import { Point, ToolType } from '../types';
import { ITool } from './ToolManager';
import { CanvasEngine } from '../engine/CanvasEngine';
import { RectShape } from '../shapes/RectShape';

export class RectTool implements ITool {
  public readonly type: ToolType = 'rect';
  private _engine: CanvasEngine;
  private _startPt: Point | null = null;
  private _activeShape: RectShape | null = null;

  constructor(engine: CanvasEngine) {
    this._engine = engine;
  }

  public onMouseDown(p: Point, _e: MouseEvent): void {
    this._startPt = { ...p };
    this._activeShape = new RectShape(p.x, p.y, 0, 0, this._engine.getActiveStyle());
    this._engine.setPreviewShape(this._activeShape);
  }

  public onMouseMove(p: Point, _e: MouseEvent): void {
    if (!this._startPt || !this._activeShape) return;
    this._activeShape.width = p.x - this._startPt.x;
    this._activeShape.height = p.y - this._startPt.y;
    this._engine.setPreviewShape(this._activeShape);
  }

  public onMouseUp(p: Point, _e: MouseEvent): void {
    if (this._startPt && this._activeShape) {
      this._activeShape.width = p.x - this._startPt.x;
      this._activeShape.height = p.y - this._startPt.y;

      if (Math.abs(this._activeShape.width) >= 5 && Math.abs(this._activeShape.height) >= 5) {
        this._engine.setPreviewShape(null);
        this._engine.addShape(this._activeShape);
      } else {
        this._engine.setPreviewShape(null);
      }
    }
    this._startPt = null;
    this._activeShape = null;
  }

  public deactivate(): void {
    this._startPt = null;
    this._activeShape = null;
    this._engine.setPreviewShape(null);
  }
}
