import { Point, RectBounds, ShapeStyle } from '../types';
import { BaseShape } from './BaseShape';

export class EllipseShape extends BaseShape {
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  constructor(x: number, y: number, width: number, height: number, style: ShapeStyle) {
    super('ellipse', style);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = this.style.strokeColor;
    ctx.lineWidth = this.style.strokeWidth;

    const norm = this.getNormalized();
    const cx = norm.x + norm.width / 2;
    const cy = norm.y + norm.height / 2;
    const rx = Math.max(0.1, norm.width / 2);
    const ry = Math.max(0.1, norm.height / 2);

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

    if (this.style.fillColor) {
      ctx.fillStyle = this.style.fillColor;
      ctx.fill();
    }
    ctx.stroke();

    ctx.restore();
    this.drawSelectionOutline(ctx);
  }

  public getNormalized(): RectBounds {
    const x = this.width < 0 ? this.x + this.width : this.x;
    const y = this.height < 0 ? this.y + this.height : this.y;
    return {
      x,
      y,
      width: Math.abs(this.width),
      height: Math.abs(this.height)
    };
  }

  public getBounds(): RectBounds {
    return this.getNormalized();
  }

  public containsPoint(p: Point): boolean {
    const norm = this.getNormalized();
    const cx = norm.x + norm.width / 2;
    const cy = norm.y + norm.height / 2;
    const rx = norm.width / 2;
    const ry = norm.height / 2;
    if (rx === 0 || ry === 0) return false;

    const pad = Math.max(6, this.style.strokeWidth);
    const val = ((p.x - cx) ** 2) / ((rx + pad) ** 2) + ((p.y - cy) ** 2) / ((ry + pad) ** 2);
    const innerVal = ((p.x - cx) ** 2) / ((Math.max(0.1, rx - pad)) ** 2) + ((p.y - cy) ** 2) / ((Math.max(0.1, ry - pad)) ** 2);

    if (val > 1) return false;
    if (this.style.fillColor) return true;
    return innerVal >= 1;
  }

  public move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  public clone(): EllipseShape {
    return new EllipseShape(this.x, this.y, this.width, this.height, this.style);
  }
}
