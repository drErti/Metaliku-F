/**
 * METALIKU-F — hero background: Construct.obj from upload.rar
 */
import { OBJLoader } from './vendor/OBJLoader.js';
import { MTLLoader } from './vendor/MTLLoader.js';

const MODEL_BASE = new URL('./models/upload/', import.meta.url);
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function loadLibs() {
  if (window.__metaliku3d) return window.__metaliku3d;
  return Promise.all([
    import('./vendor/three.module.js'),
    import('./vendor/OrbitControls.js'),
  ]).then(([THREE, OC]) => ({ THREE, OrbitControls: OC.OrbitControls }));
}

function fitObject(THREE, object, camera, controls, aspect, margin = 1.32) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);
  const size = box.setFromObject(object).getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fovRad = (camera.fov * Math.PI) / 180;
  const dist = (maxDim / (2 * Math.tan(fovRad / 2))) * margin;

  camera.position.set(dist * 0.92, dist * 0.38, dist * 1.05);
  camera.lookAt(0, size.y * 0.05, 0);
  controls.target.set(0, size.y * 0.05, 0);
  camera.near = 0.1;
  camera.far = dist * 12;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
}

async function initHeroModel(mount, THREE, OrbitControls) {
  const canvas = mount.querySelector('canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: window.innerWidth > 900,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, prefersReduced ? 1 : 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.autoRotate = !prefersReduced;
  controls.autoRotateSpeed = 0.35;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minPolarAngle = Math.PI * 0.12;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xfff8f2, 1.4);
  key.position.set(12, 18, 10);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9ab0c8, 0.45);
  fill.position.set(-8, 6, -6);
  scene.add(fill);

  const tex = await new THREE.TextureLoader().loadAsync(new URL('Material_Diffuse.jpg', MODEL_BASE).href);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mtl = await new MTLLoader().setPath(MODEL_BASE.href).loadAsync('Construct.mtl');
  mtl.preload();

  const obj = await new OBJLoader().setMaterials(mtl).setPath(MODEL_BASE.href).loadAsync('Construct.obj');

  obj.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
    child.material = new THREE.MeshStandardMaterial({
      map: tex,
      metalness: 0.2,
      roughness: 0.62,
    });
  });

  scene.add(obj);

  let raf = 0;
  let visible = true;
  let started = false;

  function resize() {
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    if (w < 1 || h < 1) return false;
    renderer.setSize(w, h, false);
    fitObject(THREE, obj, camera, controls, w / h, 1.28);
    return true;
  }

  function render() {
    if (!visible) return;
    controls.update();
    renderer.render(scene, camera);
  }

  function loop() {
    render();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (!resize()) return;
    if (!started) {
      started = true;
      mount.classList.add('is-ready');
      if (!prefersReduced) loop();
    }
    render();
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => start()).observe(mount);
  }
  start();
  requestAnimationFrame(() => requestAnimationFrame(start));

  window.addEventListener('resize', () => start(), { passive: true });

  const visIo = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible && started && !prefersReduced && !raf) loop();
      if (!visible && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    { threshold: 0.02 },
  );
  visIo.observe(mount);
}

async function main() {
  const mount = document.querySelector('[data-hero-model]');
  if (!mount) return;
  try {
    const { THREE, OrbitControls } = await loadLibs();
    await initHeroModel(mount, THREE, OrbitControls);
  } catch (err) {
    console.error('Hero model failed:', err);
    mount.classList.add('is-error');
  }
}

main();
