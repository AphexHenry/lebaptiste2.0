import * as THREE from 'three';
import {
  Page,
  createPageShape,
  FRONT_FACE_Z,
  getPageWidth,
  getPageHeight,
} from './page';

const TEXTURE_SIZE = 512;

const PASTEL_COLORS = [
  '#f8bbd0',
  '#b3e5fc',
  '#c8e6c9',
  '#fff9c4',
  '#e1bee7',
  '#ffccbc',
  '#dcedc8',
  '#f0f4c3',
];

function drawWavyTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  ctx.fillStyle = '#faf3e8';
  ctx.fillRect(0, 0, width, height);

  const lineSpacing = 28;
  const amplitude = 14;
  const frequency = 0.018;

  for (let i = 0; i * lineSpacing < height + lineSpacing; i++) {
    const baseY = i * lineSpacing;
    const color = PASTEL_COLORS[i % PASTEL_COLORS.length];
    const phase = time * 1.2 + i * 0.7;
    const verticalDrift = Math.sin(time * 0.9 + i * 0.4) * 18;

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();

    for (let x = 0; x <= width; x += 3) {
      const waveY =
        baseY + verticalDrift + Math.sin(x * frequency + phase) * amplitude;
      if (x === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }

    ctx.stroke();
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
