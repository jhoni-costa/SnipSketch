import { Point, RectBounds, ShapeStyle } from '../types';
import { BaseShape } from './BaseShape';

export class RectShape extends BaseShape {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public cornerRadius: number;

  constructor(x: number, y: number, width: number, height: number, style: ShapeStyle, cornerRadius = 6) {
    super('rect', style);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.cornerRadius = cornerRadius;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = this.style.strokeColor;
    ctx.lineWidth = this.style.strokeWidth;
    ctx.lineJoin = 'round';

    const norm = this.getNormalized();
    const r = Math.min(this.cornerRadius, norm.width / 2, norm.height / 2);

    ctx.beginPath();
    ctx.roundRect(norm.x, norm.y, norm.width, norm.height, r);

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
    const width = Math.abs(this.width);
    const height = Math.abs(this.height);
    return { x, y, width, height };
  }

  public getBounds(): RectBounds {
    return this.getNormalized();
  }

  public containsPoint(p: Point): boolean {
    const norm = this.getNormalized();
    const pad = Math.max(6, this.style.strokeWidth / 2);

    // Hit test on the border (or inside if filled)
    const insideOuter =
      p.x >= norm.x - pad &&
      p.x <= norm.x + norm.width + pad &&
      p.y >= norm.y - pad &&
      p.y <= norm.y + norm.height + pad;

    if (!insideOuter) return false;

    if (this.style.fillColor) return true;

    // Check if on border
    const insideInner =
      p.x >= norm.x + pad &&
      p.x <= norm.x + norm.width - pad &&
      p.y >= norm.y + pad &&
      p.y <= norm.y + norm.height - pad;

    return !insideInner;
  }

  public move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  public clone(): RectShape {
    return new RectShape(this.x, this.y, this.width, this.height, this.style, this.cornerRadius);
  }
}
