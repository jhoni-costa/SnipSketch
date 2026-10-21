import hljs from 'highlight.js';
import { CodeSnippetPayload, RectBounds } from '../types';

export interface RenderedSnippetInfo {
  cardBounds: RectBounds;
  totalWidth: number;
  totalHeight: number;
}

interface StyledSpan {
  text: string;
  color: string;
  italic?: boolean;
}

interface SnippetLine {
  lineNumber: number;
  spans: StyledSpan[];
}

export class SnippetRenderer {
  private _themeColors: Record<string, string> = {
    keyword: '#c678dd',
    built_in: '#e5c07b',
    type: '#e5c07b',
    literal: '#56b6c2',
    number: '#d19a66',
    string: '#98c379',
    comment: '#5c6370',
    title: '#61afef',
    'title.function_': '#61afef',
    'title.class_': '#e5c07b',
    variable: '#e06c75',
    property: '#e06c75',
    operator: '#56b6c2',
    punctuation: '#abb2bf',
    default: '#abb2bf'
  };

  public render(
    ctx: CanvasRenderingContext2D,
    snippet: CodeSnippetPayload,
    _dpr: number
  ): RenderedSnippetInfo {
    const fontSize = 14;
    const lineHeight = 22;
    const padding = snippet.padding ?? 36;
    const fontFamily = snippet.fontFamily || "JetBrains Mono, Menlo, Monaco, 'Courier New', monospace";
    const headerHeight = snippet.showWindowControls !== false ? 38 : 16;
    const cardPaddingX = 24;
    const cardPaddingY = 18;

    // Parse lines and highlighted spans
    const lines = this._parseSnippetLines(snippet);

    // Measure maximum line width
    ctx.save();
    ctx.font = `${fontSize}px ${fontFamily}`;

    const maxLineNum = snippet.startLine + lines.length - 1;
    const gutterWidth = snippet.showLineNumbers !== false
      ? Math.max(36, ctx.measureText(maxLineNum.toString()).width + 20)
      : 0;

    let maxCodeLineWidth = 0;
    for (const line of lines) {
      let lineWidth = 0;
      for (const span of line.spans) {
        lineWidth += ctx.measureText(span.text).width;
      }
      maxCodeLineWidth = Math.max(maxCodeLineWidth, lineWidth);
    }
    ctx.restore();

    // Calculate card dimensions
    const minCardWidth = Math.max(480, ctx.measureText(snippet.fileName || '').width + 160);
    const cardWidth = Math.max(minCardWidth, gutterWidth + maxCodeLineWidth + cardPaddingX * 2);
    const cardHeight = headerHeight + lines.length * lineHeight + cardPaddingY * 2;

    const totalWidth = cardWidth + padding * 2;
    const totalHeight = cardHeight + padding * 2;

    const cardX = padding;
    const cardY = padding;

    // 1. Draw outer gradient background
    this._drawOuterBackground(ctx, totalWidth, totalHeight);

    // 2. Draw Code Card with drop shadow and border
    this._drawCardWindow(ctx, cardX, cardY, cardWidth, cardHeight, snippet, headerHeight);

    // 3. Draw Lines and Code
    ctx.save();
    const codeStartY = cardY + headerHeight + cardPaddingY;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineY = codeStartY + i * lineHeight;

      // Draw line number
      if (snippet.showLineNumbers !== false) {
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = '#4b5263';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(line.lineNumber.toString(), cardX + cardPaddingX + gutterWidth - 14, lineY);
      }

      // Draw code spans
      let currentX = cardX + cardPaddingX + gutterWidth;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      for (const span of line.spans) {
        ctx.font = `${span.italic ? 'italic ' : ''}${fontSize}px ${fontFamily}`;
        ctx.fillStyle = span.color;
        ctx.fillText(span.text, currentX, lineY);
        currentX += ctx.measureText(span.text).width;
      }
    }
    ctx.restore();

    return {
      cardBounds: { x: cardX, y: cardY, width: cardWidth, height: cardHeight },
      totalWidth,
      totalHeight
    };
  }

  private _drawOuterBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1c23');
    gradient.addColorStop(0.5, '#12141a');
    gradient.addColorStop(1, '#0e1015');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private _drawCardWindow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    snippet: CodeSnippetPayload,
    headerHeight: number
  ): void {
    ctx.save();

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 12;

    // Card background
    ctx.fillStyle = '#21252b';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Card border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (snippet.showWindowControls !== false) {
      // Header dividing line
      ctx.beginPath();
      ctx.moveTo(x, y + headerHeight);
      ctx.lineTo(x + width, y + headerHeight);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.stroke();

      // macOS Traffic light dots
      const dotRadius = 5.5;
      const dotY = y + headerHeight / 2;
      const startDotX = x + 16;
      const dotGap = 8;

      const dots = [
        { color: '#ff5f56', border: '#e0443e' }, // Close
        { color: '#ffbd2e', border: '#dea123' }, // Minimize
        { color: '#27c93f', border: '#1aab29' }  // Expand
      ];

      for (let i = 0; i < dots.length; i++) {
        const dotX = startDotX + i * (dotRadius * 2 + dotGap);
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = dots[i].color;
        ctx.fill();
      }

      // Title/File name in header center
      if (snippet.fileName) {
        ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(snippet.fileName, x + width / 2, dotY);
      }
    }

    ctx.restore();
  }

  private _parseSnippetLines(snippet: CodeSnippetPayload): SnippetLine[] {
    let highlightedHtml: string;
    try {
      if (snippet.language && hljs.getLanguage(snippet.language)) {
        highlightedHtml = hljs.highlight(snippet.code, {
          language: snippet.language,
          ignoreIllegals: true
        }).value;
      } else {
        highlightedHtml = hljs.highlightAuto(snippet.code).value;
      }
    } catch {
      highlightedHtml = escapeHtml(snippet.code);
    }

    // Convert highlighted HTML into structured DOM nodes
    const container = document.createElement('div');
    container.innerHTML = highlightedHtml;

    // Walk nodes and collect lines
    const lines: SnippetLine[] = [];
    let currentSpans: StyledSpan[] = [];
    let currentLineNum = snippet.startLine || 1;

    const commitLine = () => {
      lines.push({
        lineNumber: currentLineNum++,
        spans: currentSpans
      });
      currentSpans = [];
    };

    const traverse = (node: Node, inheritedColor: string, isItalic = false) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        const parts = text.split('\n');

        for (let i = 0; i < parts.length; i++) {
          if (parts[i].length > 0) {
            currentSpans.push({
              text: parts[i],
              color: inheritedColor,
              italic: isItalic
            });
          }
          if (i < parts.length - 1) {
            commitLine();
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const color = this._resolveColorForClasses(el.className) || inheritedColor;
        const italic = el.classList.contains('hljs-comment') || isItalic;

        for (const child of Array.from(el.childNodes)) {
          traverse(child, color, italic);
        }
      }
    };

    for (const child of Array.from(container.childNodes)) {
      traverse(child, this._themeColors.default);
    }

    // Push the final line if not already committed
    commitLine();

    return lines;
  }

  private _resolveColorForClasses(className: string): string | null {
    if (!className) return null;
    const classes = className.split(' ');
    for (const cls of classes) {
      if (cls.startsWith('hljs-')) {
        const token = cls.substring(5);
        if (this._themeColors[token]) {
          return this._themeColors[token];
        }
      }
    }
    return null;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
