import { Point, ToolType } from '../types';
import { CanvasEngine } from '../engine/CanvasEngine';

export interface ITool {
  readonly type: ToolType;
  onMouseDown(p: Point, e: MouseEvent): void;
  onMouseMove(p: Point, e: MouseEvent): void;
  onMouseUp(p: Point, e: MouseEvent): void;
  onKeyDown?(e: KeyboardEvent): void;
  deactivate?(): void;
}

export class ToolManager {
  private _engine: CanvasEngine;
  private _activeTool: ITool;
  private _tools: Map<ToolType, ITool> = new Map();
  private _activeColor = '#ff3b30'; // Lightshot default vibrant red
  private _activeStrokeWidth = 4;
  private _stepCounter = 1;

  constructor(engine: CanvasEngine) {
    this._engine = engine;
    this._activeTool = this._createDefaultSelectTool();
  }

  public onToolChanged?: (tool: ToolType) => void;
  public onColorChanged?: (color: string) => void;

  public get engine(): CanvasEngine {
    return this._engine;
  }

  public registerTool(tool: ITool): void {
    this._tools.set(tool.type, tool);
  }

  public getTool<T extends ITool = ITool>(type: ToolType): T | undefined {
    return this._tools.get(type) as T | undefined;
  }

  public setTool(type: ToolType): void {
    if (this._activeTool.type === type) return;
    this._activeTool.deactivate?.();

    const tool = this._tools.get(type);
    if (tool) {
      this._activeTool = tool;
      this.onToolChanged?.(type);
    }
  }

  public getActiveToolType(): ToolType {
    return this._activeTool.type;
  }

  public getActiveColor(): string {
    return this._activeColor;
  }

  public setColor(color: string): void {
    this._activeColor = color;
    this.onColorChanged?.(color);
  }

  public getActiveStrokeWidth(): number {
    return this._activeStrokeWidth;
  }

  public setStrokeWidth(width: number): void {
    this._activeStrokeWidth = width;
  }

  public getNextStepNumber(): number {
    return this._stepCounter++;
  }

  public resetStepCounter(): void {
    this._stepCounter = 1;
  }

  public onMouseDown(p: Point, e: MouseEvent): void {
    this._activeTool.onMouseDown(p, e);
  }

  public onMouseMove(p: Point, e: MouseEvent): void {
    this._activeTool.onMouseMove(p, e);
  }

  public onMouseUp(p: Point, e: MouseEvent): void {
    this._activeTool.onMouseUp(p, e);
  }

  public onKeyDown(e: KeyboardEvent): void {
    this._activeTool.onKeyDown?.(e);
  }

  private _createDefaultSelectTool(): ITool {
    return {
      type: 'select',
      onMouseDown: () => {},
      onMouseMove: () => {},
      onMouseUp: () => {}
    };
  }
}
