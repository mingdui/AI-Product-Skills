#!/usr/bin/env node
// 浏览器路线采集器：拿「计算样式」，不是「源码里声明了什么」。
//
// 为什么需要它：源码里写着 `--navHeight:64px` 不代表导航就是 64px，
// 写着 `font-weight:700` 不代表标题就用 700。这两个坑都真实踩过。
//
// 依赖：零。按能用的最强的引擎依次尝试——
//   ① 项目里已有 playwright  → 用它（代码最少）
//   ② 机器上有 Chrome/Edge   → 用 CDP（Node ≥ 22 内置 fetch + WebSocket）
//   ③ 都没有                 → 退出码 3，让上层退回源码路线并标注「转录边界」
//
// 用法：
//   node browser-extract.mjs <url> <outDir> [--project <项目根>]
//
// 产物：
//   <outDir>/computed-<宽>.json    计算样式，按取值频次排序
//   <outDir>/breakpoints.json      四档视口的差异
//   <outDir>/shot-<宽>.png         截图

import { writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const VIEWPORTS = [375, 768, 1024, 1440];
const MAIN_VP = 1440;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

function pickEngine(projectDir) {
  if (process.argv.includes('--no-playwright') === false && projectDir) {
    try {
      const req = createRequire(join(projectDir, 'package.json'));
      const playwright = req('playwright');
      return { kind: 'playwright', playwright };
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

async function runCdp(exe, url, outDir) {
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

  const cleanup = () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} };
  process.on('exit', cleanup);

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
  const shot = async (file, full) => {
    const p = { format: 'png' }; if (full) p.captureBeyondViewport = true;
    const r = await send('Page.captureScreenshot', p);
    writeFileSync(file, Buffer.from(r.data, 'base64'));
  };

  await send('Emulation.setDeviceMetricsOverride', { width: MAIN_VP, height: 900, deviceScaleFactor: 1, mobile: false });
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
  await evaluate(`new Promise(r => { const go = () => setTimeout(r, 1500);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go).catch(go); else go(); })`);

  const full = await evaluate(COLLECT);
  writeFileSync(join(outDir, `computed-${MAIN_VP}.json`), JSON.stringify(full, null, 2), 'utf8');
  await shot(join(outDir, `shot-${MAIN_VP}.png`), true);

  const bps = [];
  for (const w of VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 768 });
    await sleep(700);
    bps.push(await evaluate(PROBE));
    if (w !== MAIN_VP) await shot(join(outDir, `shot-${w}.png`), false);
  }
  writeFileSync(join(outDir, 'breakpoints.json'), JSON.stringify(bps, null, 2), 'utf8');

  ws.close(); cleanup();
  return full;
}

// ------------------------------------------------------------ Playwright 引擎

async function runPlaywright(playwright, url, outDir) {
  const browser = await playwright.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: MAIN_VP, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
  await page.waitForTimeout(1200);

  const full = await page.evaluate(COLLECT);
  writeFileSync(join(outDir, `computed-${MAIN_VP}.json`), JSON.stringify(full, null, 2), 'utf8');
  await page.screenshot({ path: join(outDir, `shot-${MAIN_VP}.png`), fullPage: true });

  const bps = [];
  for (const w of VIEWPORTS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(700);
    bps.push(await page.evaluate(PROBE));
    if (w !== MAIN_VP) await page.screenshot({ path: join(outDir, `shot-${w}.png`) });
  }
  writeFileSync(join(outDir, 'breakpoints.json'), JSON.stringify(bps, null, 2), 'utf8');

  await browser.close();
  return full;
}

// ------------------------------------------------------------------- 入口

const main = async () => {
  const [url, outDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!url || !outDir) {
    console.error('用法: node browser-extract.mjs <url> <outDir> [--project <项目根>] [--no-playwright]');
    process.exit(2);
  }
  const pi = process.argv.indexOf('--project');
  const projectDir = pi > -1 ? process.argv[pi + 1] : process.cwd();
  mkdirSync(outDir, { recursive: true });

  const engine = pickEngine(projectDir);
  if (engine.kind === 'none') {
    console.error('没有可用的浏览器引擎。装一个 Chrome / Edge / Chromium 即可，或退回源码路线。');
    process.exit(3);
  }
  console.error(`引擎: ${engine.kind}${engine.kind === 'cdp' ? ' (' + engine.exe + ')' : ''}`);

  const result = engine.kind === 'playwright'
    ? await runPlaywright(engine.playwright, url, outDir)
    : await runCdp(engine.exe, url, outDir);

  // 终端只回摘要——完整结果在 JSON 里，别灌进上下文
  const top = (k) => result.tokens[k].slice(0, 4).map(([v, n]) => `${v}(${n})`).join('  ');
  console.log(`标题       ${result.meta.title}`);
  console.log(`最终 URL   ${result.meta.url}`);
  console.log(`页面总高   ${result.meta.docH}px`);
  console.log(`导航       ${result.nav ? result.nav.h + 'px  bg ' + result.nav.bg : '未识别'}`);
  console.log(`字体栈     ${top('fontFamily')}`);
  console.log(`字号       ${top('fontSize')}`);
  console.log(`字重       ${top('fontWeight')}`);
  console.log(`正文字色   ${top('color')}`);
  console.log(`圆角       ${top('borderRadius')}`);
  console.log(`按钮样本   ${result.buttons.length} 个`);
  console.log(`\n产物在 ${outDir}/`);
};

main().catch((e) => {
  console.error('失败:', e.message);
  process.exit(e.code || 1);
});
