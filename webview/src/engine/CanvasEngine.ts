import { CodeSnippetPayload, Point, ShapeStyle } from '../types';
import { BaseShape } from '../shapes/BaseShape';
import { SnippetRenderer } from './SnippetRenderer';
import { HistoryManager, Command } from './History';
import { ToolManager } from '../tools/ToolManager';
import { BlurShape } from '../shapes/BlurShape';

export class CanvasEngine {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private _bgCanvas: HTMLCanvasElement;
  private _bgCtx: CanvasRenderingContext2D;

  private _snippetRenderer = new SnippetRenderer();
  private _history: HistoryManager;
  private _toolManager: ToolManager;

  private _shapes: BaseShape[] = [];
  private _selectedShape: BaseShape | null = null;
  private _previewShape: BaseShape | null = null;

  private _snippet: CodeSnippetPayload | null = null;
  private _dpr = window.devicePixelRatio || 2;
  private _zoom = 1.0;
  private _contentWidth = 800;
  private _contentHeight = 600;

  private _onStateChange?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    onStateChange?: () => void
  ) {
    this._canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this._ctx = ctx;

    this._bgCanvas = document.createElement('canvas');
    const bgCtx = this._bgCanvas.getContext('2d');
    if (!bgCtx) throw new Error('Could not get offscreen background context');
    this._bgCtx = bgCtx;

    this._onStateChange = onStateChange;
    this._history = new HistoryManager(() => this._onStateChange?.());
    this._toolManager = new ToolManager(this);

    this._setupEventListeners();
  }

  public get toolManager(): ToolManager {
    return this._toolManager;
  }

  public get history(): HistoryManager {
    return this._history;
  }

  public get selectedShape(): BaseShape | null {
    return this._selectedShape;
  }

  public setSelectedShape(shape: BaseShape | null): void {
    if (this._selectedShape) {
      this._selectedShape.selected = false;
    }
    this._selectedShape = shape;
    if (this._selectedShape) {
      this._selectedShape.selected = true;
    }
    this.render();
    this._onStateChange?.();
  }

  public getActiveStyle(): ShapeStyle {
    return {
      strokeColor: this._toolManager.getActiveColor(),
      strokeWidth: this._toolManager.getActiveStrokeWidth()
    };
  }

  public setPreviewShape(shape: BaseShape | null): void {
    this._previewShape = shape;
    this.render();
  }

  public addShape(shape: BaseShape, recordHistory = true): void {
    if (recordHistory) {
      const self = this;
      const cmd: Command = {
        execute() {
          self._shapes.push(shape);
          self.render();
        },
        undo() {
          const idx = self._shapes.indexOf(shape);
          if (idx !== -1) {
            self._shapes.splice(idx, 1);
          }
          if (self._selectedShape === shape) {
            self.setSelectedShape(null);
          }
          self.render();
        }
      };
      this._history.execute(cmd);
    } else {
      this._shapes.push(shape);
      this.render();
    }
  }

  public removeShape(shape: BaseShape, recordHistory = true): void {
    if (recordHistory) {
      const self = this;
      let removedIdx = -1;
      const cmd: Command = {
        execute() {
          removedIdx = self._shapes.indexOf(shape);
          if (removedIdx !== -1) {
            self._shapes.splice(removedIdx, 1);
          }
          if (self._selectedShape === shape) {
            self.setSelectedShape(null);
          }
          self.render();
        },
        undo() {
          if (removedIdx !== -1) {
            self._shapes.splice(removedIdx, 0, shape);
          } else {
            self._shapes.push(shape);
          }
          self.render();
        }
      };
      this._history.execute(cmd);
    } else {
      const idx = this._shapes.indexOf(shape);
      if (idx !== -1) {
        this._shapes.splice(idx, 1);
      }
      if (this._selectedShape === shape) {
        this.setSelectedShape(null);
      }
      this.render();
    }
  }

  public clearAllShapes(): void {
    if (this._shapes.length === 0) return;
    const previousShapes = [...this._shapes];
    const self = this;
    const cmd: Command = {
      execute() {
        self._shapes = [];
        self.setSelectedShape(null);
        self.render();
      },
      undo() {
        self._shapes = [...previousShapes];
        self.render();
      }
    };
    this._history.execute(cmd);
  }

  public findShapeAt(p: Point): BaseShape | null {
    // Traverse backwards to pick top-most shape first
    for (let i = this._shapes.length - 1; i >= 0; i--) {
      if (this._shapes[i].containsPoint(p)) {
        return this._shapes[i];
      }
    }
    return null;
  }

  public setSnippet(snippet: CodeSnippetPayload): void {
    this._snippet = snippet;

    // Render background once to measure bounds
    // We create a temporary high-res offscreen rendering
    this._bgCanvas.width = 3000;
    this._bgCanvas.height = 3000;
    const info = this._snippetRenderer.render(this._bgCtx, snippet, this._dpr);

    this._contentWidth = Math.ceil(info.totalWidth);
    this._contentHeight = Math.ceil(info.totalHeight);

    // Resize background canvas precisely
    this._bgCanvas.width = this._contentWidth * this._dpr;
    this._bgCanvas.height = this._contentHeight * this._dpr;
    this._bgCtx.scale(this._dpr, this._dpr);
    this._snippetRenderer.render(this._bgCtx, snippet, this._dpr);

    // Update main canvas
    this._updateCanvasSize();
    this.render();
  }

  public setZoom(zoom: number): void {
    this._zoom = Math.max(0.25, Math.min(3.0, zoom));
    this._updateCanvasSize();
    this.render();
    this._onStateChange?.();
  }

  public getZoom(): number {
    return this._zoom;
  }

  private _updateCanvasSize(): void {
    const displayWidth = Math.round(this._contentWidth * this._zoom);
    const displayHeight = Math.round(this._contentHeight * this._zoom);

    this._canvas.style.width = `${displayWidth}px`;
    this._canvas.style.height = `${displayHeight}px`;

    // HiDPI buffer size
    this._canvas.width = Math.round(this._contentWidth * this._dpr);
    this._canvas.height = Math.round(this._contentHeight * this._dpr);
  }

  public render(): void {
    this._ctx.save();
    this._ctx.scale(this._dpr, this._dpr);
    this._ctx.clearRect(0, 0, this._contentWidth, this._contentHeight);

    // 1. Draw pre-rendered background
    if (this._snippet) {
      this._ctx.drawImage(
        this._bgCanvas,
        0, 0, this._bgCanvas.width, this._bgCanvas.height,
        0, 0, this._contentWidth, this._contentHeight
      );
    }

    // 2. Draw existing shapes
    for (const shape of this._shapes) {
      if (shape instanceof BlurShape) {
        shape.drawWithBackground(this._ctx, this._bgCanvas);
      } else {
        shape.draw(this._ctx);
      }
    }

    // 3. Draw active drawing preview shape (if dragging)
    if (this._previewShape) {
      if (this._previewShape instanceof BlurShape) {
        this._previewShape.drawWithBackground(this._ctx, this._bgCanvas);
      } else {
        this._previewShape.draw(this._ctx);
      }
    }

    this._ctx.restore();
  }

  public clientToCanvasPoint(clientX: number, clientY: number): Point {
    const rect = this._canvas.getBoundingClientRect();
    const scaleX = this._contentWidth / rect.width;
    const scaleY = this._contentHeight / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  public exportPngDataUrl(): string {
    // Create an export canvas at 2x resolution for ultra-sharp export
    const exportCanvas = document.createElement('canvas');
    const scale = 2;
    exportCanvas.width = this._contentWidth * scale;
    exportCanvas.height = this._contentHeight * scale;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.scale(scale, scale);

    // Draw background
    if (this._snippet) {
      ctx.drawImage(
        this._bgCanvas,
        0, 0, this._bgCanvas.width, this._bgCanvas.height,
        0, 0, this._contentWidth, this._contentHeight
      );
    }

    // Draw all shapes (deselected)
    for (const shape of this._shapes) {
      const wasSelected = shape.selected;
      shape.selected = false;
      if (shape instanceof BlurShape) {
        shape.drawWithBackground(ctx, this._bgCanvas);
      } else {
        shape.draw(ctx);
      }
      shape.selected = wasSelected;
    }

    return exportCanvas.toDataURL('image/png');
  }

  public async copyToClipboard(): Promise<boolean> {
    try {
      const exportCanvas = document.createElement('canvas');
      const scale = 2;
      exportCanvas.width = this._contentWidth * scale;
      exportCanvas.height = this._contentHeight * scale;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return false;

      ctx.scale(scale, scale);
      if (this._snippet) {
        ctx.drawImage(
          this._bgCanvas,
          0, 0, this._bgCanvas.width, this._bgCanvas.height,
          0, 0, this._contentWidth, this._contentHeight
        );
      }
      for (const shape of this._shapes) {
        const wasSelected = shape.selected;
        shape.selected = false;
        if (shape instanceof BlurShape) {
          shape.drawWithBackground(ctx, this._bgCanvas);
        } else {
          shape.draw(ctx);
        }
        shape.selected = wasSelected;
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, 'image/png');
      });

      if (!blob) return false;

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return true;
    } catch {
      return false;
    }
  }

  private _setupEventListeners(): void {
    this._canvas.addEventListener('mousedown', (e) => {
      const pt = this.clientToCanvasPoint(e.clientX, e.clientY);
      this._toolManager.onMouseDown(pt, e);
    });

    window.addEventListener('mousemove', (e) => {
      const pt = this.clientToCanvasPoint(e.clientX, e.clientY);
      this._toolManager.onMouseMove(pt, e);
    });

    window.addEventListener('mouseup', (e) => {
      const pt = this.clientToCanvasPoint(e.clientX, e.clientY);
      this._toolManager.onMouseUp(pt, e);
    });

    window.addEventListener('keydown', (e) => {
      // Global shortcut handling
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          this._history.redo();
        } else {
          this._history.undo();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this._history.redo();
        return;
      }

      // Delete selected shape
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only if not typing in text editor
        const activeEl = document.activeElement;
        if (activeEl && activeEl.tagName === 'TEXTAREA') return;

        if (this._selectedShape) {
          this.removeShape(this._selectedShape, true);
          return;
        }
      }

      this._toolManager.onKeyDown(e);
    });
  }
}
