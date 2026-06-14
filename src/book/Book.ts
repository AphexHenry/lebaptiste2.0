import {
  Clock,
  Group,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { pages, getPageIndex } from '../config/pages';
import { PAGE_ASPECT, PAGE_STACK_OFFSET } from '../types/book';
import { createPageTexture } from '../textures/PageTextureFactory';
import { BookPage } from './BookPage';
import { PageTurnMotor } from './PageTurnMotor';
import { HoleInteraction } from './HoleInteraction';

const PAGE_HEIGHT = 2.8;
const PAGE_WIDTH = PAGE_HEIGHT * PAGE_ASPECT;
const PAGE_CENTER_X = PAGE_WIDTH / 2;

export class Book {
  private readonly canvas: HTMLCanvasElement;
  private readonly scene = new Scene();
  private readonly bookGroup = new Group();
  private readonly camera: PerspectiveCamera;
  private readonly renderer: WebGLRenderer;
  private readonly clock = new Clock();
  private readonly motor: PageTurnMotor;
  private readonly holeInteraction: HoleInteraction;
  private readonly bookPages: BookPage[] = [];

  private currentTargetIndex = 0;
  private rafId = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.motor = new PageTurnMotor(reducedMotion);

    const coverHoles = pages[0].holes ?? [];
    this.holeInteraction = new HoleInteraction(coverHoles, (targetPageId) => {
      void this.navigateTo(targetPageId);
    });

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera = new PerspectiveCamera(42, 1, 0.1, 100);
    this.scene.add(this.bookGroup);

    this.buildPages();
    this.fitCamera();
    this.holeInteraction.setCoverMesh(this.bookPages[0].mesh);
    this.holeInteraction.attach(canvas, this.camera);

    window.addEventListener('resize', this.onResize);
    this.onResize();
  }

  private buildPages(): void {
    const coverHoles = pages[0].holes ?? [];
    const stackDepth = pages.length - 1;

    pages.forEach((config, index) => {
      const texture = createPageTexture(config, index, coverHoles);
      const page = new BookPage(config, index, texture, PAGE_WIDTH, PAGE_HEIGHT);
      const stackLayer = stackDepth - index;
      page.setBaseZ(stackLayer * PAGE_STACK_OFFSET);
      page.setRenderOrder(stackLayer);
      this.bookGroup.add(page.group);
      this.bookPages.push(page);
    });
  }

  private fitCamera(): void {
    const aspect = this.camera.aspect;
    const vFov = (this.camera.fov * Math.PI) / 180;
    const distForHeight = (PAGE_HEIGHT / 2) / Math.tan(vFov / 2);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const distForWidth = (PAGE_WIDTH / 2) / Math.tan(hFov / 2);
    // Closer camera = cover fit (page fills viewport, edges may crop)
    const distance = Math.min(distForHeight, distForWidth);

    this.camera.position.set(PAGE_CENTER_X, 0, distance);
    this.camera.lookAt(PAGE_CENTER_X, 0, 0);
  }

  async navigateTo(pageId: string): Promise<void> {
    if (this.motor.isAnimating) return;

    const targetIndex = getPageIndex(pageId);
    if (targetIndex <= this.currentTargetIndex) return;

    this.holeInteraction.setEnabled(false);
    await this.motor.turnToIndex(this.bookPages, targetIndex);
    this.currentTargetIndex = targetIndex;
    this.holeInteraction.setEnabled(this.currentTargetIndex === 0);
  }

  private onResize = (): void => {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.fitCamera();
    this.renderer.setSize(width, height, false);
  };

  private tick = (): void => {
    this.rafId = requestAnimationFrame(this.tick);
    const delta = this.clock.getDelta();
    this.motor.update(delta);
    this.renderer.render(this.scene, this.camera);
  };

  start(): void {
    this.tick();
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.onResize);
    this.bookPages.forEach((page) => page.dispose());
    this.renderer.dispose();
  }
}
