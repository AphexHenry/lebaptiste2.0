import * as THREE from 'three';

const ENABLE_AXIS_DEBUG = false;
const ENABLE_LIGHT_DEBUG = false;

const AXIS_LENGTH = 2;
const AXIS_ORIGIN = new THREE.Vector3(-2.5, 0, 0);

export type DebugTools = {
  group: THREE.Group;
};

export type LightDebugTools = {
  syncPosition: (position: THREE.Vector3) => void;
  update: () => void;
};

function createAxisArrow(direction: THREE.Vector3, color: number): THREE.ArrowHelper {
  return new THREE.ArrowHelper(direction, AXIS_ORIGIN, AXIS_LENGTH, color);
}

export function createDebugTools(): DebugTools {
  const group = new THREE.Group();

  group.add(createAxisArrow(new THREE.Vector3(1, 0, 0), 0xff0000));
  group.add(createAxisArrow(new THREE.Vector3(0, 1, 0), 0x00ff00));
  group.add(createAxisArrow(new THREE.Vector3(0, 0, 1), 0x0000ff));

  return { group };
}

export function addDebugTools(scene: THREE.Scene): DebugTools {
  const tools = createDebugTools();
  if (ENABLE_AXIS_DEBUG) {
    scene.add(tools.group);
  }
  return tools;
}

export function addLightDebugTools(scene: THREE.Scene, light: THREE.DirectionalLight): LightDebugTools {
  if (!ENABLE_LIGHT_DEBUG) {
    return {
      syncPosition: () => {},
      update: () => {},
    };
  }

  const lightMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffdd44 }),
  );
  lightMarker.position.copy(light.position);
  scene.add(lightMarker);

  const lightHelper = new THREE.DirectionalLightHelper(light, 0.8, 0xffdd44);
  scene.add(lightHelper);

  const shadowHelper = new THREE.CameraHelper(light.shadow.camera);
  scene.add(shadowHelper);

  return {
    syncPosition: (position) => {
      lightMarker.position.copy(position);
    },
    update: () => {
      lightHelper.update();
      shadowHelper.update();
    },
  };
}
