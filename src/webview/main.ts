import { toPNG } from '@markmap/canvas';
import {
  findNode,
  toPlainText,
  walkTree,
  type MarkmapNode,
} from '@markmap/core';
import { MarkmapViewElement } from '@markmap/element';
import { mathContent, remarkMath } from '@markmap/plugin-math';
import { defaultContentPlugins, toSVGString } from '@markmap/render';
import { defaultToolbarItems } from '@markmap/toolbar';
import { resolveViewOptions, type Markmap } from '@markmap/view';
import { debounce } from 'es-toolkit';
import type { HostMessage, ImageFormat, WebviewMessage } from '../protocol';
import { remarkLocalImages } from './local-images';
import { createFlash, isInView, nodeAtEvent, nodeAtOffset } from './sync';

const vscode = acquireVsCodeApi();
const post = (message: WebviewMessage) => vscode.postMessage(message);

const flash = createFlash();
const status = document.createElement('div');
status.className = 'status';
const customStyle = document.createElement('style');
document.head.append(customStyle);

let baseUri = '';
let defaultOptions: unknown;
let defaultWarnings: readonly string[] = [];
let appliedOptions: string | undefined;
let placed = false;
/** The node under the editor's cursor. */
let active: MarkmapNode | undefined;

const view = new MarkmapViewElement();
view.toolbar = true;
view.toolbarItems = [
  ...defaultToolbarItems,
  { label: 'Edit', onClick: () => post({ type: 'editAsText' }) },
  {
    label: 'Export',
    onClick: (mm) => {
      const title = mm.tree && toPlainText(mm.tree.content);
      post({ type: 'export', data: { title: title || 'Markmap' } });
    },
  },
];
view.parseOptions = { plugins: [remarkMath, remarkLocalImages(() => baseUri)] };
view.addEventListener('render', showWarnings);
view.addEventListener('dblclick', (event) => {
  const position = view.mm && nodeAtEvent(view.mm, event)?.position;
  if (position) post({ type: 'setFocus', data: position.start });
});
document.body.append(view, status);
applyOptions();

new MutationObserver(applyOptions).observe(document.body, {
  attributes: true,
  attributeFilter: ['class'],
});

let observedSize = false;
const refit = debounce(() => view.mm?.fit(), 200);
new ResizeObserver(() => {
  // The first call only reports the starting size.
  if (observedSize) refit();
  observedSize = true;
}).observe(view);

document.addEventListener('click', handleLinkClick);
document.addEventListener('click', handleNodeClick);
document.addEventListener('keydown', handleKeyDown);

const handlers: {
  [T in HostMessage['type']]: (
    data: Extract<HostMessage, { type: T }>['data'],
  ) => void;
} = {
  setContent(data) {
    baseUri = data.baseUri;
    defaultOptions = data.defaultOptions;
    applyOptions();
    view.markdown = data.markdown;
    if (!placed) {
      placed = true;
      // Images and math change the drawing's size once they are ready.
      view.mm?.result?.pending?.then(() => {
        if (data.foldedIds?.length) {
          view.mm?.setFoldedIds(data.foldedIds, { animate: false });
        }
        view.mm?.fit();
      });
    }
  },
  setCursor(offset) {
    const mm = view.mm;
    const node = mm?.tree && nodeAtOffset(mm.tree, offset);
    if (!node || node.id === active?.id) return;
    active = node;
    reveal(node);
  },
  setCSS(css) {
    customStyle.textContent = css;
  },
  toggleNode(recursive) {
    const mm = view.mm;
    if (!mm || !active) return;
    if (!recursive) mm.toggle(active.id);
    else if (mm.foldedIds.has(active.id)) mm.expandAll(active.id);
    else mm.foldAll(active.id);
  },
  exportOutline() {
    post({ type: 'outline', data: buildOutline() });
  },
  exportImage,
};

window.addEventListener('message', (event: MessageEvent<HostMessage>) => {
  const { type, data } = event.data;
  (handlers[type] as (value: typeof data) => void)?.(data);
});

// Report fold changes so the host can restore them the next time the file opens.
view.addEventListener('fold', () => {
  const mm = view.mm;
  if (mm) post({ type: 'foldChanged', data: [...mm.foldedIds] });
});

post({ type: 'ready' });

function isDark() {
  // https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content
  const { classList } = document.body;
  return (
    classList.contains('vscode-dark') ||
    (classList.contains('vscode-high-contrast') &&
      !classList.contains('vscode-high-contrast-light'))
  );
}

/** Light or dark follows VS Code unless the document or the settings say otherwise. */
function applyOptions() {
  const colorScheme = isDark() ? 'dark' : 'light';
  const key = JSON.stringify([colorScheme, defaultOptions]);
  if (key === appliedOptions) return;
  appliedOptions = key;
  const { options, warnings } = resolveViewOptions(
    { plugins: [...defaultContentPlugins, mathContent], colorScheme },
    defaultOptions,
  );
  defaultWarnings = warnings;
  view.options = options;
}

function showWarnings() {
  const warnings = [...defaultWarnings, ...view.warnings];
  status.textContent = warnings.join(' · ');
  status.hidden = !warnings.length;
}

function reveal(node: MarkmapNode) {
  const mm = view.mm;
  if (!mm) return;
  if (!isInView(mm, node.id)) mm.focusNode(node.id);
  flash(mm, node.id);
}

function findHeading(id: string) {
  let target: MarkmapNode | undefined;
  if (view.mm?.tree) {
    walkTree(view.mm.tree, (node) => {
      const text = toPlainText(node.content).trim();
      if (
        node.type === 'heading' &&
        text.replace(/\W/g, '-').toLowerCase() === id
      ) {
        target ??= node;
      }
    });
  }
  return target;
}

/** Links in labels and notes: go to headings and open local files in VS Code. */
function handleLinkClick(event: MouseEvent) {
  const link = event
    .composedPath()
    .find((target) => target instanceof Element && target.localName === 'a') as
    | Element
    | undefined;
  const href = link?.getAttribute('href');
  if (!href) return;
  if (href.startsWith('#')) {
    event.preventDefault();
    const node = findHeading(href.slice(1));
    if (node) reveal(node);
  } else if (!/^[a-z][a-z\d+.-]*:/i.test(href)) {
    event.preventDefault();
    post({ type: 'openFile', data: href });
  }
}

/**
 * Fold or unfold a node by clicking anywhere on it, not only on its fold
 * anchor. Ctrl or Cmd toggles the whole subtree, same as the anchor.
 */
function handleNodeClick(event: MouseEvent) {
  if (event.defaultPrevented) return;
  const mm = view.mm;
  if (!mm) return;
  const target = mm.hitAt(...mm.layoutPoint(event.clientX, event.clientY));
  // Fold anchors, note dots and links are handled by the view's own gestures.
  if (target?.kind !== 'node') return;
  const node = mm.tree && findNode(mm.tree, target.nodeId);
  if (!node?.children.length) return;
  toggleNode(mm, target.nodeId, event.ctrlKey || event.metaKey);
}

function toggleNode(mm: Markmap, id: string, recursive: boolean) {
  if (!recursive) mm.toggle(id);
  else if (mm.foldedIds.has(id)) mm.expandAll(id);
  else mm.foldAll(id);
}

/** Single-key shortcuts, available while the preview has focus. */
const keyHandlers: Record<string, () => void> = {
  f: () => view.mm?.fit(),
  e: () => view.mm?.expandAll(),
  c: () => view.mm?.foldToLevel(1),
  '+': () => view.mm?.zoomIn(),
  '=': () => view.mm?.zoomIn(),
  '-': () => view.mm?.zoomOut(),
  t: () => {
    if (view.mm && active) toggleNode(view.mm, active.id, false);
  },
  r: () => {
    if (view.mm && active) toggleNode(view.mm, active.id, true);
  },
  '/': () => openSearch(),
  '?': () => toggleHelp(),
};

function handleKeyDown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest?.('input, textarea, select, [contenteditable]')) return;
  if (event.key === 'Escape') {
    hideHelp();
    return;
  }
  const handler = keyHandlers[event.key.toLowerCase()];
  if (!handler) return;
  event.preventDefault();
  handler();
}

const SHORTCUTS: [string[], string][] = [
  [['F'], 'Fit window size'],
  [['E'], 'Expand all'],
  [['C'], 'Collapse all'],
  [['+', '='], 'Zoom in'],
  [['-'], 'Zoom out'],
  [['T'], 'Toggle the node under the cursor'],
  [['R'], 'Toggle the node under the cursor recursively'],
  [['/'], 'Search nodes'],
  [['?'], 'Show/hide this help'],
];

let helpEl: HTMLDivElement | undefined;

function toggleHelp() {
  if (helpEl?.isConnected) {
    hideHelp();
    return;
  }
  helpEl = document.createElement('div');
  helpEl.className = 'shortcut-help';
  const title = document.createElement('div');
  title.className = 'shortcut-help-title';
  title.textContent = 'Keyboard Shortcuts';
  const list = document.createElement('ul');
  for (const [keys, label] of SHORTCUTS) {
    const item = document.createElement('li');
    const keyList = document.createElement('span');
    keys.forEach((key, index) => {
      if (index) keyList.append(' / ');
      const kbd = document.createElement('kbd');
      kbd.textContent = key;
      keyList.append(kbd);
    });
    const text = document.createElement('span');
    text.textContent = label;
    item.append(keyList, text);
    list.append(item);
  }
  helpEl.append(title, list);
  document.body.append(helpEl);
}

function hideHelp() {
  helpEl?.remove();
}

/**
 * The tree as a nested Markdown list, skipping folded branches so the outline
 * matches what is on screen.
 */
function buildOutline() {
  const mm = view.mm;
  if (!mm?.tree) return '';
  const lines: string[] = [];
  const visit = (node: MarkmapNode, depth: number) => {
    const text = toPlainText(node.content).trim();
    if (text) lines.push(`${'  '.repeat(depth)}- ${text}`);
    if (mm.foldedIds.has(node.id)) return;
    node.children.forEach((child) => visit(child, depth + 1));
  };
  visit(mm.tree, 0);
  return lines.length ? `${lines.join('\n')}\n` : '';
}

/** Fold state saved when a search starts, restored when it is cleared. */
let foldBeforeSearch: string[] | undefined;
let searchEl: HTMLDivElement | undefined;
let searchInput: HTMLInputElement | undefined;
let searchCount: HTMLSpanElement | undefined;
let matches: MarkmapNode[] = [];
let matchIndex = 0;

function openSearch() {
  if (!searchEl) {
    searchEl = document.createElement('div');
    searchEl.className = 'node-search';
    searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search nodes';
    searchInput.setAttribute('aria-label', 'Search nodes');
    searchCount = document.createElement('span');
    searchCount.className = 'node-search-count';
    searchEl.append(searchInput, searchCount);
    document.body.append(searchEl);
    searchInput.addEventListener('input', () => runSearch(searchInput!.value));
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        stepMatch(event.shiftKey ? -1 : 1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeSearch();
      }
    });
  }
  searchEl.hidden = false;
  searchInput?.focus();
  searchInput?.select();
}

function closeSearch() {
  if (!searchEl) return;
  searchEl.hidden = true;
  searchInput!.value = '';
  runSearch('');
  view.element.focus();
}

/** Show only the branches that lead to a match, and jump to the first one. */
function runSearch(query: string) {
  const mm = view.mm;
  if (!mm?.tree) return;
  const needle = query.trim().toLowerCase();
  if (!needle) {
    matches = [];
    matchIndex = 0;
    if (foldBeforeSearch) {
      mm.setFoldedIds(foldBeforeSearch);
      foldBeforeSearch = undefined;
    }
    updateSearchCount();
    return;
  }
  foldBeforeSearch ??= [...mm.foldedIds];
  matches = [];
  const keep = new Set<string>();
  const visit = (node: MarkmapNode, ancestors: string[]) => {
    const hit = toPlainText(node.content).toLowerCase().includes(needle);
    if (hit) {
      matches.push(node);
      ancestors.forEach((id) => keep.add(id));
    }
    node.children.forEach((child) => visit(child, [...ancestors, node.id]));
  };
  visit(mm.tree, []);
  // Fold every node with children that is not on the path to a match. With no
  // match at all, leave the map as it was rather than folding everything away.
  const folded: string[] = [];
  if (matches.length) {
    let isRoot = true;
    walkTree(mm.tree, (node) => {
      // Never fold the root, or the whole map disappears.
      if (!isRoot && node.children.length && !keep.has(node.id)) {
        folded.push(node.id);
      }
      isRoot = false;
    });
  } else {
    folded.push(...foldBeforeSearch);
  }
  mm.setFoldedIds(folded);
  matchIndex = 0;
  updateSearchCount();
  if (matches.length) reveal(matches[0]);
}

function stepMatch(delta: number) {
  if (!matches.length) return;
  matchIndex = (matchIndex + delta + matches.length) % matches.length;
  updateSearchCount();
  reveal(matches[matchIndex]);
}

function updateSearchCount() {
  if (!searchCount) return;
  searchCount.textContent = matches.length
    ? `${matchIndex + 1}/${matches.length}`
    : searchInput?.value.trim()
      ? '0'
      : '';
}

async function exportImage(format: ImageFormat) {
  const mm = view.mm;
  try {
    if (!mm?.result) throw new Error('The map is not ready');
    const scheme = mm.options.colorScheme ?? 'light';
    let content: string | Uint8Array;
    if (format === 'svg') {
      content = toSVGString(mm.result, { colorScheme: scheme });
    } else {
      const dark = matchMedia('(prefers-color-scheme: dark)').matches;
      const blob = await toPNG(mm.result, {
        colorScheme: scheme === 'auto' ? (dark ? 'dark' : 'light') : scheme,
      });
      content = new Uint8Array(await blob.arrayBuffer());
    }
    post({ type: 'exportResult', data: { content } });
  } catch (err) {
    post({
      type: 'exportResult',
      data: {
        error: err instanceof Error ? err.message : 'Could not export the map',
      },
    });
  }
}
