import { Point, RectBounds, ShapeStyle } from '../types';
import { BaseShape } from './BaseShape';

export class ArrowShape extends BaseShape {
  public start: Point;
  public end: Point;

  constructor(start: Point, end: Point, style: ShapeStyle) {
    super('arrow', style);
    this.start = { ...start };
    this.end = { ...end };
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = this.style.strokeColor;
    ctx.fillStyle = this.style.strokeColor;
    ctx.lineWidth = this.style.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const dx = this.end.x - this.start.x;
    const dy = this.end.y - this.start.y;
    const length = Math.hypot(dx, dy);

    if (length > 2) {
      const angle = Math.atan2(dy, dx);
      const headLength = Math.max(16, this.style.strokeWidth * 3.8);
      const headAngle = Math.PI / 6; // 30 degrees

      // Arrow shaft end slightly before tip so it blends cleanly with the head
      const shaftEndX = this.end.x - Math.cos(angle) * (headLength * 0.4);
      const shaftEndY = this.end.y - Math.sin(angle) * (headLength * 0.4);

      // Draw shaft
      ctx.beginPath();
      ctx.moveTo(this.start.x, this.start.y);
      ctx.lineTo(shaftEndX, shaftEndY);
      ctx.stroke();

      // Draw arrow head triangle
      const x1 = this.end.x - headLength * Math.cos(angle - headAngle);
      const y1 = this.end.y - headLength * Math.sin(angle - headAngle);
      const x2 = this.end.x - headLength * Math.cos(angle + headAngle);
      const y2 = this.end.y - headLength * Math.sin(angle + headAngle);

      ctx.beginPath();
      ctx.moveTo(this.end.x, this.end.y);
      ctx.lineTo(x1, y1);
      ctx.lineTo(this.end.x - (headLength * 0.5) * Math.cos(angle), this.end.y - (headLength * 0.5) * Math.sin(angle));
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
    this.drawSelectionOutline(ctx);
  }

  public getBounds(): RectBounds {
    const minX = Math.min(this.start.x, this.end.x);
    const maxX = Math.max(this.start.x, this.end.x);
    const minY = Math.min(this.start.y, this.end.y);
    const maxY = Math.max(this.start.y, this.end.y);
    return {
      x: minX,
      y: minY,
      width: Math.max(maxX - minX, 10),
      height: Math.max(maxY - minY, 10)
    };
  }

  public containsPoint(p: Point): boolean {
    const threshold = Math.max(8, this.style.strokeWidth + 4);
    return distToSegment(p, this.start, this.end) <= threshold;
  }

  public move(dx: number, dy: number): void {
    this.start.x += dx;
    this.start.y += dy;
    this.end.x += dx;
    this.end.y += dy;
  }

  public clone(): ArrowShape {
    return new ArrowShape(this.start, this.end, this.style);
  }
}

function distToSegment(p: Point, v: Point, w: Point): number {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}
