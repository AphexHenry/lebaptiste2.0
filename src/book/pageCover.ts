import * as THREE from 'three';
import {
  Page,
  createPageShape,
  FRONT_FACE_Z,
  getPageHeight,
  getPageWidth,
} from './page';
import { Hole, TextHole, mergeHoleGeometry } from './holes';

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

  /** The cover's own decorative title, as composable hole objects. */
  private readonly titleHoles: Hole[] = buildTitleHoles();

  constructor() {
    super(COVER_COLOR, 'Cover');

    this.canvas = document.createElement('canvas');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.rebuildDecorations();
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
    this.paperFace = createPaperFrontFace(this.texture, this.holes, this.counters);
    this.mesh.add(this.paperFace);
  }
}
