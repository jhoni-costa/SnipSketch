import { Point, RectBounds, ShapeStyle } from '../types';
import { BaseShape } from './BaseShape';

export class BlurShape extends BaseShape {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  private _offscreenCanvas: HTMLCanvasElement;

  constructor(x: number, y: number, width: number, height: number, style: ShapeStyle) {
    super('blur', style);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this._offscreenCanvas = document.createElement('canvas');
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // Basic fallback render
    this.drawWithBackground(ctx, null);
  }

  public drawWithBackground(ctx: CanvasRenderingContext2D, bgCanvas: HTMLCanvasElement | null): void {
    const norm = this.getNormalized();
    if (norm.width <= 2 || norm.height <= 2) return;

    ctx.save();

    if (bgCanvas) {
      // Pixelation algorithm:
      // 1. Downscale region by factor of 8
      // 2. Upscale back to canvas with nearest-neighbor interpolation
      const pixelSize = 8;
      const smallW = Math.max(1, Math.floor(norm.width / pixelSize));
      const smallH = Math.max(1, Math.floor(norm.height / pixelSize));

      this._offscreenCanvas.width = smallW;
      this._offscreenCanvas.height = smallH;
      const offCtx = this._offscreenCanvas.getContext('2d');

      if (offCtx) {
        offCtx.imageSmoothingEnabled = true;
        // Draw the region from bgCanvas onto mini canvas
        offCtx.drawImage(
          bgCanvas,
          norm.x, norm.y, norm.width, norm.height,
          0, 0, smallW, smallH
        );

        // Blit back scaled up with pixelated smoothing disabled
        ctx.imageSmoothingEnabled = false;
        ctx.beginPath();
        ctx.roundRect(norm.x, norm.y, norm.width, norm.height, 4);
        ctx.clip();

        ctx.drawImage(
          this._offscreenCanvas,
          0, 0, smallW, smallH,
          norm.x, norm.y, norm.width, norm.height
        );
      }
    } else {
      // Semi-opaque redaction box fallback
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(norm.x, norm.y, norm.width, norm.height);
    }

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(norm.x, norm.y, norm.width, norm.height);

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
    return (
      p.x >= norm.x &&
      p.x <= norm.x + norm.width &&
      p.y >= norm.y &&
      p.y <= norm.y + norm.height
    );
  }

  public move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  public clone(): BlurShape {
    return new BlurShape(this.x, this.y, this.width, this.height, this.style);
  }
}
