import { Point, ToolType } from '../types';
import { ITool } from './ToolManager';
import { CanvasEngine } from '../engine/CanvasEngine';
import { ArrowShape } from '../shapes/ArrowShape';

export class ArrowTool implements ITool {
  public readonly type: ToolType = 'arrow';
  private _engine: CanvasEngine;
  private _startPt: Point | null = null;
  private _activeShape: ArrowShape | null = null;

  constructor(engine: CanvasEngine) {
    this._engine = engine;
  }

  public onMouseDown(p: Point, _e: MouseEvent): void {
    this._startPt = { ...p };
    this._activeShape = new ArrowShape(p, p, this._engine.getActiveStyle());
    this._engine.setPreviewShape(this._activeShape);
  }

  public onMouseMove(p: Point, _e: MouseEvent): void {
    if (!this._startPt || !this._activeShape) return;
    this._activeShape.end = { ...p };
    this._engine.setPreviewShape(this._activeShape);
  }

  public onMouseUp(p: Point, _e: MouseEvent): void {
    if (this._startPt && this._activeShape) {
      const dist = Math.hypot(p.x - this._startPt.x, p.y - this._startPt.y);
      if (dist >= 5) {
        this._activeShape.end = { ...p };
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
