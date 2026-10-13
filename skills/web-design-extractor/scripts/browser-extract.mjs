#!/usr/bin/env node
// 浏览器路线采集器：拿「计算样式」，不是「源码里声明了什么」。
//
// 为什么需要它：源码里写着 `--navHeight:64px` 不代表导航就是 64px，
// 写着 `font-weight:700` 不代表标题就用 700。这两个坑都真实踩过。
//
// 依赖：零。按能用的最强的引擎依次尝试——
//   ① 项目里已有 playwright  → 用它（代码最少）
//   ② 机器上有 Chrome/Edge   → 用 CDP（Node ≥ 22 内置 fetch + WebSocket）
//   ③ 都没有                 → 退出码 3，让上层退回源码路线并标注「证据边界」
//
// 用法：
//   node browser-extract.mjs <url> <outDir> [选项]
//
//   选项
//     --project <目录>   从这里解析 playwright（默认当前目录）
//     --no-playwright    跳过 playwright，强制走 CDP
//     --slice [px]       额外按固定高度分段截图（默认 900），并给出每段文字索引
//     --read <outDir>    不采集，只把已有结果打成可读摘要（别把 JSON 整个读进上下文）
//
// 产物：
//   <outDir>/computed-<宽>.json    计算样式，按取值频次排序
//   <outDir>/breakpoints.json      四档视口的差异
//   <outDir>/shot-<宽>.png         截图（全页 + 各档视口）
//   <outDir>/slices/               分段截图（用了 --slice 才有）

import { writeFileSync, readFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const VIEWPORTS = [375, 768, 1024, 1440];
const MAIN_VP = 1440;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// PNG 的 IHDR 固定在第 16–24 字节。读真实尺寸，别靠"我记得截了多大"。
function pngSize(file) {
  try {
    const b = readFileSync(file);
    if (b.length < 24) return null;
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  } catch { return null; }
}

// ---------------------------------------------------------------- 引擎探测

function findBrowser() {
  const cands = {
    win32: [
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
    linux: ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'],
  }[process.platform] || [];
  for (const c of cands) if (existsSync(c)) return c;
  return null; // 交给上层提示用户装一个，或退回源码路线
}

function pickEngine(projectDir, allowPlaywright) {
  if (allowPlaywright && projectDir) {
    try {
      const req = createRequire(join(projectDir, 'package.json'));
      return { kind: 'playwright', playwright: req('playwright') };
    } catch { /* 没装，正常 */ }
  }
  const exe = findBrowser();
  if (exe) return { kind: 'cdp', exe };
  return { kind: 'none' };
}

// ------------------------------------------------- 页面内采集（两个引擎共用）

// 对每个可见元素取 getComputedStyle，按取值出现次数排序。
// 频次就是「这个值到底用得多不多」——比在样式表里正则搜声明可靠。
const COLLECT = `(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const KEYS = ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color',
                'backgroundColor','borderRadius','boxShadow','padding','gap'];
  const agg = {}; for (const k of KEYS) agg[k] = {};
  for (const el of document.querySelectorAll('*')) {
    if (!vis(el)) continue;
    const cs = getComputedStyle(el);
    for (const k of KEYS) {
      const v = cs[k];
      if (!v || v === 'none' || v === 'normal' || v === 'auto' || v === 'rgba(0, 0, 0, 0)') continue;
      agg[k][v] = (agg[k][v] || 0) + 1;
    }
  }
  const rank = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
  const tokens = {}; for (const k of KEYS) tokens[k] = rank(agg[k], 12);

  // 标题的真实规格：源码里只有 var(--titleFontSize)，这里才有值
  const headings = [...document.querySelectorAll('h1,h2,h3')].filter(vis).slice(0, 18).map((h) => {
    const cs = getComputedStyle(h); const r = h.getBoundingClientRect();
    return { tag: h.tagName, size: cs.fontSize, weight: cs.fontWeight, lh: cs.lineHeight,
             color: cs.color, w: Math.round(r.width), text: (h.textContent || '').trim().slice(0, 46) };
  });

  // 按钮的真实形态：高度、圆角、padding —— 这三项源码路线全拿不到
  const buttons = [...document.querySelectorAll('a,button')].filter(vis).map((el) => {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 20) return null;
    if (cs.backgroundColor === 'rgba(0, 0, 0, 0)' && parseFloat(cs.borderTopWidth) === 0) return null;
    return { text: (el.textContent || '').trim().slice(0, 26), bg: cs.backgroundColor, fg: cs.color,
             radius: cs.borderRadius, h: Math.round(r.height), pad: cs.padding,
             fs: cs.fontSize, fw: cs.fontWeight };
  }).filter(Boolean).slice(0, 24);

  const sections = [...document.querySelectorAll('section,header,footer,main')].filter(vis).slice(0, 24).map((s) => {
    const cs = getComputedStyle(s); const r = s.getBoundingClientRect();
    return { tag: s.tagName, bg: cs.backgroundColor, maxW: cs.maxWidth, pad: cs.padding,
             y: Math.round(r.y + scrollY), h: Math.round(r.height) };
  });

  const nav = document.querySelector('header,nav');
  const navBox = nav ? (() => { const r = nav.getBoundingClientRect(); const cs = getComputedStyle(nav);
    return { h: Math.round(r.height), bg: cs.backgroundColor, pos: cs.position }; })() : null;

  return { meta: { title: document.title, url: location.href, vw: innerWidth,
                   docH: document.documentElement.scrollHeight },
           nav: navBox, tokens, headings, buttons, sections };
})()`;

// 断点扫描：同页面换视口，看什么变了。源码路线完全给不了这一节。
const PROBE = `(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const nav = document.querySelector('header,nav');
  const bordered = [...document.querySelectorAll('a,div,section')].filter((el) => {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    return vis(el) && parseFloat(cs.borderTopWidth) > 0 && r.width > 150 && r.height > 120;
  }).length;
  return { vw: innerWidth,
           navH: nav ? Math.round(nav.getBoundingClientRect().height) : null,
           borderedBlocks: bordered,
           docH: document.documentElement.scrollHeight,
           overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth };
})()`;

// 分段截图的文字索引：只取叶子节点，避免把整棵容器树重复打出来
const digestExpr = (y0, y1) => `(() => {
  const out = [];
  document.querySelectorAll('h1,h2,h3,h4,p,li,button,td,th,a').forEach((el) => {
    if (el.children.length) return;
    const t = (el.textContent || '').trim(); if (!t) return;
    const r = el.getBoundingClientRect(); const top = r.top + window.scrollY;
    if (top >= ${y0} && top < ${y1}) out.push(el.tagName + ':' + t.slice(0, 44));
  });
  return out.slice(0, 14).join(' | ');
})()`;

// ------------------------------------------------------------------ CDP 引擎

function rpc(ws) {
  let id = 0;
  const pending = new Map();
  const waiters = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    } else if (m.method && waiters.has(m.method)) {
      const fns = waiters.get(m.method); waiters.delete(m.method); fns.forEach((f) => f(m.params));
    }
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const once = (method) => new Promise((res) => {
    const fns = waiters.get(method) || []; fns.push(res); waiters.set(method, fns);
  });
  return { send, once };
}

async function runCdp(exe, url, outDir, opts) {
  if (!globalThis.WebSocket || Number(process.versions.node.split('.')[0]) < 22) {
    throw Object.assign(new Error('Node 版本过低：CDP 路线需要 Node ≥ 22（内置 WebSocket）'), { code: 3 });
  }
  const port = 9000 + Math.floor(Math.random() * 900);
  // Chrome ≥ 136 禁止在默认 profile 上开调试端口，临时 profile 是必需项，不是可选项。
  const profile = mkdtempSync(join(tmpdir(), 'wde-cdp-'));
  const child = spawn(exe, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
    '--disable-features=Translate', 'about:blank',
  ], { stdio: 'ignore' });

  // Windows 上 child.kill() 杀不掉 Chrome 的进程树——实测会留下 headless 进程占着调试端口，
  // 下次跑就撞端口。必须用 taskkill /T 连子树一起收。
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    try {
      if (process.platform === 'win32' && child.pid) {
        spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch { /* 已经退了 */ }
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* 临时目录留着自己会被清 */ }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(130); });

  let wsUrl = null;
  for (let i = 0; i < 40 && !wsUrl; i++) {
    await sleep(250);
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      wsUrl = list.find((t) => t.type === 'page')?.webSocketDebuggerUrl || null;
    } catch { /* 还没起来 */ }
  }
  if (!wsUrl) { cleanup(); throw new Error('浏览器起来了，但 CDP 端点没响应'); }

  const ws = await new Promise((res, rej) => {
    const s = new WebSocket(wsUrl);
    s.addEventListener('open', () => res(s), { once: true });
    s.addEventListener('error', () => rej(new Error('CDP WebSocket 连不上')), { once: true });
  });
  const { send, once } = rpc(ws);
  await send('Page.enable');
  await send('Runtime.enable');

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('页面内执行出错: ' + JSON.stringify(r.exceptionDetails).slice(0, 300));
    return r.result.value;
  };
  const shots = [];
  const shot = async (file, params) => {
    const r = await send('Page.captureScreenshot', Object.assign({ format: 'png' }, params || {}));
    writeFileSync(file, Buffer.from(r.data, 'base64'));
    shots.push({ file, ...(pngSize(file) || {}) });
  };

  await send('Emulation.setDeviceMetricsOverride', { width: MAIN_VP, height: 900, deviceScaleFactor: 1, mobile: false });
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
  await evaluate(`new Promise(r => { const go = () => setTimeout(r, 1500);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go).catch(go); else go(); })`);

  const full = await evaluate(COLLECT);
  writeFileSync(join(outDir, `computed-${MAIN_VP}.json`), JSON.stringify(full, null, 2), 'utf8');
  await shot(join(outDir, `shot-${MAIN_VP}.png`), { captureBeyondViewport: true });

  const bps = [];
  for (const w of VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 768 });
    await sleep(700);
    bps.push(await evaluate(PROBE));
    if (w !== MAIN_VP) await shot(join(outDir, `shot-${w}.png`), null);
  }
  writeFileSync(join(outDir, 'breakpoints.json'), JSON.stringify(bps, null, 2), 'utf8');

  // 分段截图：整页 1:11 这种比例，缩放到可读尺寸后信息基本没了，
  // 必须切成视口大小的段才看得清。顺便给每段一份文字索引，省得逐个开图。
  const slices = [];
  if (opts.slice) {
    const h = opts.slice;
    const dir = join(outDir, 'slices');
    mkdirSync(dir, { recursive: true });
    const docH = full.meta.docH;
    let n = 0;
    for (let y = 0; y < docH; y += h) {
      const hh = Math.min(h, docH - y);
      const file = join(dir, `slice-${String(n).padStart(2, '0')}-y${y}.png`);
      await shot(file, { captureBeyondViewport: true, clip: { x: 0, y, width: MAIN_VP, height: hh, scale: 1 } });
      slices.push({ file, y, h: hh, text: await evaluate(digestExpr(y, y + hh)) });
      n++;
    }
  }

  ws.close(); cleanup();
  return { full, bps, shots, slices };
}

// ------------------------------------------------------------ Playwright 引擎

async function runPlaywright(playwright, url, outDir, opts) {
  const browser = await playwright.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: MAIN_VP, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
  await page.waitForTimeout(1200);

  const shots = [];
  const snap = async (file, fullPage) => {
    await page.screenshot({ path: file, fullPage: !!fullPage });
    shots.push({ file, ...(pngSize(file) || {}) });
  };

  const full = await page.evaluate(COLLECT);
  writeFileSync(join(outDir, `computed-${MAIN_VP}.json`), JSON.stringify(full, null, 2), 'utf8');
  await snap(join(outDir, `shot-${MAIN_VP}.png`), true);

  const bps = [];
  for (const w of VIEWPORTS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(700);
    bps.push(await page.evaluate(PROBE));
    if (w !== MAIN_VP) await snap(join(outDir, `shot-${w}.png`), false);
  }
  writeFileSync(join(outDir, 'breakpoints.json'), JSON.stringify(bps, null, 2), 'utf8');

  // 分段截图：Playwright 用 clip 实现，语义和 CDP 一致
  const slices = [];
  if (opts.slice) {
    const h = opts.slice;
    const dir = join(outDir, 'slices');
    mkdirSync(dir, { recursive: true });
    const docH = full.meta.docH;
    let n = 0;
    for (let y = 0; y < docH; y += h) {
      const hh = Math.min(h, docH - y);
      const file = join(dir, `slice-${String(n).padStart(2, '0')}-y${y}.png`);
      await page.screenshot({ path: file, clip: { x: 0, y, width: MAIN_VP, height: hh } });
      shots.push({ file, ...(pngSize(file) || {}) });
      slices.push({ file, y, h: hh, text: await page.evaluate(digestExpr(y, y + hh)) });
      n++;
    }
  }

  await browser.close();
  return { full, bps, shots, slices };
}

// ------------------------------------------------------- 只读模式（W12）

function readMode(outDir) {
  const computed = JSON.parse(readFileSync(join(outDir, `computed-${MAIN_VP}.json`), 'utf8'));
  const rank = (rows) => rows.map(([v, n]) => `${v}(${n})`).join('  ');
  const L = [];
  L.push(`标题      ${computed.meta.title}`);
  L.push(`URL       ${computed.meta.url}`);
  L.push(`页面总高  ${computed.meta.docH}px`);
  L.push(`导航      ${computed.nav ? computed.nav.h + 'px  bg ' + computed.nav.bg : '未识别'}`);
  for (const k of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
                   'color', 'backgroundColor', 'borderRadius', 'boxShadow']) {
    if (computed.tokens[k] && computed.tokens[k].length) L.push(`${k.padEnd(9)} ${rank(computed.tokens[k].slice(0, 6))}`);
  }
  L.push('');
  L.push('标题层级：');
  for (const h of computed.headings) L.push(`  ${h.size.padStart(6)} / ${h.weight}  ${h.tag}  ${h.text}`);
  L.push('');
  L.push(`按钮（${computed.buttons.length} 个，去重前 6 个）：`);
  for (const b of computed.buttons.slice(0, 6)) {
    L.push(`  ${String(b.h).padStart(3)}px  r=${b.radius}  ${b.fs}/${b.fw}  bg=${b.bg}  ${b.text}`);
  }
  L.push('');
  L.push('分区：');
  for (const s of computed.sections.slice(0, 14)) {
    L.push(`  y=${String(s.y).padStart(6)} h=${String(s.h).padStart(5)}  ${s.tag.padEnd(8)} ${s.bg}`);
  }
  try {
    const bps = JSON.parse(readFileSync(join(outDir, 'breakpoints.json'), 'utf8'));
    L.push('');
    L.push('断点：');
    for (const b of bps) {
      L.push(`  ${String(b.vw).padStart(4)}  导航 ${b.navH}px  区块 ${b.borderedBlocks}  页高 ${b.docH}  横向溢出 ${b.overflowX ? '有' : '无'}`);
    }
  } catch { /* 没有就算了 */ }
  console.log(L.join('\n'));
}

// ------------------------------------------------------------------- 入口

const main = async () => {
  const argv = process.argv.slice(2);
  const flags = argv.filter((a) => a.startsWith('--'));
  const pi = argv.indexOf('--project');
  const ri = argv.indexOf('--read');
  const si = argv.indexOf('--slice');
  // 选项的值也要从位置参数里排掉
  const consumed = new Set();
  if (pi > -1) consumed.add(pi + 1);
  if (ri > -1) consumed.add(ri + 1);
  if (si > -1 && argv[si + 1] && !argv[si + 1].startsWith('--')) consumed.add(si + 1);
  const positional = argv.filter((a, i) => !a.startsWith('--') && !consumed.has(i));

  if (ri > -1) { readMode(argv[ri + 1]); return; }

  const [url, outDir] = positional;
  if (!url || !outDir) {
    console.error('用法: node browser-extract.mjs <url> <outDir> [--project <目录>] [--no-playwright] [--slice [px]]');
    console.error('      node browser-extract.mjs --read <outDir>');
    process.exit(2);
  }
  const projectDir = pi > -1 ? argv[pi + 1] : process.cwd();
  const opts = {
    slice: si > -1 ? Number((argv[si + 1] && !argv[si + 1].startsWith('--')) ? argv[si + 1] : 900) : 0,
  };
  mkdirSync(outDir, { recursive: true });

  const engine = pickEngine(projectDir, !flags.includes('--no-playwright'));
  if (engine.kind === 'none') {
    console.error('没有可用的浏览器引擎。装一个 Chrome / Edge / Chromium 即可，或退回源码路线。');
    process.exit(3);
  }

  const { full, bps, shots, slices } = engine.kind === 'playwright'
    ? await runPlaywright(engine.playwright, url, outDir, opts)
    : await runCdp(engine.exe, url, outDir, opts);

  // ── 摘要。首要目的是别让人把静默错误当成正常结果。
  const L = [];
  const norm = (u) => String(u).replace(/\/+$/, '');
  if (norm(full.meta.url) !== norm(url)) {
    L.push(`⚠️  发生了重定向：${url}`);
    L.push(`    → ${full.meta.url}`);
    L.push('    地区/语言可能被自动改写（例如计价货币、文案语言）。');
    L.push('    要么以重定向后的版本为准并在 design.md 里写明，要么换一个不带地区判定的入口。');
    L.push('');
  }
  L.push(`引擎      ${engine.kind}${engine.kind === 'cdp' ? '  (' + engine.exe + ')' : ''}`);
  L.push(`标题      ${full.meta.title}`);
  L.push(`最终 URL  ${full.meta.url}`);
  L.push(`页面总高  ${full.meta.docH}px`);
  L.push(`导航      ${full.nav ? full.nav.h + 'px  bg ' + full.nav.bg : '未识别'}`);
  const top = (k) => full.tokens[k].slice(0, 4).map(([v, n]) => `${v}(${n})`).join('  ');
  L.push(`字体栈    ${top('fontFamily')}`);
  L.push(`字号      ${top('fontSize')}`);
  L.push(`字重      ${top('fontWeight')}`);
  L.push(`正文字色  ${top('color')}`);
  L.push(`圆角      ${top('borderRadius')}`);
  L.push('');
  L.push('截图（尺寸读自 PNG 头，不是猜的）：');
  for (const s of shots) {
    const ratio = s.h && s.w ? (s.h / s.w) : 0;
    const warn = ratio > 4 ? '   ⚠️ 比例极端（1:' + Math.round(ratio) + '），缩放到可读尺寸后信息基本没了——用 --slice 分段看' : '';
    L.push(`  ${s.file.split(/[\\/]/).pop().padEnd(20)} ${String(s.w).padStart(4)} × ${String(s.h).padStart(5)}${warn}`);
  }
  if (slices.length) {
    L.push('');
    L.push(`分段截图 ${slices.length} 段（每段带文字索引，省得逐个开图）：`);
    for (const s of slices) L.push(`  y=${String(s.y).padStart(6)}  ${s.text}`);
  }
  L.push('');
  L.push(`产物在 ${outDir}/`);
  L.push(`要看可读摘要：node browser-extract.mjs --read ${outDir}`);
  console.log(L.join('\n'));
};

main().catch((e) => {
  console.error('失败:', e.message);
  process.exit(e.code || 1);
});
