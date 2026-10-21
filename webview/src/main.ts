import { CanvasEngine } from './engine/CanvasEngine';
import { SelectTool } from './tools/SelectTool';
import { ArrowTool } from './tools/ArrowTool';
import { RectTool } from './tools/RectTool';
import { EllipseTool } from './tools/EllipseTool';
import { PenTool } from './tools/PenTool';
import { TextTool } from './tools/TextTool';
import { StepTool } from './tools/StepTool';
import { BlurTool } from './tools/BlurTool';
import { ToolType, ExtensionToWebviewMessage, WebviewToExtensionMessage } from './types';

// Declare VS Code API acquisition
declare function acquireVsCodeApi(): {
  postMessage(message: WebviewToExtensionMessage): void;
  setState(state: any): void;
  getState(): any;
};

const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : null;

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const btnUndo = document.getElementById('btn-undo') as HTMLButtonElement;
  const btnRedo = document.getElementById('btn-redo') as HTMLButtonElement;
  const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;
  const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement;
  const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
  const btnZoomIn = document.getElementById('btn-zoom-in') as HTMLButtonElement;
  const btnZoomOut = document.getElementById('btn-zoom-out') as HTMLButtonElement;
  const btnZoomReset = document.getElementById('btn-zoom-reset') as HTMLButtonElement;
  const zoomLabel = document.getElementById('zoom-label') as HTMLSpanElement;
  const badgeLang = document.getElementById('badge-lang') as HTMLSpanElement;
  const badgeFile = document.getElementById('badge-file') as HTMLSpanElement;
  const toast = document.getElementById('toast') as HTMLDivElement;

  let currentFileName = 'code-snippet.png';

  // State synchronization callback
  const onStateChange = () => {
    btnUndo.disabled = !engine.history.canUndo();
    btnRedo.disabled = !engine.history.canRedo();
    zoomLabel.textContent = `${Math.round(engine.getZoom() * 100)}%`;
  };

  // Instantiate Canvas Engine
  const engine = new CanvasEngine(canvas, onStateChange);

  // Register all interactive tools
  engine.toolManager.registerTool(new SelectTool(engine));
  engine.toolManager.registerTool(new ArrowTool(engine));
  engine.toolManager.registerTool(new RectTool(engine));
  engine.toolManager.registerTool(new EllipseTool(engine));
  engine.toolManager.registerTool(new PenTool(engine, false)); // Pen
  engine.toolManager.registerTool(new PenTool(engine, true));  // Highlighter
  engine.toolManager.registerTool(new TextTool(engine));
  engine.toolManager.registerTool(new StepTool(engine));
  engine.toolManager.registerTool(new BlurTool(engine));

  // Initialize tool to Select
  engine.toolManager.setTool('select');

  // Tool buttons binding
  const toolButtons = document.querySelectorAll<HTMLButtonElement>('.tool-btn');
  toolButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const toolType = btn.dataset.tool as ToolType;
      if (!toolType) return;

      toolButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      engine.toolManager.setTool(toolType);
    });
  });

  // Color palette binding
  const colorDots = document.querySelectorAll<HTMLButtonElement>('.color-dot');
  colorDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const color = dot.dataset.color;
      if (!color) return;

      colorDots.forEach((d) => d.classList.remove('active'));
      dot.classList.add('active');

      engine.toolManager.setColor(color);
    });
  });

  // Stroke width selector binding
  const strokeButtons = document.querySelectorAll<HTMLButtonElement>('.stroke-btn');
  strokeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const width = parseInt(btn.dataset.width || '4', 10);

      strokeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      engine.toolManager.setStrokeWidth(width);
    });
  });

  // Undo / Redo / Clear
  btnUndo.addEventListener('click', () => engine.history.undo());
  btnRedo.addEventListener('click', () => engine.history.redo());
  btnClear.addEventListener('click', () => {
    engine.clearAllShapes();
    engine.toolManager.resetStepCounter();
    showToast('Annotations cleared');
  });

  // Zoom controls
  btnZoomIn.addEventListener('click', () => {
    engine.setZoom(engine.getZoom() + 0.1);
  });
  btnZoomOut.addEventListener('click', () => {
    engine.setZoom(engine.getZoom() - 0.1);
  });
  btnZoomReset.addEventListener('click', () => {
    engine.setZoom(1.0);
  });

  // Copy to clipboard
  btnCopy.addEventListener('click', async () => {
    const success = await engine.copyToClipboard();
    if (success) {
      showToast('Copied screenshot to clipboard!');
      vscode?.postMessage({ type: 'COPY_IMAGE', dataUrl: '' });
    } else {
      const dataUrl = engine.exportPngDataUrl();
      vscode?.postMessage({ type: 'COPY_IMAGE', dataUrl });
      showToast('Copied screenshot!');
    }
  });

  // Save to PNG file
  btnSave.addEventListener('click', () => {
    const dataUrl = engine.exportPngDataUrl();
    if (!dataUrl) {
      showToast('Failed to generate image');
      return;
    }

    const defaultName = currentFileName
      ? currentFileName.replace(/\.[^/.]+$/, '') + '-capture.png'
      : `code-capture-${Date.now()}.png`;

    vscode?.postMessage({
      type: 'SAVE_IMAGE',
      dataUrl,
      defaultFileName: defaultName
    });
  });

  // Keyboard shortcuts helper for quick tool switching
  window.addEventListener('keydown', (e) => {
    // If typing in textarea, ignore tool switching
    if (document.activeElement?.tagName === 'TEXTAREA') return;

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key.toLowerCase();
    const keyMap: Record<string, ToolType> = {
      v: 'select',
      a: 'arrow',
      r: 'rect',
      e: 'ellipse',
      p: 'pen',
      h: 'highlighter',
      t: 'text',
      s: 'step',
      b: 'blur'
    };

    if (keyMap[key]) {
      const targetTool = keyMap[key];
      engine.toolManager.setTool(targetTool);
      toolButtons.forEach((b) => {
        b.classList.toggle('active', b.dataset.tool === targetTool);
      });
    }
  });

  // Notification Toast Helper
  let toastTimer: any = null;
  function showToast(message: string): void {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  // Handle messages from Extension Host
  window.addEventListener('message', (event) => {
    const message: ExtensionToWebviewMessage = event.data;
    switch (message.type) {
      case 'LOAD_SNIPPET': {
        const payload = message.payload;
        currentFileName = payload.fileName || 'snippet.png';
        if (badgeLang) badgeLang.textContent = payload.language || 'plaintext';
        if (badgeFile) badgeFile.textContent = payload.fileName || 'untitled';

        engine.setSnippet(payload);
        showToast('Code snippet loaded');
        break;
      }
    }
  });

  // Signal to extension host that Webview is ready to receive snippet
  vscode?.postMessage({ type: 'READY' });
});
