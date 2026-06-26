import * as THREE from 'three';
import { Page, createTexturedFrontFace } from './page';
import backgroundUrl from '../../assets/backgroundBlueAquarel.jpg';

export class PageArt extends Page {
  private backgroundTexture: THREE.Texture | null = null;
  private texturedFace: THREE.Mesh | null = null;

  constructor() {
    super(0xa88b5e, 'Art');

    new THREE.TextureLoader().load(
      backgroundUrl,
      (texture) => {
        this.backgroundTexture = texture;
        this.rebuildDecorations();
      },
      undefined,
      (error) => {
        console.error('Failed to load Art page background:', error);
      },
    );
  }

  protected rebuildDecorations() {
    if (this.texturedFace) {
      this.mesh.remove(this.texturedFace);
      this.texturedFace.geometry.dispose();
      const material = this.texturedFace.material as THREE.MeshBasicMaterial;
      material.map = null;
      material.dispose();
      this.texturedFace = null;
    }
    if (!this.backgroundTexture) return;

    this.texturedFace = createTexturedFrontFace(this.backgroundTexture, this.holes);
    this.mesh.add(this.texturedFace);
  }
}
