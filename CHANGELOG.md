# Change Log

> **Markmap Plus** is an independent fork of [markmap-vscode](https://github.com/markmap/markmap-vscode) by Gerald, MIT licensed.
> Entries below `0.4.0` are inherited from the upstream project and are kept for history.
> From `0.4.0` on, versions are released independently by this fork.

## 0.4.0

Forked from upstream `markmap-vscode` 0.3.1 and published under a new extension ID.

- Renamed the extension to **Markmap Plus** (`cgxiao.markmap-plus`)
- Renamed the command prefix from `markmap-vscode.*` to `markmap-plus.*`
- Renamed the custom editor view type from `markmap-vscode.markmap` to `markmap-plus.markmap`
- Renamed the settings from `markmap.*` to `markmapPlus.*` so both extensions can coexist in a settings file without clashing
- New icon, so the fork is visually distinguishable from the original
- Preserved the original MIT copyright notice and added the fork's own
- Added single-key shortcuts while the preview has focus: <kbd>F</kbd> fit, <kbd>E</kbd> expand all, <kbd>C</kbd> collapse all, <kbd>+</kbd>/<kbd>-</kbd> zoom, <kbd>T</kbd>/<kbd>R</kbd> toggle the node under the cursor, <kbd>/</kbd> search, <kbd>?</kbd> shortcut help
- Click anywhere on a node to fold it, not only on its fold anchor (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd> toggles the whole subtree)
- Added node search: matching branches stay open, everything else folds away, and the previous fold state is restored when the search is cleared
- Remember the folded branches per file, so reopening a document shows the map the way you left it
- Added a Markdown export that writes the branches currently open as a nested list
- Added `markmapPlus.theme` and `markmapPlus.layout` settings, so the look can be set once instead of in every document's frontmatter
- Keep multiple previews of the same document in sync when a branch is folded

## 0.3.1

- Update `@markmap/*` to 1.1.0 and add e2e tests

## 0.3.0

Rebuilt on the new `@markmap/*` packages.

- Add themes (`classic`, `cards`, `minimal`) and layouts (`tree`, `two-sided`, `org-chart`), set in frontmatter
- Add PNG export, and choose the format before picking a file
- Keep folded branches while editing
- Follow the VS Code color theme
- Add a content security policy to the webview, and limit local files to the document's folder
- Paragraphs, code blocks and tables are now notes that open in a popover, not nodes
- Raw HTML is dropped, except `<!-- markmap: fold -->` comments and single `<img>` tags
- Math uses MathJax instead of KaTeX
- Option names changed, for example `initialExpandLevel` is now `foldLevel`, and old names show a warning. See the [migration guide](https://markmap.js.org/docs/migration)
- Remove the `activeNode`, `autoExpand`, `embedAssets` and `htmlParser` options
- `markmap.customCSS` can no longer style the inside of a map. Set `--mm-*` properties on `markmap-view` instead
- Exported HTML always works offline, and `markmap.defaultOptions` and `markmap.customCSS` do not apply to it

## 0.2.12

- Fix security issue in file operations requested from the webview, thanks to Brian Willows for reporting

## 0.1.1

- Use <kbd>Cmd</kbd>+click to toggle nodes recursively on macOS

## 0.1.0

- Added offline mode

## 0.0.4

- Fix nested list with depth greater than 10
- Bundle with rollup to decrease package size

## 0.0.2

- Initial release
