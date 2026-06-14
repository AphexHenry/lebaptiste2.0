import * as THREE from 'three';
import { Page } from './page';

function triangleHole(cx: number, cy: number, size: number): THREE.Path {
  const height = (size * Math.sqrt(3)) / 2;
  const hole = new THREE.Path();
  hole.moveTo(cx, cy + height / 2);
  hole.lineTo(cx - size / 2, cy - height / 2);
  hole.lineTo(cx + size / 2, cy - height / 2);
  hole.closePath();
  return hole;
}

export class PageArt extends Page {
  constructor() {
    super(0xa88b5e, 1, 'Art', [triangleHole(0, 0, 1.4)]);
  }
}
