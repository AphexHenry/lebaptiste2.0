import * as THREE from 'three';
import { Page, FRONT_FACE_Z, scaleHoleCoord, scaleHoleSize } from './page';

export const PROGRAMMING_TRIANGLE = { cx: 0, cy: 0.2, size: 1.0 };

function circleHole(cx: number, cy: number, radius: number): THREE.Path {
  const [x, y] = scaleHoleCoord(cx, cy);
  const hole = new THREE.Path();
  hole.absarc(x, y, scaleHoleSize(radius), 0, Math.PI * 2, true);
  return hole;
}

function buildProgrammingHoles(): THREE.Path[] {
  return [
    circleHole(-0.9, -0.8, 0.55),
    circleHole(0.9, 0.3, 0.55),
  ];
}

export function programmingTrianglePath(
  cx = PROGRAMMING_TRIANGLE.cx,
  cy = PROGRAMMING_TRIANGLE.cy,
  size = PROGRAMMING_TRIANGLE.size,
): THREE.Path {
  const [x, y] = scaleHoleCoord(cx, cy);
  const scaled = scaleHoleSize(size);
  const height = (scaled * Math.sqrt(3)) / 2;
  const hole = new THREE.Path();
  hole.moveTo(x, y + height / 2);
  hole.lineTo(x - scaled / 2, y - height / 2);
  hole.lineTo(x + scaled / 2, y - height / 2);
  hole.closePath();
  return hole;
}

function createTriangleShape(
  cx = PROGRAMMING_TRIANGLE.cx,
  cy = PROGRAMMING_TRIANGLE.cy,
  size = PROGRAMMING_TRIANGLE.size,
): THREE.Shape {
  const [x, y] = scaleHoleCoord(cx, cy);
  const scaled = scaleHoleSize(size);
  const height = (scaled * Math.sqrt(3)) / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x, y + height / 2);
  shape.lineTo(x - scaled / 2, y - height / 2);
  shape.lineTo(x + scaled / 2, y - height / 2);
  shape.closePath();
  return shape;
}

function createReflectiveTriangle(): THREE.Mesh {
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
  private reflectiveTriangle: THREE.Mesh;

  constructor() {
    super(0x2a2a3e, 2, 'Programming', buildProgrammingHoles);

    this.reflectiveTriangle = createReflectiveTriangle();
    this.mesh.add(this.reflectiveTriangle);
  }

  rebuildGeometry() {
    super.rebuildGeometry();
    this.mesh.remove(this.reflectiveTriangle);
    this.reflectiveTriangle.geometry.dispose();
    (this.reflectiveTriangle.material as THREE.Material).dispose();
    this.reflectiveTriangle = createReflectiveTriangle();
    this.mesh.add(this.reflectiveTriangle);
  }
}
