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
  | { type: 'toggleNode'; data: boolean }
  | { type: 'exportImage'; data: ImageFormat };

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
  | { type: 'foldChanged'; data: string[] };
