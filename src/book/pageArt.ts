import * as THREE from 'three';
import { Page, createPageShape, FRONT_FACE_Z, PLANE_SIZE } from './page';

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

function triangleHole(cx: number, cy: number, size: number): THREE.Path {
  const height = (size * Math.sqrt(3)) / 2;
  const hole = new THREE.Path();
  hole.moveTo(cx, cy + height / 2);
  hole.lineTo(cx - size / 2, cy - height / 2);
  hole.lineTo(cx + size / 2, cy - height / 2);
  hole.closePath();
  return hole;
}

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

function createTexturedFrontFace(texture: THREE.CanvasTexture): THREE.Mesh {
  const geometry = new THREE.ShapeGeometry(createPageShape([triangleHole(0, 0, 1.4)]));
  const buffer = geometry as unknown as THREE.BufferGeometry;
  const uv = buffer.attributes.uv;
  const pos = buffer.attributes.position;
  const half = PLANE_SIZE / 2;

  for (let i = 0; i < uv.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    uv.setXY(i, (x + half) / PLANE_SIZE, (y + half) / PLANE_SIZE);
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
  return face;
}

export class PageArt extends Page {
  private readonly texture: THREE.CanvasTexture;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;
  private time = 0;

  constructor() {
    super(0xa88b5e, 1, 'Art', [triangleHole(0, 0, 1.4)]);

    this.canvas = document.createElement('canvas');
    this.canvas.width = TEXTURE_SIZE;
    this.canvas.height = TEXTURE_SIZE;
    this.ctx = this.canvas.getContext('2d')!;

    this.texture = new THREE.CanvasTexture(this.canvas);
    drawWavyTexture(this.ctx, TEXTURE_SIZE, TEXTURE_SIZE, this.time);
    this.texture.needsUpdate = true;

    this.mesh.add(createTexturedFrontFace(this.texture));
  }

  update(delta: number) {
    this.time += delta;
    drawWavyTexture(this.ctx, TEXTURE_SIZE, TEXTURE_SIZE, this.time);
    this.texture.needsUpdate = true;
  }
}
