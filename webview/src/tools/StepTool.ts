import { Point, ToolType } from '../types';
import { ITool } from './ToolManager';
import { CanvasEngine } from '../engine/CanvasEngine';
import { StepBadgeShape } from '../shapes/StepBadgeShape';

export class StepTool implements ITool {
  public readonly type: ToolType = 'step';
  private _engine: CanvasEngine;

  constructor(engine: CanvasEngine) {
    this._engine = engine;
  }

  public onMouseDown(p: Point, _e: MouseEvent): void {
    const stepNumber = this._engine.toolManager.getNextStepNumber();
    const badge = new StepBadgeShape(
      p.x,
      p.y,
      stepNumber,
      this._engine.getActiveStyle()
    );
    this._engine.addShape(badge);
  }

  public onMouseMove(_p: Point, _e: MouseEvent): void {}
  public onMouseUp(_p: Point, _e: MouseEvent): void {}
}
