import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const TOTAL_FRAMES = 120;

const shell = document.getElementById('scrollframes-shell');
const canvas = document.getElementById('scrollframes-canvas');
const counterEl = document.getElementById('sf-frame-counter');
const scrubberFillEl = document.getElementById('sf-scrubber-fill');
const captions = Array.from(document.querySelectorAll('.sf-caption'));

if (shell && canvas) {
  initScrollframesLaptop();
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  const k = 1 - clamp(t, 0, 1);
  return 1 - k * k * k;
}

function easeInOutCubic(t) {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Generates a high-resolution 1280x800 CanvasTexture representing the live
 * Padaria Diniz Power BI dashboard inside the 3D laptop display.
 */
function createDashboardScreenCanvas() {
  const off = document.createElement('canvas');
  off.width = 1280;
  off.height = 800;
  const ctx = off.getContext('2d');
  if (!ctx) return off;

  // Obsidian background
  const bgGrad = ctx.createLinearGradient(0, 0, 1280, 800);
  bgGrad.addColorStop(0, '#07090f');
  bgGrad.addColorStop(0.6, '#0b0e17');
  bgGrad.addColorStop(1, '#101422');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1280, 800);

  // Subtle ambient orange bloom
  const glow = ctx.createRadialGradient(980, 160, 20, 980, 160, 460);
  glow.addColorStop(0, 'rgba(255, 90, 31, 0.16)');
  glow.addColorStop(1, 'rgba(255, 90, 31, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1280, 800);

  // Subtle technical grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1280; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 800);
    ctx.stroke();
  }
  for (let y = 0; y <= 800; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }

  // Top Header Bar
  ctx.fillStyle = 'rgba(17, 22, 34, 0.92)';
  ctx.fillRect(0, 0, 1280, 74);
  ctx.fillStyle = 'rgba(255, 90, 31, 0.45)';
  ctx.fillRect(0, 73, 1280, 1.5);

  // Status dot + title
  ctx.fillStyle = '#ff5a1f';
  ctx.beginPath();
  ctx.arc(46, 37, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f4f3ef';
  ctx.font = '700 22px "Space Grotesk", "Segoe UI", sans-serif';
  ctx.fillText('PADARIA DINIZ // INTELIGÊNCIA EXECUTIVA BI', 72, 44);

  ctx.fillStyle = '#8b93a3';
  ctx.font = '500 15px "JetBrains Mono", monospace';
  ctx.fillText('SYS.REPORT: UNISAL-2026  ·  VIEWS LGPD + AWS RDS', 760, 42);

  // KPI Cards Row (4 cards)
  const kpis = [
    { label: 'FATURAMENTO TOTAL', value: 'R$ 79.335,89', sub: '+18,4% vs mês anterior', accent: '#ff5a1f' },
    { label: 'MARGEM REAL LÍQUIDA', value: '43,62%', sub: '30+ medidas DAX auditadas', accent: '#38bdf8' },
    { label: 'SLA DE PREPARO', value: '28,03 min', sub: '-4,2 min abaixo da meta', accent: '#22c55e' },
    { label: 'CONVERSÃO PEÇA & RETIRE', value: '85,5%', sub: '160+ SKUs ativos na nuvem', accent: '#ff9f43' },
  ];

  const cardW = 282;
  const cardH = 148;
  const startX = 44;
  const gap = 21;
  const rowY = 104;

  kpis.forEach((kpi, idx) => {
    const cx = startX + idx * (cardW + gap);
    drawRoundedRect(ctx, cx, rowY, cardW, cardH, 14, 'rgba(18, 23, 34, 0.88)', 'rgba(255, 255, 255, 0.11)');

    // Top accent bar
    ctx.fillStyle = kpi.accent;
    ctx.fillRect(cx + 18, rowY + 18, 42, 4);

    ctx.fillStyle = '#8b93a3';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText(kpi.label, cx + 18, rowY + 48);

    ctx.fillStyle = '#f4f3ef';
    ctx.font = '700 32px "Space Grotesk", "Segoe UI", sans-serif';
    ctx.fillText(kpi.value, cx + 18, rowY + 94);

    ctx.fillStyle = kpi.accent;
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.fillText(kpi.sub, cx + 18, rowY + 124);
  });

  // Main Chart Panel (Left)
  const chartX = 44;
  const chartY = 280;
  const chartW = 738;
  const chartH = 472;
  drawRoundedRect(ctx, chartX, chartY, chartW, chartH, 16, 'rgba(16, 20, 30, 0.9)', 'rgba(255, 255, 255, 0.1)');

  ctx.fillStyle = '#f4f3ef';
  ctx.font = '700 20px "Space Grotesk", "Segoe UI", sans-serif';
  ctx.fillText('EVOLUÇÃO DE RECEITA & MARGEM POR MÊS', chartX + 26, chartY + 42);

  ctx.fillStyle = '#8b93a3';
  ctx.font = '500 13px "JetBrains Mono", monospace';
  ctx.fillText('SQL AGGREGATION · SÉRIE HISTÓRICA 8 MESES', chartX + 26, chartY + 66);

  // Horizontal guide lines
  const plotX = chartX + 58;
  const plotY = chartY + 104;
  const plotW = chartW - 96;
  const plotH = 290;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillStyle = '#6f7787';
  ctx.font = '500 12px "JetBrains Mono", monospace';
  for (let i = 0; i <= 4; i++) {
    const gy = plotY + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(plotX, gy);
    ctx.lineTo(plotX + plotW, gy);
    ctx.stroke();
    ctx.fillText(`${80 - i * 20}k`, chartX + 20, gy + 4);
  }

  // Monthly bars + trend curve
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO'];
  const values = [0.44, 0.53, 0.61, 0.58, 0.72, 0.81, 0.88, 0.96];
  const barStep = plotW / months.length;
  const barW = 42;
  const linePts = [];

  values.forEach((val, i) => {
    const bx = plotX + i * barStep + (barStep - barW) / 2;
    const bh = val * plotH;
    const by = plotY + plotH - bh;

    const barGrad = ctx.createLinearGradient(0, by, 0, plotY + plotH);
    barGrad.addColorStop(0, i >= 6 ? '#ff5a1f' : '#38bdf8');
    barGrad.addColorStop(1, i >= 6 ? 'rgba(255, 90, 31, 0.16)' : 'rgba(56, 189, 248, 0.14)');
    drawRoundedRect(ctx, bx, by, barW, bh, 6, barGrad);

    linePts.push({ x: bx + barW / 2, y: by - 12 });

    ctx.fillStyle = '#9aa3b2';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText(months[i], bx + 8, plotY + plotH + 28);
  });

  // Glowing trend overlay curve
  ctx.strokeStyle = '#ff9f43';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  linePts.forEach((pt, idx) => {
    if (idx === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  linePts.forEach((pt) => {
    ctx.fillStyle = '#07090f';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff9f43';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  });

  // Side Panel (Right) — Canal Mix + LGPD Security Views
  const sideX = 804;
  const sideY = 280;
  const sideW = 432;
  const sideH = 472;
  drawRoundedRect(ctx, sideX, sideY, sideW, sideH, 16, 'rgba(16, 20, 30, 0.9)', 'rgba(255, 255, 255, 0.1)');

  ctx.fillStyle = '#f4f3ef';
  ctx.font = '700 20px "Space Grotesk", "Segoe UI", sans-serif';
  ctx.fillText('MIX DE CANAIS & LGPD', sideX + 26, sideY + 42);

  // Donut graphic
  const dcx = sideX + 124;
  const dcy = sideY + 158;
  const radius = 64;
  const segments = [
    { frac: 0.54, color: '#ff5a1f', label: 'Peça & Retire (54%)' },
    { frac: 0.31, color: '#38bdf8', label: 'Balcão Físico (31%)' },
    { frac: 0.15, color: '#22c55e', label: 'Encomendas (15%)' },
  ];

  let startAng = -Math.PI / 2;
  segments.forEach((seg, idx) => {
    const endAng = startAng + seg.frac * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(dcx, dcy, radius, startAng, endAng);
    ctx.strokeStyle = seg.color;
    ctx.lineWidth = 22;
    ctx.stroke();
    startAng = endAng;

    // Legend row
    const ly = sideY + 122 + idx * 34;
    ctx.fillStyle = seg.color;
    ctx.fillRect(sideX + 216, ly - 10, 12, 12);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '500 14px "Space Grotesk", sans-serif';
    ctx.fillText(seg.label, sideX + 236, ly);
  });

  ctx.fillStyle = '#f4f3ef';
  ctx.font = '700 20px "Space Grotesk", sans-serif';
  ctx.fillText('100%', dcx - 24, dcy + 7);

  // Mini SQL / Security Audit Block
  drawRoundedRect(ctx, sideX + 24, sideY + 262, sideW - 48, 182, 10, 'rgba(8, 10, 16, 0.85)', 'rgba(255, 90, 31, 0.25)');
  ctx.fillStyle = '#ff7a45';
  ctx.font = '600 13px "JetBrains Mono", monospace';
  ctx.fillText('CAMADA LGPD // DATA MASKING ATIVO', sideX + 42, sideY + 292);

  const views = [
    '• vw_bi_vendas_anon    [ACID VERIFIED]',
    '• vw_bi_sla_producao   [28.03 MIN AVG]',
    '• vw_bi_estoque_giro   [160+ SKUS]',
    '• CPF / EMAIL / TEL    [HASHED SHA-256]',
  ];
  ctx.fillStyle = '#b4bcc8';
  ctx.font = '500 13px "JetBrains Mono", monospace';
  views.forEach((line, idx) => {
    ctx.fillText(line, sideX + 42, sideY + 328 + idx * 28);
  });

  return off;
}

function drawRoundedRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.25;
    ctx.stroke();
  }
}

/**
 * Generates a subtle radial studio floor shadow disc texture.
 */
function createShadowDiscTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    g.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
    g.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates an anodized dark brushed lid emblem texture ("WR // BI WORKSTATION")
 * visible on the back shell when closed or spinning past 180°.
 */
function createLidBackTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 332;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#121620';
    ctx.fillRect(0, 0, 512, 332);

    // Subtle hairline diagonal sheen
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = -332; i < 512; i += 14) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 240, 332);
      ctx.stroke();
    }

    // Precision corner marks
    ctx.strokeStyle = 'rgba(255, 90, 31, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 464, 284);

    // Monogram mark centered
    ctx.strokeStyle = '#ff5a1f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 152, 34, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#f4f3ef';
    ctx.font = '700 22px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WR', 256, 160);

    ctx.fillStyle = '#8b93a3';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('BI WORKSTATION // OBSD-01', 256, 214);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createExtrudedChassisGeometry(width, depth, height, radius) {
  const w = width / 2 - radius;
  const d = depth / 2 - radius;
  const shape = new THREE.Shape();
  shape.moveTo(-w, -depth / 2);
  shape.lineTo(w, -depth / 2);
  shape.quadraticCurveTo(width / 2, -depth / 2, width / 2, -d);
  shape.lineTo(width / 2, d);
  shape.quadraticCurveTo(width / 2, depth / 2, w, depth / 2);
  shape.lineTo(-w, depth / 2);
  shape.quadraticCurveTo(-width / 2, depth / 2, -width / 2, d);
  shape.lineTo(-width / 2, -d);
  shape.quadraticCurveTo(-width / 2, -depth / 2, -w, -depth / 2);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015,
  });
  geo.rotateX(Math.PI / 2);
  geo.center();
  return geo;
}

function init2DFallback(screenCanvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  function drawStatic() {
    const w = canvas.clientWidth || 640;
    const h = canvas.clientHeight || 360;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    const scale = Math.min((w * 0.84) / 1280, (h * 0.84) / 800);
    const dw = 1280 * scale;
    const dh = 800 * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;

    ctx.fillStyle = '#141821';
    drawRoundedRect(ctx, dx - 12, dy - 12, dw + 24, dh + 24, 14, '#141821', 'rgba(255, 90, 31, 0.45)');
    ctx.drawImage(screenCanvas, dx, dy, dw, dh);
  }

  drawStatic();
  window.addEventListener('resize', drawStatic, { passive: true });
  if (counterEl) counterEl.textContent = 'FRAME 060 / 120';
  if (scrubberFillEl) scrubberFillEl.style.width = '50%';
  captions.forEach((el) => el.classList.toggle('is-active', Number(el.dataset.sfStep) === 1));
}

function initScrollframesLaptop() {
  const screenCanvas = createDashboardScreenCanvas();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch {
    init2DFallback(screenCanvas);
    return;
  }

  const gl = renderer.getContext();
  if (!gl) {
    init2DFallback(screenCanvas);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 40);
  camera.position.set(0, 0.65, 5.4);

  // Studio Three-Point + Ember Rim Lighting
  const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.65);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
  keyLight.position.set(3.8, 5.4, 4.6);
  scene.add(keyLight);

  const rimOrange = new THREE.DirectionalLight(0xff5a1f, 2.25);
  rimOrange.position.set(-4.5, 2.5, -3.2);
  scene.add(rimOrange);

  const fillCyan = new THREE.DirectionalLight(0x38bdf8, 1.1);
  fillCyan.position.set(4.0, -1.5, -2.5);
  scene.add(fillCyan);

  // Studio floor glow ring & soft contact shadow
  const stageGroup = new THREE.Group();
  scene.add(stageGroup);

  const shadowMat = new THREE.MeshBasicMaterial({
    map: createShadowDiscTexture(),
    transparent: true,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 4.2), shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = -0.34;
  stageGroup.add(shadowMesh);

  const floorRingMat = new THREE.MeshBasicMaterial({
    color: 0xff5a1f,
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
  });
  const floorRing = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.13, 72), floorRingMat);
  floorRing.rotation.x = -Math.PI / 2;
  floorRing.position.y = -0.33;
  stageGroup.add(floorRing);

  // Root Laptop Assembly
  const laptopRoot = new THREE.Group();
  stageGroup.add(laptopRoot);

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x161a24,
    metalness: 0.78,
    roughness: 0.28,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x262c3a,
    metalness: 0.85,
    roughness: 0.22,
  });

  const recessMat = new THREE.MeshStandardMaterial({
    color: 0x0a0d13,
    metalness: 0.35,
    roughness: 0.7,
  });

  const keyMat = new THREE.MeshStandardMaterial({
    color: 0x1b202b,
    metalness: 0.25,
    roughness: 0.52,
  });

  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xff5a1f,
    emissive: 0xff5a1f,
    emissiveIntensity: 1.4,
    roughness: 0.25,
  });

  // Base Chassis
  const baseGeo = createExtrudedChassisGeometry(3.2, 2.16, 0.1, 0.11);
  const baseMesh = new THREE.Mesh(baseGeo, bodyMat);
  baseMesh.position.set(0, 0, 0);
  laptopRoot.add(baseMesh);

  // Keyboard well recess
  const kbWell = new THREE.Mesh(new THREE.BoxGeometry(2.74, 0.015, 1.02), recessMat);
  kbWell.position.set(0, 0.064, -0.24);
  laptopRoot.add(kbWell);

  // Instanced Keycaps (5 rows x 14 cols)
  const rows = 5;
  const cols = 14;
  const keyGeo = new THREE.BoxGeometry(0.165, 0.024, 0.155);
  const keysMesh = new THREE.InstancedMesh(keyGeo, keyMat, rows * cols);
  const dummy = new THREE.Object3D();
  let keyIdx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const kx = -1.21 + c * 0.186;
      const kz = -0.64 + r * 0.195;
      dummy.position.set(kx, 0.075, kz);
      dummy.scale.set(1, 1, 1);
      if (r === 4 && c >= 4 && c <= 8) {
        dummy.scale.x = 1.08;
      }
      dummy.updateMatrix();
      keysMesh.setMatrixAt(keyIdx++, dummy.matrix);
    }
  }
  keysMesh.instanceMatrix.needsUpdate = true;
  laptopRoot.add(keysMesh);

  // Glass Trackpad
  const trackpadMat = new THREE.MeshStandardMaterial({
    color: 0x11151f,
    metalness: 0.55,
    roughness: 0.16,
  });
  const trackpad = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.012, 0.64), trackpadMat);
  trackpad.position.set(0, 0.065, 0.64);
  laptopRoot.add(trackpad);

  // Trackpad Accent Border Strip
  const frontLip = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.014, 0.02), emberMat);
  frontLip.position.set(0, 0.01, 1.088);
  laptopRoot.add(frontLip);

  // Side I/O USB-C ports (detail visible during 360 rotation)
  for (let side of [-1, 1]) {
    for (let pz of [-0.45, -0.2, 0.05]) {
      const port = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.026, 0.11), trimMat);
      port.position.set(side * 1.61, 0, pz);
      laptopRoot.add(port);
    }
  }

  // Hinge Cylinder
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 2.48, 24), trimMat);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, 0.092, -1.03);
  laptopRoot.add(hinge);

  // Display Lid Pivot
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.102, -1.03);
  laptopRoot.add(lidPivot);

  const lidW = 3.2;
  const lidH = 2.08;
  const lidDepth = 0.052;

  const lidShellGeo = createExtrudedChassisGeometry(lidW, lidH, lidDepth, 0.1);
  // createExtrudedChassisGeometry lies flat in XZ; stand it upright along XY
  lidShellGeo.rotateX(-Math.PI / 2);
  const lidShell = new THREE.Mesh(lidShellGeo, bodyMat);
  lidShell.position.set(0, lidH / 2, 0);
  lidPivot.add(lidShell);

  // Back Shell Textured Plate (seen closed or during 180° back turn)
  const lidBackPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(3.04, 1.94),
    new THREE.MeshStandardMaterial({
      map: createLidBackTexture(),
      metalness: 0.6,
      roughness: 0.35,
    })
  );
  lidBackPlate.rotation.y = Math.PI;
  lidBackPlate.position.set(0, lidH / 2, -lidDepth / 2 - 0.017);
  lidPivot.add(lidBackPlate);

  // Display Front Bezel
  const bezelMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.08, 1.98, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.25, metalness: 0.2 })
  );
  bezelMesh.position.set(0, lidH / 2, lidDepth / 2 + 0.012);
  lidPivot.add(bezelMesh);

  // Active BI Screen Texture
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissiveMap: screenTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.06,
  });
  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.94, 1.84), screenMat);
  screenMesh.position.set(0, lidH / 2, lidDepth / 2 + 0.02);
  lidPivot.add(screenMesh);

  // Top Webcam pill
  const camDot = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.008, 12), trimMat);
  camDot.rotation.x = Math.PI / 2;
  camDot.position.set(0, lidH - 0.055, lidDepth / 2 + 0.02);
  lidPivot.add(camDot);

  // Scrollframes State
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let targetP = prefersReducedMotion ? 0.5 : 0;
  let currentP = targetP;
  let lastHudFrame = -1;
  let isVisible = true;
  let rafId = 0;

  function applyPose(p) {
    const aspect = camera.aspect || 16 / 9;
    const isDesktopWide = window.innerWidth > 980;
    const mobileDistBoost = aspect < 1.1 ? (1.1 - aspect) * 2.6 : 0;

    // 1. Frame pose interpolation across 3 phases (0..0.294 open, 0.294..0.756 360 spin, 0.756..1 lock-in)
    if (p <= 0.294) {
      const t = easeOutCubic(p / 0.294);
      // Closed (+1.45 rad flat forward over keyboard) -> Open (-0.19 rad)
      lidPivot.rotation.x = lerp(1.45, -0.19, t);
      laptopRoot.rotation.y = lerp(-0.55, 0.16, t);
      laptopRoot.rotation.x = lerp(0.42, 0.22, t);
      laptopRoot.position.y = lerp(-0.08, -0.22, t);
      laptopRoot.position.x = isDesktopWide ? lerp(0.15, 0.42, t) : 0;
      camera.position.z = lerp(5.55, 5.2, t) + mobileDistBoost;
      camera.position.y = lerp(0.85, 0.65, t);
      screenMat.emissiveIntensity = lerp(0.04, 0.82, t);
    } else if (p <= 0.756) {
      const t = (p - 0.294) / (0.756 - 0.294);
      const smoothT = easeInOutCubic(t);
      lidPivot.rotation.x = -0.19;
      laptopRoot.rotation.y = 0.16 + smoothT * Math.PI * 2;
      laptopRoot.rotation.x = 0.22 + Math.sin(smoothT * Math.PI) * 0.08;
      laptopRoot.position.y = -0.22;
      laptopRoot.position.x = isDesktopWide ? 0.42 : 0;
      camera.position.z = 5.2 + Math.sin(smoothT * Math.PI) * 0.42 + mobileDistBoost;
      camera.position.y = 0.65;
      screenMat.emissiveIntensity = 0.84;
    } else {
      const t = easeInOutCubic((p - 0.756) / (1.0 - 0.756));
      lidPivot.rotation.x = lerp(-0.19, -0.14, t);
      laptopRoot.rotation.y = lerp(0.16 + Math.PI * 2, -0.05 + Math.PI * 2, t);
      laptopRoot.rotation.x = lerp(0.22, 0.14, t);
      laptopRoot.position.y = lerp(-0.22, -0.34, t);
      laptopRoot.position.x = isDesktopWide ? lerp(0.42, 0.56, t) : 0;
      camera.position.z = lerp(5.2, 4.1, t) + mobileDistBoost;
      camera.position.y = lerp(0.65, 0.52, t);
      screenMat.emissiveIntensity = lerp(0.84, 0.94, t);
    }

    camera.lookAt(0, 0.28, 0);

    // Subtle rotation of floor glow ring synced to frame
    floorRingMat.opacity = 0.18 + Math.sin(p * Math.PI) * 0.14;
  }

  function updateHud(p) {
    const frameIndex = clamp(Math.round(p * (TOTAL_FRAMES - 1)), 0, TOTAL_FRAMES - 1);
    if (frameIndex !== lastHudFrame) {
      lastHudFrame = frameIndex;
      if (counterEl) {
        counterEl.textContent = `FRAME ${String(frameIndex + 1).padStart(3, '0')} / ${TOTAL_FRAMES}`;
      }
    }
    if (scrubberFillEl) {
      scrubberFillEl.style.width = `${(p * 100).toFixed(2)}%`;
    }
    const step = p < 0.33 ? 0 : p < 0.68 ? 1 : 2;
    captions.forEach((cap) => {
      cap.classList.toggle('is-active', Number(cap.dataset.sfStep) === step);
    });
  }

  function computeScrollProgress() {
    const rect = shell.getBoundingClientRect();
    const scrollable = shell.offsetHeight - window.innerHeight;
    if (scrollable > 80) {
      return clamp(-rect.top / scrollable, 0, 1);
    }
    // Stacked mobile layout fallback: map traversal across viewport
    const total = window.innerHeight + rect.height;
    return total > 0 ? clamp((window.innerHeight - rect.top) / total, 0, 1) : 0.5;
  }

  function renderFrame() {
    applyPose(currentP);
    updateHud(currentP);
    renderer.render(scene, camera);
  }

  function tick() {
    rafId = 0;
    const diff = targetP - currentP;
    if (Math.abs(diff) > 0.00025) {
      currentP += diff * 0.16;
      renderFrame();
      if (isVisible) {
        rafId = window.requestAnimationFrame(tick);
      }
    } else if (currentP !== targetP) {
      currentP = targetP;
      renderFrame();
    }
  }

  function scheduleRender() {
    if (!rafId && isVisible) {
      rafId = window.requestAnimationFrame(tick);
    }
  }

  function handleResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 10 || h < 10) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderFrame();
  }

  // Initial sizing & pose
  handleResize();

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);
  } else {
    window.addEventListener('resize', handleResize, { passive: true });
  }

  if (prefersReducedMotion) {
    currentP = 0.5;
    targetP = 0.5;
    renderFrame();
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      isVisible = Boolean(entries[0]?.isIntersecting);
      if (isVisible) {
        targetP = computeScrollProgress();
        scheduleRender();
      } else if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    },
    { rootMargin: '240px 0px' }
  );
  io.observe(shell);

  window.addEventListener(
    'scroll',
    () => {
      targetP = computeScrollProgress();
      scheduleRender();
    },
    { passive: true }
  );

  // Sync initial scroll offset on reload
  targetP = computeScrollProgress();
  currentP = targetP;
  renderFrame();
}
