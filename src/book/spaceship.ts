import * as THREE from 'three';
import spaceshipUrl from '../../assets/spaceship.png';
import spaceshipThrustUrl from '../../assets/spaceshipThrust.png';

export const SPACESHIP_PARAMS = {
  /** Page-local size of the rocket body, measured from nose to tail. */
  bodyHeight: 0.42,
  /** Page-local size of the animated flame, measured from top to tip. */
  flameHeight: 0.34,
  /** Acceleration while ArrowUp is held, in page units per second squared. */
  thrustAcceleration: 2.1,
  /** Rotation speed while ArrowLeft/ArrowRight is held, in radians per second. */
  rotationSpeed: Math.PI * 1.0,
  /** Velocity multiplier per 60fps frame. Lower values feel draggier. */
  linearDamping: 0.992,
  /** Velocity cap, in page units per second. */
  maxSpeed: 2.2,
  /** How far beyond the page edge the ship travels before wrapping around. */
  wrapPadding: 0.25,
  /** Starting page-local position. */
  initialPosition: new THREE.Vector2(0, -0.9),
  /** Starting page-local rotation. 0 points toward +Y, matching the rocket art. */
  initialRotation: 0,
  /** Flame pulse frequency while thrusting, in cycles per second. */
  flamePulseSpeed: 8,
  /** Flame opacity range while thrusting. */
  flameOpacity: { min: 0.65, max: 1 },
  /** Flame scale range while thrusting. */
  flameScale: { min: 0.72, max: 1.18 },
} as const;

const DEFAULT_BODY_ASPECT = 544 / 1000;
const DEFAULT_FLAME_ASPECT = 387 / 816;

type Controls = {
  left: boolean;
  right: boolean;
  thrust: boolean;
};

const controls: Controls = {
  left: false,
  right: false,
  thrust: false,
};

let controlsReady = false;

function ensureKeyboardControls() {
  if (controlsReady) return;
  controlsReady = true;

  const updateKey = (event: KeyboardEvent, isDown: boolean) => {
    if (event.key === 'ArrowLeft') {
      controls.left = isDown;
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      controls.right = isDown;
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      controls.thrust = isDown;
      event.preventDefault();
    }
  };

  window.addEventListener('keydown', (event) => updateKey(event, true));
  window.addEventListener('keyup', (event) => updateKey(event, false));
}

function createTexturedPlane(url: string, width: number, height: number) {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    toneMapped: false,
    depthTest: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(width, height, 1);

  new THREE.TextureLoader().load(
    url,
    (texture) => {
      (texture as unknown as { colorSpace: string }).colorSpace = 'srgb';
      const image = texture.image as HTMLImageElement | HTMLCanvasElement | undefined;
      const aspect = image && image.height > 0 ? image.width / image.height : width / height;
      mesh.scale.x = height * aspect;
      material.map = texture;
      material.needsUpdate = true;
    },
    undefined,
    (error) => {
      console.error(`Failed to load spaceship texture ${url}:`, error);
    },
  );

  return mesh;
}

export class Spaceship {
  readonly group = new THREE.Group();

  private readonly body: THREE.Mesh;
  private readonly flame: THREE.Mesh;
  private readonly velocity = new THREE.Vector2();
  private readonly bounds = new THREE.Vector2(4, 4);
  private flameTime = 0;

  constructor(z: number) {
    ensureKeyboardControls();

    this.body = createTexturedPlane(
      spaceshipUrl,
      SPACESHIP_PARAMS.bodyHeight * DEFAULT_BODY_ASPECT,
      SPACESHIP_PARAMS.bodyHeight,
    );
    this.body.renderOrder = 3;

    this.flame = createTexturedPlane(
      spaceshipThrustUrl,
      SPACESHIP_PARAMS.flameHeight * DEFAULT_FLAME_ASPECT,
      SPACESHIP_PARAMS.flameHeight,
    );
    this.flame.position.y = -SPACESHIP_PARAMS.bodyHeight * 0.52;
    this.flame.visible = false;
    this.flame.renderOrder = 2;

    this.group.name = 'pageSpaceship';
    this.group.position.set(
      SPACESHIP_PARAMS.initialPosition.x,
      SPACESHIP_PARAMS.initialPosition.y,
      z,
    );
    this.group.rotation.z = SPACESHIP_PARAMS.initialRotation;
    this.group.add(this.flame, this.body);
  }

  setBounds(width: number, height: number) {
    this.bounds.set(width, height);
    this.wrapPosition();
  }

  update(delta: number) {
    const rotationInput = Number(controls.left) - Number(controls.right);
    this.group.rotation.z += rotationInput * SPACESHIP_PARAMS.rotationSpeed * delta;

    if (controls.thrust) {
      const direction = new THREE.Vector2(0, 1).rotateAround(
        new THREE.Vector2(),
        this.group.rotation.z,
      );
      this.velocity.addScaledVector(direction, SPACESHIP_PARAMS.thrustAcceleration * delta);
    }

    const speed = this.velocity.length();
    if (speed > SPACESHIP_PARAMS.maxSpeed) {
      this.velocity.multiplyScalar(SPACESHIP_PARAMS.maxSpeed / speed);
    }

    this.velocity.multiplyScalar(Math.pow(SPACESHIP_PARAMS.linearDamping, delta * 60));
    this.group.position.x += this.velocity.x * delta;
    this.group.position.y += this.velocity.y * delta;
    this.wrapPosition();
    this.updateFlame(delta);
  }

  private updateFlame(delta: number) {
    this.flame.visible = controls.thrust;
    if (!controls.thrust) return;

    this.flameTime += delta * SPACESHIP_PARAMS.flamePulseSpeed;
    const pulse = (Math.sin(this.flameTime * Math.PI * 2) + 1) / 2;
    const opacity = THREE.MathUtils.lerp(
      SPACESHIP_PARAMS.flameOpacity.min,
      SPACESHIP_PARAMS.flameOpacity.max,
      pulse,
    );
    const scale = THREE.MathUtils.lerp(
      SPACESHIP_PARAMS.flameScale.min,
      SPACESHIP_PARAMS.flameScale.max,
      pulse,
    );

    const material = this.flame.material as THREE.MeshBasicMaterial;
    material.opacity = opacity;
    this.flame.scale.y = SPACESHIP_PARAMS.flameHeight * scale;
  }

  private wrapPosition() {
    const halfW = this.bounds.x / 2 + SPACESHIP_PARAMS.wrapPadding;
    const halfH = this.bounds.y / 2 + SPACESHIP_PARAMS.wrapPadding;

    if (this.group.position.x > halfW) this.group.position.x = -halfW;
    if (this.group.position.x < -halfW) this.group.position.x = halfW;
    if (this.group.position.y > halfH) this.group.position.y = -halfH;
    if (this.group.position.y < -halfH) this.group.position.y = halfH;
  }
}
