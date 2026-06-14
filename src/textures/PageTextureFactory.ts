import { CanvasTexture, type Texture } from 'three';
import type { HoleConfig, PageConfig, PatternType } from '../types/book';
import { TEXTURE_HEIGHT, TEXTURE_WIDTH } from '../types/book';
import { getPageIndex } from '../config/pages';
import { drawDots } from './patterns/dots';
import { drawStripes } from './patterns/stripes';
import { drawSquares } from './patterns/squares';
import { drawWaves } from './patterns/waves';

const patternDrawers: Record<
  PatternType,
  (ctx: CanvasRenderingContext2D, w: number, h: number, color: string) => void
> = {
  dots: drawDots,
  stripes: drawStripes,
  squares: drawSquares,
  waves: drawWaves,
};

function darkenColor(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function holeCenter(hole: HoleConfig, width: number, height: number) {
  return {
    x: hole.x * width,
    y: (1 - hole.y) * height,
    radius: hole.radius * width,
  };
}

/** Build a page face path with circular holes subtracted (even-odd rule). */
function tracePageFace(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  holes: HoleConfig[],
): void {
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  for (const hole of holes) {
    const { x, y, radius } = holeCenter(hole, width, height);
    ctx.moveTo(x + radius, y);
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
  }
}

function drawHoleLabels(
  ctx: CanvasRenderingContext2D,
  holes: HoleConfig[],
  width: number,
  height: number,
): void {
  ctx.font = '600 42px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';

  for (const hole of holes) {
    const { x, y } = holeCenter(hole, width, height);
    ctx.fillText(hole.label, x, y);
  }
}

function drawPageBorder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
): void {
  const borderWidth = 12;
  ctx.strokeStyle = darkenColor(color, 50);
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(
    borderWidth / 2,
    borderWidth / 2,
    width - borderWidth,
    height - borderWidth,
  );
}

export function getHolesForPage(
  pageIndex: number,
  coverHoles: HoleConfig[],
): HoleConfig[] {
  return coverHoles.filter((hole) => getPageIndex(hole.targetPageId) > pageIndex);
}

export function createPageTexture(
  config: PageConfig,
  pageIndex: number,
  coverHoles: HoleConfig[],
): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const ctx = canvas.getContext('2d', { alpha: true })!;

  ctx.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  const holes =
    config.holes ?? getHolesForPage(pageIndex, coverHoles);

  // Solid page face with transparent holes
  tracePageFace(ctx, TEXTURE_WIDTH, TEXTURE_HEIGHT, holes);
  ctx.fillStyle = config.color;
  ctx.fill('evenodd');

  // Pattern only on the opaque face — never inside holes
  ctx.save();
  tracePageFace(ctx, TEXTURE_WIDTH, TEXTURE_HEIGHT, holes);
  ctx.clip('evenodd');
  patternDrawers[config.pattern](ctx, TEXTURE_WIDTH, TEXTURE_HEIGHT, config.color);
  drawPageBorder(ctx, TEXTURE_WIDTH, TEXTURE_HEIGHT, config.color);
  ctx.restore();

  if (config.holes) {
    drawHoleLabels(ctx, config.holes, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  }

  const texture = new CanvasTexture(canvas);
  texture.premultiplyAlpha = false;
  texture.needsUpdate = true;
  return texture;
}
