import * as THREE from 'three';
import {
  Page,
  configureBitmapTexture,
  createTexturedFrontFace,
  getPageHeight,
  getPageWidth,
} from './page';
import { Hole, TextHole, mergeHoleGeometry } from './holes';
import paperTextureUrl from '../../assets/paperTexture.jpg';

const COVER_COLOR = 0xdccfc2;
const PAPER_TEXTURE_SIZE = 768;

/** Diagonal cover gradient: warm cream (top-left) → soft blush → cool lavender (bottom-right). */
const COVER_TOP_LEFT_COLOR = '#FCEAD7';
const COVER_MID_COLOR = '#F0E1DE';
const COVER_BOTTOM_RIGHT_COLOR = '#D5C5DC';
/** Soft warm light pooling in the top-left corner, fading to nothing. */
const COVER_BLOOM_COLOR = '#FFF6E9';
const COVER_BLOOM_ALPHA = 0.5;

const GRAIN_OPACITY = 0.55;
const GRAIN_TILE_SIZE = 384;

/**
 * Cohesive plum ink shared by every printed accent (echoes, rule, frame). All
 * of it is laid down with `multiply` so it reads as pigment soaked into the
 * paper rather than a flat overlay.
 */
const INK_COLOR = '#5B5168';

/**
 * Concentric "contour echoes" rippling outward from each portal hole, so the
 * cutouts feel like the origin of the composition instead of stray punches.
 * Derived from the live hole geometry, so they hug a circle as rings and the
 * triangle as nested triangles, and always stay registered with the cutouts.
 */
const ECHO_COUNT = 2;
/** Each successive echo expands this fraction beyond the hole's own outline. */
const ECHO_GAP_FACTOR = 0.14;
const ECHO_BASE_ALPHA = 0.17;
const ECHO_LINE_WIDTH = 1.5;
/** Holes smaller than this fraction of the page height are skipped (title letters). */
const ECHO_MIN_SIZE_FACTOR = 0.12;
/** Curve sampling for an echo outline; high enough for clean rings. */
const ECHO_SAMPLES = 64;

/** Hairline rule under the title block, anchoring the punched-through type. */
const RULE_ALPHA = 0.5;
const RULE_LINE_WIDTH = 1.5;
/** Vertical gap below the subtitle baseline, as a fraction of the subtitle size. */
const RULE_GAP_FACTOR = 0.7;
/** Rule length as a fraction of the page width. */
const RULE_LENGTH_FACTOR = 0.18;

/** Thin editorial frame inset from the page edge. */
const FRAME_INSET_FACTOR = 0.04;
const FRAME_ALPHA = 0.26;
const FRAME_LINE_WIDTH = 1.25;

/** Title shown punched through the cover, top-left. */
const TITLE_TEXT = 'Baptiste Bohelay';
const SUBTITLE_TEXT = 'Developer & Designer';

/** Cap height of each line, as a fraction of the page height. */
const TITLE_HEIGHT_FACTOR = 0.052;
const SUBTITLE_HEIGHT_FACTOR = 0.032;
/** Top-left inset of the text block, as fractions of the page size. */
const TEXT_LEFT_FACTOR = 0.06;
const TEXT_TOP_FACTOR = 0.07;
/** Blank space between the two lines, as a fraction of the title height. */
const LINE_GAP_FACTOR = 0.55;
/**
 * The cover's punched-through title block, modelled as two {@link TextHole}
 * objects (one per line). Each resolves its baseline lazily so the lettering
 * tracks the current page size, exactly like the portal holes do.
 */
function buildTitleHoles(): Hole[] {
  const leftX = () => -getPageWidth() / 2 + getPageWidth() * TEXT_LEFT_FACTOR;
  const titleSize = () => getPageHeight() * TITLE_HEIGHT_FACTOR;
  const subtitleSize = () => getPageHeight() * SUBTITLE_HEIGHT_FACTOR;
  const topY = () => getPageHeight() / 2 - getPageHeight() * TEXT_TOP_FACTOR;
  const titleBaseline = () => topY() - titleSize();
  const subtitleBaseline = () =>
    titleBaseline() - (titleSize() * LINE_GAP_FACTOR + subtitleSize());

  return [
    new TextHole(TITLE_TEXT, () => ({
      size: titleSize(),
      baselineX: leftX(),
      baselineY: titleBaseline(),
    })),
    new TextHole(SUBTITLE_TEXT, () => ({
      size: subtitleSize(),
      baselineX: leftX(),
      baselineY: subtitleBaseline(),
    })),
  ];
}

function drawCoverBase(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, COVER_TOP_LEFT_COLOR);
  gradient.addColorStop(0.55, COVER_MID_COLOR);
  gradient.addColorStop(1, COVER_BOTTOM_RIGHT_COLOR);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const bloomRadius = Math.max(width, height) * 0.85;
  const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, bloomRadius);
  bloom.addColorStop(0, hexWithAlpha(COVER_BLOOM_COLOR, COVER_BLOOM_ALPHA));
  bloom.addColorStop(1, hexWithAlpha(COVER_BLOOM_COLOR, 0));
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, width, height);
}

function hexWithAlpha(hex: string, alpha: number): string {
  const value = parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type CanvasPoint = { x: number; y: number };

/**
 * Maps a page-local world point (origin at the page centre, +Y up) to a pixel
 * on the cover texture (origin top-left, +Y down).
 */
function makeWorldToCanvas(width: number, height: number): (p: THREE.Vector2) => CanvasPoint {
  const halfW = getPageWidth() / 2;
  const halfH = getPageHeight() / 2;
  return (p) => ({
    x: ((p.x + halfW) / getPageWidth()) * width,
    y: ((halfH - p.y) / getPageHeight()) * height,
  });
}

type EchoSource = { center: CanvasPoint; size: number; points: CanvasPoint[] };

function describeHole(hole: THREE.Path, toCanvas: (p: THREE.Vector2) => CanvasPoint): EchoSource {
  const points = hole.getPoints(ECHO_SAMPLES).map(toCanvas);
  let cx = 0;
  let cy = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return {
    center: { x: cx / points.length, y: cy / points.length },
    size: Math.max(maxX - minX, maxY - minY),
    points,
  };
}

/**
 * Draws nested outline echoes around every portal-sized hole. The shape is the
 * hole's own outline scaled outward from its centroid, so circles ripple as
 * rings and the triangle as nested triangles.
 */
function drawHoleEchoes(
  ctx: CanvasRenderingContext2D,
  holes: THREE.Path[],
  width: number,
  height: number,
) {
  if (holes.length === 0) return;
  const toCanvas = makeWorldToCanvas(width, height);
  const minSize = height * ECHO_MIN_SIZE_FACTOR;

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = INK_COLOR;
  ctx.lineJoin = 'round';

  for (const hole of holes) {
    const { center, size, points } = describeHole(hole, toCanvas);
    if (size < minSize) continue;

    for (let i = 1; i <= ECHO_COUNT; i++) {
      const scale = 1 + i * ECHO_GAP_FACTOR;
      ctx.globalAlpha = ECHO_BASE_ALPHA * (1 - ((i - 1) / ECHO_COUNT) * 0.5);
      ctx.lineWidth = ECHO_LINE_WIDTH;
      ctx.beginPath();
      points.forEach((p, index) => {
        const x = center.x + (p.x - center.x) * scale;
        const y = center.y + (p.y - center.y) * scale;
        index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawTitleRule(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const titleSize = height * TITLE_HEIGHT_FACTOR;
  const subtitleSize = height * SUBTITLE_HEIGHT_FACTOR;
  const titleBaseline = height * TEXT_TOP_FACTOR + titleSize;
  const subtitleBaseline = titleBaseline + titleSize * LINE_GAP_FACTOR + subtitleSize;

  const left = width * TEXT_LEFT_FACTOR;
  const y = subtitleBaseline + subtitleSize * RULE_GAP_FACTOR;

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = RULE_ALPHA;
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = RULE_LINE_WIDTH;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(left + width * RULE_LENGTH_FACTOR, y);
  ctx.stroke();
  ctx.restore();
}

function drawFrame(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const inset = Math.min(width, height) * FRAME_INSET_FACTOR;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = FRAME_ALPHA;
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = FRAME_LINE_WIDTH;
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
  ctx.restore();
}

function drawTiledGrain(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const tileAspect = image.naturalWidth / image.naturalHeight;
  const tileWidth = GRAIN_TILE_SIZE * tileAspect;
  const tileHeight = GRAIN_TILE_SIZE;

  for (let y = 0; y < height; y += tileHeight) {
    for (let x = 0; x < width; x += tileWidth) {
      ctx.drawImage(image, x, y, tileWidth, tileHeight);
    }
  }
}

function drawPaperTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  grainImage: HTMLImageElement | null,
  holes: THREE.Path[],
) {
  drawCoverBase(ctx, width, height);

  if (grainImage) {
    ctx.save();
    ctx.globalAlpha = GRAIN_OPACITY;
    ctx.globalCompositeOperation = 'multiply';
    drawTiledGrain(ctx, grainImage, width, height);
    ctx.restore();
  }

  // Printed accents sit on top of the paper grain, but clipped inside the frame
  // so echoes never bleed off the sheet.
  const inset = Math.min(width, height) * FRAME_INSET_FACTOR;
  ctx.save();
  ctx.beginPath();
  ctx.rect(inset, inset, width - inset * 2, height - inset * 2);
  ctx.clip();
  drawHoleEchoes(ctx, holes, width, height);
  drawTitleRule(ctx, width, height);
  ctx.restore();

  drawFrame(ctx, width, height);
}

export class PageCover extends Page {
  private readonly texture: THREE.CanvasTexture;
  private readonly ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private grainImage: HTMLImageElement | null = null;
  private paperFace: THREE.Mesh | null = null;

  /** The cover's own decorative title, as composable hole objects. */
  private readonly titleHoles: Hole[] = buildTitleHoles();

  constructor() {
    super(COVER_COLOR, 'Cover');

    this.canvas = document.createElement('canvas');
    this.texture = configureBitmapTexture(new THREE.CanvasTexture(this.canvas));
    this.ctx = this.canvas.getContext('2d')!;
    this.rebuildDecorations();
    this.loadPaperGrain();
  }

  /**
   * Merges the cover's title holes into the portal holes the book assigns, so
   * the cover is see-through both through its portals and through the lettering.
   * Portal counters (e.g. the "Art" ring text's letter insides) and the title
   * counters are kept so the front face can fill them back in.
   */
  setHoles(holes: THREE.Path[], counters: THREE.Shape[] = []) {
    const title = mergeHoleGeometry(this.titleHoles.map((hole) => hole.build()));
    super.setHoles([...holes, ...title.paths], [...counters, ...title.counters]);
  }

  private resizeTexture() {
    const aspect = getPageWidth() / getPageHeight();
    this.canvas.width = Math.round(PAPER_TEXTURE_SIZE * aspect);
    this.canvas.height = PAPER_TEXTURE_SIZE;
    drawPaperTexture(this.ctx, this.canvas.width, this.canvas.height, this.grainImage, this.holes);
    this.texture.needsUpdate = true;
  }

  private loadPaperGrain() {
    const image = new Image();
    image.onload = () => {
      this.grainImage = image;
      this.rebuildDecorations();
    };
    image.onerror = (error) => {
      console.error('Failed to load cover paper texture:', error);
    };
    image.src = paperTextureUrl;
  }

  protected rebuildDecorations() {
    if (this.paperFace) {
      this.mesh.remove(this.paperFace);
      this.paperFace.geometry.dispose();
      const material = this.paperFace.material as THREE.MeshBasicMaterial;
      material.map = null;
      material.dispose();
    }

    this.resizeTexture();
    this.paperFace = createTexturedFrontFace(this.texture, this.holes, this.counters);
    this.paperFace.name = 'paperCoverFace';
    this.mesh.add(this.paperFace);
  }
}
