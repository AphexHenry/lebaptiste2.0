import * as THREE from 'three';
import { Page, THICKNESS } from './page';
import { PageCover } from './pageCover';
import { PageAboutMe } from './pageAboutMe';
import { PageArt } from './pageArt';

export class Book {
  readonly group = new THREE.Group();
  readonly cover: PageCover;
  readonly aboutMe: PageAboutMe;
  readonly art: PageArt;
  readonly pages: Page[];

  constructor() {
    this.cover = new PageCover();
    this.aboutMe = new PageAboutMe();
    this.art = new PageArt();
    this.pages = [this.cover, this.aboutMe, this.art];

    for (const page of this.pages) {
      this.group.add(page.mesh);
    }
  }

  get centerY(): number {
    return ((this.pages.length - 1) * THICKNESS) / 2;
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.group);
  }
}
