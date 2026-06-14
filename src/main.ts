import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Book, BOOK_FRONT_NORMAL, BOOK_CAMERA_DISTANCE, perspectiveFovForPageBounds } from './book/Book';
import { addDebugTools, addLightDebugTools } from './debugTools';

function bootstrap() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) throw new Error('Canvas element not found');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  addDebugTools(scene);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  // const pmrem = new THREE.PMREMGenerator(renderer);
  // scene.environment = pmrem.fromScene(new RoomEnvironment()).texture;
  // pmrem.dispose();

  const book = new Book();

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  const ambient = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambient);

  const light = new THREE.DirectionalLight(0xfff5e0, 2);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.bias = -0.0005;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 20;
  light.shadow.camera.left = -5;
  light.shadow.camera.right = 5;
  light.shadow.camera.top = 5;
  light.shadow.camera.bottom = -5;
  scene.add(light);
  scene.add(light.target);

  const lightDebug = addLightDebugTools(scene, light);

  book.addToScene(scene);
  const focus = book.getWorldFocusPoint();
  controls.target.copy(focus);
  camera.position.copy(focus).addScaledVector(BOOK_FRONT_NORMAL, BOOK_CAMERA_DISTANCE);
  controls.update();

  // On +Z side, shining toward the cover front.
  light.position.copy(focus).addScaledVector(BOOK_FRONT_NORMAL, 5);
  light.position.y = focus.y + 0.3;
  light.target.position.copy(focus);
  lightDebug.syncPosition(light.position);

  const clock = new THREE.Clock();
  let pointerDown = { x: 0, y: 0 };

  canvas.addEventListener('pointerdown', (event) => {
    pointerDown = { x: event.clientX, y: event.clientY };
  });

  canvas.addEventListener('pointerup', (event) => {
    const dx = event.clientX - pointerDown.x;
    const dy = event.clientY - pointerDown.y;
    if (dx * dx + dy * dy < 25) {
      book.onPointerClick(event, camera, canvas);
    }
  });

  function updateCameraFrustum() {
    const aspect = window.innerWidth / window.innerHeight;
    book.setViewportAspect(aspect);
    camera.aspect = aspect;
    camera.fov = perspectiveFovForPageBounds();
    camera.updateProjectionMatrix();
  }

  function onResize() {
    updateCameraFrustum();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateCameraFrustum();
  window.addEventListener('resize', onResize);

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    book.update(delta);
    controls.update();
    lightDebug.update();
    renderer.render(scene, camera);
  }

  animate();
}

bootstrap();
