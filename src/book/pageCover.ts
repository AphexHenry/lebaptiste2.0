import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
// Swap this import for any other typeface.json to change the cover font. Three.js
// ships several under `three/examples/fonts`, and the `facetype.js` converter
// (https://gero3.github.io/facetype.js/) turns any .ttf/.otf into this format.
import titleFontUrl from 'three/examples/fonts/helvetiker_bold.typeface.json?url';
import {
  Page,
  createPageShape,
  FRONT_FACE_Z,
  getPageHeight,
  getPageWidth,
} from './page';

const COVER_COLOR = 0xffef9f;
const PAPER_TEXTURE_SIZE = 768;

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
/** Bezier sampling per glyph contour; higher is smoother but heavier. */
const GLYPH_CURVE_DIVISIONS = 6;

type TitleGeometry = {
  /** Glyph outlines, punched as see-through holes in the page. */
  holes: THREE.Path[];
  /** Letter counters (insides of a, o, B, …), filled back in so text reads. */
  counters: THREE.Shape[];
};

function contourToPath(points: THREE.Vector2[], dx: number, dy: number): THREE.Path {
  const path = new THREE.Path();
  points.forEach((p, i) =>
    i === 0 ? path.moveTo(p.x + dx, p.y + dy) : path.lineTo(p.x + dx, p.y + dy),
  );
  path.closePath();
  return path;
}

function contourToShape(points: THREE.Vector2[], dx: number, dy: number): THREE.Shape {
  const shape = new THREE.Shape();
  points.forEach((p, i) =>
    i === 0 ? shape.moveTo(p.x + dx, p.y + dy) : shape.lineTo(p.x + dx, p.y + dy),
  );
  shape.closePath();
  return shape;
}

/**
 * Lays one line of text out from a baseline at (originX, originY) and appends
 * its glyph outlines (as holes) and counters (as fill shapes) to `out`.
 *
 * `font.generateShapes` returns one {@link THREE.Shape} per glyph already
 * positioned along the baseline, with the letter counters stored as the shape's
 * own holes — exactly what we need to invert into see-through letters.
 */
function layoutLine(
  font: any,
  text: string,
  size: number,
  originX: number,
  originY: number,
  out: TitleGeometry,
) {
  const glyphs = font.generateShapes(text, size) as THREE.Shape[];
  for (const glyph of glyphs) {
    const { shape, holes } = glyph.extractPoints(GLYPH_CURVE_DIVISIONS);
    out.holes.push(contourToPath(shape, originX, originY));
    for (const counter of holes) {
      out.counters.push(contourToShape(counter, originX, originY));
    }
  }
}

/** Builds the title/subtitle holes and counters for the current page size. */
function buildTitleGeometry(font: any): TitleGeometry {
  const out: TitleGeometry = { holes: [], counters: [] };
  if (!font) return out;

  const pageW = getPageWidth();
  const pageH = getPageHeight();
  const titleSize = pageH * TITLE_HEIGHT_FACTOR;
  const subtitleSize = pageH * SUBTITLE_HEIGHT_FACTOR;

  const leftX = -pageW / 2 + pageW * TEXT_LEFT_FACTOR;
  const topY = pageH / 2 - pageH * TEXT_TOP_FACTOR;

  const titleBaseline = topY - titleSize;
  const subtitleBaseline = titleBaseline - (titleSize * LINE_GAP_FACTOR + subtitleSize);

  layoutLine(font, TITLE_TEXT, titleSize, leftX, titleBaseline, out);
  layoutLine(font, SUBTITLE_TEXT, subtitleSize, leftX, subtitleBaseline, out);

  return out;
}

function randomFromSeed(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function drawPaperTexture(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, '#fff7c8');
  base.addColorStop(0.5, '#ffe98e');
  base.addColorStop(1, '#ffd86a');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const fineGrain = randomFromSeed(x * 31 + y * 17);
      const broadGrain = randomFromSeed(Math.floor(x / 9) * 19 + Math.floor(y / 9) * 23);
      const grain = (fineGrain - 0.5) * 18 + (broadGrain - 0.5) * 18;

      data[offset] = THREE.MathUtils.clamp(data[offset] + grain, 0, 255);
      data[offset + 1] = THREE.MathUtils.clamp(data[offset + 1] + grain, 0, 255);
      data[offset + 2] = THREE.MathUtils.clamp(data[offset + 2] + grain * 0.6, 0, 255);
    }
  }

  ctx.putImageData(imageData, 0, 0);

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = '#fffbe2';
  ctx.lineWidth = 1;
  for (let i = 0; i < 180; i++) {
    const x = randomFromSeed(i * 41) * width;
    const y = randomFromSeed(i * 67) * height;
    const length = 18 + randomFromSeed(i * 89) * 90;
    const angle = -0.25 + randomFromSeed(i * 101) * 0.5;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#b86f23';
  for (let i = 0; i < 80; i++) {
    const radius = 1 + randomFromSeed(i * 137) * 2.5;
    ctx.beginPath();
    ctx.arc(randomFromSeed(i * 149) * width, randomFromSeed(i * 163) * height, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function createPaperFrontFace(
  texture: THREE.CanvasTexture,
  holes: THREE.Path[],
  counters: THREE.Shape[],
): THREE.Mesh {
  // The page shape carries the glyph outlines as holes; the counters are added
  // as extra solid islands so letters like a/o/B keep their insides.
  const geometry = new THREE.ShapeGeometry([createPageShape(holes), ...counters]);
  const buffer = geometry as unknown as THREE.BufferGeometry;
  const uv = buffer.attributes.uv;
  const pos = buffer.attributes.position;
  const halfW = getPageWidth() / 2;
  const halfH = getPageHeight() / 2;

  for (let i = 0; i < uv.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    uv.setXY(i, (x + halfW) / getPageWidth(), (y + halfH) / getPageHeight());
  }
  uv.needsUpdate = true;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.92,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const face = new THREE.Mesh(geometry, material);
  face.position.z = FRONT_FACE_Z + 0.005;
  face.castShadow = true;
  face.receiveShadow = true;
  face.name = 'paperCoverFace';
  return face;
}

export class PageCover extends Page {
  private readonly texture: THREE.CanvasTexture;
  private readonly ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private paperFace: THREE.Mesh | null = null;

  private font: any = null;
  /** Portal holes assigned by the book layout, kept so we can re-merge text. */
  private portalHoles: THREE.Path[] = [];
  /** Counters for the current title, filled back into the front face. */
  private titleCounters: THREE.Shape[] = [];

  constructor() {
    super(COVER_COLOR, 'Cover');

    this.canvas = document.createElement('canvas');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.rebuildDecorations();

    new FontLoader().load(titleFontUrl, (font: any) => {
      this.font = font;
      // Re-run the layout now that glyphs are available.
      this.setHoles(this.portalHoles);
    });
  }

  /**
   * Merges the title glyph holes into the portal holes the book assigns, so the
   * cover is see-through both through its portals and through the lettering.
   */
  setHoles(holes: THREE.Path[]) {
    this.portalHoles = holes;
    const title = buildTitleGeometry(this.font);
    this.titleCounters = title.counters;
    super.setHoles([...holes, ...title.holes]);
  }

  private resizeTexture() {
    const aspect = getPageWidth() / getPageHeight();
    this.canvas.width = Math.round(PAPER_TEXTURE_SIZE * aspect);
    this.canvas.height = PAPER_TEXTURE_SIZE;
    drawPaperTexture(this.ctx, this.canvas.width, this.canvas.height);
    this.texture.needsUpdate = true;
  }

  protected rebuildDecorations() {
    if (this.paperFace) {
      this.mesh.remove(this.paperFace);
      this.paperFace.geometry.dispose();
      (this.paperFace.material as THREE.Material).dispose();
    }

    this.resizeTexture();
    this.paperFace = createPaperFrontFace(this.texture, this.holes, this.titleCounters);
    this.mesh.add(this.paperFace);
  }
}
