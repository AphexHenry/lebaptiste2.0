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
const COVER_TOP_LEFT_COLOR = '#FCEAD7';
const COVER_BOTTOM_RIGHT_COLOR = '#D5C5DC';
const GRAIN_OPACITY = 0.55;
const GRAIN_TILE_SIZE = 384;

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
  ctx.fillStyle = COVER_TOP_LEFT_COLOR;
  ctx.fillRect(0, 0, width, height);

  ctx.beginPath();
  ctx.moveTo(width, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = COVER_BOTTOM_RIGHT_COLOR;
  ctx.fill();
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
) {
  drawCoverBase(ctx, width, height);
  if (!grainImage) return;

  ctx.save();
  ctx.globalAlpha = GRAIN_OPACITY;
  ctx.globalCompositeOperation = 'multiply';
  drawTiledGrain(ctx, grainImage, width, height);
  ctx.restore();
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
    drawPaperTexture(this.ctx, this.canvas.width, this.canvas.height, this.grainImage);
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
