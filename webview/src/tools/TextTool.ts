import { Point, ToolType } from '../types';
import { ITool } from './ToolManager';
import { CanvasEngine } from '../engine/CanvasEngine';
import { TextShape } from '../shapes/TextShape';
import { Command } from '../engine/History';

export class TextTool implements ITool {
  public readonly type: ToolType = 'text';
  private _engine: CanvasEngine;
  private _textInput: HTMLTextAreaElement | null = null;
  private _activePoint: Point | null = null;
  private _editingShape: TextShape | null = null;
  private _justCommitted = false;

  constructor(engine: CanvasEngine) {
    this._engine = engine;
    this._textInput = document.getElementById('text-editor-input') as HTMLTextAreaElement | null;
    this._setupInputListeners();

    // Listen to color changes while text box is open
    this._engine.toolManager.onColorChanged = (color) => {
      if (this._textInput && this._textInput.style.display !== 'none') {
        this._textInput.style.color = color;
        this._textInput.style.borderColor = color;
        this._textInput.style.caretColor = color;
      }
    };
  }

  public onMouseDown(p: Point, e: MouseEvent): void {
    // Prevent canvas from stealing focus from the text input
    e.stopPropagation();
    e.preventDefault();
    // If we just committed text (e.g. user clicked to blur), don't spawn a new box on the same click
    if (this._justCommitted) {
      this._justCommitted = false;
      return;
    }

    // If an existing input is already open, commit it first
    if (this._textInput && this._textInput.style.display !== 'none') {
      this._commitText();
      return;
    }

    // Check if user clicked on an existing TextShape to edit it
    const hit = this._engine.findShapeAt(p);
    if (hit instanceof TextShape) {
      this.startEditing(hit);
      return;
    }

    // Start a new text annotation at clicked point
    this._activePoint = { ...p };
    this._editingShape = null;
    this._showInputAtPoint(this._activePoint, '', e.clientX, e.clientY);
  }

  public onMouseMove(_p: Point, _e: MouseEvent): void {}
  public onMouseUp(_p: Point, _e: MouseEvent): void {}

  public startEditing(shape: TextShape): void {
    this._editingShape = shape;
    this._activePoint = { x: shape.x, y: shape.y };

    // Select color of the shape being edited
    this._engine.toolManager.setColor(shape.style.strokeColor);

    this._showInputAtPoint(this._activePoint, shape.text);
  }

  private _showInputAtPoint(canvasPt: Point, initialText = '', clientX?: number, clientY?: number): void {
    if (!this._textInput) {
      this._textInput = document.getElementById('text-editor-input') as HTMLTextAreaElement | null;
      if (!this._textInput) return;
    }

    const zoom = this._engine.getZoom();
    const activeColor = this._engine.toolManager.getActiveColor();

    let left = Math.round(canvasPt.x * zoom);
    let top = Math.round(canvasPt.y * zoom);

    // If clientX/clientY are available and element has client rect, verify coordinates
    const canvas = this._engine.canvas;
    if (clientX !== undefined && clientY !== undefined && canvas) {
      const rect = canvas.getBoundingClientRect();
      left = Math.round(clientX - rect.left);
      top = Math.round(clientY - rect.top);
    }

    this._textInput.value = initialText;
    this._textInput.style.display = 'block';
    this._textInput.style.left = `${Math.max(0, left)}px`;
    this._textInput.style.top = `${Math.max(0, top)}px`;
    this._textInput.style.color = activeColor;
    this._textInput.style.borderColor = activeColor;
    this._textInput.style.caretColor = activeColor;
    this._textInput.style.fontSize = `${Math.max(12, Math.round(15 * zoom))}px`;

    this._autoResize();

    // Use requestAnimationFrame & setTimeout to avoid focus stealing by canvas mousedown
    setTimeout(() => {
      if (this._textInput && this._textInput.style.display !== 'none') {
        this._textInput.focus();
        if (initialText) {
          this._textInput.select();
        }
      }
    }, 20);
  }

  private _autoResize(): void {
    if (!this._textInput) return;
    this._textInput.style.height = 'auto';
    const newHeight = Math.max(38, this._textInput.scrollHeight);
    this._textInput.style.height = `${newHeight}px`;

    const lines = this._textInput.value.split('\n');
    let maxLen = 0;
    for (const l of lines) {
      if (l.length > maxLen) maxLen = l.length;
    }
    const approxWidth = Math.max(130, Math.min(600, maxLen * 11 + 32));
    this._textInput.style.width = `${approxWidth}px`;
  }

  private _commitText(): void {
    if (!this._textInput || !this._activePoint) return;

    const text = this._textInput.value.trim();
    if (text.length > 0) {
      if (this._editingShape) {
        // Update existing shape with undo history
        const shape = this._editingShape;
        const oldText = shape.text;
        const newText = text;
        const oldColor = shape.style.strokeColor;
        const newColor = this._engine.toolManager.getActiveColor();
        const engine = this._engine;

        if (oldText !== newText || oldColor !== newColor) {
          const cmd: Command = {
            execute() {
              shape.text = newText;
              shape.style.strokeColor = newColor;
              engine.render();
            },
            undo() {
              shape.text = oldText;
              shape.style.strokeColor = oldColor;
              engine.render();
            }
          };
          cmd.execute();
          this._engine.history.execute({ execute: () => {}, undo: cmd.undo });
        }
      } else {
        // Create new text shape
        const shape = new TextShape(
          this._activePoint.x,
          this._activePoint.y,
          text,
          this._engine.getActiveStyle(),
          15
        );
        this._engine.addShape(shape);
      }
    } else if (this._editingShape) {
      // If user cleared text completely, delete the shape
      this._engine.removeShape(this._editingShape, true);
    }

    // Set guard flag to avoid immediate re-opening on the same click
    this._justCommitted = true;
    setTimeout(() => {
      this._justCommitted = false;
    }, 180);

    this._hideInput();
  }

  private _hideInput(): void {
    if (this._textInput) {
      this._textInput.style.display = 'none';
      this._textInput.value = '';
    }
    this._activePoint = null;
    this._editingShape = null;
    this._engine.render();
  }

  private _setupInputListeners(): void {
    if (!this._textInput) return;

    // Prevent clicks inside textarea from bubbling to canvas or window
    this._textInput.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    this._textInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    this._textInput.addEventListener('dblclick', (e) => {
      e.stopPropagation();
    });

    this._textInput.addEventListener('input', () => {
      this._autoResize();
    });

    this._textInput.addEventListener('keydown', (e) => {
      // Crucial: Stop propagation so window tool shortcuts and canvas shortcuts don't fire
      e.stopPropagation();

      if (e.key === 'Escape') {
        e.preventDefault();
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
