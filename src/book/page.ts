import * as THREE from 'three';

export const PLANE_SIZE = 4;
export const THICKNESS = 0.06;

/** Large readable face in page-local space (+Z). */
export const PAGE_FRONT_NORMAL = new THREE.Vector3(0, 0, 1);

/** Z coordinate of the front face center in page-local space. */
export const FRONT_FACE_Z = THICKNESS / 2;

/** Left edge X in book-local space; pages hinge here on the world-up axis. */
export const LEFT_HINGE_X = -PLANE_SIZE / 2;

export function createPageShape(holes: THREE.Path[] = []) {
  const half = PLANE_SIZE / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-half, -half);
  shape.lineTo(half, -half);
  shape.lineTo(half, half);
  shape.lineTo(-half, half);
  shape.closePath();

  for (const hole of holes) {
    shape.holes.push(hole);
  }

  return shape;
}

function createPageGeometry(holes: THREE.Path[]) {
  const shape = createPageShape(holes);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: THICKNESS,
    bevelEnabled: false,
  });
  geometry.translate(0, 0, -THICKNESS / 2);
  return geometry;
}

function createLabel(name: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  const width = 512;
  const height = 128;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#1a1008';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const labelWidth = 1.8;
  const labelHeight = labelWidth * (height / width);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(labelWidth, labelHeight), material);
  label.position.set(0, 0, FRONT_FACE_Z + 0.01);
  label.renderOrder = 1;
  return label;
}

export class Page {
  readonly mesh: THREE.Mesh;
  readonly stackIndex: number;
  readonly name: string;

  constructor(color: number, stackIndex: number, name: string, holes: THREE.Path[] = []) {
    this.stackIndex = stackIndex;
    this.name = name;
    this.mesh = new THREE.Mesh(
      createPageGeometry(holes),
      new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
    );
    this.mesh.position.z = stackIndex * THICKNESS;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData.page = this;
    this.mesh.add(createLabel(name));
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
