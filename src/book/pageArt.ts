import * as THREE from 'three';
import {
  Page,
  createPageShape,
  FRONT_FACE_Z,
  getPageWidth,
  getPageHeight,
} from './page';

const TEXTURE_SIZE = 512;

const BAND_COLORS = [
  '#e91e63',
  '#2196f3',
  '#4caf50',
  '#ffeb3b',
  '#9c27b0',
  '#ff5722',
  '#00bcd4',
  '#cddc39',
  '#ff9800',
  '#3f51b5',
  '#f44336',
  '#009688',
];

function waveY(
  x: number,
  baseY: number,
  phase: number,
  verticalDrift: number,
  amplitude: number,
  frequency: number,
): number {
  return baseY + verticalDrift + Math.sin(x * frequency + phase) * amplitude;
}

function traceWaveEdge(
  ctx: CanvasRenderingContext2D,
  width: number,
  baseY: number,
  phase: number,
  verticalDrift: number,
  amplitude: number,
  frequency: number,
  forward: boolean,
) {
  const step = 3;
  if (forward) {
    for (let x = 0; x <= width; x += step) {
      ctx.lineTo(x, waveY(x, baseY, phase, verticalDrift, amplitude, frequency));
    }
  } else {
    for (let x = width; x >= 0; x -= step) {
      ctx.lineTo(x, waveY(x, baseY, phase, verticalDrift, amplitude, frequency));
    }
  }
}

function bandParams(index: number, time: number) {
  const phase = time * 1.2 + index * 0.7;
  const verticalDrift = Math.sin(time * 0.9 + index * 0.4) * 18;
  return { phase, verticalDrift };
}

function drawWavyTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  const bandSpacing = 30;
  const amplitude = 16;
  const frequency = 0.018;
  const bandCount = Math.ceil((height + bandSpacing * 2) / bandSpacing);

  for (let i = 0; i < bandCount; i++) {
    const topY = i * bandSpacing;
    const bottomY = (i + 1) * bandSpacing;
    const top = bandParams(i, time);
    const bottom = bandParams(i + 1, time);
    const color = BAND_COLORS[i % BAND_COLORS.length];

    ctx.beginPath();
    ctx.moveTo(
      0,
      waveY(0, topY, top.phase, top.verticalDrift, amplitude, frequency),
    );
    traceWaveEdge(ctx, width, topY, top.phase, top.verticalDrift, amplitude, frequency, true);
    traceWaveEdge(
      ctx,
      width,
      bottomY,
      bottom.phase,
      bottom.verticalDrift,
      amplitude,
      frequency,
      false,
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function createTexturedFrontFace(
  texture: THREE.CanvasTexture,
  holes: THREE.Path[],
): THREE.Mesh {
  const geometry = new THREE.ShapeGeometry(createPageShape(holes));
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
    roughness: 0.7,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const face = new THREE.Mesh(geometry, material);
  face.position.z = FRONT_FACE_Z + 0.005;
  face.castShadow = true;
  face.receiveShadow = true;
  face.name = 'texturedFrontFace';
  return face;
}

export class PageArt extends Page {
  private readonly texture: THREE.CanvasTexture;
  private readonly ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private texturedFace: THREE.Mesh | null = null;
  private time = 0;

  constructor() {
    super(0xa88b5e, 'Art');

    this.canvas = document.createElement('canvas');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.rebuildDecorations();
  }

  private resizeTexture() {
    const aspect = getPageWidth() / getPageHeight();
    this.canvas.width = Math.round(TEXTURE_SIZE * aspect);
    this.canvas.height = TEXTURE_SIZE;
    drawWavyTexture(this.ctx, this.canvas.width, this.canvas.height, this.time);
    this.texture.needsUpdate = true;
  }

  protected rebuildDecorations() {
    if (this.texturedFace) {
      this.mesh.remove(this.texturedFace);
      this.texturedFace.geometry.dispose();
      (this.texturedFace.material as THREE.Material).dispose();
    }
    this.resizeTexture();
    this.texturedFace = createTexturedFrontFace(this.texture, this.holes);
    this.mesh.add(this.texturedFace);
  }

  update(delta: number) {
    this.time += delta;
    drawWavyTexture(this.ctx, this.canvas.width, this.canvas.height, this.time);
    this.texture.needsUpdate = true;
  }
}
