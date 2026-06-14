import * as THREE from 'three';
import { Page } from './page';

function squareHole(cx: number, cy: number, size: number): THREE.Path {
  const half = size / 2;
  const hole = new THREE.Path();
  hole.moveTo(cx - half, cy - half);
  hole.lineTo(cx - half, cy + half);
  hole.lineTo(cx + half, cy + half);
  hole.lineTo(cx + half, cy - half);
  hole.closePath();
  return hole;
}

export class PageAboutMe extends Page {
  constructor() {
    super(0xd4b896, 1, [squareHole(0, 0, 1.2)]);
  }
}
