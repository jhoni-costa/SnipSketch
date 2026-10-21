import { Point, RectBounds, ShapeStyle } from '../types';
import { BaseShape } from './BaseShape';

export class StepBadgeShape extends BaseShape {
  public x: number;
  public y: number;
  public stepNumber: number;
  public radius: number;

  constructor(x: number, y: number, stepNumber: number, style: ShapeStyle, radius = 14) {
    super('step', style);
    this.x = x;
    this.y = y;
    this.stepNumber = stepNumber;
    this.radius = radius;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Outer shadow / glow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // Circle background
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.style.strokeColor;
    ctx.fill();

    // Crisp white border
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Step number
    ctx.fillStyle = '#ffffff';
    // If background is very bright yellow/white, use dark text
    if (this.style.strokeColor === '#ffd60a' || this.style.strokeColor === '#ffffff') {
      ctx.fillStyle = '#1c1c1e';
    }
    ctx.font = `bold ${Math.round(this.radius * 1.05)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.stepNumber.toString(), this.x, this.y + 0.5);

    ctx.restore();
    this.drawSelectionOutline(ctx);
  }

  public getBounds(): RectBounds {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }

  public containsPoint(p: Point): boolean {
    return Math.hypot(p.x - this.x, p.y - this.y) <= this.radius + 4;
  }

  public move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  public clone(): StepBadgeShape {
    return new StepBadgeShape(this.x, this.y, this.stepNumber, this.style, this.radius);
  }
}
