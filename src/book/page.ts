import * as THREE from 'three';
import { Spaceship } from './spaceship';

/** World units along the shorter viewport axis; the longer axis scales with aspect ratio. */
export const PAGE_REFERENCE = 4;

export const THICKNESS = 0.01;

/** Large readable face in page-local space (+Z). */
export const PAGE_FRONT_NORMAL = new THREE.Vector3(0, 0, 1);

/** Z coordinate of the front face center in page-local space. */
export const FRONT_FACE_Z = THICKNESS / 2;

const REF_WIDTH = PAGE_REFERENCE;
const REF_HEIGHT = PAGE_REFERENCE;

export type PageDimensions = { width: number; height: number };

let pageDimensions: PageDimensions = { width: REF_WIDTH, height: REF_HEIGHT };

/** @deprecated Use {@link getPageWidth} / {@link getPageDimensions}. */
export const PLANE_SIZE = PAGE_REFERENCE;

export function getPageDimensions(): PageDimensions {
  return pageDimensions;
}

export function getPageWidth(): number {
  return pageDimensions.width;
}

export function getPageHeight(): number {
  return pageDimensions.height;
}

/** Left edge X in book-local space; pages hinge here on the world-up axis. */
export function getLeftHingeX(): number {
  return -pageDimensions.width / 2;
}

export function setPageViewportAspect(aspect: number): PageDimensions {
  pageDimensions =
    aspect >= 1
      ? { height: PAGE_REFERENCE, width: PAGE_REFERENCE * aspect }
      : { width: PAGE_REFERENCE, height: PAGE_REFERENCE / aspect };
  return pageDimensions;
}

function scaleFromReference(value: number, axis: 'x' | 'y'): number {
  const scale = axis === 'x' ? pageDimensions.width / REF_WIDTH : pageDimensions.height / REF_HEIGHT;
  return value * scale;
}

export function scaleHoleCoord(x: number, y: number): [number, number] {
  return [scaleFromReference(x, 'x'), scaleFromReference(y, 'y')];
}

export function scaleHoleSize(size: number): number {
  return size * Math.min(pageDimensions.width / REF_WIDTH, pageDimensions.height / REF_HEIGHT);
}

export function createPageShape(holes: THREE.Path[] = []) {
  const halfW = pageDimensions.width / 2;
  const halfH = pageDimensions.height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-halfW, -halfH);
  shape.lineTo(halfW, -halfH);
  shape.lineTo(halfW, halfH);
  shape.lineTo(-halfW, halfH);
  shape.closePath();

  for (const hole of holes) {
    shape.holes.push(hole);
  }

  return shape;
}

export function createPageGeometry(holes: THREE.Path[] = []) {
  const shape = createPageShape(holes);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: THICKNESS,
    bevelEnabled: false,
  });
  geometry.translate(0, 0, -THICKNESS / 2);
  return geometry;
}

/** JPG/PNG/canvas bitmaps are sRGB; without this Three treats them as linear and they render too bright. */
export function configureBitmapTexture<T extends THREE.Texture>(texture: T): T {
  (texture as unknown as { colorSpace: string }).colorSpace = 'srgb';
  return texture;
}

/**
 * Unlit front face that shows a bitmap at the same brightness as the source file.
 * Scene lights do not affect this mesh.
 */
export function createTexturedFrontFace(
  texture: THREE.Texture,
  holes: THREE.Path[],
  counters: THREE.Shape[] = [],
): THREE.Mesh {
  configureBitmapTexture(texture);

  const shapeInput =
    counters.length > 0 ? [createPageShape(holes), ...counters] : createPageShape(holes);
  const geometry = new THREE.ShapeGeometry(shapeInput);
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

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const face = new THREE.Mesh(geometry, material);
  face.position.z = FRONT_FACE_Z + 0.005;
  face.name = 'texturedFrontFace';
  return face;
}

export class Page {
  readonly mesh: THREE.Mesh;
  readonly name: string;
  private readonly spaceship: Spaceship;
  /** See-through holes currently punched in this page (set by the book layout). */
  protected holes: THREE.Path[] = [];
  /** Solid islands filled back into the holes (e.g. letter counters). */
  protected counters: THREE.Shape[] = [];

  constructor(color: number, name: string) {
    this.name = name;
    this.mesh = new THREE.Mesh(
      createPageGeometry(this.holes),
      new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData.page = this;

    this.spaceship = new Spaceship(FRONT_FACE_Z + 0.03);
    this.spaceship.setBounds(pageDimensions.width, pageDimensions.height);
    this.mesh.add(this.spaceship.group);
  }

  /**
   * Replace the see-through holes punched in this page and rebuild it.
   *
   * `counters` are solid islands filled back inside those holes (e.g. the
   * insides of letters). The base page only cuts the holes; subclasses that draw
   * a decorated front face are responsible for rendering the counters.
   */
  setHoles(holes: THREE.Path[], counters: THREE.Shape[] = []) {
    this.holes = holes;
    this.counters = counters;
    this.rebuildGeometry();
  }

  /** Position the page along the stack depth (Z). Higher Z is closer to the reader. */
  setDepth(z: number) {
    this.mesh.position.z = z;
  }

  rebuildGeometry() {
    this.mesh.geometry.dispose();
    this.mesh.geometry = createPageGeometry(this.holes);
    this.spaceship.setBounds(pageDimensions.width, pageDimensions.height);
    this.rebuildDecorations();
  }

  /** When false, animated canvas textures should skip per-frame redraws. */
  protected readerVisible = true;

  /** Hook for subclasses to (re)build hole-aware decorations such as textures. */
  protected rebuildDecorations() {}

  /** Called by {@link Book} when the page enters or leaves the camera frustum. */
  setReaderVisible(visible: boolean) {
    this.readerVisible = visible;
  }

  /** Hook for subclasses with per-frame animation. */
  update(delta: number) {
    this.spaceship.update(delta);
  }

  dispose() {
    this.mesh.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const { material } = object;
      const materials = Array.isArray(material) ? material : [material];
      for (const mat of materials) {
        mat.map?.dispose();
        mat.dispose();
      }
    });
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.mesh);
  }
}
