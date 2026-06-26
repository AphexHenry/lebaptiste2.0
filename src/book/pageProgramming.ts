import * as THREE from 'three';
import {
  Page,
  createTexturedFrontFace,
  FRONT_FACE_Z,
} from './page';
import { traceEquilateralTriangle } from './holes';
import backgroundUrl from '../../assets/backgroundGreenAquarel.jpg';

// Shared with the Art/About portals via bookTree so the reflective triangle and
// the cover's triangular hole stay perfectly aligned.
export const PROGRAMMING_TRIANGLE = {
  cx: 0.2,
  cy: -0.6,
  size: 1.3,
  /** Radians around the triangle centre; 0 = apex pointing up. */
  rotation: Math.PI * 0.3,
};

function createTriangleShape(
  cx = PROGRAMMING_TRIANGLE.cx,
  cy = PROGRAMMING_TRIANGLE.cy,
  size = PROGRAMMING_TRIANGLE.size,
  rotation = PROGRAMMING_TRIANGLE.rotation,
): THREE.Shape {
  const shape = new THREE.Shape();
  traceEquilateralTriangle(shape, cx, cy, size, rotation);
  return shape;
}

export function createReflectiveTriangle(): THREE.Mesh {
  const geometry = new THREE.ShapeGeometry(createTriangleShape());
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0.05,
    envMapIntensity: 1.2,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const triangle = new THREE.Mesh(geometry, material);
  triangle.position.z = FRONT_FACE_Z + 0.005;
  triangle.castShadow = true;
  triangle.receiveShadow = true;
  triangle.name = 'reflectiveTriangle';
  return triangle;
}

export class PageProgramming extends Page {
  private backgroundTexture: THREE.Texture | null = null;
  private texturedFace: THREE.Mesh | null = null;
  private reflectiveTriangle: THREE.Mesh | null = null;

  constructor() {
    super(0x2a2a3e, 'Programming');
    this.rebuildDecorations();

    new THREE.TextureLoader().load(
      backgroundUrl,
      (texture) => {
        this.backgroundTexture = texture;
        this.rebuildDecorations();
      },
      undefined,
      (error) => {
        console.error('Failed to load Programming page background:', error);
      },
    );
  }

  protected rebuildDecorations() {
    if (this.texturedFace) {
      this.mesh.remove(this.texturedFace);
      this.texturedFace.geometry.dispose();
      const material = this.texturedFace.material as THREE.MeshBasicMaterial;
      material.map = null;
      material.dispose();
      this.texturedFace = null;
    }
    if (this.reflectiveTriangle) {
      this.mesh.remove(this.reflectiveTriangle);
      this.reflectiveTriangle.geometry.dispose();
      (this.reflectiveTriangle.material as THREE.Material).dispose();
      this.reflectiveTriangle = null;
    }

    if (this.backgroundTexture) {
      this.texturedFace = createTexturedFrontFace(this.backgroundTexture, this.holes);
      this.mesh.add(this.texturedFace);
    }

    // this.reflectiveTriangle = createReflectiveTriangle();
    // this.mesh.add(this.reflectiveTriangle);
  }
}
