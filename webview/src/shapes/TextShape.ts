import { Point, RectBounds, ShapeStyle } from '../types';
import { BaseShape } from './BaseShape';

export class TextShape extends BaseShape {
  public x: number;
  public y: number;
  public text: string;
  public fontSize: number;
  private _measuredWidth = 0;

  constructor(x: number, y: number, text: string, style: ShapeStyle, fontSize = 16) {
    super('text', style);
    this.x = x;
    this.y = y;
    this.text = text;
    this.fontSize = fontSize;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.text) return;

    ctx.save();
    const font = `600 ${this.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.font = font;

    const lines = this.text.split('\n');
    const lineHeight = this.fontSize * 1.35;
    let maxLineWidth = 0;

    for (const line of lines) {
      const metrics = ctx.measureText(line);
      maxLineWidth = Math.max(maxLineWidth, metrics.width);
    }
    this._measuredWidth = maxLineWidth;

    const padX = 10;
    const padY = 6;
    const totalHeight = lines.length * lineHeight;
    const rectWidth = maxLineWidth + padX * 2;
    const rectHeight = totalHeight + padY * 2;

    // Draw solid translucent background card for maximum legibility over code
    ctx.fillStyle = 'rgba(24, 24, 27, 0.88)';
    ctx.strokeStyle = this.style.strokeColor;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(this.x, this.y, rectWidth, rectHeight, 6);
    } else {
      ctx.rect(this.x, this.y, rectWidth, rectHeight);
    }
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = this.style.strokeColor;
    ctx.textBaseline = 'top';

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], this.x + padX, this.y + padY + i * lineHeight);
    }

    ctx.restore();
    this.drawSelectionOutline(ctx);
  }

  public getBounds(): RectBounds {
    const lines = this.text.split('\n');
    const lineHeight = this.fontSize * 1.35;
    const approxCharWidth = this.fontSize * 0.65;
    let maxLen = 0;
    for (const l of lines) maxLen = Math.max(maxLen, l.length);

    const padX = 10;
    const padY = 6;
    const contentWidth = this._measuredWidth > 0 ? this._measuredWidth : (maxLen * approxCharWidth);
    const width = contentWidth + padX * 2;
    const height = lines.length * lineHeight + padY * 2;

    return {
      x: this.x,
      y: this.y,
      width: Math.max(width, 30),
      height: Math.max(height, 24)
    };
  }

  public containsPoint(p: Point): boolean {
    const b = this.getBounds();
    return p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;
  }

  public move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  public clone(): TextShape {
    return new TextShape(this.x, this.y, this.text, this.style, this.fontSize);
  }
}
