import * as THREE from 'three';
import { scaleHoleCoord, scaleHoleSize } from './page';

/**
 * A deferred hole shape. It is re-evaluated every time the page geometry is
 * (re)built so that the hole tracks the current viewport-dependent page scale.
 *
 * The same factory instance is reused for every page that has to render a given
 * portal, which guarantees the holes line up perfectly and you can see straight
 * through the stack.
 */
export type HoleFactory = () => THREE.Path;

export function circleHole(cx: number, cy: number, radius: number): HoleFactory {
  return () => {
    const [x, y] = scaleHoleCoord(cx, cy);
    const path = new THREE.Path();
    path.absarc(x, y, scaleHoleSize(radius), 0, Math.PI * 2, true);
    return path;
  };
}

/** Equilateral triangle, apex pointing up. */
export function triangleHole(cx: number, cy: number, size: number): HoleFactory {
  return () => {
    const [x, y] = scaleHoleCoord(cx, cy);
    const scaled = scaleHoleSize(size);
    const height = (scaled * Math.sqrt(3)) / 2;
    const path = new THREE.Path();
    path.moveTo(x, y + height / 2);
    path.lineTo(x - scaled / 2, y - height / 2);
    path.lineTo(x + scaled / 2, y - height / 2);
    path.closePath();
    return path;
  };
}

export function squareHole(cx: number, cy: number, size: number): HoleFactory {
  return () => {
    const [x, y] = scaleHoleCoord(cx, cy);
    const half = scaleHoleSize(size) / 2;
    const path = new THREE.Path();
    path.moveTo(x - half, y - half);
    path.lineTo(x - half, y + half);
    path.lineTo(x + half, y + half);
    path.lineTo(x + half, y - half);
    path.closePath();
    return path;
  };
}
