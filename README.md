# Markmap Plus

[![vscode](https://img.shields.io/visual-studio-marketplace/v/cgxiao.markmap-plus)](https://marketplace.visualstudio.com/items?itemName=cgxiao.markmap-plus)

[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=cgxiao.markmap-plus) · [Project website](https://xiao-chenguang.github.io/markmap-vscode/) · [Source and issues](https://github.com/Xiao-Chenguang/markmap-vscode)

Markmap Plus previews Markdown as an interactive mind map in VS Code.

## Features

- Preview Markdown and see edits reflected as you type
- Use keyboard shortcuts, fold branches, and search nodes in the preview
- Restore folded branches per file and synchronize folding across open previews
- Set themes and layouts in VS Code settings or document frontmatter
- Export as HTML, SVG, PNG or a Markdown outline
- Preview without a network connection (remote images and links still require access to their sources)

## Usage

### Command Palette

Open a markdown file. Then open the Command Palette (⇧⌘P on macOS, Ctrl+Shift+P on Windows/Linux), search for `Markmap Plus: Open as markmap`, and press Enter.

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
| `/` | Search nodes |
| `?` | Show/hide the shortcut help |
| `Esc` | Close the shortcut help |

### Folding nodes

In the preview, left-click a branch node to fold or unfold its immediate children. Right-click it to fold or unfold the entire subtree. <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+click also toggles the whole subtree. Links and areas outside branch nodes keep their context menus.

When the Markdown editor is active, the Command Palette offers **Markmap Plus: Toggle the active node** and **Markmap Plus: Toggle the active node recursively** for the node at the text cursor. These commands have no default keybindings, so typing `t` or `r` in Markdown works normally. You can assign your own keybindings in VS Code if you want them.

### Search

Press <kbd>/</kbd> to search the map. Paths to matching nodes stay open and other branches fold. If there are no matches, the previous fold state remains visible. <kbd>Enter</kbd> jumps to the next match, <kbd>Shift</kbd>+<kbd>Enter</kbd> to the previous one, and <kbd>Esc</kbd> clears the search and restores the fold state you had before.

### Fold state

The branches you fold are remembered per file in the current VS Code workspace. Reopening a document in that workspace restores its saved fold state. Editing node content can change its identity and prevent that node's saved state from being restored.

If you open the same document in more than one preview, folding a branch in one updates the others.

### Export

Use the **Export** button in the toolbar to save the map as SVG, PNG or an HTML page. The HTML includes the viewer, but does not embed local images or apply the extension's settings; document frontmatter still applies. Remote resources require a network connection. **Markdown** exports the branches that are currently open as a nested list.

## Configuration

### Custom CSS

`markmapPlus.customCSS` adds CSS to the preview page around the map. To change colors, set `--mm-*` properties on `markmap-view`; rules cannot reach inside the map. It does not apply to exported HTML. See [Themes and layouts](https://markmap.js.org/docs/guide/themes-and-layouts) for the list.

```css
markmap-view {
  --mm-link: rebeccapurple;
}
```

### Default Options

`markmapPlus.defaultOptions` sets default Markmap options as a JSON string; see [Options](https://markmap.js.org/docs/guide/options). Options in a document's frontmatter take precedence. These defaults do not apply to exported HTML.

### Theme and Layout

`markmapPlus.theme` and `markmapPlus.layout` set the look of every map, so you do not have to repeat frontmatter in each document. They win over the `theme` and `layout` in a document's frontmatter.

| Setting | Values |
| --- | --- |
| `markmapPlus.theme` | `classic`, `cards`, `minimal` |
| `markmapPlus.layout` | `tree`, `two-sided`, `org-chart` |

Leave either empty to use the document's frontmatter, or the default. If you clear a previously selected theme or layout, reopen the preview to restore the document's value.

## Migrating from markmap-vscode

1. Install **Markmap Plus** (`cgxiao.markmap-plus`).
2. Optionally disable `markmap-vscode` (`gera2ld.markmap-vscode`) to avoid duplicate commands and editor choices. The two extensions use separate IDs and settings.
3. Copy your settings to the new keys.

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

4. Look for commands under `Markmap Plus` in the Command Palette.

## Credits

Markmap Plus builds on Gerald's [markmap-vscode](https://github.com/markmap/markmap-vscode) and adds features such as preview shortcuts, node search, and Markdown outline export. It uses [markmap](https://github.com/markmap/markmap) to render mind maps.

## License

MIT. See [LICENSE](./LICENSE) — the original copyright notice is preserved.
