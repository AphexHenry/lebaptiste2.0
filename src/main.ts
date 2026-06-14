import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Book, BOOK_FRONT_NORMAL } from './book/Book';

function bootstrap() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) throw new Error('Canvas element not found');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  const yAxisArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-2.5, 0, 0),
    2,
    0x00ff00,
  );
  scene.add(yAxisArrow);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const book = new Book();

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  const ambient = new THREE.AmbientLight(0xffffff, 0.15);
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

  book.addToScene(scene);
  const focus = book.getWorldFocusPoint();
  controls.target.copy(focus);
  camera.position.copy(focus).addScaledVector(BOOK_FRONT_NORMAL, 6);
  controls.update();

  // Near -Z axis, shining toward the cover front.
  light.position.set(0, 1.5, -5);
  light.target.position.copy(focus);
  lightMarker.position.copy(light.position);

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

  function onResize() {
    const { innerWidth, innerHeight } = window;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }

  window.addEventListener('resize', onResize);

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    book.update(delta);
    controls.update();
    lightHelper.update();
    shadowHelper.update();
    renderer.render(scene, camera);
  }

  animate();
}

bootstrap();
