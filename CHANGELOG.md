# Change Log

## 0.4.5

- Update the README, website, and extension listing to focus on what Markmap Plus offers. Move migration and project credits after usage and configuration.

## 0.4.4

- Redesign the extension icon and the light/dark editor title-bar icons.
- Refine documentation and add Open VSX publishing to the release workflow.

## 0.4.3

- Clarify the mouse gestures and the unbound Command Palette commands for folding nodes.

## 0.4.2

- Use left-click to toggle a branch and right-click to toggle its entire subtree; remove the unreliable T and R shortcuts.

## 0.4.1

- Correct project links and issue templates; remove the unavailable Open VSX installation link and inherited screenshots.

## 0.4.0

The first Markmap Plus release builds on `markmap-vscode` 0.3.1.

- Renamed the extension to **Markmap Plus** (`cgxiao.markmap-plus`)
- Renamed the command prefix from `markmap-vscode.*` to `markmap-plus.*`
- Renamed the custom editor view type from `markmap-vscode.markmap` to `markmap-plus.markmap`
- Renamed the settings from `markmap.*` to `markmapPlus.*` so both extensions can coexist in a settings file without clashing
- Added a Markmap Plus icon
- Preserved the original MIT copyright notice and added the Markmap Plus notice
- Added single-key shortcuts while the preview has focus: <kbd>F</kbd> fit, <kbd>E</kbd> expand all, <kbd>C</kbd> collapse all, <kbd>+</kbd>/<kbd>-</kbd> zoom, <kbd>T</kbd>/<kbd>R</kbd> toggle the node under the cursor (removed in 0.4.2), <kbd>/</kbd> search, <kbd>?</kbd> shortcut help
- Click anywhere on a node to fold it, not only on its fold anchor (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd> toggles the whole subtree)
- Added node search: matching branches stay open, everything else folds away, and the previous fold state is restored when the search is cleared
- Remember the folded branches per file, so reopening a document shows the map the way you left it
- Added a Markdown export that writes the branches currently open as a nested list
- Added `markmapPlus.theme` and `markmapPlus.layout` settings, so the look can be set once instead of in every document's frontmatter
- Keep multiple previews of the same document in sync when a branch is folded

## 0.3.1

This and earlier entries record releases of [markmap-vscode](https://github.com/markmap/markmap-vscode).

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
