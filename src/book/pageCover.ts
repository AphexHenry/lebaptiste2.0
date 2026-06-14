import * as THREE from 'three';
import { Page } from './page';

function circleHole(cx: number, cy: number, radius: number): THREE.Path {
  const hole = new THREE.Path();
  hole.absarc(cx, cy, radius, 0, Math.PI * 2, true);
  return hole;
}

export class PageCover extends Page {
  constructor() {
    super(0xf5e6d3, 2, 'Cover', [
      circleHole(-0.9, 0, 0.55),
      circleHole(0.9, 0, 0.55),
    ]);
  }
}
