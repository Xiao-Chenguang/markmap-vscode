export type ImageFormat = 'svg' | 'png';

/** Messages from the extension host to the webview. */
export type HostMessage =
  | {
      type: 'setContent';
      data: {
        markdown: string;
        /** The `markmapPlus.defaultOptions` setting, parsed. */
        defaultOptions: unknown;
        /** Webview URL of the document's folder, for relative images. */
        baseUri: string;
        /**
         * Folded node ids saved from a previous session. Only sent on the
         * first load, so later edits keep whatever the user folded since.
         */
        foldedIds?: string[];
      };
    }
  | { type: 'setCursor'; data: number }
  | { type: 'setCSS'; data: string }
  /** Theme and layout chosen in the settings, overriding the frontmatter. */
  | { type: 'setAppearance'; data: { theme?: string; layout?: string } }
  | { type: 'toggleNode'; data: boolean }
  | { type: 'exportImage'; data: ImageFormat }
  /** Ask for the visible tree as a nested Markdown list. */
  | { type: 'exportOutline' };

/** Messages from the webview to the extension host. */
export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'editAsText' }
  | { type: 'export'; data: { title: string } }
  | {
      type: 'exportResult';
      data: { content?: string | Uint8Array; error?: string };
    }
  | { type: 'openFile'; data: string }
  | { type: 'setFocus'; data: number }
  /** The set of folded node ids changed, for restoring it next time. */
  | { type: 'foldChanged'; data: string[] }
  /** The visible tree as a nested Markdown list, for the outline export. */
  | { type: 'outline'; data: string };
