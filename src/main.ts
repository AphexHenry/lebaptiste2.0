import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GAP, THICKNESS } from './book/page';
import { PageCover } from './book/pageCover';
import { PageAboutMe } from './book/pageAboutMe';
import { PageArt } from './book/pageArt';

function bootstrap() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) throw new Error('Canvas element not found');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(5, 4, 6);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.target.set(0, GAP + THICKNESS, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.15);
  scene.add(ambient);

  const light = new THREE.DirectionalLight(0xfff5e0, 2);
  light.position.set(4, 7, 3);
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

  for (const page of [new PageCover(), new PageAboutMe(), new PageArt()]) {
    page.addToScene(scene);
  }

  function onResize() {
    const { innerWidth, innerHeight } = window;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }

  window.addEventListener('resize', onResize);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    lightHelper.update();
    shadowHelper.update();
    renderer.render(scene, camera);
  }

  animate();
}

bootstrap();
