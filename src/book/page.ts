import * as THREE from 'three';

export const PLANE_SIZE = 4;
export const THICKNESS = 0.06;
export const GAP = 0.4;

function createPageGeometry(holes: THREE.Path[]) {
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

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: THICKNESS,
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -THICKNESS / 2, 0);
  return geometry;
}

export class Page {
  readonly mesh: THREE.Mesh;

  constructor(color: number, stackIndex: number, holes: THREE.Path[] = []) {
    this.mesh = new THREE.Mesh(
      createPageGeometry(holes),
      new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
    );
    this.mesh.position.y = stackIndex * (THICKNESS + GAP);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.mesh);
  }
}
