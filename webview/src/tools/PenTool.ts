import { Point, ToolType } from '../types';
import { ITool } from './ToolManager';
import { CanvasEngine } from '../engine/CanvasEngine';
import { FreehandShape } from '../shapes/FreehandShape';

export class PenTool implements ITool {
  public readonly type: ToolType;
  private _engine: CanvasEngine;
  private _points: Point[] = [];
  private _isHighlighter: boolean;
  private _activeShape: FreehandShape | null = null;

  constructor(engine: CanvasEngine, isHighlighter = false) {
    this._engine = engine;
    this._isHighlighter = isHighlighter;
    this.type = isHighlighter ? 'highlighter' : 'pen';
  }

  public onMouseDown(p: Point, _e: MouseEvent): void {
    this._points = [{ ...p }];
    this._activeShape = new FreehandShape(this._points, this._engine.getActiveStyle(), this._isHighlighter);
    this._engine.setPreviewShape(this._activeShape);
  }

  public onMouseMove(p: Point, _e: MouseEvent): void {
    if (!this._activeShape || this._points.length === 0) return;

    // Minimum distance check to avoid duplicate points
    const last = this._points[this._points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) > 2) {
      this._points.push({ ...p });
      this._activeShape.points = [...this._points];
      this._engine.setPreviewShape(this._activeShape);
    }
  }

  public onMouseUp(_p: Point, _e: MouseEvent): void {
    if (this._activeShape && this._points.length >= 2) {
      this._engine.setPreviewShape(null);
      this._engine.addShape(this._activeShape);
    } else {
      this._engine.setPreviewShape(null);
    }
    this._points = [];
    this._activeShape = null;
  }

  public deactivate(): void {
    this._points = [];
    this._activeShape = null;
    this._engine.setPreviewShape(null);
  }
}
