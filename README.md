# Markmap Plus

[![vscode](https://img.shields.io/visual-studio-marketplace/v/cgxiao.markmap-plus)](https://marketplace.visualstudio.com/items?itemName=cgxiao.markmap-plus)

[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=cgxiao.markmap-plus) · [Project website](https://xiao-chenguang.github.io/markmap-vscode/) · [Source and issues](https://github.com/Xiao-Chenguang/markmap-vscode)

> **Markmap Plus is an independent fork of [markmap-vscode](https://github.com/markmap/markmap-vscode) by Gerald ([@gera2ld](https://github.com/gera2ld)).**
> It is **not** affiliated with or endorsed by the original author. The original project is MIT licensed, and so is this fork.
> The fork exists because the upstream project is no longer actively maintained; it keeps the upstream feature set and adds improvements on top.

This extension integrates [markmap](https://markmap.js.org/) into VS Code: preview your markdown as an interactive mind map.

## Why a fork?

The upstream `markmap-vscode` has not been updated for a long time and pull requests are not being merged. Markmap Plus is published under its own extension ID so it can be iterated on independently, while staying compatible with the upstream feature set.

| | markmap-vscode (upstream) | Markmap Plus (this fork) |
| --- | --- | --- |
| Maintenance | Inactive | Actively maintained |
| Extension ID | `gera2ld.markmap-vscode` | `cgxiao.markmap-plus` |
| Settings prefix | `markmap.*` | `markmapPlus.*` |
| Keyboard shortcuts in the preview | — | ✅ |
| Click anywhere on a node to fold it | — | ✅ |
| Node search / filter | — | ✅ |
| Fold state remembered per file | — | ✅ |
| Markdown outline export | — | ✅ |
| Theme and layout settings | frontmatter only | ✅ settings too |
| Multiple previews stay in sync | — | ✅ |
| Everything else | ✅ | ✅ (inherited) |

## Migrating from markmap-vscode

1. Uninstall (or disable) the original `markmap-vscode` extension. Both extensions register a markdown custom editor, so keeping both installed leads to unpredictable behaviour.
2. Install **Markmap Plus**.
3. Copy your settings over — the keys were renamed to avoid clashing with the original extension:

   | Old key | New key |
   | --- | --- |
   | `markmap.defaultOptions` | `markmapPlus.defaultOptions` |
   | `markmap.customCSS` | `markmapPlus.customCSS` |

   In `settings.json`:

   ```jsonc
   {
     "markmapPlus.defaultOptions": "{ \"colorFreezeLevel\": 2 }",
     "markmapPlus.customCSS": "markmap-view { --mm-link: rebeccapurple; }"
   }
   ```

4. Commands moved from the `Markmap` category to `Markmap Plus` in the Command Palette.

## Features

- Preview markdown files as markmap
- Edit markdown files in a text editor and the markmap will update on the fly
- Themes and layouts, set in frontmatter
- Export as HTML, SVG or PNG
- Works offline

## Usage

### Command Palette

Open a markdown file. Then open the Command Palette (⇧⌘P) and search `Open as markmap`, press enter.

### Context menu

Right click on a markdown file, then choose `Open as markmap`.

### Button on title-bar

Open a markdown file. Find the markmap icon on the editor title-bar and click it.

### Keyboard shortcuts

When the markmap preview is focused, the following single-key shortcuts are available. Press <kbd>?</kbd> in the preview to show them.

| Key | Action |
| --- | --- |
| `F` | Fit window size |
| `E` | Expand all nodes |
| `C` | Collapse all nodes (keep the first level) |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `T` | Toggle the node under the cursor |
| `R` | Toggle the node under the cursor recursively |
| `/` | Search nodes |
| `?` | Show/hide the shortcut help |
| `Esc` | Close the shortcut help |

Clicking anywhere on a node folds or unfolds it, not only on its fold anchor. Hold <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> to toggle the whole subtree.

### Search

Press <kbd>/</kbd> to search the map. Matching branches stay open and everything else folds away, so a large document collapses to just the parts that match. <kbd>Enter</kbd> jumps to the next match, <kbd>Shift</kbd>+<kbd>Enter</kbd> to the previous one, and <kbd>Esc</kbd> clears the search and restores the fold state you had before.

### Fold state

The branches you fold are remembered per file, so reopening a document shows the map the way you left it. Node ids are content hashes, so renaming a heading simply drops that node from the saved state instead of breaking it.

If you open the same document in more than one preview, folding a branch in one updates the others.

### Export

Use the **Export** button in the toolbar to save the map as SVG, PNG or a standalone HTML page. **Markdown** exports the branches that are currently open as a nested list, which is handy for turning a large document into a summary.

## Configuration

### Custom CSS

Extra CSS for the page around the map. To change colors, set `--mm-*` properties on `markmap-view`. See [Themes and layouts](https://markmap.js.org/docs/guide/themes-and-layouts) for the list.

```css
markmap-view {
  --mm-link: rebeccapurple;
}
```

### Default Options

Default options for Markmap as JSON, see [Options](https://markmap.js.org/docs/guide/options). Options in the frontmatter of a document win over these.

### Theme and Layout

`markmapPlus.theme` and `markmapPlus.layout` set the look of every map, so you do not have to repeat frontmatter in each document. They win over the `theme` and `layout` in a document's frontmatter.

| Setting | Values |
| --- | --- |
| `markmapPlus.theme` | `classic`, `cards`, `minimal` |
| `markmapPlus.layout` | `tree`, `two-sided`, `org-chart` |

Leave either empty to use the document's frontmatter, or the default.

## Credits

- [markmap](https://github.com/markmap/markmap) — the rendering engine
- [markmap-vscode](https://github.com/markmap/markmap-vscode) by Gerald — the original VS Code integration this fork is based on

## License

MIT. See [LICENSE](./LICENSE) — the original copyright notice is preserved.
