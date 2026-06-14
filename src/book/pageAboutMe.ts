import * as THREE from 'three';
import { Page, scaleHoleCoord, scaleHoleSize } from './page';

function squareHole(cx: number, cy: number, size: number): THREE.Path {
  const [x, y] = scaleHoleCoord(cx, cy);
  const half = scaleHoleSize(size) / 2;
  const hole = new THREE.Path();
  hole.moveTo(x - half, y - half);
  hole.lineTo(x - half, y + half);
  hole.lineTo(x + half, y + half);
  hole.lineTo(x + half, y - half);
  hole.closePath();
  return hole;
}

export class PageAboutMe extends Page {
  constructor() {
    super(0xd4b896, 0, 'About Me', () => [squareHole(0, 0, 1.2)]);
  }
}
