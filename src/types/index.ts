/**
 * Shared message contracts and domain types between the extension host and webview.
 */

export interface CodeSnippetPayload {
  code: string;
  language: string;
  fileName: string;
  startLine: number;
  theme?: string;
  showLineNumbers?: boolean;
  showWindowControls?: boolean;
  padding?: number;
  fontFamily?: string;
}

export type ExtensionToWebviewMessage =
  | { type: 'LOAD_SNIPPET'; payload: CodeSnippetPayload }
  | { type: 'SET_THEME'; theme: string }
  | { type: 'TRIGGER_EXPORT'; format: 'png' | 'copy' };

export type WebviewToExtensionMessage =
  | { type: 'COPY_IMAGE'; dataUrl: string }
  | { type: 'SAVE_IMAGE'; dataUrl: string; defaultFileName?: string }
  | { type: 'SHOW_INFO'; message: string }
  | { type: 'SHOW_ERROR'; message: string }
  | { type: 'READY' };
