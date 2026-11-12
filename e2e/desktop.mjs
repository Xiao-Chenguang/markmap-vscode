// E2E in desktop VS Code, driven over the Chrome DevTools Protocol by Playwright.
// Needs a built extension (`pnpm build:js`) and VS Code installed.
// Set VSCODE_PATH if VS Code is not at the default macOS location.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import {
  chooseExport, createReporter, extensionPath, findNodeId, openSampleAsMarkmap, prepareWorkspace, runCommand, sleep,
} from './lib.mjs';

const vscodePath = process.env.VSCODE_PATH || '/Applications/Visual Studio Code.app/Contents/MacOS/Code';
const port = process.env.E2E_CDP_PORT || '9333';
if (!existsSync(vscodePath)) {
  console.error(`VS Code not found at ${vscodePath}; set VSCODE_PATH`);
  process.exit(2);
}

const { root, workspace } = prepareWorkspace();
const dataDir = join(root, 'data');
mkdirSync(join(dataDir, 'User'), { recursive: true });
// simpleDialog makes the save dialog a quick-input box that Playwright can drive.
writeFileSync(
  join(dataDir, 'User', 'settings.json'),
  JSON.stringify({ 'files.simpleDialog.enable': true, 'workbench.startupEditor': 'none', 'update.mode': 'none', 'telemetry.telemetryLevel': 'off' }),
);

const t = createReporter();
const proc = spawn(
  vscodePath,
  [`--remote-debugging-port=${port}`, `--user-data-dir=${dataDir}`, `--extensions-dir=${join(root, 'ext')}`, `--extensionDevelopmentPath=${extensionPath}`, '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes', '--disable-updates', workspace],
  { stdio: 'ignore' },
);

let browser;
try {
  for (let i = 0; i < 60 && !browser; i++) {
    await sleep(500);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`).catch(() => undefined);
  }
  if (!browser) throw new Error('could not connect to VS Code');
  let page;
  for (let i = 0; i < 40 && !page; i++) {
    await sleep(500);
    page = browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().includes('workbench'));
  }
  if (!page) throw new Error('workbench window not found');
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 240)));

  const frame = await openSampleAsMarkmap(page);
  t.ok('webview loads', !!frame);
  if (!frame) throw new Error('no webview');
  const v = (fn, arg) => frame.evaluate(fn, arg);

  const info = await v(() => {
    const sr = document.querySelector('markmap-view').shadowRoot;
    return { imgs: [...sr.querySelectorAll('image')].map((x) => x.getAttribute('href')), math: /<path/.test(sr.innerHTML) };
  });
  t.ok('local image rewritten to a webview URI', info.imgs.length === 1 && /vscode-resource/.test(info.imgs[0]), info.imgs[0]);
  t.ok('math is rendered', info.math);

  const firstId = await findNodeId(frame, 'dot.png');
  await v((id) => document.querySelector('markmap-view').mm.openNotes(id), firstId);
  await sleep(700);
  t.ok('code block in a note is highlighted (lazy chunk loads)', await v(() => !!document.querySelector('.markmap-popover .hljs-keyword')));
  await v(() => document.querySelector('markmap-view').mm.closeNotes());

  // Search: matching branches stay open, the rest folds away, Esc restores.
  await v(() => document.querySelector('markmap-view').mm.expandAll());
  await sleep(400);
  const before = await v(() => document.querySelector('markmap-view').mm.foldedIds.size);
  await page.keyboard.press('/');
  await sleep(300);
  const searchVisible = await v(() => {
    const el = document.querySelector('.node-search');
    return !!el && !el.hidden;
  });
  t.ok('slash opens the node search', searchVisible);
  await page.keyboard.type('dot');
  await sleep(600);
  const searched = await v(() => ({
    count: document.querySelector('.node-search-count')?.textContent,
    folded: document.querySelector('markmap-view').mm.foldedIds.size,
  }));
  t.ok('search reports a match', /^1\/\d+$/.test(searched.count || ''), searched.count);
  t.ok('search folds the branches without a match', searched.folded > before, `${before} -> ${searched.folded}`);
  await page.keyboard.press('Escape');
  await sleep(600);
  const restored = await v(() => ({
    hidden: document.querySelector('.node-search')?.hidden,
    folded: document.querySelector('markmap-view').mm.foldedIds.size,
  }));
  t.ok('Esc closes the search and restores the fold state', restored.hidden && restored.folded === before, `${restored.folded} vs ${before}`);

  // Fold state survives closing and reopening the preview.
  const foldTarget = await findNodeId(frame, 'dot.png');
  await v((id) => document.querySelector('markmap-view').mm.setFolded(id, true), foldTarget);
  await sleep(800);
  const foldedBefore = await v(() => [...document.querySelector('markmap-view').mm.foldedIds]);
  await page.keyboard.press('Control+W');
  await sleep(1500);
  const reopened = await openSampleAsMarkmap(page);
  t.ok('preview reopens', !!reopened);
  if (reopened) {
    const restoredFold = await reopened.evaluate(() => [...document.querySelector('markmap-view').mm.foldedIds]);
    t.ok('fold state is restored after reopening', restoredFold.includes(foldTarget), `${JSON.stringify(foldedBefore)} -> ${JSON.stringify(restoredFold)}`);
  }

  // The theme and layout settings win over the document's frontmatter.
  const settingsPath = join(dataDir, 'User', 'settings.json');
  const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
  writeFileSync(settingsPath, JSON.stringify({ ...settings, 'markmapPlus.theme': 'cards', 'markmapPlus.layout': 'org-chart' }));
  await sleep(2500);
  const appearance = await reopened.evaluate(() => {
    const el = document.querySelector('markmap-view');
    return { theme: el.theme, layout: el.layout };
  });
  t.ok('theme and layout settings apply', appearance.theme === 'cards' && appearance.layout === 'org-chart', JSON.stringify(appearance));
  writeFileSync(settingsPath, JSON.stringify(settings));
  await sleep(1500);

  // Two previews of the same document stay in step. "Open as markmap" reuses
  // the existing preview, so split the editor to get a second one.
  await page.locator('.monaco-editor').first().click();
  await sleep(800);
  await runCommand(page, 'Open as markmap');
  await sleep(2500);
  await runCommand(page, 'Split Editor');
  await sleep(3000);
  const mapFrames = [];
  for (const f of page.frames()) {
    if (await f.evaluate(() => !!document.querySelector('markmap-view')).catch(() => false)) mapFrames.push(f);
  }
  t.ok('a second preview opens', mapFrames.length >= 2, `${mapFrames.length} previews`);
  if (mapFrames.length >= 2) {
    const [a, b] = mapFrames;
    const syncTarget = await findNodeId(a, 'dot.png');
    await a.evaluate((id) => document.querySelector('markmap-view').mm.setFolded(id, true), syncTarget);
    await sleep(1200);
    const mirrored = await b.evaluate((id) => document.querySelector('markmap-view').mm.foldedIds.has(id), syncTarget);
    t.ok('fold state is mirrored to the other preview', mirrored);
    await page.keyboard.press('Control+W');
    await sleep(1200);
  }

  const signatures = { svg: (b) => /<svg/.test(b.subarray(0, 400).toString()), png: (b) => b.subarray(1, 4).toString() === 'PNG', html: (b) => /<html|<!doctype/i.test(b.subarray(0, 400).toString()), md: (b) => /^- /m.test(b.toString()) };
  for (const format of ['svg', 'png', 'html', 'md']) {
    const rows = await chooseExport(page, frame, format, format === 'md' ? 'Markdown' : format);
    if (format === 'svg') t.ok('export picker lists SVG, PNG, HTML and Markdown', ['SVG', 'PNG', 'HTML', 'Markdown'].every((f) => rows.some((x) => x.startsWith(f))), JSON.stringify(rows));
    const input = page.locator('.quick-input-box input').first();
    const target = join(workspace, `exported.${format}`);
    await input.fill(target);
    await sleep(400);
    await page.keyboard.press('Enter');
    await sleep(800);
    await page.keyboard.press('Enter').catch(() => {}); // confirm if prompted
    await sleep(2000);
    const written = existsSync(target) && signatures[format](readFileSync(target));
    t.ok(`export ${format} writes a valid file`, written, existsSync(target) ? readFileSync(target).length + ' bytes' : 'missing');
  }

  const bad = [...new Set(errors)].filter((e) => !/favicon|404/.test(e));
  t.ok('no console errors', bad.length === 0, bad.join(' | '));
} catch (e) {
  t.ok('test run completed', false, e.message);
} finally {
  await browser?.close().catch(() => {});
  proc.kill();
}
process.exit(t.finish());
