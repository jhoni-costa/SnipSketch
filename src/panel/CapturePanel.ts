import * as vscode from 'vscode';
import * as path from 'path';
import { CodeSnippetPayload, ExtensionToWebviewMessage, WebviewToExtensionMessage } from '../types';

export class CapturePanel {
  public static currentPanel: CapturePanel | undefined;
  public static readonly viewType = 'vsCaptureEditor';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _pendingSnippet: CodeSnippetPayload | null = null;
  private _isReady = false;

  public static createOrShow(extensionUri: vscode.Uri, snippet?: CodeSnippetPayload): CapturePanel {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : vscode.ViewColumn.One;

    if (CapturePanel.currentPanel) {
      CapturePanel.currentPanel._panel.reveal(column);
      if (snippet) {
        CapturePanel.currentPanel.loadSnippet(snippet);
      }
      return CapturePanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      CapturePanel.viewType,
      'SnipSketch',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist')
        ]
      }
    );

    CapturePanel.currentPanel = new CapturePanel(panel, extensionUri, snippet);
    return CapturePanel.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    snippet?: CodeSnippetPayload
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._pendingSnippet = snippet || null;

    // Set panel icon
    this._panel.iconPath = vscode.Uri.joinPath(this._extensionUri, 'dist', 'icon.svg');

    // Set HTML content
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

    // Listen to messages from Webview
    this._panel.webview.onDidReceiveMessage(
      (message: WebviewToExtensionMessage) => {
        this._handleWebviewMessage(message);
      },
      null,
      this._disposables
    );

    // Clean up on panel disposal
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public loadSnippet(snippet: CodeSnippetPayload): void {
    this._pendingSnippet = snippet;
    if (this._isReady) {
      this._sendMessage({
        type: 'LOAD_SNIPPET',
        payload: snippet
      });
      this._pendingSnippet = null;
    }
  }

  private _sendMessage(message: ExtensionToWebviewMessage): void {
    this._panel.webview.postMessage(message);
  }

  private async _handleWebviewMessage(message: WebviewToExtensionMessage): Promise<void> {
    switch (message.type) {
      case 'READY': {
        this._isReady = true;
        if (this._pendingSnippet) {
          this._sendMessage({
            type: 'LOAD_SNIPPET',
            payload: this._pendingSnippet
          });
          this._pendingSnippet = null;
        }
        break;
      }

      case 'SHOW_INFO': {
        vscode.window.showInformationMessage(message.message);
        break;
      }

      case 'SHOW_ERROR': {
        vscode.window.showErrorMessage(message.message);
        break;
      }

      case 'COPY_IMAGE': {
        vscode.window.showInformationMessage('Screenshot copied to clipboard!');
        break;
      }

      case 'SAVE_IMAGE': {
        await this._saveImageToFile(message.dataUrl, message.defaultFileName);
        break;
      }
    }
  }

  private async _saveImageToFile(dataUrl: string, defaultName?: string): Promise<void> {
    try {
      const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
      if (!match) {
        throw new Error('Invalid PNG data URL');
      }

      const buffer = Buffer.from(match[1], 'base64');
      const filename = defaultName || `code-capture-${Date.now()}.png`;

      // Workspace folder if available
      const defaultUri = vscode.workspace.workspaceFolders?.[0]
        ? vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, filename)
        : vscode.Uri.file(path.join(process.env.HOME || '', 'Downloads', filename));

      const fileUri = await vscode.window.showSaveDialog({
        defaultUri,
        filters: {
          'PNG Image': ['png']
        },
        saveLabel: 'Save Screenshot'
      });

      if (fileUri) {
        await vscode.workspace.fs.writeFile(fileUri, buffer);
        const openAction = 'Open File';
        const choice = await vscode.window.showInformationMessage(
          `Image saved: ${path.basename(fileUri.fsPath)}`,
          openAction
        );

        if (choice === openAction) {
          vscode.env.openExternal(fileUri);
        }
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to save image: ${err?.message || err}`);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
    );

    const nonce = getNonce();

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data: blob:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource} https: data:;">
  <title>SnipSketch</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body class="vs-capture-body">
  <div id="app">
    <!-- Top Bar Controls -->
    <header class="app-header">
      <div class="header-left">
        <span class="app-title">SnipSketch</span>
        <span id="badge-lang" class="badge-tag">plaintext</span>
        <span id="badge-file" class="badge-file">untitled</span>
      </div>
      <div class="header-center">
        <!-- Zoom and View Controls -->
        <div class="zoom-controls">
          <button id="btn-zoom-out" class="icon-btn" title="Zoom Out (Ctrl -)">-</button>
          <span id="zoom-label" class="zoom-label">100%</span>
          <button id="btn-zoom-in" class="icon-btn" title="Zoom In (Ctrl +)">+</button>
          <button id="btn-zoom-reset" class="icon-btn" title="Reset Zoom">1:1</button>
        </div>
      </div>
      <div class="header-right">
        <button id="btn-undo" class="action-btn" title="Undo (Ctrl+Z)" disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          <span>Undo</span>
        </button>
        <button id="btn-redo" class="action-btn" title="Redo (Ctrl+Y / Ctrl+Shift+Z)" disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
          <span>Redo</span>
        </button>
        <button id="btn-clear" class="action-btn danger" title="Clear all annotations">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span>Clear</span>
        </button>
        <div class="divider"></div>
        <button id="btn-copy" class="action-btn primary" title="Copy screenshot to clipboard (Ctrl+C)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>Copy</span>
        </button>
        <button id="btn-save" class="action-btn success" title="Save as PNG file (Ctrl+S)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <span>Save PNG</span>
        </button>
      </div>
    </header>

    <!-- Main Workspace Area -->
    <main class="editor-viewport" id="viewport">
      <div class="canvas-wrapper" id="canvas-wrapper">
        <canvas id="main-canvas"></canvas>
      </div>
    </main>

    <!-- Floating Lightshot-style Toolbar -->
    <div class="floating-toolbar" id="toolbar">
      <div class="tool-group">
        <button class="tool-btn active" data-tool="select" title="Select / Move (V)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>
        </button>
        <button class="tool-btn" data-tool="arrow" title="Arrow (A)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="10 5 19 5 19 14"/></svg>
        </button>
        <button class="tool-btn" data-tool="rect" title="Rectangle (R)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
        </button>
        <button class="tool-btn" data-tool="ellipse" title="Ellipse / Circle (E)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>
        </button>
        <button class="tool-btn" data-tool="pen" title="Pencil / Freehand (P)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/></svg>
        </button>
        <button class="tool-btn" data-tool="highlighter" title="Highlighter (H)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
        </button>
        <button class="tool-btn" data-tool="text" title="Text (T)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
        </button>
        <button class="tool-btn" data-tool="step" title="Step Badge Number (S)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="currentColor" stroke="none">1</text></svg>
        </button>
        <button class="tool-btn" data-tool="blur" title="Blur / Redact Sensitive Code (B)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
        </button>
      </div>

      <div class="tool-divider"></div>

      <!-- Color Palette -->
      <div class="color-palette">
        <button class="color-dot active" data-color="#ff3b30" style="background-color: #ff3b30;" title="Red"></button>
        <button class="color-dot" data-color="#ff9500" style="background-color: #ff9500;" title="Orange"></button>
        <button class="color-dot" data-color="#ffd60a" style="background-color: #ffd60a;" title="Yellow"></button>
        <button class="color-dot" data-color="#30d158" style="background-color: #30d158;" title="Green"></button>
        <button class="color-dot" data-color="#0a84ff" style="background-color: #0a84ff;" title="Blue"></button>
        <button class="color-dot" data-color="#bf5af2" style="background-color: #bf5af2;" title="Purple"></button>
        <button class="color-dot" data-color="#ffffff" style="background-color: #ffffff;" title="White"></button>
      </div>

      <div class="tool-divider"></div>

      <!-- Stroke Width Selector -->
      <div class="stroke-selector">
        <button class="stroke-btn" data-width="2" title="Thin (2px)"><span class="stroke-preview" style="height: 2px;"></span></button>
        <button class="stroke-btn active" data-width="4" title="Medium (4px)"><span class="stroke-preview" style="height: 4px;"></span></button>
        <button class="stroke-btn" data-width="8" title="Thick (8px)"><span class="stroke-preview" style="height: 8px;"></span></button>
      </div>
    </div>

    <!-- Hidden Text Input for Canvas Text Tool -->
    <textarea id="text-editor-input" class="text-editor-input" style="display: none;"></textarea>

    <!-- Notification Toast -->
    <div id="toast" class="toast"></div>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose(): void {
    CapturePanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
