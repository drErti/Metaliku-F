/**
 * METALIKU-F — steel skeleton viewer (local Three.js)
 */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dprCap = prefersReduced ? 1 : 1.5;

function loadLibs() {
  if (window.__metaliku3d) return window.__metaliku3d;
  return Promise.all([
    import('./vendor/three.module.js'),
    import('./vendor/OrbitControls.js'),
  ]).then(([THREE, OC]) => ({ THREE, OrbitControls: OC.OrbitControls }));
}

function buildSteelFrame(THREE, scene) {
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xb4bac4,
    metalness: 0.92,
    roughness: 0.32,
  });
  const steelDark = steelMat.clone();
  steelDark.color.setHex(0x8e959f);
  steelDark.roughness = 0.4;

  const frame = new THREE.Group();
  scene.add(frame);

  function box(sx, sy, sz, mat) {
    return new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat || steelMat);
  }

  function add(mesh, x, y, z) {
    mesh.position.set(x, y, z);
    frame.add(mesh);
  }

  const W = 18;
  const D = 10;
  const H = 6.5;
  const col = 0.32;
  const bh = 0.26;
  const bw = 0.2;

  [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]].forEach(([x, z]) => {
    add(box(col, H, col, steelDark), x, H / 2, z);
  });

  add(box(W, bh, bw), 0, H, -D / 2);
  add(box(W, bh, bw), 0, H, D / 2);
  add(box(bw, bh, D), -W / 2, H, 0);
  add(box(bw, bh, D), W / 2, H, 0);
  add(box(W * 0.9, bh * 0.85, bw * 0.85), 0, H + 2.15, 0);

  const bays = 5;
  const bayW = W / bays;
  const pitch = 2.15;
  for (let i = 0; i <= bays; i++) {
    const x = -W / 2 + i * bayW;
    const len = Math.hypot(bayW / 2, pitch);
    const rafter = box(bw * 0.65, bh * 0.6, len);
    rafter.position.set(x, H + pitch / 2, -D / 2);
    rafter.rotation.x = -Math.atan2(pitch, bayW / 2);
    frame.add(rafter);
    const rafter2 = box(bw * 0.65, bh * 0.6, len);
    rafter2.position.set(x, H + pitch / 2, D / 2);
    rafter2.rotation.x = Math.atan2(pitch, bayW / 2);
    frame.add(rafter2);
  }

  for (let i = 1; i < 7; i++) {
    const z = -D / 2 + (i / 7) * D;
    add(box(W * 0.88, 0.1, 0.1, steelDark), 0, H + 2, z);
  }

  function brace(x, z, rotY) {
    const len = Math.hypot(W * 0.38, H * 0.82);
    const b = box(0.12, 0.12, len, steelDark);
    b.position.set(x, H * 0.42, z);
    b.rotation.y = rotY;
    b.rotation.z = Math.atan2(H * 0.82, W * 0.38);
    frame.add(b);
  }
  brace(-W / 2, 0, 0);
  brace(-W / 2, 0, Math.PI);
  brace(W / 2, 0, 0);
  brace(W / 2, 0, Math.PI);

  add(box(col * 0.7, H * 0.5, col * 0.7, steelDark), 0, H * 0.25, -D / 2);
  add(box(col * 0.7, H * 0.5, col * 0.7, steelDark), 0, H * 0.25, D / 2);

  const grid = new THREE.GridHelper(40, 40, 0x3a3a38, 0x252524);
  grid.position.y = 0.02;
  grid.material.opacity = 0.4;
  grid.material.transparent = true;
  scene.add(grid);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x1a1a18, metalness: 0.2, roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  return frame;
}

function initSteelSkeleton(mount, THREE, OrbitControls) {
  const canvas = mount.querySelector('canvas');
  if (!canvas) return null;

  const isHero = mount.classList.contains('steel-3d--hero');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: window.innerWidth > 600,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = isHero ? 1.15 : 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x131312, isHero ? 0.022 : 0.028);

  const camera = new THREE.PerspectiveCamera(isHero ? 38 : 42, 1, 0.1, 120);
  camera.position.set(isHero ? 12 : 14, isHero ? 8 : 9, isHero ? 14 : 16);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = isHero ? 6 : 8;
  controls.maxDistance = isHero ? 28 : 36;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 4.2, 0);
  controls.autoRotate = !prefersReduced;
  controls.autoRotateSpeed = isHero ? 0.5 : 0.35;

  scene.add(new THREE.AmbientLight(0x8a9098, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(12, 18, 10);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x6a7a9a, 0.5);
  fill.position.set(-10, 6, -8);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xddeeff, 0.35);
  rim.position.set(0, 4, -12);
  scene.add(rim);

  buildSteelFrame(THREE, scene);

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
    if (started) {
      resize();
      return;
    }
    if (!resize()) return;
    started = true;
    render();
    mount.classList.add('is-ready');
    if (!prefersReduced) loop();
  }

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => start());
    ro.observe(mount);
  }

  start();
  requestAnimationFrame(() => requestAnimationFrame(start));

  window.addEventListener('resize', () => resize(), { passive: true });

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

  let idleTimer;
  controls.addEventListener('end', () => {
    if (prefersReduced) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      controls.autoRotate = true;
    }, 4000);
  });

  return { start };
}

async function main() {
  const mounts = document.querySelectorAll('[data-steel-skeleton]');
  if (!mounts.length) return;

  try {
    const { THREE, OrbitControls } = await loadLibs();
    mounts.forEach((mount) => initSteelSkeleton(mount, THREE, OrbitControls));
  } catch (err) {
    mounts.forEach((mount) => {
      mount.classList.add('is-error');
    });
    console.error('Steel 3D failed:', err);
  }
}

main();
