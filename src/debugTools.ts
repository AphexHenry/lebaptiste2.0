import * as THREE from 'three';

const AXIS_LENGTH = 2;
const AXIS_ORIGIN = new THREE.Vector3(-2.5, 0, 0);

export type DebugTools = {
  group: THREE.Group;
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
  scene.add(tools.group);
  return tools;
}
