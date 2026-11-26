import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const shell = document.getElementById('scrollframes-shell');
const canvas = document.getElementById('scrollframes-canvas');
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

function drawRoundedRect(ctx, x, y, w, h, r, fill, stroke, lineWidth = 1.25) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * Generates a procedural studio HDRI-like environment map via PMREMGenerator
 * using pure core THREE without external JSM imports.
 */
function createStudioEnvironment(renderer) {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x0b0e15);

  const addPanel = (w, h, pos, target, r, g, b) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(r, g, b),
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.lookAt(target[0], target[1], target[2]);
    envScene.add(mesh);
  };

  // Overhead diffused softbox (creates crisp specular sheen along beveled aluminum)
  addPanel(11, 6, [0, 7.5, 2.2], [0, 0, 0], 3.2, 3.3, 3.55);
  // Soft left key fill
  addPanel(7, 5, [-7, 3.2, 6], [0, 0, 0], 2.1, 2.15, 2.3);
  // Warm-neutral right edge strip
  addPanel(2.4, 7, [7.5, 2.4, -1.8], [0, 0, 0], 2.0, 1.85, 1.72);
  // Cool rear rim strip (separates back lid silhouette)
  addPanel(9.5, 2.4, [0, 4.2, -8], [0, 0, 0], 2.5, 2.6, 2.9);
  // Subtle lower studio bounce
  addPanel(12, 12, [0, -6, 0], [0, 0, 0], 0.36, 0.4, 0.46);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromScene(envScene, 0.035);
  pmrem.dispose();

  return envRT;
}

/**
 * Procedural fine bead-blasted & brushed anodized aluminum roughness + bump maps.
 */
function createBrushedMetalMaps() {
  const size = 512;
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  if (rCtx && bCtx) {
    const rImg = rCtx.createImageData(size, size);
    const bImg = bCtx.createImageData(size, size);
    let seed = 4219;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let y = 0; y < size; y++) {
      const rowBias = (rand() - 0.5) * 14;
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const grain = (rand() - 0.5) * 20;
        const rVal = clamp(Math.round(145 + grain * 0.8 + rowBias * 0.6), 95, 195);
        const bVal = clamp(Math.round(128 + grain * 0.65 + rowBias * 0.8), 90, 165);

        rImg.data[idx] = rVal;
        rImg.data[idx + 1] = rVal;
        rImg.data[idx + 2] = rVal;
        rImg.data[idx + 3] = 255;

        bImg.data[idx] = bVal;
        bImg.data[idx + 1] = bVal;
        bImg.data[idx + 2] = bVal;
        bImg.data[idx + 3] = 255;
      }
    }
    rCtx.putImageData(rImg, 0, 0);
    bCtx.putImageData(bImg, 0, 0);
  }

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2, 2);
  roughnessMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);
  bumpMap.needsUpdate = true;

  return { roughnessMap, bumpMap };
}

/**
 * Procedural micro-perforated speaker grille texture.
 */
function createSpeakerGrilleTexture() {
  const w = 128;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, w, h);
    const cols = 7;
    const rows = 42;
    const padX = 16;
    const padY = 18;
    const stepX = (w - padX * 2) / (cols - 1);
    const stepY = (h - padY * 2) / (rows - 1);

    for (let r = 0; r < rows; r++) {
      const offsetX = r % 2 === 0 ? 0 : stepX * 0.5;
      for (let col = 0; col < cols; col++) {
        const px = padX + col * stepX + offsetX;
        if (px > w - padX + 2) continue;
        const py = padY + r * stepY;

        ctx.fillStyle = 'rgba(10, 12, 16, 0.88)';
        ctx.beginPath();
        ctx.arc(px, py, 3.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(px, py + 0.9, 2.2, 0, Math.PI);
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Minimalist metallic WR monogram texture (transparent background, no border plate).
 */
function createLidMonogramTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);

    // Subtle precision geometric ring + WR monogram
    ctx.strokeStyle = 'rgba(244, 247, 252, 0.92)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(256, 256, 78, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(244, 247, 252, 0.96)';
    ctx.font = '700 62px "Space Grotesk", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WR', 256, 260);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Subtle engraved bottom case serial / certification text.
 */
function createBottomEtchingTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = 'rgba(220, 228, 240, 0.18)';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WORKSTATION BI // ANODIZED UNIBODY', 256, 56);
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(220, 228, 240, 0.13)';
    ctx.fillText('MODEL WR-PRO 14  ·  DESIGNED FOR ANALYTICS', 256, 78);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates high-resolution 1600x1000 CanvasTexture representing the framed
 * Padaria Diniz Power BI dashboard inside a sleek OS & BI application shell.
 */
function createDashboardScreenCanvas(existingCanvas = null) {
  const off = existingCanvas || document.createElement('canvas');
  if (!existingCanvas) {
    off.width = 1600;
    off.height = 1000;
  }
  const ctx = off.getContext('2d');
  if (!ctx) return off;

  const W = 1600;
  const H = 1000;

  // Obsidian backdrop
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#07090f');
  bgGrad.addColorStop(0.55, '#0b0e17');
  bgGrad.addColorStop(1, '#101422');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle ambient orange bloom
  const glow = ctx.createRadialGradient(1240, 220, 24, 1240, 220, 540);
  glow.addColorStop(0, 'rgba(255, 90, 31, 0.14)');
  glow.addColorStop(1, 'rgba(255, 90, 31, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Subtle technical grid inside workspace
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 78);
    ctx.lineTo(x, H - 34);
    ctx.stroke();
  }
  for (let y = 78; y <= H - 34; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // 1. OS Menu Bar (30px, center clear for physical camera notch)
  ctx.fillStyle = 'rgba(7, 9, 14, 0.96)';
  ctx.fillRect(0, 0, W, 32);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, 31, W, 1);

  ctx.fillStyle = '#e5e7eb';
  ctx.font = '700 13px "Space Grotesk", "Segoe UI", sans-serif';
  ctx.fillText('Power BI', 26, 20);

  ctx.fillStyle = '#9aa3b2';
  ctx.font = '500 12.5px "Inter", "Segoe UI", sans-serif';
  ctx.fillText('Arquivo     Exibir     Modelagem     Segurança     Ajuda', 112, 20);

  // Right status icons (Wi-Fi bars, battery, BRT time)
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.6;
  // Battery icon
  ctx.strokeRect(1426, 10, 24, 12);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(1428, 12, 19, 8);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(1450, 13, 2, 6);
  ctx.font = '600 12px "JetBrains Mono", monospace';
  ctx.fillText('96%', 1460, 20);
  ctx.fillStyle = '#e5e7eb';
  ctx.fillText('BRT', 1534, 20);

  // 2. App Window Chrome Bar (y = 32..80)
  ctx.fillStyle = 'rgba(15, 20, 31, 0.94)';
  ctx.fillRect(0, 32, W, 48);
  ctx.fillStyle = 'rgba(255, 90, 31, 0.42)';
  ctx.fillRect(0, 79, W, 1.5);

  // Traffic light dots (muted realistic)
  const dots = ['#d9534f', '#d99b26', '#3ca367'];
  dots.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(30 + i * 20, 56, 5.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // App Title
  ctx.fillStyle = '#f4f3ef';
  ctx.font = '700 19px "Space Grotesk", "Segoe UI", sans-serif';
  ctx.fillText('Padaria Diniz  ·  Inteligência Executiva BI', 106, 62);

  // App Tabs
  const tabs = [
    { label: 'Visão Geral', x: 640, w: 122, active: true },
    { label: 'Margens', x: 774, w: 100, active: false },
    { label: 'SLA Preparo', x: 886, w: 118, active: false },
    { label: 'Views LGPD', x: 1016, w: 118, active: false },
  ];
  tabs.forEach((t) => {
    drawRoundedRect(
      ctx,
      t.x,
      42,
      t.w,
      28,
      7,
      t.active ? 'rgba(255, 90, 31, 0.2)' : 'rgba(255, 255, 255, 0.04)',
      t.active ? 'rgba(255, 90, 31, 0.65)' : 'rgba(255, 255, 255, 0.09)'
    );
    ctx.fillStyle = t.active ? '#ff9d73' : '#9aa3b2';
    ctx.font = '600 13px "Space Grotesk", sans-serif';
    ctx.fillText(t.label, t.x + 16, 60);
  });

  // Live AWS RDS badge
  drawRoundedRect(ctx, 1344, 42, 224, 28, 7, 'rgba(34, 197, 94, 0.12)', 'rgba(34, 197, 94, 0.35)');
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(1364, 56, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 12px "JetBrains Mono", monospace';
  ctx.fillText('AWS RDS · LIVE SYNC', 1380, 60);

  // 3. KPI Cards Row (4 cards)
  const kpis = [
    { label: 'FATURAMENTO TOTAL', value: 'R$ 79.335,89', sub: '+18,4% vs mês anterior', accent: '#ff5a1f' },
    { label: 'MARGEM REAL LÍQUIDA', value: '43,62%', sub: '30+ medidas DAX auditadas', accent: '#38bdf8' },
    { label: 'SLA DE PREPARO', value: '28,03 min', sub: '-4,2 min abaixo da meta', accent: '#22c55e' },
    { label: 'CONVERSÃO PEÇA & RETIRE', value: '85,5%', sub: '160+ SKUs ativos na nuvem', accent: '#ff9f43' },
  ];

  const startX = 48;
  const gap = 24;
  const cardW = (W - startX * 2 - gap * 3) / 4; // 358px
  const cardH = 166;
  const rowY = 108;

  kpis.forEach((kpi, idx) => {
    const cx = startX + idx * (cardW + gap);
    drawRoundedRect(ctx, cx, rowY, cardW, cardH, 16, 'rgba(18, 23, 34, 0.9)', 'rgba(255, 255, 255, 0.11)');

    ctx.fillStyle = kpi.accent;
    ctx.fillRect(cx + 22, rowY + 22, 48, 4.5);

    ctx.fillStyle = '#8b93a3';
    ctx.font = '600 14px "JetBrains Mono", monospace';
    ctx.fillText(kpi.label, cx + 22, rowY + 54);

    ctx.fillStyle = '#f4f3ef';
    ctx.font = '700 38px "Space Grotesk", "Segoe UI", sans-serif';
    ctx.fillText(kpi.value, cx + 22, rowY + 106);

    ctx.fillStyle = kpi.accent;
    ctx.font = '500 14.5px "JetBrains Mono", monospace';
    ctx.fillText(kpi.sub, cx + 22, rowY + 140);
  });

  // 4. Main Chart Panel (Left)
  const chartX = 48;
  const chartY = 302;
  const chartW = 928;
  const chartH = 628;
  drawRoundedRect(ctx, chartX, chartY, chartW, chartH, 18, 'rgba(16, 20, 30, 0.92)', 'rgba(255, 255, 255, 0.1)');

  ctx.fillStyle = '#f4f3ef';
  ctx.font = '700 24px "Space Grotesk", "Segoe UI", sans-serif';
  ctx.fillText('EVOLUÇÃO DE RECEITA & MARGEM POR MÊS', chartX + 32, chartY + 50);

  ctx.fillStyle = '#8b93a3';
  ctx.font = '500 14.5px "JetBrains Mono", monospace';
  ctx.fillText('SQL AGGREGATION · SÉRIE HISTÓRICA 8 MESES', chartX + 32, chartY + 78);

  const plotX = chartX + 74;
  const plotY = chartY + 132;
  const plotW = chartW - 122;
  const plotH = 408;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillStyle = '#6f7787';
  ctx.font = '500 14px "JetBrains Mono", monospace';
  for (let i = 0; i <= 4; i++) {
    const gy = plotY + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(plotX, gy);
    ctx.lineTo(plotX + plotW, gy);
    ctx.stroke();
    ctx.fillText(`${80 - i * 20}k`, chartX + 26, gy + 5);
  }

  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO'];
  const values = [0.44, 0.53, 0.61, 0.58, 0.72, 0.81, 0.88, 0.96];
  const barStep = plotW / months.length;
  const barW = 54;
  const linePts = [];

  values.forEach((val, i) => {
    const bx = plotX + i * barStep + (barStep - barW) / 2;
    const bh = val * plotH;
    const by = plotY + plotH - bh;

    const barGrad = ctx.createLinearGradient(0, by, 0, plotY + plotH);
    barGrad.addColorStop(0, i >= 6 ? '#ff5a1f' : '#38bdf8');
    barGrad.addColorStop(1, i >= 6 ? 'rgba(255, 90, 31, 0.16)' : 'rgba(56, 189, 248, 0.14)');
    drawRoundedRect(ctx, bx, by, barW, bh, 8, barGrad);

    linePts.push({ x: bx + barW / 2, y: by - 16 });

    ctx.fillStyle = '#9aa3b2';
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.fillText(months[i], bx + 11, plotY + plotH + 36);
  });

  ctx.strokeStyle = '#ff9f43';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  linePts.forEach((pt, idx) => {
    if (idx === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  linePts.forEach((pt) => {
    ctx.fillStyle = '#07090f';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff9f43';
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  // 5. Side Panel (Right) — Canal Mix + LGPD Security Views
  const sideX = 1004;
  const sideY = 302;
  const sideW = 548;
  const sideH = 628;
  drawRoundedRect(ctx, sideX, sideY, sideW, sideH, 18, 'rgba(16, 20, 30, 0.92)', 'rgba(255, 255, 255, 0.1)');

  ctx.fillStyle = '#f4f3ef';
  ctx.font = '700 24px "Space Grotesk", "Segoe UI", sans-serif';
  ctx.fillText('MIX DE CANAIS & LGPD', sideX + 32, sideY + 50);

  const dcx = sideX + 150;
  const dcy = sideY + 206;
  const radius = 84;
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
    ctx.lineWidth = 28;
    ctx.stroke();
    startAng = endAng;

    const ly = sideY + 158 + idx * 46;
    ctx.fillStyle = seg.color;
    ctx.fillRect(sideX + 272, ly - 12, 15, 15);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '500 18px "Space Grotesk", sans-serif';
    ctx.fillText(seg.label, sideX + 298, ly);
  });

  ctx.fillStyle = '#f4f3ef';
  ctx.font = '700 24px "Space Grotesk", sans-serif';
  ctx.fillText('100%', dcx - 30, dcy + 8);

  // Mini SQL / Security Audit Block
  drawRoundedRect(ctx, sideX + 30, sideY + 344, sideW - 60, 250, 12, 'rgba(8, 10, 16, 0.88)', 'rgba(255, 90, 31, 0.28)');
  ctx.fillStyle = '#ff7a45';
  ctx.font = '600 15.5px "JetBrains Mono", monospace';
  ctx.fillText('CAMADA LGPD // DATA MASKING ATIVO', sideX + 52, sideY + 384);

  const views = [
    '• vw_bi_vendas_anon    [ACID VERIFIED]',
    '• vw_bi_sla_producao   [28.03 MIN AVG]',
    '• vw_bi_estoque_giro   [160+ SKUS]',
    '• CPF / EMAIL / TEL    [HASHED SHA-256]',
  ];
  ctx.fillStyle = '#b4bcc8';
  ctx.font = '500 15.5px "JetBrains Mono", monospace';
  views.forEach((line, idx) => {
    ctx.fillText(line, sideX + 52, sideY + 432 + idx * 38);
  });

  // 6. Power BI Bottom Status Bar (y = 966..1000)
  ctx.fillStyle = 'rgba(12, 15, 24, 0.96)';
  ctx.fillRect(0, 966, W, 34);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, 966, W, 1);

  ctx.fillStyle = '#8b93a3';
  ctx.font = '500 12.5px "JetBrains Mono", monospace';
  ctx.fillText('Página 1 de 4   ·   30+ medidas DAX auditadas   ·   LGPD Masking SHA-256', 48, 988);
  ctx.fillStyle = '#ff9d73';
  ctx.fillText('POWER BI SERVICE // PRODUCTION', 1320, 988);

  return off;
}

/**
 * Helper: creates a rounded rectangle THREE.Shape centered on (0,0).
 */
function createRoundedRectShape(width, depth, radius) {
  const r = Math.min(radius, width / 2 - 0.002, depth / 2 - 0.002);
  const hw = width / 2;
  const hd = depth / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  return shape;
}

/**
 * Helper: creates a rounded rectangle Path (for Shape holes).
 */
function createRoundedRectHole(cx, cy, width, depth, radius) {
  const r = Math.min(radius, width / 2 - 0.002, depth / 2 - 0.002);
  const hw = width / 2;
  const hd = depth / 2;
  const path = new THREE.Path();
  path.moveTo(cx - hw + r, cy - hd);
  path.lineTo(cx + hw - r, cy - hd);
  path.quadraticCurveTo(cx + hw, cy - hd, cx + hw, cy - hd + r);
  path.lineTo(cx + hw, cy + hd - r);
  path.quadraticCurveTo(cx + hw, cy + hd, cx + hw - r, cy + hd);
  path.lineTo(cx - hw + r, cy + hd);
  path.quadraticCurveTo(cx - hw, cy + hd, cx - hw, cy + hd - r);
  path.lineTo(cx - hw, cy - hd + r);
  path.quadraticCurveTo(cx - hw, cy - hd, cx - hw + r, cy - hd);
  return path;
}

/**
 * Creates the sculpted upper chassis deck with a real concave front thumb scoop,
 * sunken keyboard cavity hole, and sunken trackpad cavity hole.
 */
function createTopDeckGeometry(targetW, targetD, targetH, radius, bevelSize, bevelThickness) {
  const innerW = targetW - bevelSize * 2;
  const innerD = targetD - bevelSize * 2;
  const innerH = Math.max(0.004, targetH - bevelThickness * 2);
  const r = Math.max(0.01, radius - bevelSize);
  const hw = innerW / 2;
  const hd = innerD / 2;

  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);

  // Front edge (+Y in 2D shape maps to +Z in 3D) with curved thumb scoop
  const scoopHalfW = 0.235;
  const scoopDepth = 0.032;
  shape.lineTo(scoopHalfW, hd);
  const steps = 18;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = lerp(scoopHalfW, -scoopHalfW, t);
    const fall = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
    shape.lineTo(x, hd - scoopDepth * fall);
  }

  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  // Inner hole 1: Keyboard well centered at (0, -0.24)
  // Note: bevel expands hole inward by bevelSize on all sides, so pad hole size by bevelSize * 2
  shape.holes.push(createRoundedRectHole(0, -0.24, 2.52 + bevelSize * 2, 1.02 + bevelSize * 2, 0.038));

  // Inner hole 2: Trackpad recess centered at (0, +0.68)
  shape.holes.push(createRoundedRectHole(0, 0.68, 1.13 + bevelSize * 2, 0.67 + bevelSize * 2, 0.044));

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: innerH,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize,
    bevelThickness,
    curveSegments: 12,
    steps: 1,
  });
  geo.rotateX(Math.PI / 2);
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a smoothly tapered unibody lower shell via multi-ring lofting.
 * Top rim sits cleanly under the top deck; lower hull curves smoothly inward like a MacBook Pro.
 */
function createTaperedBottomGeometry(topW, topD, height) {
  const segsPerCorner = 8;
  const rings = [
    { yFrac: 0.5, scaleW: 1.0, scaleD: 1.0, r: 0.115 },
    { yFrac: 0.25, scaleW: 0.997, scaleD: 0.996, r: 0.116 },
    { yFrac: -0.05, scaleW: 0.986, scaleD: 0.982, r: 0.12 },
    { yFrac: -0.32, scaleW: 0.964, scaleD: 0.954, r: 0.128 },
    { yFrac: -0.47, scaleW: 0.935, scaleD: 0.918, r: 0.135 },
    { yFrac: -0.5, scaleW: 0.916, scaleD: 0.896, r: 0.138 },
  ];

  const sampleRoundedRect = (w, d, rad, nCorner) => {
    const pts = [];
    const hw = w / 2 - rad;
    const hd = d / 2 - rad;
    const corners = [
      { cx: hw, cz: -hd, a0: -Math.PI / 2, a1: 0 },
      { cx: hw, cz: hd, a0: 0, a1: Math.PI / 2 },
      { cx: -hw, cz: hd, a0: Math.PI / 2, a1: Math.PI },
      { cx: -hw, cz: -hd, a0: Math.PI, a1: Math.PI * 1.5 },
    ];
    for (const c of corners) {
      for (let i = 0; i <= nCorner; i++) {
        const ang = lerp(c.a0, c.a1, i / nCorner);
        pts.push([c.cx + Math.cos(ang) * rad, c.cz + Math.sin(ang) * rad]);
      }
    }
    return pts;
  };

  const ringPoints = rings.map((rg) => ({
    y: rg.yFrac * height,
    pts: sampleRoundedRect(topW * rg.scaleW, topD * rg.scaleD, rg.r, segsPerCorner),
  }));

  const count = ringPoints[0].pts.length;
  const positions = [];
  const indices = [];

  for (let r = 0; r < ringPoints.length; r++) {
    const y = ringPoints[r].y;
    for (let i = 0; i < count; i++) {
      const [px, pz] = ringPoints[r].pts[i];
      positions.push(px, y, pz);
    }
  }

  for (let r = 0; r < ringPoints.length - 1; r++) {
    const rowA = r * count;
    const rowB = (r + 1) * count;
    for (let i = 0; i < count; i++) {
      const next = (i + 1) % count;
      const a = rowA + i;
      const b = rowA + next;
      const c = rowB + next;
      const d = rowB + i;
      indices.push(a, b, c, a, c, d);
    }
  }

  // Bottom flat cap
  const bottomCenterIdx = positions.length / 3;
  positions.push(0, ringPoints[ringPoints.length - 1].y, 0);
  const lastRow = (ringPoints.length - 1) * count;
  for (let i = 0; i < count; i++) {
    const next = (i + 1) % count;
    indices.push(bottomCenterIdx, lastRow + i, lastRow + next);
  }

  // Top cap
  const topCenterIdx = positions.length / 3;
  positions.push(0, ringPoints[0].y, 0);
  for (let i = 0; i < count; i++) {
    const next = (i + 1) % count;
    indices.push(topCenterIdx, next, i);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Helper: rounded 3D extruded plate (used for lid shell, trackpad, bezel, notch).
 */
function createExtrudedRoundedPlate(targetW, targetD, targetH, radius, bevelSize, bevelThickness) {
  const innerW = Math.max(0.01, targetW - bevelSize * 2);
  const innerD = Math.max(0.01, targetD - bevelSize * 2);
  const innerH = Math.max(0.001, targetH - bevelThickness * 2);
  const r = Math.max(0.005, radius - bevelSize);
  const shape = createRoundedRectShape(innerW, innerD, r);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: innerH,
    bevelEnabled: bevelSize > 0 && bevelThickness > 0,
    bevelSegments: 4,
    bevelSize,
    bevelThickness,
    curveSegments: 12,
    steps: 1,
  });
  geo.rotateX(Math.PI / 2);
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

/**
 * Helper: rounded flat 2D ShapeGeometry in XY plane centered at (0, 0).
 */
function createRoundedPlaneGeometry(width, height, radius) {
  const shape = createRoundedRectShape(width, height, radius);
  const geo = new THREE.ShapeGeometry(shape, 12);
  return geo;
}

/**
 * Helper: webcam notch ShapeGeometry (top flush, bottom corners rounded).
 */
function createNotchGeometry(width, height, bottomRadius) {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(bottomRadius, hw, height * 0.8);
  const shape = new THREE.Shape();
  shape.moveTo(-hw, hh);
  shape.lineTo(hw, hh);
  shape.lineTo(hw, -hh + r);
  shape.quadraticCurveTo(hw, -hh, hw - r, -hh);
  shape.lineTo(-hw + r, -hh);
  shape.quadraticCurveTo(-hw, -hh, -hw, -hh + r);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 8);
}

/**
 * Helper: slightly tapered keycap unit geometry (1x1x1 centered in XZ, base at y=0, top at y=1).
 */
function createUnitKeycapGeometry() {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0.5) {
      pos.setX(i, pos.getX(i) * 0.91);
      pos.setZ(i, pos.getZ(i) * 0.91);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Declarative 6-row laptop keyboard layout (14.5u wide x 5.62u deep).
 * Returns physical coordinates within the keyboard well AND normalized legend bounds.
 */
function buildKeyboardLayout(wellW, wellD, centerZ) {
  const totalU = 14.5;
  const rowHeights = [0.62, 1.0, 1.0, 1.0, 1.0, 1.0];
  const totalV = rowHeights.reduce((acc, v) => acc + v, 0);
  const unitX = wellW / totalU;
  const unitZ = wellD / totalV;
  const gapX = 0.014;
  const gapZ = 0.014;

  const rows = [
    [
      { w: 1.5, label: 'esc', align: 'left' },
      { w: 1, label: 'F1' },
      { w: 1, label: 'F2' },
      { w: 1, label: 'F3' },
      { w: 1, label: 'F4' },
      { w: 1, label: 'F5' },
      { w: 1, label: 'F6' },
      { w: 1, label: 'F7' },
      { w: 1, label: 'F8' },
      { w: 1, label: 'F9' },
      { w: 1, label: 'F10' },
      { w: 1, label: 'F11' },
      { w: 1, label: 'F12' },
      { w: 1, label: '', touchId: true },
    ],
    [
      { w: 1, label: '~' },
      { w: 1, label: '1' },
      { w: 1, label: '2' },
      { w: 1, label: '3' },
      { w: 1, label: '4' },
      { w: 1, label: '5' },
      { w: 1, label: '6' },
      { w: 1, label: '7' },
      { w: 1, label: '8' },
      { w: 1, label: '9' },
      { w: 1, label: '0' },
      { w: 1, label: '-' },
      { w: 1, label: '=' },
      { w: 1.5, label: 'delete', align: 'right' },
    ],
    [
      { w: 1.5, label: 'tab', align: 'left' },
      { w: 1, label: 'Q' },
      { w: 1, label: 'W' },
      { w: 1, label: 'E' },
      { w: 1, label: 'R' },
      { w: 1, label: 'T' },
      { w: 1, label: 'Y' },
      { w: 1, label: 'U' },
      { w: 1, label: 'I' },
      { w: 1, label: 'O' },
      { w: 1, label: 'P' },
      { w: 1, label: '[' },
      { w: 1, label: ']' },
      { w: 1, label: '\\' },
    ],
    [
      { w: 1.75, label: 'caps', align: 'left' },
      { w: 1, label: 'A' },
      { w: 1, label: 'S' },
      { w: 1, label: 'D' },
      { w: 1, label: 'F' },
      { w: 1, label: 'G' },
      { w: 1, label: 'H' },
      { w: 1, label: 'J' },
      { w: 1, label: 'K' },
      { w: 1, label: 'L' },
      { w: 1, label: ';' },
      { w: 1, label: "'" },
      { w: 1.75, label: 'return', align: 'right' },
    ],
    [
      { w: 2.25, label: 'shift', align: 'left' },
      { w: 1, label: 'Z' },
      { w: 1, label: 'X' },
      { w: 1, label: 'C' },
      { w: 1, label: 'V' },
      { w: 1, label: 'B' },
      { w: 1, label: 'N' },
      { w: 1, label: 'M' },
      { w: 1, label: ',' },
      { w: 1, label: '.' },
      { w: 1, label: '/' },
      { w: 2.25, label: 'shift', align: 'right' },
    ],
    [
      { w: 1, label: 'fn', align: 'left' },
      { w: 1, label: 'ctrl' },
      { w: 1, label: '⌥' },
      { w: 1.25, label: '⌘' },
      { w: 5.0, label: '' },
      { w: 1.25, label: '⌘' },
      { w: 1, label: '⌥' },
      { w: 1, label: '◀', halfRow: 'bottom' },
      { w: 1, label: '▲', halfRow: 'top', stackedArrowDown: '▼' },
      { w: 1, label: '▶', halfRow: 'bottom' },
    ],
  ];

  const keys = [];
  let cursorV = 0;

  rows.forEach((row, rIdx) => {
    const rowUHeight = rowHeights[rIdx];
    let cursorU = 0;

    row.forEach((spec) => {
      const kw = spec.w * unitX - gapX;
      const cx = -wellW / 2 + (cursorU + spec.w / 2) * unitX;
      const uNorm = (cursorU + spec.w / 2) / totalU;
      const wNorm = kw / wellW;

      if (spec.stackedArrowDown) {
        const subH = (rowUHeight * unitZ - gapZ * 1.45) * 0.5;
        const topCz = centerZ - wellD / 2 + (cursorV + rowUHeight * 0.25) * unitZ;
        const botCz = centerZ - wellD / 2 + (cursorV + rowUHeight * 0.75) * unitZ;

        keys.push({
          x: cx,
          z: topCz,
          w: kw,
          d: subH,
          uNorm,
          vNorm: (cursorV + rowUHeight * 0.25) / totalV,
          wNorm,
          hNorm: subH / wellD,
          label: spec.label,
          small: true,
        });
        keys.push({
          x: cx,
          z: botCz,
          w: kw,
          d: subH,
          uNorm,
          vNorm: (cursorV + rowUHeight * 0.75) / totalV,
          wNorm,
          hNorm: subH / wellD,
          label: spec.stackedArrowDown,
          small: true,
        });
      } else if (spec.halfRow === 'bottom') {
        const subH = (rowUHeight * unitZ - gapZ * 1.45) * 0.5;
        const botCz = centerZ - wellD / 2 + (cursorV + rowUHeight * 0.75) * unitZ;
        keys.push({
          x: cx,
          z: botCz,
          w: kw,
          d: subH,
          uNorm,
          vNorm: (cursorV + rowUHeight * 0.75) / totalV,
          wNorm,
          hNorm: subH / wellD,
          label: spec.label,
          small: true,
        });
      } else {
        const kd = rowUHeight * unitZ - gapZ;
        const cz = centerZ - wellD / 2 + (cursorV + rowUHeight / 2) * unitZ;
        keys.push({
          x: cx,
          z: cz,
          w: kw,
          d: kd,
          uNorm,
          vNorm: (cursorV + rowUHeight / 2) / totalV,
          wNorm,
          hNorm: kd / wellD,
          label: spec.label,
          align: spec.align || 'center',
          touchId: Boolean(spec.touchId),
          small: rIdx === 0 || spec.label.length > 2,
        });
      }

      cursorU += spec.w;
    });

    cursorV += rowUHeight;
  });

  return keys;
}

/**
 * Generates crisp transparent keycap legend overlay synced 1:1 with the 3D key instances.
 */
function createKeyboardLegendTexture(keys) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 420;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.textBaseline = 'middle';

    keys.forEach((k) => {
      const px = k.uNorm * c.width;
      const py = k.vNorm * c.height;
      const kw = k.wNorm * c.width * 0.88;
      const kh = k.hNorm * c.height * 0.88;

      if (k.touchId) {
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, Math.min(kw, kh) * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        return;
      }

      if (!k.label) return;

      ctx.fillStyle = 'rgba(232, 238, 248, 0.82)';
      const fontSize = k.small ? 11.5 : 15;
      ctx.font = `600 ${fontSize}px "Inter", "Segoe UI", sans-serif`;

      if (k.align === 'left') {
        ctx.textAlign = 'left';
        ctx.fillText(k.label, px - kw * 0.38, py + kh * 0.14);
      } else if (k.align === 'right') {
        ctx.textAlign = 'right';
        ctx.fillText(k.label, px + kw * 0.38, py + kh * 0.14);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(k.label, px, py);
      }
    });
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  return tex;
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
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 124);
    g.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
    g.addColorStop(0.5, 'rgba(0, 0, 0, 0.34)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
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

    const scale = Math.min((w * 0.84) / 1600, (h * 0.84) / 1000);
    const dw = 1600 * scale;
    const dh = 1000 * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;

    ctx.fillStyle = '#1b1f27';
    drawRoundedRect(ctx, dx - 12, dy - 12, dw + 24, dh + 24, 14, '#1b1f27', 'rgba(255, 255, 255, 0.2)');
    ctx.drawImage(screenCanvas, dx, dy, dw, dh);
  }

  drawStatic();
  window.addEventListener('resize', drawStatic, { passive: true });
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
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const studioEnvRT = createStudioEnvironment(renderer);
  scene.environment = studioEnvRT.texture;
  scene.environmentIntensity = 1.15;

  const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 40);
  camera.position.set(0, 0.65, 5.4);

  // Neutral Photographic Studio Lighting
  const hemiLight = new THREE.HemisphereLight(0xdce7f7, 0x191d26, 0.5);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffcf8, 1.65);
  keyLight.position.set(3.8, 6.2, 4.8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.normalBias = 0.015;
  keyLight.shadow.camera.left = -3;
  keyLight.shadow.camera.right = 3;
  keyLight.shadow.camera.top = 3;
  keyLight.shadow.camera.bottom = -3;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 16;
  scene.add(keyLight);

  const rimCool = new THREE.DirectionalLight(0xc7dcf5, 0.85);
  rimCool.position.set(-4.8, 3.2, -3.8);
  scene.add(rimCool);

  const edgeWarm = new THREE.DirectionalLight(0xffe7d4, 0.65);
  edgeWarm.position.set(4.6, 1.8, -4.0);
  scene.add(edgeWarm);

  // Studio Stage & Clean Shadow Floor (zero floor ring)
  const stageGroup = new THREE.Group();
  scene.add(stageGroup);

  const shadowMat = new THREE.MeshBasicMaterial({
    map: createShadowDiscTexture(),
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 3.8), shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = -1.045;
  stageGroup.add(shadowMesh);

  const shadowReceiver = new THREE.Mesh(
    new THREE.PlaneGeometry(7.0, 6.0),
    new THREE.ShadowMaterial({ opacity: 0.3 })
  );
  shadowReceiver.rotation.x = -Math.PI / 2;
  shadowReceiver.position.y = -1.042;
  shadowReceiver.receiveShadow = true;
  stageGroup.add(shadowReceiver);

  // Root Laptop Assembly
  const laptopRoot = new THREE.Group();
  stageGroup.add(laptopRoot);

  // Screen bounce light onto keyboard & palmrest
  const screenBounceLight = new THREE.PointLight(0x9bc4f0, 0.45, 3.2, 2);
  screenBounceLight.position.set(0, 1.02, -0.5);
  laptopRoot.add(screenBounceLight);

  // Space Gray / Titanium Anodized PBR Materials
  const { roughnessMap, bumpMap } = createBrushedMetalMaps();

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x5c6370,
    metalness: 0.88,
    roughness: 0.3,
    roughnessMap,
    bumpMap,
    bumpScale: 0.002,
    clearcoat: 0.08,
    clearcoatRoughness: 0.38,
  });

  const bottomCaseMat = new THREE.MeshPhysicalMaterial({
    color: 0x4c525e,
    metalness: 0.86,
    roughness: 0.35,
    roughnessMap,
    bumpMap,
    bumpScale: 0.002,
  });

  const chamferMat = new THREE.MeshStandardMaterial({
    color: 0x9aa4b4,
    metalness: 0.95,
    roughness: 0.16,
  });

  const darkAnodizedMat = new THREE.MeshStandardMaterial({
    color: 0x14171e,
    metalness: 0.42,
    roughness: 0.56,
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x0f1116,
    metalness: 0.02,
    roughness: 0.88,
  });

  const keycapMat = new THREE.MeshStandardMaterial({
    color: 0x161920,
    metalness: 0.08,
    roughness: 0.52,
  });

  const trackpadGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x4b525f,
    metalness: 0.2,
    roughness: 0.18,
    clearcoat: 0.65,
    clearcoatRoughness: 0.16,
  });

  const displayGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.11,
    roughness: 0.04,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.55,
    depthWrite: false,
  });

  // =========================================================
  // 1. UNIBODY CHASSIS (Sculpted Top Deck + Tapered Bottom)
  // =========================================================
  const baseW = 3.24;
  const baseD = 2.2;

  // Top deck spans y in [+0.002, +0.058]
  const topDeckGeo = createTopDeckGeometry(baseW, baseD, 0.056, 0.115, 0.009, 0.008);
  const topDeckMesh = new THREE.Mesh(topDeckGeo, bodyMat);
  topDeckMesh.position.set(0, 0.03, 0);
  topDeckMesh.castShadow = true;
  topDeckMesh.receiveShadow = true;
  laptopRoot.add(topDeckMesh);

  // Tapered bottom hull spans y in [-0.058, +0.012]
  const bottomGeo = createTaperedBottomGeometry(3.222, 2.182, 0.07);
  const bottomMesh = new THREE.Mesh(bottomGeo, bottomCaseMat);
  bottomMesh.position.set(0, -0.023, 0);
  bottomMesh.castShadow = true;
  bottomMesh.receiveShadow = true;
  laptopRoot.add(bottomMesh);

  // Front thumb scoop machined floor & chamfer rim inside the concave notch
  const scoopFloor = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.026, 0.058), darkAnodizedMat);
  scoopFloor.position.set(0, 0.023, 1.066);
  scoopFloor.receiveShadow = true;
  laptopRoot.add(scoopFloor);

  const scoopRim = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.004, 0.01), chamferMat);
  scoopRim.position.set(0, 0.037, 1.091);
  laptopRoot.add(scoopRim);

  // =========================================================
  // 2. SUNKEN KEYBOARD WELL, BACKLIGHT, KEYCAPS & LEGENDS
  // =========================================================
  const kbCenterZ = -0.24;
  const kbWellFloor = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.02, 1.06), darkAnodizedMat);
  kbWellFloor.position.set(0, 0.039, kbCenterZ);
  kbWellFloor.receiveShadow = true;
  laptopRoot.add(kbWellFloor);

  const backlightMat = new THREE.MeshBasicMaterial({
    color: 0xdbeafe,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const backlightPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.48, 0.99), backlightMat);
  backlightPlane.rotation.x = -Math.PI / 2;
  backlightPlane.position.set(0, 0.0496, kbCenterZ);
  laptopRoot.add(backlightPlane);

  const kbWellW = 2.46;
  const kbWellD = 0.97;
  const keyLayout = buildKeyboardLayout(kbWellW, kbWellD, kbCenterZ);
  const keyGeo = createUnitKeycapGeometry();
  const keysMesh = new THREE.InstancedMesh(keyGeo, keycapMat, keyLayout.length);
  keysMesh.castShadow = true;
  keysMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  keyLayout.forEach((k, idx) => {
    dummy.position.set(k.x, 0.049, k.z);
    dummy.scale.set(k.w, 0.011, k.d);
    dummy.updateMatrix();
    keysMesh.setMatrixAt(idx, dummy.matrix);
  });
  keysMesh.instanceMatrix.needsUpdate = true;
  laptopRoot.add(keysMesh);

  // Aligned keyboard legends overlay
  const legendTex = createKeyboardLegendTexture(keyLayout);
  const legendPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(kbWellW, kbWellD),
    new THREE.MeshBasicMaterial({
      map: legendTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
  );
  legendPlane.rotation.x = -Math.PI / 2;
  legendPlane.position.set(0, 0.0604, kbCenterZ);
  laptopRoot.add(legendPlane);

  // =========================================================
  // 3. SPEAKER GRILLES & GLASS TRACKPAD
  // =========================================================
  const speakerTex = createSpeakerGrilleTexture();
  const speakerMat = new THREE.MeshStandardMaterial({
    map: speakerTex,
    transparent: true,
    roughness: 0.7,
    metalness: 0.2,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  for (const side of [-1, 1]) {
    const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1.0), speakerMat);
    grille.rotation.x = -Math.PI / 2;
    grille.position.set(side * 1.41, 0.0585, kbCenterZ);
    laptopRoot.add(grille);
  }

  // Sunken Trackpad cavity floor + glass pad
  const tpFloor = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.012, 0.7), darkAnodizedMat);
  tpFloor.position.set(0, 0.0505, 0.68);
  laptopRoot.add(tpFloor);

  const trackpadGeo = createExtrudedRoundedPlate(1.12, 0.66, 0.008, 0.04, 0.002, 0.002);
  const trackpadMesh = new THREE.Mesh(trackpadGeo, trackpadGlassMat);
  trackpadMesh.position.set(0, 0.054, 0.68);
  trackpadMesh.receiveShadow = true;
  laptopRoot.add(trackpadMesh);

  // =========================================================
  // 4. DETAILED LEFT & RIGHT I/O PORTS
  // =========================================================
  const addUsbCPort = (side, zPos) => {
    const portGroup = new THREE.Group();
    portGroup.position.set(side * 1.62, 0.03, zPos);

    const rimGeo = createExtrudedRoundedPlate(0.01, 0.115, 0.034, 0.014, 0.0015, 0.0015);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, chamferMat);
    portGroup.add(rim);

    const cavity = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.022, 0.095), rubberMat);
    cavity.position.x = side * 0.001;
    portGroup.add(cavity);

    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.005, 0.068), chamferMat);
    tongue.position.x = side * 0.0015;
    portGroup.add(tongue);

    laptopRoot.add(portGroup);
  };

  // Left side: MagSafe + 2x USB-C + 3.5mm Audio Jack
  {
    const magGroup = new THREE.Group();
    magGroup.position.set(-1.62, 0.03, -0.68);
    const magRim = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.036, 0.145), chamferMat);
    const magCavity = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.024, 0.125), rubberMat);
    magGroup.add(magRim, magCavity);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xe6b963, metalness: 0.9, roughness: 0.25 });
    for (let p = -2; p <= 2; p++) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.013, 8), pinMat);
      pin.rotation.z = Math.PI / 2;
      pin.position.set(-0.001, 0, p * 0.018);
      magGroup.add(pin);
    }
    laptopRoot.add(magGroup);

    addUsbCPort(-1, -0.44);
    addUsbCPort(-1, -0.24);

    // 3.5mm Headphone jack
    const jackGroup = new THREE.Group();
    jackGroup.position.set(-1.62, 0.03, -0.04);
    const jackRing = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.01, 16), chamferMat);
    jackRing.rotation.z = Math.PI / 2;
    const jackBore = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.013, 16), rubberMat);
    jackBore.rotation.z = Math.PI / 2;
    jackGroup.add(jackRing, jackBore);
    laptopRoot.add(jackGroup);
  }

  // Right side: HDMI + 1x USB-C + SDXC Card Reader
  {
    const hdmiGroup = new THREE.Group();
    hdmiGroup.position.set(1.62, 0.03, -0.58);
    const hdmiRim = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.04, 0.165), chamferMat);
    const hdmiCav = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.028, 0.145), rubberMat);
    const hdmiBar = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.006, 0.11), chamferMat);
    hdmiGroup.add(hdmiRim, hdmiCav, hdmiBar);
    laptopRoot.add(hdmiGroup);

    addUsbCPort(1, -0.34);

    // SDXC Slot
    const sdGroup = new THREE.Group();
    sdGroup.position.set(1.62, 0.03, -0.08);
    const sdRim = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.026, 0.24), chamferMat);
    const sdSlot = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.014, 0.22), rubberMat);
    sdGroup.add(sdRim, sdSlot);
    laptopRoot.add(sdGroup);
  }

  // =========================================================
  // 5. BOTTOM RUBBER FEET, COOLING INTAKE, SCREWS & ETCHING
  // =========================================================
  const footOffsets = [
    [-1.22, -0.76],
    [1.22, -0.76],
    [-1.22, 0.76],
    [1.22, 0.76],
  ];
  footOffsets.forEach(([fx, fz]) => {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.112, 0.008, 24), chamferMat);
    ring.position.set(fx, -0.056, fz);
    laptopRoot.add(ring);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.094, 0.014, 24), rubberMat);
    pad.position.set(fx, -0.06, fz);
    pad.castShadow = true;
    laptopRoot.add(pad);
  });

  // Side-bottom thermal intake slots
  for (const side of [-1, 1]) {
    for (let s = 0; s < 3; s++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.01, 0.14), rubberMat);
      vent.position.set(side * 1.48, -0.038, -0.35 + s * 0.18);
      vent.rotation.z = side * 0.45;
      laptopRoot.add(vent);
    }
  }

  // 8 instanced perimeter pentalobe screws
  const screwPts = [
    [-1.36, -0.9],
    [-0.48, -0.93],
    [0.48, -0.93],
    [1.36, -0.9],
    [-1.36, 0.88],
    [-0.48, 0.91],
    [0.48, 0.91],
    [1.36, 0.88],
  ];
  const screwGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.003, 12);
  const screwsMesh = new THREE.InstancedMesh(screwGeo, chamferMat, screwPts.length);
  screwPts.forEach(([sx, sz], i) => {
    dummy.position.set(sx, -0.058, sz);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    screwsMesh.setMatrixAt(i, dummy.matrix);
  });
  screwsMesh.instanceMatrix.needsUpdate = true;
  laptopRoot.add(screwsMesh);

  // Subtle bottom etching
  const bottomEtching = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.35),
    new THREE.MeshBasicMaterial({
      map: createBottomEtchingTexture(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    })
  );
  bottomEtching.rotation.x = Math.PI / 2;
  bottomEtching.position.set(0, -0.0585, 0.16);
  laptopRoot.add(bottomEtching);

  // =========================================================
  // 6. BLACK ANODIZED CLUTCH HINGE & EXHAUST
  // =========================================================
  const hingeClutch = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 2.36, 20), darkAnodizedMat);
  hingeClutch.rotation.z = Math.PI / 2;
  hingeClutch.position.set(0, 0.068, -1.035);
  laptopRoot.add(hingeClutch);

  for (const side of [-1, 1]) {
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.024, 0.08), bodyMat);
    shoulder.position.set(side * 1.26, 0.066, -1.035);
    laptopRoot.add(shoulder);
  }

  // Rear exhaust grille
  const rearExhaust = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.018, 0.015), rubberMat);
  rearExhaust.position.set(0, 0.044, -1.095);
  laptopRoot.add(rearExhaust);

  // =========================================================
  // 7. DISPLAY LID ASSEMBLY (Unibody Shell, Monogram WR, OLED, Notch & Glass)
  // =========================================================
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.085, -1.035);
  laptopRoot.add(lidPivot);

  const lidW = 3.24;
  const lidH = 2.15;
  const lidDepth = 0.036;
  const lidCenterY = 1.06; // spans [-0.015, +2.135]

  const lidShellGeo = createExtrudedRoundedPlate(lidW, lidH, lidDepth, 0.115, 0.008, 0.008);
  lidShellGeo.rotateX(-Math.PI / 2);
  const lidShell = new THREE.Mesh(lidShellGeo, bodyMat);
  lidShell.position.set(0, lidCenterY, 0);
  lidShell.castShadow = true;
  lidShell.receiveShadow = true;
  lidPivot.add(lidShell);

  // Clean metallic WR monogram directly on brushed back aluminum (zero rectangular plate)
  const monogramTex = createLidMonogramTexture();
  const monogramMat = new THREE.MeshPhysicalMaterial({
    map: monogramTex,
    color: 0xe6ecf5,
    transparent: true,
    metalness: 0.96,
    roughness: 0.12,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const lidMonogram = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), monogramMat);
  lidMonogram.rotation.y = Math.PI;
  lidMonogram.position.set(0, lidCenterY + 0.02, -lidDepth / 2 - 0.0005);
  lidPivot.add(lidMonogram);

  // Thin perimeter rubber screen gasket
  const gasketMesh = new THREE.Mesh(createRoundedPlaneGeometry(3.2, 2.1, 0.095), rubberMat);
  gasketMesh.position.set(0, lidCenterY, lidDepth / 2 + 0.0005);
  lidPivot.add(gasketMesh);

  // Glossy black display bezel
  const bezelMesh = new THREE.Mesh(
    createRoundedPlaneGeometry(3.15, 2.05, 0.075),
    new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.22, metalness: 0.15 })
  );
  bezelMesh.position.set(0, lidCenterY, lidDepth / 2 + 0.0014);
  lidPivot.add(bezelMesh);

  // Active 16:10 OLED Screen (1600x1000)
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.generateMipmaps = true;
  screenTex.minFilter = THREE.LinearMipmapLinearFilter;
  screenTex.magFilter = THREE.LinearFilter;
  screenTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  screenTex.wrapS = THREE.ClampToEdgeWrapping;
  screenTex.wrapT = THREE.ClampToEdgeWrapping;
  screenTex.needsUpdate = true;

  const screenMat = new THREE.MeshBasicMaterial({
    map: screenTex,
    color: new THREE.Color(0xffffff),
    toneMapped: false,
  });
  const screenW = 3.01;
  const screenH = 1.881;
  const screenCenterY = 1.095;
  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), screenMat);
  screenMesh.position.set(0, screenCenterY, lidDepth / 2 + 0.0025);
  lidPivot.add(screenMesh);

  // Camera Notch + Lens + Sensor + Status LED
  const notchH = 0.056;
  const notchMesh = new THREE.Mesh(
    createNotchGeometry(0.34, notchH, 0.016),
    new THREE.MeshBasicMaterial({ color: 0x050608 })
  );
  notchMesh.position.set(0, screenCenterY + screenH / 2 - notchH / 2, lidDepth / 2 + 0.0036);
  lidPivot.add(notchMesh);

  const camLensBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.003, 18), chamferMat);
  camLensBezel.rotation.x = Math.PI / 2;
  camLensBezel.position.set(0, screenCenterY + screenH / 2 - notchH / 2, lidDepth / 2 + 0.004);
  lidPivot.add(camLensBezel);

  const camGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.004, 16),
    new THREE.MeshPhysicalMaterial({ color: 0x0c1b36, metalness: 0.2, roughness: 0.06, clearcoat: 1 })
  );
  camGlass.rotation.x = Math.PI / 2;
  camGlass.position.set(0, screenCenterY + screenH / 2 - notchH / 2, lidDepth / 2 + 0.0044);
  lidPivot.add(camGlass);

  const camLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0 });
  const camLed = new THREE.Mesh(new THREE.CircleGeometry(0.004, 12), camLedMat);
  camLed.position.set(0.036, screenCenterY + screenH / 2 - notchH / 2, lidDepth / 2 + 0.0048);
  lidPivot.add(camLed);

  // Full-panel reflective glass overlay
  const displayGlassMesh = new THREE.Mesh(createRoundedPlaneGeometry(3.14, 2.04, 0.072), displayGlassMat);
  displayGlassMesh.position.set(0, lidCenterY, lidDepth / 2 + 0.0055);
  lidPivot.add(displayGlassMesh);

  // =========================================================
  // 8. SCROLL CHOREOGRAPHY + 360° DRAG (DESKTOP & MOBILE)
  // =========================================================
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const phaseBtns = Array.from(document.querySelectorAll('.sf-phase-btn'));
  const PHASE_TARGETS = [0.24, 0.56, 0.96];
  let targetP = prefersReducedMotion ? 0.5 : 0;
  let currentP = targetP;
  let targetYaw = 0;
  let currentYaw = 0;
  let targetPitch = 0;
  let currentPitch = 0;
  let targetParallaxX = 0;
  let targetParallaxY = 0;
  let curParallaxX = 0;
  let curParallaxY = 0;
  let manualPhaseLock = false;
  let lockScrollY = window.scrollY;
  let isVisible = true;
  let rafId = 0;
  let wasDesktopWide = window.innerWidth > 980;

  function applyPose(p) {
    const aspect = camera.aspect || 16 / 9;
    const isDesktopWide = window.innerWidth > 980;
    const vTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const minVerticalZ = 1.48 / (vTan * 0.72);
    const minHorizontalZ = aspect < 1.4 ? 2.05 / (vTan * aspect * 0.86) : 0;
    const baseFitZ = Math.max(minVerticalZ, minHorizontalZ);

    let openFactor = 1;

    if (!isDesktopWide) {
      const openT = easeOutCubic(clamp(p / 0.18, 0, 1));
      lidPivot.rotation.x = lerp(0.85, -0.18, openT);
      openFactor = openT;

      if (p <= 0.33) {
        const t = easeInOutCubic(p / 0.33);
        laptopRoot.rotation.y = lerp(-0.42, -0.22, t) + currentYaw;
      } else if (p <= 0.68) {
        const t = easeInOutCubic((p - 0.33) / 0.35);
        laptopRoot.rotation.y = lerp(-0.22, 0.22, t) + currentYaw;
      } else {
        const t = easeInOutCubic((p - 0.68) / 0.32);
        laptopRoot.rotation.y = lerp(0.22, 0.0, t) + currentYaw;
      }

      laptopRoot.rotation.x = lerp(0.22, 0.12, p);
      laptopRoot.position.y = -0.82;
      stageGroup.position.x = 0;
      camera.position.z = lerp(baseFitZ * 0.96, baseFitZ * 0.84, p);
      camera.position.y = 0.34;
      screenMat.color.setScalar(1.0);
    } else if (p <= 0.294) {
      // Desktop Phase 1: open lid from closed anodized shell
      const t = easeOutCubic(p / 0.294);
      lidPivot.rotation.x = lerp(1.572, -0.19, t);
      openFactor = t;
      laptopRoot.rotation.y = lerp(-0.55, 0.16, t) + currentYaw + curParallaxY;
      laptopRoot.rotation.x = clamp(lerp(0.36, 0.18, t) + currentPitch + curParallaxX, -0.25, 0.72);
      laptopRoot.position.y = lerp(-0.68, -0.82, t);
      stageGroup.position.x = lerp(0.32, 0.62, t);
      camera.position.z = lerp(baseFitZ * 1.04, baseFitZ * 0.98, t);
      camera.position.y = lerp(0.52, 0.4, t);
      screenMat.color.setScalar(lerp(0.25, 1.0, t));
    } else if (p <= 0.756) {
      // Desktop Phase 2: full 360° studio turntable
      const t = (p - 0.294) / (0.756 - 0.294);
      const smoothT = easeInOutCubic(t);
      lidPivot.rotation.x = -0.19;
      laptopRoot.rotation.y = 0.16 + smoothT * Math.PI * 2 + currentYaw + curParallaxY;
      laptopRoot.rotation.x = clamp(0.18 + Math.sin(smoothT * Math.PI) * 0.06 + currentPitch + curParallaxX, -0.25, 0.72);
      laptopRoot.position.y = -0.82;
      stageGroup.position.x = 0.62;
      camera.position.z = baseFitZ * 0.98 + Math.sin(smoothT * Math.PI) * 0.45;
      camera.position.y = 0.4;
      screenMat.color.setScalar(1.0);
    } else {
      // Desktop Phase 3: front executive zoom lock-in
      const t = easeInOutCubic((p - 0.756) / (1.0 - 0.756));
      lidPivot.rotation.x = lerp(-0.19, -0.14, t);
      laptopRoot.rotation.y = lerp(0.16 + Math.PI * 2, -0.05 + Math.PI * 2, t) + currentYaw + curParallaxY;
      laptopRoot.rotation.x = clamp(lerp(0.18, 0.12, t) + currentPitch + curParallaxX, -0.25, 0.72);
      laptopRoot.position.y = lerp(-0.82, -0.86, t);
      stageGroup.position.x = lerp(0.62, 0.72, t);
      camera.position.z = lerp(baseFitZ * 0.98, baseFitZ * 0.86, t);
      camera.position.y = lerp(0.4, 0.3, t);
      screenMat.color.setScalar(1.0);
    }

    // Dynamic screen bounce light, keyboard backlight & subtle webcam LED when open
    screenBounceLight.intensity = 0.48 * openFactor;
    backlightMat.opacity = 0.28 * openFactor;
    camLedMat.opacity = openFactor > 0.25 ? 0.82 : 0;

    camera.lookAt(0, 0.12, 0);
  }

  function updateHud(p) {
    if (scrubberFillEl) {
      scrubberFillEl.style.width = `${(p * 100).toFixed(2)}%`;
    }
    const step = p < 0.33 ? 0 : p < 0.68 ? 1 : 2;
    captions.forEach((cap) => {
      cap.classList.toggle('is-active', Number(cap.dataset.sfStep) === step);
    });
    phaseBtns.forEach((btn) => {
      const active = Number(btn.dataset.sfTarget) === step;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
  }

  function computeScrollProgress() {
    const rect = shell.getBoundingClientRect();
    const scrollable = shell.offsetHeight - window.innerHeight;
    if (scrollable > 80) {
      return clamp(-rect.top / scrollable, 0, 1);
    }
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
    const yawDiff = targetYaw - currentYaw;
    const pitchDiff = targetPitch - currentPitch;
    const pxDiff = targetParallaxX - curParallaxX;
    const pyDiff = targetParallaxY - curParallaxY;
    if (
      Math.abs(diff) > 0.00025 ||
      Math.abs(yawDiff) > 0.0005 ||
      Math.abs(pitchDiff) > 0.0005 ||
      Math.abs(pxDiff) > 0.0004 ||
      Math.abs(pyDiff) > 0.0004
    ) {
      currentP += diff * 0.16;
      currentYaw += yawDiff * 0.16;
      currentPitch += pitchDiff * 0.16;
      curParallaxX += pxDiff * 0.1;
      curParallaxY += pyDiff * 0.1;
      renderFrame();
      if (isVisible) {
        rafId = window.requestAnimationFrame(tick);
      }
    } else if (
      currentP !== targetP ||
      currentYaw !== targetYaw ||
      currentPitch !== targetPitch ||
      curParallaxX !== targetParallaxX ||
      curParallaxY !== targetParallaxY
    ) {
      currentP = targetP;
      currentYaw = targetYaw;
      currentPitch = targetPitch;
      curParallaxX = targetParallaxX;
      curParallaxY = targetParallaxY;
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
    const isDesktopWide = window.innerWidth > 980;
    const maxDpr = isDesktopWide ? 2 : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    if (isDesktopWide !== wasDesktopWide) {
      wasDesktopWide = isDesktopWide;
      targetYaw = 0;
      currentYaw = 0;
      targetPitch = 0;
      currentPitch = 0;
      if (isDesktopWide) {
        manualPhaseLock = false;
      } else {
        targetParallaxX = 0;
        targetParallaxY = 0;
        curParallaxX = 0;
        curParallaxY = 0;
      }
    }
    renderFrame();
  }

  // Subtle Desktop Mouse Parallax (> 980px fine pointers only, paused during drag)
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartYaw = 0;
  let dragStartPitch = 0;
  let dragAxis = null;
  let isDesktopDrag = false;

  if (finePointer && !prefersReducedMotion) {
    window.addEventListener(
      'pointermove',
      (e) => {
        if (!isVisible || window.innerWidth <= 980 || e.pointerType === 'touch' || isDesktopDrag) return;
        const nx = clamp((e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2, -1, 1);
        const ny = clamp((e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2, -1, 1);
        targetParallaxY = nx * 0.14;
        targetParallaxX = ny * 0.06;
        scheduleRender();
      },
      { passive: true }
    );

    document.addEventListener('pointerleave', () => {
      targetParallaxX = 0;
      targetParallaxY = 0;
      scheduleRender();
    });
  }

  // Mobile Phase Pills Controller
  phaseBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.sfTarget);
      if (Number.isNaN(idx) || PHASE_TARGETS[idx] === undefined) return;
      manualPhaseLock = true;
      lockScrollY = window.scrollY;
      targetP = PHASE_TARGETS[idx];
      targetYaw = 0;
      targetPitch = 0;
      scheduleRender();
    });
  });

  // 360° Drag Inspection on Canvas (Desktop free 2-axis orbit + Mobile horizontal swipe)
  canvas.addEventListener('pointerdown', (e) => {
    const desktopPointer = window.innerWidth > 980 && e.pointerType !== 'touch';
    if (desktopPointer && e.button !== 0) return;

    dragPointerId = e.pointerId;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartYaw = targetYaw;
    dragStartPitch = targetPitch;
    dragAxis = null;
    isDesktopDrag = desktopPointer;

    if (desktopPointer) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Ignore capture errors
      }
      canvas.style.cursor = 'grabbing';
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (dragPointerId !== e.pointerId) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    if (isDesktopDrag) {
      targetYaw = dragStartYaw + dx * 0.0085;
      targetPitch = clamp(dragStartPitch + dy * 0.0045, -0.28, 0.38);
      scheduleRender();
      return;
    }

    if (dragAxis === null) {
      if (Math.hypot(dx, dy) < 6) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        dragAxis = 'x';
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          // Ignore capture errors
        }
        canvas.style.cursor = 'grabbing';
      } else {
        dragAxis = 'y';
        dragPointerId = null;
        return;
      }
    }
    if (dragAxis === 'x') {
      targetYaw = dragStartYaw + dx * 0.012;
      scheduleRender();
    }
  });

  const endCanvasDrag = () => {
    dragPointerId = null;
    dragAxis = null;
    isDesktopDrag = false;
    canvas.style.cursor = '';
  };
  canvas.addEventListener('pointerup', endCanvasDrag);
  canvas.addEventListener('pointercancel', endCanvasDrag);

  canvas.addEventListener('dblclick', () => {
    targetYaw = 0;
    targetPitch = 0;
    scheduleRender();
  });

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
        if (!manualPhaseLock) {
          targetP = computeScrollProgress();
        }
        scheduleRender();
      } else {
        manualPhaseLock = false;
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
      }
    },
    { rootMargin: '240px 0px' }
  );
  io.observe(shell);

  window.addEventListener(
    'scroll',
    () => {
      if (manualPhaseLock) {
        if (Math.abs(window.scrollY - lockScrollY) > 150) {
          manualPhaseLock = false;
        } else {
          return;
        }
      }
      targetP = computeScrollProgress();
      scheduleRender();
    },
    { passive: true }
  );

  // Sync initial scroll offset on reload and refresh screen once web fonts settle
  targetP = computeScrollProgress();
  currentP = targetP;
  renderFrame();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      createDashboardScreenCanvas(screenCanvas);
      screenTex.needsUpdate = true;
      renderFrame();
    });
  }
}
