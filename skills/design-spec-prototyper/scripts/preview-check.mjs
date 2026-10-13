#!/usr/bin/env node
// 原型预览校验：四档视口实测 + 静态复查，并各截一张图。
//
// 为什么需要它：契约要求「在 375 / 768 / 1024 / 1440 检查结果」「确认字体已加载」，
// 但不给工具的话只有两条路——自己写一个，或者跳过并写「无法验证」。
// 后者最糟：**「验证过」和「没验证」在交付说明里长得一样。**
//
// 依赖：零。只要有 Chrome / Edge / Chromium 和 Node ≥ 22（内置 fetch + WebSocket）。
// 拿不到浏览器时退出码 3——这时**不要假装验证过**，如实写「未能运行预览检查」。
//
// 用法：
//   node preview-check.mjs <prototype.html 绝对路径> <截图输出目录> [chromeExe]

import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const WIDTHS = [375, 768, 1024, 1440];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  return null;
}

function pngSize(file) {
  try {
    const b = readFileSync(file);
    return b.length < 24 ? null : { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  } catch { return null; }
}

// ── 静态复查：这些不用开浏览器就能查，而且都是真会犯的错 ──────────────
function staticChecks(file) {
  const html = readFileSync(file, 'utf8');
  const rows = [];
  const count = (re) => (html.match(re) || []).length;

  const fffd = count(/\uFFFD/g);
  rows.push(['U+FFFD 乱码', fffd === 0, `${fffd} 处`]);

  const svg = count(/<svg\b/g);
  const svgHidden = count(/<svg[^>]*aria-hidden="true"/g);
  rows.push(['装饰性 SVG 标 aria-hidden', svg === 0 || svg === svgHidden, `${svgHidden}/${svg}`]);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  rows.push(['id 唯一', dup.length === 0, dup.length ? `重复：${[...new Set(dup)].join(', ')}` : `${ids.length} 个`]);

  const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1]);
  const dangling = controls.filter((c) => !ids.includes(c));
  rows.push(['aria-controls 不悬空', dangling.length === 0, dangling.length ? `悬空：${dangling.join(', ')}` : `${controls.length} 个`]);

  const h1 = count(/<h1\b/g);
  rows.push(['只有一个 <h1>', h1 <= 1, `${h1} 个`]);

  const hasDoctype = /^\s*<!doctype html>/i.test(html);
  const hasLang = /<html[^>]+lang="/i.test(html);
  const hasViewport = /name="viewport"/i.test(html);
  rows.push(['doctype / lang / viewport', hasDoctype && hasLang && hasViewport,
    [hasDoctype ? 'doctype' : '缺 doctype', hasLang ? 'lang' : '缺 lang', hasViewport ? 'viewport' : '缺 viewport'].join(' · ')]);

  return rows;
}

const PAGE_PROBE = `(() => {
  const d = document.documentElement;
  const over = [...document.querySelectorAll('*')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && (r.right > d.clientWidth + 1 || r.left < -1);
  }).slice(0, 5).map((el) => {
    const cn = (typeof el.className === 'string' && el.className) ? '.' + el.className.trim().split(/\\s+/)[0] : '';
    return el.tagName.toLowerCase() + cn + '@' + Math.round(el.getBoundingClientRect().right);
  });
  return { sw: d.scrollWidth, cw: d.clientWidth, sh: d.scrollHeight, over };
})()`;

const FONT_PROBE = `(async () => {
  await document.fonts.ready;
  return [...document.fonts].map((f) => f.family.replace(/["']/g, '') + ' ' + f.weight + ' ' + f.status);
})()`;

async function main() {
  const [file, outDir, exeArg] = process.argv.slice(2);
  if (!file || !outDir) {
    console.error('用法: node preview-check.mjs <prototype.html> <截图输出目录> [chromeExe]');
    process.exit(2);
  }

  let failed = 0;
  console.log('── 静态复查 ──────────────────────────────');
  for (const [name, ok, detail] of staticChecks(file)) {
    if (!ok) failed++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(26)} ${detail}`);
  }

  const exe = exeArg || findBrowser();
  if (!exe) {
    console.error('\n没有可用的浏览器（Chrome / Edge / Chromium）。');
    console.error('**不要因此写「已验证」**——交付说明里如实写「未能运行预览检查」。');
    process.exit(3);
  }
  if (!globalThis.WebSocket || Number(process.versions.node.split('.')[0]) < 22) {
    console.error('\nNode < 22，跑不了预览检查。同样不要写「已验证」。');
    process.exit(3);
  }

  mkdirSync(outDir, { recursive: true });
  const port = 9000 + Math.floor(Math.random() * 900);
  // Chrome ≥ 136 禁止在默认 profile 上开调试端口，临时 profile 是必需项。
  const profile = mkdtempSync(join(tmpdir(), 'dsp-prev-'));
  const child = spawn(exe, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
    '--disable-features=Translate', 'about:blank',
  ], { stdio: 'ignore' });

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    try {
      if (process.platform === 'win32' && child.pid) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      else child.kill('SIGTERM');
    } catch { /* 已经退了 */ }
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* noop */ }
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
  let id = 0; const pending = new Map(); const waiters = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id); pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    } else if (m.method && waiters.has(m.method)) {
      const fns = waiters.get(m.method); waiters.delete(m.method); fns.forEach((f) => f(m.params));
    }
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params }));
  });
  const once = (method) => new Promise((res) => { const f = waiters.get(method) || []; f.push(res); waiters.set(method, f); });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('页面内执行出错: ' + JSON.stringify(r.exceptionDetails).slice(0, 300));
    return r.result.value;
  };

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: pathToFileURL(file).href });
  await Promise.race([loaded, sleep(25000)]);
  await sleep(2500); // 等在线字体 / CDN 资源落地

  console.log('\n── 字体 ──────────────────────────────────');
  const fonts = await evaluate(FONT_PROBE);
  if (!fonts.length) {
    console.log('  （页面没有加载任何自定义字体——用系统字体栈时这是正常的）');
  } else {
    for (const f of fonts) console.log(`  ${f}`);
  }

  console.log('\n── 四档视口 ──────────────────────────────');
  for (const w of WIDTHS) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 768 });
    await sleep(800);
    const r = await evaluate(PAGE_PROBE);
    const overflow = r.sw > r.cw + 1;
    if (overflow) failed++;
    const out = join(outDir, `preview-${w}.png`);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(out, Buffer.from(shot.data, 'base64'));
    const size = pngSize(out) || {};
    // 只有真的溢出了才列嫌疑元素。没溢出时列出来全是噪音——
    // 跳转链接的 left:-9999px、overflow-x:auto 容器里的宽内容，都是故意越界的。
    console.log(`  ${overflow ? 'FAIL' : 'PASS'}  ${String(w).padStart(4)}px  ` +
      `scrollW=${r.sw} clientW=${r.cw} 页高=${r.sh} 图=${size.w}×${size.h}` +
      (overflow && r.over.length ? `\n        越界嫌疑：${r.over.join(', ')}` : ''));
  }

  try { ws.close(); } catch { /* noop */ }
  cleanup();
  console.log(`\n${failed === 0 ? '全部通过' : failed + ' 项未通过'}　截图在 ${outDir}/`);
  if (failed) process.exit(1);
}

main().catch((e) => { console.error('失败:', e.message); process.exit(e.code || 1); });
