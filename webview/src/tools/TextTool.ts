import { Point, ToolType } from '../types';
import { ITool } from './ToolManager';
import { CanvasEngine } from '../engine/CanvasEngine';
import { TextShape } from '../shapes/TextShape';

export class TextTool implements ITool {
  public readonly type: ToolType = 'text';
  private _engine: CanvasEngine;
  private _textInput: HTMLTextAreaElement | null = null;
  private _activePoint: Point | null = null;

  constructor(engine: CanvasEngine) {
    this._engine = engine;
    this._textInput = document.getElementById('text-editor-input') as HTMLTextAreaElement | null;
    this._setupInputListeners();
  }

  public onMouseDown(p: Point, e: MouseEvent): void {
    if (this._textInput && this._textInput.style.display !== 'none') {
      this._commitText();
      return;
    }

    this._activePoint = { ...p };
    this._showInputAt(e.clientX, e.clientY);
  }

  public onMouseMove(_p: Point, _e: MouseEvent): void {}
  public onMouseUp(_p: Point, _e: MouseEvent): void {}

  private _showInputAt(clientX: number, clientY: number): void {
    if (!this._textInput) return;

    this._textInput.value = '';
    this._textInput.style.display = 'block';
    this._textInput.style.left = `${clientX}px`;
    this._textInput.style.top = `${clientY}px`;
    this._textInput.style.color = this._engine.toolManager.getActiveColor();
    this._textInput.focus();
  }

  private _commitText(): void {
    if (!this._textInput || !this._activePoint) return;

    const text = this._textInput.value.trim();
    if (text.length > 0) {
      const shape = new TextShape(
        this._activePoint.x,
        this._activePoint.y,
        text,
        this._engine.getActiveStyle(),
        15
      );
      this._engine.addShape(shape);
    }

    this._hideInput();
  }

  private _hideInput(): void {
    if (this._textInput) {
      this._textInput.style.display = 'none';
      this._textInput.value = '';
    }
    this._activePoint = null;
  }

  private _setupInputListeners(): void {
    if (!this._textInput) return;

    this._textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this._hideInput();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._commitText();
      }
    });

    this._textInput.addEventListener('blur', () => {
      this._commitText();
    });
  }

  public deactivate(): void {
    this._commitText();
  }
}
