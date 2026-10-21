import { Point, RectBounds, ShapeStyle } from '../types';
import { BaseShape } from './BaseShape';

export class FreehandShape extends BaseShape {
  public points: Point[];
  public isHighlighter: boolean;

  constructor(points: Point[], style: ShapeStyle, isHighlighter = false) {
    super(isHighlighter ? 'highlighter' : 'pen', style);
    this.points = points.map(p => ({ ...p }));
    this.isHighlighter = isHighlighter;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.points.length < 2) return;

    ctx.save();
    if (this.isHighlighter) {
      ctx.globalAlpha = 0.38;
      ctx.strokeStyle = this.style.strokeColor;
      ctx.lineWidth = Math.max(18, this.style.strokeWidth * 3.5);
      ctx.lineCap = 'square';
      ctx.lineJoin = 'round';
    } else {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = this.style.strokeColor;
      ctx.lineWidth = this.style.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    if (this.points.length === 2) {
      ctx.lineTo(this.points[1].x, this.points[1].y);
    } else {
      // Smooth curve through midpoint interpolation
      for (let i = 1; i < this.points.length - 1; i++) {
        const xc = (this.points[i].x + this.points[i + 1].x) / 2;
        const yc = (this.points[i].y + this.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
      }
      const last = this.points.length - 1;
      ctx.lineTo(this.points[last].x, this.points[last].y);
    }

    ctx.stroke();
    ctx.restore();
    this.drawSelectionOutline(ctx);
  }

  public getBounds(): RectBounds {
    if (this.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of this.points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    const pad = this.isHighlighter ? 12 : 6;
    return {
      x: minX - pad,
      y: minY - pad,
      width: Math.max(maxX - minX + pad * 2, 10),
      height: Math.max(maxY - minY + pad * 2, 10)
    };
  }

  public containsPoint(p: Point): boolean {
    const threshold = this.isHighlighter ? 14 : Math.max(8, this.style.strokeWidth + 2);
    for (let i = 0; i < this.points.length - 1; i++) {
      if (distToSegment(p, this.points[i], this.points[i + 1]) <= threshold) {
        return true;
      }
    }
    return false;
  }

  public move(dx: number, dy: number): void {
    for (const p of this.points) {
      p.x += dx;
      p.y += dy;
    }
  }

  public clone(): FreehandShape {
    return new FreehandShape(this.points, this.style, this.isHighlighter);
  }
}

function distToSegment(p: Point, v: Point, w: Point): number {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}
