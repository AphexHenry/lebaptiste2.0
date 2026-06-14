import * as THREE from 'three';
import {
  Page,
  THICKNESS,
  PAGE_FRONT_NORMAL,
  FRONT_FACE_Z,
  getLeftHingeX,
  getPageHeight,
  PAGE_REFERENCE,
  setPageViewportAspect,
} from './page';
import { PageCover } from './pageCover';
import { PageAboutMe } from './pageAboutMe';
import { PageArt } from './pageArt';

const FLIP_DURATION = 1.8;

/** World-space direction toward the reader (camera on +Z, pages face +Z). */
export const BOOK_FRONT_NORMAL = new THREE.Vector3(0, 0, 1);

/** Default camera offset along {@link BOOK_FRONT_NORMAL} from the book focus point. */
export const BOOK_CAMERA_DISTANCE = PAGE_REFERENCE * 1.5;

/** Orthographic frustum height for the current page dimensions. */
export function orthographicFrustumHeight(): number {
  return getPageHeight();
}

type FlipAnimation = {
  pivot: THREE.Group;
  progress: number;
  pagesToRemove: Page[];
};

export class Book {
  readonly group = new THREE.Group();
  readonly cover: PageCover;
  readonly aboutMe: PageAboutMe;
  readonly art: PageArt;
  readonly pages: Page[];

  private flipAnimation: FlipAnimation | null = null;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();

  constructor() {
    this.cover = new PageCover();
    this.aboutMe = new PageAboutMe();
    this.art = new PageArt();
    this.pages = [this.aboutMe, this.art, this.cover];

    for (const page of this.pages) {
      this.group.add(page.mesh);
    }

    const coverFrontCenter = new THREE.Vector3(
      0,
      0,
      this.cover.stackIndex * THICKNESS + FRONT_FACE_Z,
    );
    const frontIndicator = new THREE.ArrowHelper(
      PAGE_FRONT_NORMAL.clone(),
      coverFrontCenter,
      1.2,
      0x3fd48d,
    );
    this.group.add(frontIndicator);
  }

  get centerZ(): number {
    return ((this.pages.length - 1) * THICKNESS) / 2;
  }

  get isAnimating(): boolean {
    return this.flipAnimation !== null;
  }

  getWorldFocusPoint(target = new THREE.Vector3()): THREE.Vector3 {
    return target.set(0, 0, this.centerZ).applyMatrix4(this.group.matrixWorld);
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.group);
  }

  setViewportAspect(aspect: number) {
    setPageViewportAspect(aspect);
    for (const page of this.pages) {
      page.rebuildGeometry();
    }
  }

  onPointerClick(event: PointerEvent, camera: THREE.Camera, canvas: HTMLCanvasElement) {
    if (this.flipAnimation) return;

    const rect = canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, camera);
    const hits = this.raycaster.intersectObjects(
      this.pages.map((page) => page.mesh),
      false,
    );
    if (hits.length === 0) return;

    let hit: THREE.Object3D | null = hits[0].object;
    while (hit && !hit.userData.page) {
      hit = hit.parent;
    }
    if (!hit?.userData.page) return;

    const page = hit.userData.page as Page;
    const clickedIndex = this.pages.indexOf(page);
    if (clickedIndex === -1) return;

    this.flipPagesAbove(clickedIndex);
  }

  update(delta: number) {
    this.art.update(delta);

    if (!this.flipAnimation) return;

    this.flipAnimation.progress += delta / FLIP_DURATION;
    const t = Math.min(this.flipAnimation.progress, 1);
    const eased =
      t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    // Rotate around Y at the left hinge; page folds toward +Z.
    this.flipAnimation.pivot.rotation.y = -eased * Math.PI;

    if (t >= 1) {
      this.finishFlip();
    }
  }

  private flipPagesAbove(clickedIndex: number) {
    const pagesAbove = this.pages.slice(clickedIndex + 1);
    if (pagesAbove.length === 0) return;

    const pivotZ = (clickedIndex + 1) * THICKNESS;

    const pivot = new THREE.Group();
    pivot.position.set(getLeftHingeX(), 0, pivotZ);
    this.group.add(pivot);

    for (const page of pagesAbove) {
      this.group.remove(page.mesh);
      page.mesh.position.x -= getLeftHingeX();
      page.mesh.position.z -= pivotZ;
      pivot.add(page.mesh);
    }

    this.flipAnimation = { pivot, progress: 0, pagesToRemove: pagesAbove };
  }

  private finishFlip() {
    const { pivot, pagesToRemove } = this.flipAnimation!;

    for (const page of pagesToRemove) {
      pivot.remove(page.mesh);
      page.dispose();
      const index = this.pages.indexOf(page);
      if (index !== -1) {
        this.pages.splice(index, 1);
      }
    }

    this.group.remove(pivot);
    this.flipAnimation = null;
  }
}
