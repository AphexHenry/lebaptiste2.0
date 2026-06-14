import * as THREE from 'three';

export const PLANE_SIZE = 4;
export const THICKNESS = 0.06;
export const GAP = 0.4;

export class Page {
  readonly mesh: THREE.Mesh;

  constructor(color: number, stackIndex: number) {
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(PLANE_SIZE, THICKNESS, PLANE_SIZE),
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
