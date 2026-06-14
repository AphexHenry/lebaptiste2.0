import { Raycaster, Vector2, type Camera, type Mesh } from 'three';
import type { HoleConfig } from '../types/book';

export class HoleInteraction {
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly holes: HoleConfig[];
  private readonly onHoleClick: (targetPageId: string) => void;
  private coverMesh: Mesh | null = null;
  private enabled = true;

  constructor(holes: HoleConfig[], onHoleClick: (targetPageId: string) => void) {
    this.holes = holes;
    this.onHoleClick = onHoleClick;
  }

  setCoverMesh(mesh: Mesh): void {
    this.coverMesh = mesh;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  attach(canvas: HTMLCanvasElement, camera: Camera): void {
    canvas.addEventListener('pointermove', (e) => this.onPointerMove(e, canvas, camera));
    canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e, canvas, camera));
  }

  private updatePointer(event: PointerEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private findHoleAtUV(u: number, v: number): HoleConfig | null {
    for (const hole of this.holes) {
      const dx = u - hole.x;
      const dy = v - hole.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= hole.radius) {
        return hole;
      }
    }
    return null;
  }

  private raycastHole(
    event: PointerEvent,
    canvas: HTMLCanvasElement,
    camera: Camera,
  ): HoleConfig | null {
    if (!this.coverMesh || !this.enabled) return null;

    this.updatePointer(event, canvas);
    this.raycaster.setFromCamera(this.pointer, camera);
    const hits = this.raycaster.intersectObject(this.coverMesh, false);
    if (hits.length === 0) return null;

    const uv = hits[0].uv;
    if (!uv) return null;

    return this.findHoleAtUV(uv.x, uv.y);
  }

  private onPointerMove(
    event: PointerEvent,
    canvas: HTMLCanvasElement,
    camera: Camera,
  ): void {
    const hole = this.raycastHole(event, canvas, camera);
    canvas.style.cursor = hole ? 'pointer' : 'default';
  }

  private onPointerDown(
    event: PointerEvent,
    canvas: HTMLCanvasElement,
    camera: Camera,
  ): void {
    const hole = this.raycastHole(event, canvas, camera);
    if (hole) {
      this.onHoleClick(hole.targetPageId);
    }
  }
}
