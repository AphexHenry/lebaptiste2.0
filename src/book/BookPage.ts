import {
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  type Texture,
} from 'three';
import type { PageConfig } from '../types/book';
import { TURN_ANGLE } from '../types/book';

export class BookPage {
  readonly group: Group;
  readonly mesh: Mesh;
  readonly config: PageConfig;
  readonly index: number;

  private turned = false;

  constructor(
    config: PageConfig,
    index: number,
    texture: Texture,
    pageWidth: number,
    pageHeight: number,
  ) {
    this.config = config;
    this.index = index;

    this.group = new Group();

    const geometry = new PlaneGeometry(pageWidth, pageHeight);
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 1,
    });

    this.mesh = new Mesh(geometry, material);
    this.mesh.position.x = pageWidth / 2;
    this.group.add(this.mesh);
  }

  get isTurned(): boolean {
    return this.turned;
  }

  get currentAngle(): number {
    return this.group.rotation.y;
  }

  setAngle(angle: number): void {
    this.group.rotation.y = angle;
    this.turned = angle <= TURN_ANGLE + 0.01;
  }

  markTurned(turned: boolean): void {
    this.turned = turned;
  }

  setTurnLift(z: number): void {
    this.group.position.z = z;
  }

  get baseZ(): number {
    return this.group.userData.baseZ as number;
  }

  setBaseZ(z: number): void {
    this.group.userData.baseZ = z;
    this.group.position.z = z;
  }

  setRenderOrder(order: number): void {
    this.mesh.renderOrder = order;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    const material = this.mesh.material as MeshBasicMaterial;
    material.map?.dispose();
    material.dispose();
  }
}
