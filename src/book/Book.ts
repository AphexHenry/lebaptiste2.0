import * as THREE from 'three';
import {
  Page,
  THICKNESS,
  FRONT_FACE_Z,
  getPageHeight,
  PAGE_REFERENCE,
  setPageViewportAspect,
  scaleHoleCoord,
} from './page';
import { PageNode, Portal, createBookTree } from './bookTree';
import { mergeHoleGeometry } from './holes';
import { onFontReady } from './font';

/** Duration of the pull-toward-camera reveal (seconds). */
export let PageTurnDuration = 1.5;

/** @deprecated Kept for compatibility; reveal moves all pages as one block. */
export let TotalPageTurnDuration = 1.5;

/** World-space direction toward the reader (camera on +Z, pages face +Z). */
export const BOOK_FRONT_NORMAL = new THREE.Vector3(0, 0, 1);

/** Default camera offset along {@link BOOK_FRONT_NORMAL} from the book focus point. */
export const BOOK_CAMERA_DISTANCE = PAGE_REFERENCE * 1.5;

/** Vertical FOV (degrees) so page bounds fill the view at {@link BOOK_CAMERA_DISTANCE}. */
export function perspectiveFovForPageBounds(): number {
  const halfHeight = getPageHeight() / 2;
  return THREE.MathUtils.radToDeg(2 * Math.atan(halfHeight / BOOK_CAMERA_DISTANCE));
}

type PullReveal = {
  group: THREE.Group;
  pages: Page[];
  elapsed: number;
  endPosition: THREE.Vector3;
  finished: boolean;
};

/**
 * Renders a book as a linear page stack while navigation is driven by a tree
 * (see {@link bookTree}).
 *
 * ## The see-through trick
 *
 * The front page declares portal holes leading to its children. For the stack
 * to be see-through, every page physically in front of a target must repeat the
 * target's hole. With children ordered `[A, B, C]` behind the cover, the stack
 * becomes:
 *
 * ```
 * Cover { A, B, C }   A { B, C }   B { C }   C { }
 * ```
 *
 * i.e. each child renders the portal holes of every child stacked behind it.
 *
 * ## Opening a page
 *
 * Clicking the hole that reveals page A moves A to the back of the order and
 * recomputes holes. The render is unchanged, but A is now whole:
 *
 * ```
 * Cover { A, B, C }   B { C, A }   C { A }   A { }
 * ```
 *
 * Pulling every page in front of A toward the camera then reveals it as a clean
 * page. A becomes the new root and the same logic applies to its own portals.
 */
export class Book {
  readonly group = new THREE.Group();

  private readonly root: PageNode;
  private currentNode: PageNode;
  /** Current node's portals in physical stack order (front child first). */
  private orderedPortals: Portal[];
  /** Pages currently in the scene graph, used for animation and picking. */
  private mounted: Page[] = [];

  // private readonly frontIndicator: THREE.ArrowHelper;

  private activeReveal: PullReveal | null = null;
  private pendingChild: PageNode | null = null;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();

  constructor() {
    this.root = createBookTree();
    this.currentNode = this.root;
    this.orderedPortals = [...this.root.portals];

    // this.frontIndicator = new THREE.ArrowHelper(
    //   PAGE_FRONT_NORMAL.clone(),
    //   new THREE.Vector3(),
    //   1.2,
    //   0x3fd48d,
    // );
    // this.group.add(this.frontIndicator);

    for (const node of this.stackNodes()) {
      this.group.add(node.page.mesh);
    }
    this.mounted = this.stackNodes().map((node) => node.page);
    this.relayout();

    // Text holes only have geometry once the font loads; redo the layout then.
    onFontReady(() => this.relayout());
  }

  get centerZ(): number {
    return ((this.mounted.length - 1) * THICKNESS) / 2;
  }

  get isAnimating(): boolean {
    return this.activeReveal !== null;
  }

  getWorldFocusPoint(target = new THREE.Vector3()): THREE.Vector3 {
    return target.set(0, 0, this.centerZ).applyMatrix4(this.group.matrixWorld);
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.group);
  }

  setViewportAspect(aspect: number) {
    setPageViewportAspect(aspect);
    this.relayout();
  }

  onPointerClick(event: PointerEvent, camera: THREE.Camera, canvas: HTMLCanvasElement) {
    if (this.isAnimating) return;

    const rect = canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, camera);
    const hits = this.raycaster.intersectObjects(
      this.mounted.map((page) => page.mesh),
      false,
    );
    if (hits.length === 0) return;

    let hit: THREE.Object3D | null = hits[0].object;
    while (hit && !hit.userData.page) {
      hit = hit.parent;
    }
    const page = hit?.userData.page as Page | undefined;
    if (!page) return;

    // The first solid page the ray reaches is the page seen through the hole.
    const portalIndex = this.orderedPortals.findIndex((p) => p.child.page === page);
    if (portalIndex === -1) return;

    this.openPortal(portalIndex, camera);
  }

  update(delta: number) {
    for (const page of this.mounted) {
      page.update(delta);
    }
    if (this.activeReveal) {
      this.advanceReveal(delta);
    }
  }

  /** Stack from front (reader side) to back: current node, then ordered children. */
  private stackNodes(): PageNode[] {
    return [this.currentNode, ...this.orderedPortals.map((p) => p.child)];
  }

  /**
   * Recomputes the see-through holes and stack depth of every mounted page from
   * the current node and child ordering.
   */
  private relayout() {
    const front = mergeHoleGeometry(this.orderedPortals.map((p) => p.hole.build()));
    this.currentNode.page.setHoles(front.paths, front.counters);

    this.orderedPortals.forEach((portal, index) => {
      const behind = mergeHoleGeometry(
        this.orderedPortals.slice(index + 1).map((p) => p.hole.build()),
      );
      portal.child.page.setHoles(behind.paths, behind.counters);
    });

    const nodes = this.stackNodes();
    const frontZ = (nodes.length - 1) * THICKNESS;
    nodes.forEach((node, index) => node.page.setDepth(frontZ - index * THICKNESS));

    // this.frontIndicator.position.set(0, 0, frontZ + FRONT_FACE_Z);
  }

  /**
   * Sends the clicked portal's page to the back, rebuilds the equivalent render,
   * then pulls everything in front of it toward the camera before descending.
   */
  private openPortal(index: number, camera: THREE.Camera) {
    const target = this.orderedPortals[index];
    this.orderedPortals.splice(index, 1);
    this.orderedPortals.push(target);
    this.relayout();

    const stack = this.stackNodes();
    const pagesInFront = stack.slice(0, -1).map((node) => node.page);
    this.pendingChild = target.child;

    if (pagesInFront.length === 0) {
      this.descend();
      return;
    }

    const frontPage = pagesInFront[0];
    const [refCx, refCy] = target.hole.referenceCenter();
    const [holeX, holeY] = scaleHoleCoord(refCx, refCy);
    const holeOnPage = new THREE.Vector3(holeX, holeY, FRONT_FACE_Z);
    const holeInGroup = frontPage.mesh.position.clone().add(holeOnPage);

    const cameraInGroup = camera.position.clone();
    this.group.worldToLocal(cameraInGroup);
    const endPosition = cameraInGroup.sub(holeInGroup);

    const pullGroup = new THREE.Group();
    this.group.add(pullGroup);
    for (const page of pagesInFront) {
      pullGroup.attach(page.mesh);
    }

    this.activeReveal = {
      group: pullGroup,
      pages: pagesInFront,
      elapsed: 0,
      endPosition,
      finished: false,
    };
  }

  private advanceReveal(delta: number) {
    const reveal = this.activeReveal;
    if (!reveal || reveal.finished) return;

    reveal.elapsed += delta;
    const t = Math.min(reveal.elapsed / PageTurnDuration, 1);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    reveal.group.position.copy(reveal.endPosition).multiplyScalar(eased);

    if (t >= 1) {
      reveal.finished = true;
      this.cleanupReveal(reveal);
      this.activeReveal = null;
      this.descend();
    }
  }

  private cleanupReveal(reveal: PullReveal) {
    for (const page of reveal.pages) {
      reveal.group.remove(page.mesh);
      page.dispose();
    }
    this.group.remove(reveal.group);
    this.mounted = this.mounted.filter((page) => !reveal.pages.includes(page));
  }

  /** Makes the opened page the new root and mounts its children behind it. */
  private descend() {
    const child = this.pendingChild;
    this.pendingChild = null;
    if (!child) return;

    // The opened page survived the reveal; its former siblings are gone. Free any
    // of their descendants that were created but never mounted.
    for (let i = 0; i < this.orderedPortals.length - 1; i++) {
      disposeDescendants(this.orderedPortals[i].child);
    }

    this.currentNode = child;
    this.orderedPortals = [...child.portals];

    for (const portal of this.orderedPortals) {
      this.group.add(portal.child.page.mesh);
    }
    this.mounted = this.stackNodes().map((node) => node.page);
    this.relayout();
  }
}

/** Disposes every page below a node, leaving the node's own page untouched. */
function disposeDescendants(node: PageNode) {
  for (const portal of node.portals) {
    disposeDescendants(portal.child);
    portal.child.page.dispose();
  }
}
