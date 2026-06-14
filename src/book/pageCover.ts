import * as THREE from 'three';
import { Page, scaleHoleCoord, scaleHoleSize } from './page';
import { programmingTrianglePath } from './pageProgramming';

function circleHole(cx: number, cy: number, radius: number): THREE.Path {
  const [x, y] = scaleHoleCoord(cx, cy);
  const hole = new THREE.Path();
  hole.absarc(x, y, scaleHoleSize(radius), 0, Math.PI * 2, true);
  return hole;
}

export class PageCover extends Page {
  constructor() {
    super(0xf5e6d3, 3, 'Cover', () => [
      circleHole(-0.9, -0.8, 0.55),
      circleHole(0.9, 0.3, 0.55),
      programmingTrianglePath(),
    ]);
  }
}
