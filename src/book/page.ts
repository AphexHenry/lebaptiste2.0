import * as THREE from 'three';

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

export class Page {
  readonly mesh: THREE.Mesh;
  readonly stackIndex: number;
  readonly name: string;
  private readonly buildHoles: () => THREE.Path[];
  private holes: THREE.Path[];

  constructor(
    color: number,
    stackIndex: number,
    name: string,
    buildHoles: () => THREE.Path[] = () => [],
  ) {
    this.stackIndex = stackIndex;
    this.name = name;
    this.buildHoles = buildHoles;
    this.holes = buildHoles();
    this.mesh = new THREE.Mesh(
      createPageGeometry(this.holes),
      new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
    );
    this.mesh.position.z = stackIndex * THICKNESS;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData.page = this;
  }

  rebuildGeometry() {
    this.holes = this.buildHoles();
    this.mesh.geometry.dispose();
    this.mesh.geometry = createPageGeometry(this.holes);
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
