import { Point, RectBounds, ShapeStyle, ToolType } from '../types';

export abstract class BaseShape {
  public id: string;
  public type: ToolType;
  public style: ShapeStyle;
  public selected: boolean = false;

  constructor(type: ToolType, style: ShapeStyle) {
    this.id = 'shape_' + Math.random().toString(36).substring(2, 9);
    this.type = type;
    this.style = { ...style };
  }

  public abstract draw(ctx: CanvasRenderingContext2D): void;
  public abstract getBounds(): RectBounds;
  public abstract containsPoint(p: Point): boolean;
  public abstract move(dx: number, dy: number): void;
  public abstract clone(): BaseShape;

  protected drawSelectionOutline(ctx: CanvasRenderingContext2D): void {
    if (!this.selected) return;
    const b = this.getBounds();
    const pad = 6;
    ctx.save();
    ctx.strokeStyle = '#007acc';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2);

    // Corner handles
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#007acc';
    ctx.setLineDash([]);
    const handles = [
      { x: b.x - pad, y: b.y - pad },
      { x: b.x + b.width + pad, y: b.y - pad },
      { x: b.x + b.width + pad, y: b.y + b.height + pad },
      { x: b.x - pad, y: b.y + b.height + pad }
    ];
    for (const h of handles) {
      ctx.fillRect(h.x - 3, h.y - 3, 6, 6);
      ctx.strokeRect(h.x - 3, h.y - 3, 6, 6);
    }
    ctx.restore();
  }
}
