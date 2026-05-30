/**
 * METALIKU-F — full-bleed hero: professional clear-span steel hall
 */
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dprCap = prefersReduced ? 1 : 2;

function loadLibs() {
  if (window.__metaliku3d) return window.__metaliku3d;
  return Promise.all([
    import('./vendor/three.module.js'),
    import('./vendor/OrbitControls.js'),
  ]).then(([THREE, OC]) => ({ THREE, OrbitControls: OC.OrbitControls }));
}

function steelMat(THREE, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: opts.color ?? 0xb5bcc6,
    metalness: 1,
    roughness: opts.rough ?? 0.18,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    reflectivity: 1,
    envMapIntensity: 1.35,
  });
}

/** Clear-span logistics hall — portal frames + purlins + bracing */
function buildHeroHall(THREE) {
  const root = new THREE.Group();
  const primary = steelMat(THREE, { color: 0xc2c9d4, rough: 0.16 });
  const secondary = steelMat(THREE, { color: 0x9aa3af, rough: 0.24 });
  const dark = steelMat(THREE, { color: 0x7a828c, rough: 0.28 });

  const box = (sx, sy, sz, mat) => new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  const add = (m, x, y, z) => {
    m.position.set(x, y, z);
    root.add(m);
  };

  const L = 42;
  const W = 22;
  const H = 8;
  const pitch = 3.2;
  const ridge = H + pitch;
  const frames = 6;
  const frameStep = L / (frames - 1);
  const col = 0.42;
  const beam = 0.34;

  for (let f = 0; f < frames; f++) {
    const z = -L / 2 + f * frameStep;
    [[-W / 2, -1], [W / 2, -1]].forEach(([x]) => {
      add(box(col, H, col, dark), x, H / 2, z);
    });
    add(box(W, beam, beam * 0.85, primary), 0, H, z);
    const raLen = Math.hypot(W / 2, pitch);
    const raL = box(beam * 0.75, beam * 0.65, raLen, primary);
    raL.position.set(-W / 4, H + pitch / 2, z);
    raL.rotation.x = -Math.atan2(pitch, W / 2);
    root.add(raL);
    const raR = box(beam * 0.75, beam * 0.65, raLen, primary);
    raR.position.set(W / 4, H + pitch / 2, z);
    raR.rotation.x = Math.atan2(pitch, W / 2);
    root.add(raR);
    if (f < frames - 1) {
      add(box(frameStep * 0.98, beam * 0.55, beam * 0.55, secondary), 0, H + 0.05, z + frameStep / 2);
      add(box(frameStep * 0.98, beam * 0.4, beam * 0.4, secondary), 0, ridge - 0.1, z + frameStep / 2);
    }
  }

  add(box(W * 0.96, beam * 0.7, beam * 0.7, primary), 0, ridge, 0);

  const purlinCount = 14;
  for (let i = 0; i <= purlinCount; i++) {
    const z = -L / 2 + (i / purlinCount) * L;
    const t = i / purlinCount;
    const y = H + pitch * (0.5 - Math.abs(t - 0.5));
    add(box(W * 0.94, 0.11, 0.11, secondary), 0, H + pitch * 0.92, z);
  }

  for (let f = 0; f < frames; f += 2) {
    const z = -L / 2 + f * frameStep;
    const brLen = Math.hypot(W * 0.4, H * 0.75);
    [-1, 1].forEach((side) => {
      const b = box(0.14, 0.14, brLen, dark);
      b.position.set(side * (W / 2), H * 0.38, z);
      b.rotation.z = side * Math.atan2(H * 0.75, W * 0.4);
      root.add(b);
    });
  }

  [[-L / 2, 0], [L / 2, 0]].forEach(([z]) => {
    add(box(col * 0.55, H * 0.55, col * 0.55, dark), 0, H * 0.28, z);
    add(box(W, beam * 0.5, beam * 0.5, secondary), 0, H * 0.15, z);
  });

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(L + 8, 0.35, W + 8),
    new THREE.MeshStandardMaterial({ color: 0x2a2a28, metalness: 0.15, roughness: 0.85 }),
  );
  slab.position.y = -0.18;
  root.add(slab);

  const pad = new THREE.Mesh(
    new THREE.PlaneGeometry(L + 20, W + 20),
    new THREE.MeshStandardMaterial({ color: 0x121211, metalness: 0.4, roughness: 0.65 }),
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.01;
  root.add(pad);

  return root;
}

function fitCamera(THREE, camera, controls, object, aspect, margin = 1.28) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fovRad = (camera.fov * Math.PI) / 180;
  let dist = (maxDim / (2 * Math.tan(fovRad / 2))) * margin;
  const elev = 0.32;
  camera.position.set(
    center.x + dist * 0.72,
    center.y + dist * elev,
    center.z + dist * 0.68,
  );
  camera.lookAt(center.x, center.y + size.y * 0.08, center.z);
  controls.target.set(center.x, center.y + size.y * 0.06, center.z);
  camera.near = 0.5;
  camera.far = dist * 8;
  camera.updateProjectionMatrix();
}

function initHero(mount, THREE, OrbitControls) {
  const canvas = mount.querySelector('canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.setClearColor(0x0c0c0b, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.shadowMap.enabled = false;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0c0b);
  scene.environment = envMap;
  scene.fog = new THREE.Fog(0x0c0c0b, 35, 95);

  const hall = buildHeroHall(THREE);
  scene.add(hall);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 200);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 18;
  controls.maxDistance = 55;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.autoRotate = !prefersReduced;
  controls.autoRotateSpeed = 0.28;

  scene.add(new THREE.AmbientLight(0x6a7585, 0.35));
  const sun = new THREE.DirectionalLight(0xfff8f0, 2.2);
  sun.position.set(18, 28, 14);
  scene.add(sun);
  const cool = new THREE.DirectionalLight(0x8eb4ff, 0.55);
  cool.position.set(-16, 12, -10);
  scene.add(cool);
  const rim = new THREE.DirectionalLight(0xffffff, 0.4);
  rim.position.set(0, 6, -22);
  scene.add(rim);

  let raf = 0;
  let visible = true;
  let started = false;

  function resize() {
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    if (w < 1 || h < 1) return false;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    fitCamera(THREE, camera, controls, hall, w / h, 1.08);
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

  canvas.addEventListener('pointerdown', () => {
    controls.autoRotate = false;
  });
  controls.addEventListener('end', () => {
    if (prefersReduced) return;
    clearTimeout(canvas._idle);
    canvas._idle = setTimeout(() => {
      controls.autoRotate = true;
    }, 5000);
  });
}

async function main() {
  const mount = document.querySelector('[data-hero-3d]');
  if (!mount) return;
  try {
    const { THREE, OrbitControls } = await loadLibs();
    initHero(mount, THREE, OrbitControls);
  } catch (err) {
    mount.classList.add('is-error');
    console.error('Hero 3D failed:', err);
  }
}

main();
