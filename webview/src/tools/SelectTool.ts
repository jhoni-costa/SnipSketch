import { Point, ToolType } from '../types';
import { ITool } from './ToolManager';
import { CanvasEngine } from '../engine/CanvasEngine';
import { BaseShape } from '../shapes/BaseShape';
import { Command } from '../engine/History';

export class SelectTool implements ITool {
  public readonly type: ToolType = 'select';
  private _engine: CanvasEngine;
  private _draggedShape: BaseShape | null = null;
  private _dragStartPt: Point | null = null;
  private _totalDx = 0;
  private _totalDy = 0;

  constructor(engine: CanvasEngine) {
    this._engine = engine;
  }

  public onMouseDown(p: Point, _e: MouseEvent): void {
    const hit = this._engine.findShapeAt(p);
    this._engine.setSelectedShape(hit);

    if (hit) {
      this._draggedShape = hit;
      this._dragStartPt = { ...p };
      this._totalDx = 0;
      this._totalDy = 0;
    } else {
      this._draggedShape = null;
      this._dragStartPt = null;
    }
  }

  public onMouseMove(p: Point, _e: MouseEvent): void {
    if (!this._draggedShape || !this._dragStartPt) return;

    const dx = p.x - this._dragStartPt.x;
    const dy = p.y - this._dragStartPt.y;

    this._draggedShape.move(dx, dy);
    this._totalDx += dx;
    this._totalDy += dy;
    this._dragStartPt = { ...p };

    this._engine.render();
  }

  public onMouseUp(_p: Point, _e: MouseEvent): void {
    if (this._draggedShape && (Math.abs(this._totalDx) > 1 || Math.abs(this._totalDy) > 1)) {
      const shape = this._draggedShape;
      const dx = this._totalDx;
      const dy = this._totalDy;
      const self = this;

      const cmd: Command = {
        execute() {
          // Re-move if redone
          shape.move(dx, dy);
          self._engine.render();
        },
        undo() {
          shape.move(-dx, -dy);
          self._engine.render();
        }
      };

      // Already moved during drag, so just push to history stack
      this._engine.history.execute({
        execute: () => {},
        undo: cmd.undo
      });
    }

    this._draggedShape = null;
    this._dragStartPt = null;
    this._totalDx = 0;
    this._totalDy = 0;
  }

  public deactivate(): void {
    this._draggedShape = null;
    this._dragStartPt = null;
  }
}
