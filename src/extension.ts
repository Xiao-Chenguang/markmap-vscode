import {
  ExtensionContext,
  TabInputCustom,
  TabInputText,
  Uri,
  ViewColumn,
  commands,
  window as vscodeWindow,
} from 'vscode';
import { MarkmapEditor } from './editor';

const PREFIX = 'markmap-plus';
const VIEW_TYPE = `${PREFIX}.markmap`;

/**
 * The document to act on: the active text editor, or else the file behind the
 * active tab, so the commands also work while a preview has focus.
 */
function activeDocumentUri() {
  const editor = vscodeWindow.activeTextEditor;
  if (editor) return editor.document.uri;
  const input = vscodeWindow.tabGroups.activeTabGroup.activeTab?.input;
  if (input instanceof TabInputText) return input.uri;
  if (input instanceof TabInputCustom) return input.uri;
  return undefined;
}

export function activate(context: ExtensionContext) {
  const markmapEditor = new MarkmapEditor(context);
  context.subscriptions.push(
    commands.registerCommand(`${PREFIX}.open`, (uri?: Uri) => {
      uri ??= activeDocumentUri();
      if (!uri) return;
      commands.executeCommand(
        'vscode.openWith',
        uri,
        VIEW_TYPE,
        ViewColumn.Beside,
      );
    }),
    commands.registerCommand(`${PREFIX}.toggle`, () => {
      const document = vscodeWindow.activeTextEditor?.document;
      if (document) markmapEditor.toggleActiveNode(document);
    }),
    commands.registerCommand(`${PREFIX}.toggle-recursively`, () => {
      const document = vscodeWindow.activeTextEditor?.document;
      if (document) markmapEditor.toggleActiveNode(document, true);
    }),
  );
  context.subscriptions.push(
    vscodeWindow.registerCustomEditorProvider(VIEW_TYPE, markmapEditor, {
      webviewOptions: { retainContextWhenHidden: true },
      // Allow the same document in more than one preview, e.g. side by side.
      supportsMultipleEditorsPerDocument: true,
    }),
  );
}

export function deactivate() {
  // noop
}
