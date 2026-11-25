(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     1. LENIS SMOOTH SCROLL (darkroom.engineering)
     ========================================================= */
  let lenis = null;
  if (!prefersReducedMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    window.__portfolioLenis = lenis;

    function rafLenis(time) {
      lenis.raf(time);
      requestAnimationFrame(rafLenis);
    }
    requestAnimationFrame(rafLenis);

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          event.preventDefault();
          lenis.scrollTo(targetEl, { offset: -72 });
        }
      });
    });
  }

  /* =========================================================
     2. PIXEL BUTTON (Imesh Dilshan Style)
     ========================================================= */
  document.querySelectorAll('.pixel-btn').forEach((btn) => {
    const grid = document.createElement('span');
    grid.className = 'pixel-grid';
    grid.setAttribute('aria-hidden', 'true');

    const totalCells = 30; // 10 x 3
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('span');
      cell.className = 'pixel-cell';
      const delay = ((i * 37) % 10) * 18;
      cell.style.transitionDelay = `${delay}ms`;
      grid.appendChild(cell);
    }
    btn.prepend(grid);
  });

  /* =========================================================
     3. TEXT SCRAMBLE (Aidan Looker Style)
     ========================================================= */
  const GLYPHS = '01/_#<>+=-*ABCDEF';

  function scrambleText(el) {
    const target = el.dataset.scramble || el.textContent.trim();
    if (prefersReducedMotion || el.dataset.scrambling === '1') return;

    el.dataset.scrambling = '1';
    let iteration = 0;
    const step = Math.max(0.5, target.length / 26);

    const timer = window.setInterval(() => {
      el.textContent = target
        .split('')
        .map((char, idx) => {
          if (char === ' ' || char === '\n') return char;
          if (idx < iteration) return target[idx];
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join('');

      iteration += step;
      if (iteration >= target.length) {
        window.clearInterval(timer);
        el.textContent = target;
        el.dataset.scrambling = '0';
      }
    }, 26);
  }

  const scrambleElements = document.querySelectorAll('[data-scramble]');
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            scrambleText(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    scrambleElements.forEach((el) => {
      observer.observe(el);
      if (el.tagName === 'A' || el.classList.contains('brand-code')) {
        el.addEventListener('mouseenter', () => scrambleText(el));
      }
    });
  }

  /* =========================================================
     4. HALFTONE PRO BACKDROP CANVAS
     ========================================================= */
  const halftoneCanvas = document.getElementById('halftone-canvas');
  if (halftoneCanvas) {
    const ctx = halftoneCanvas.getContext('2d');
    const mouse = { x: -9999, y: -9999 };
    let needsRender = true;

    function resizeHalftone() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      halftoneCanvas.width = Math.floor(window.innerWidth * dpr);
      halftoneCanvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      needsRender = true;
    }

    function drawHalftone() {
      if (needsRender) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const spacing = 22;
        ctx.clearRect(0, 0, w, h);

        for (let y = spacing / 2; y < h; y += spacing) {
          for (let x = spacing / 2; x < w; x += spacing) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.hypot(dx, dy);
            const influence = Math.max(0, 1 - dist / 240);
            const radius = 0.75 + influence * 2.1;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle =
              influence > 0.15
                ? `rgba(255, 90, 31, ${0.14 + influence * 0.42})`
                : 'rgba(244, 243, 239, 0.08)';
            ctx.fill();
          }
        }
        needsRender = false;
      }
      if (!prefersReducedMotion) {
        requestAnimationFrame(drawHalftone);
      }
    }

    window.addEventListener('resize', resizeHalftone);
    if (!prefersReducedMotion) {
      window.addEventListener('pointermove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        needsRender = true;
      });
    }
    resizeHalftone();
    drawHalftone();
  }

  /* =========================================================
     5. ATOMIC GLOBE (3D Particle & Orbital Canvas)
     ========================================================= */
  const globeCanvas = document.getElementById('atomic-globe');
  const globeToggle = document.getElementById('globe-toggle');

  if (globeCanvas) {
    const ctx = globeCanvas.getContext('2d');
    const points = [];
    const totalPoints = 220;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < totalPoints; i++) {
      const y = 1 - (i / (totalPoints - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      points.push({
        x: Math.cos(theta) * radiusAtY,
        y,
        z: Math.sin(theta) * radiusAtY,
        highlight: i % 17 === 0,
      });
    }

    let rotY = 0.4;
    let rotX = 0.25;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let isPaused = prefersReducedMotion;

    if (globeToggle && isPaused) {
      globeToggle.textContent = 'Retomar globo';
    }

    if (globeToggle) {
      globeToggle.addEventListener('click', () => {
        isPaused = !isPaused;
        globeToggle.textContent = isPaused ? 'Retomar globo' : 'Pausar globo';
      });
    }

    globeCanvas.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      globeCanvas.setPointerCapture(e.pointerId);
    });

    globeCanvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      rotY += dx * 0.008;
      rotX = Math.max(-1.1, Math.min(1.1, rotX + dy * 0.006));
      lastX = e.clientX;
      lastY = e.clientY;
      if (isPaused) renderGlobe();
    });

    globeCanvas.addEventListener('pointerup', () => {
      dragging = false;
    });

    function renderGlobe() {
      const w = globeCanvas.width;
      const h = globeCanvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = w * 0.34;

      ctx.clearRect(0, 0, w, h);

      // Orbital rings (Atomic aesthetic)
      ctx.save();
      ctx.translate(cx, cy);
      [0.42, -0.58, 1.15].forEach((tilt, idx) => {
        ctx.save();
        ctx.rotate(tilt + rotY * (idx % 2 === 0 ? 0.15 : -0.1));
        ctx.scale(1, 0.34);
        ctx.beginPath();
        ctx.arc(0, 0, radius * (1.22 + idx * 0.05), 0, Math.PI * 2);
        ctx.strokeStyle =
          idx === 0 ? 'rgba(255, 90, 31, 0.45)' : 'rgba(244, 243, 239, 0.14)';
        ctx.lineWidth = idx === 0 ? 1.5 : 1;
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const projected = points.map((p) => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;
        const scale = 2.6 / (2.6 - z2 * 0.85);
        return {
          sx: cx + x1 * radius * scale,
          sy: cy + y2 * radius * scale,
          z: z2,
          scale,
          highlight: p.highlight,
        };
      });

      projected.sort((a, b) => a.z - b.z);

      // Subtle data links between highlighted nodes on front hemisphere
      const frontHot = projected.filter((p) => p.highlight && p.z > -0.15);
      ctx.strokeStyle = 'rgba(255, 90, 31, 0.28)';
      ctx.lineWidth = 1;
      for (let i = 0; i < frontHot.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(frontHot[i].sx, frontHot[i].sy);
        ctx.lineTo(frontHot[i + 1].sx, frontHot[i + 1].sy);
        ctx.stroke();
      }

      projected.forEach((p) => {
        const alpha = Math.max(0.14, (p.z + 1.15) / 2.15);
        const dotR = (p.highlight ? 3.2 : 1.7) * p.scale;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = p.highlight
          ? `rgba(255, 90, 31, ${Math.min(1, alpha + 0.2)})`
          : `rgba(244, 243, 239, ${alpha * 0.82})`;
        ctx.fill();
      });
    }

    function animateGlobe() {
      if (!isPaused && !dragging) {
        rotY += 0.0045;
      }
      renderGlobe();
      requestAnimationFrame(animateGlobe);
    }

    renderGlobe();
    requestAnimationFrame(animateGlobe);
  }

  /* =========================================================
     6. MILK GLASS FOLDER TOGGLE + PRINT LIGHTBOX DIALOG
     ========================================================= */
  const folderBtn = document.getElementById('milk-folder-btn');
  const printsVault = document.getElementById('clube-gringas-prints');

  if (folderBtn && printsVault) {
    folderBtn.addEventListener('click', () => {
      const expanded = folderBtn.getAttribute('aria-expanded') === 'true';
      folderBtn.setAttribute('aria-expanded', String(!expanded));
      printsVault.classList.toggle('is-open', !expanded);
    });
  }

  const printDialog = document.getElementById('print-dialog');
  const dialogTitle = document.getElementById('dialog-title');
  const dialogImg = document.getElementById('dialog-img');
  const dialogDesc = document.getElementById('dialog-desc');

  document.querySelectorAll('.print-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const frame = trigger.querySelector('.print-frame');
      if (frame && frame.classList.contains('is-placeholder')) return;

      dialogTitle.textContent = trigger.dataset.printTitle || 'Print do Projeto';
      dialogImg.src = trigger.dataset.printSrc || '';
      dialogImg.alt = trigger.dataset.printTitle || 'Captura de tela do Clube Gringas';
      dialogDesc.textContent = trigger.dataset.printDesc || '';
      printDialog.showModal();
    });
  });

  // Fallback obrigatório para navegadores sem closedBy (Safari)
  if (printDialog && !('closedBy' in HTMLDialogElement.prototype)) {
    printDialog.addEventListener('click', (event) => {
      if (event.target !== printDialog) return;
      const rect = printDialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) printDialog.close();
    });
  }

  /* =========================================================
     7. 3D SPATIAL GALLERY (Studio Digital Style)
     ========================================================= */
  const spatialShell = document.getElementById('spatial-shell');
  const spatialStage = document.getElementById('spatial-stage');
  const spatialCards = Array.from(document.querySelectorAll('.spatial-card'));
  const spatialCounter = document.getElementById('spatial-counter');
  const prevBtn = document.getElementById('spatial-prev');
  const nextBtn = document.getElementById('spatial-next');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const spatialModeBtn = document.getElementById('spatial-mode-btn');
  const gridModeBtn = document.getElementById('grid-mode-btn');

  let activeIndex = 0;

  function getVisibleCards() {
    return spatialCards.filter((card) => !card.classList.contains('is-filtered-out'));
  }

  function layoutSpatial() {
    const visible = getVisibleCards();
    if (visible.length === 0) return;

    activeIndex = ((activeIndex % visible.length) + visible.length) % visible.length;

    visible.forEach((card, i) => {
      let offset = i - activeIndex;
      if (offset > visible.length / 2) offset -= visible.length;
      if (offset < -visible.length / 2) offset += visible.length;

      const absOffset = Math.abs(offset);
      const isCenter = offset === 0;
      card.classList.toggle('is-center', isCenter);

      const tx = offset * 285;
      const tz = -absOffset * 170;
      const ry = Math.max(-36, Math.min(36, offset * -22));
      const scale = Math.max(0.72, 1 - absOffset * 0.13);
      const opacity = absOffset > 2 ? 0 : Math.max(0.28, 1 - absOffset * 0.34);

      card.style.transform = `translate(-50%, -50%) translate3d(${tx}px, 0px, ${tz}px) rotateY(${ry}deg) scale(${scale})`;
      card.style.opacity = String(opacity);
      card.style.zIndex = String(20 - absOffset);
      card.style.pointerEvents = absOffset > 2 ? 'none' : 'auto';
    });

    if (spatialCounter) {
      const cur = String(activeIndex + 1).padStart(2, '0');
      const tot = String(visible.length).padStart(2, '0');
      spatialCounter.textContent = `${cur} / ${tot}`;
    }
  }

  spatialCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      if (spatialShell.classList.contains('is-grid')) return;
      if (e.target.closest('a, button')) return;
      const visible = getVisibleCards();
      const idx = visible.indexOf(card);
      if (idx !== -1 && idx !== activeIndex) {
        activeIndex = idx;
        layoutSpatial();
      }
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      activeIndex -= 1;
      layoutSpatial();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      activeIndex += 1;
      layoutSpatial();
    });
  }

  if (spatialStage) {
    spatialStage.addEventListener('keydown', (e) => {
      if (spatialShell.classList.contains('is-grid')) return;
      if (e.key === 'ArrowRight') {
        activeIndex += 1;
        layoutSpatial();
      } else if (e.key === 'ArrowLeft') {
        activeIndex -= 1;
        layoutSpatial();
      }
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.filter;
      filterButtons.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      spatialCards.forEach((card) => {
        const match = cat === 'all' || card.dataset.category === cat;
        card.classList.toggle('is-filtered-out', !match);
      });

      activeIndex = 0;
      layoutSpatial();
    });
  });

  if (spatialModeBtn && gridModeBtn && spatialShell) {
    spatialModeBtn.addEventListener('click', () => {
      spatialShell.classList.remove('is-grid');
      spatialModeBtn.classList.add('is-active');
      gridModeBtn.classList.remove('is-active');
      layoutSpatial();
    });

    gridModeBtn.addEventListener('click', () => {
      spatialShell.classList.add('is-grid');
      gridModeBtn.classList.add('is-active');
      spatialModeBtn.classList.remove('is-active');
    });
  }

  layoutSpatial();

  /* =========================================================
     8. LANYARD PASS PHYSICS (BuiltByKern Style)
     ========================================================= */
  const lanyardCard = document.getElementById('lanyard-card');
  const lanyardStrap = document.getElementById('lanyard-strap-path');
  const lanyardGlare = document.getElementById('lanyard-glare');

  if (lanyardCard && lanyardStrap) {
    let posX = 0;
    let posY = 0;
    let velX = 0;
    let velY = 0;
    let isDragging = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let startPosX = 0;
    let startPosY = 0;

    lanyardCard.addEventListener('pointerdown', (e) => {
      isDragging = true;
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      startPosX = posX;
      startPosY = posY;
      lanyardCard.setPointerCapture(e.pointerId);
    });

    lanyardCard.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const targetX = Math.max(-95, Math.min(95, startPosX + (e.clientX - startPointerX)));
      const targetY = Math.max(-40, Math.min(70, startPosY + (e.clientY - startPointerY)));
      velX = (targetX - posX) * 0.45;
      velY = (targetY - posY) * 0.45;
      posX = targetX;
      posY = targetY;
    });

    const releaseCard = () => {
      isDragging = false;
    };
    lanyardCard.addEventListener('pointerup', releaseCard);
    lanyardCard.addEventListener('pointercancel', releaseCard);

    function stepLanyard() {
      if (!isDragging) {
        // Spring return + pendulum damping
        const stiffness = 0.085;
        const damping = 0.88;
        velX = (velX - posX * stiffness) * damping;
        velY = (velY - posY * stiffness) * damping;
        posX += velX;
        posY += velY;
      }

      const rotZ = -posX * 0.22;
      const rotY = posX * 0.24;
      const rotX = -posY * 0.16;

      lanyardCard.style.transform = `translate3d(${posX.toFixed(2)}px, ${posY.toFixed(2)}px, 0) rotateZ(${rotZ.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg)`;

      // Update SVG lanyard strap curve dynamically
      const endX = 130 + posX;
      const endY = 128 + posY;
      const ctrlX = 130 + posX * 0.35;
      const ctrlY = 64 + Math.max(0, posY * 0.5);
      lanyardStrap.setAttribute('d', `M 130 0 Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`);

      if (lanyardGlare) {
        const gx = 50 + posX * 0.45;
        const gy = 30 + posY * 0.45;
        lanyardGlare.style.background = `radial-gradient(circle at ${gx.toFixed(1)}% ${gy.toFixed(1)}%, rgba(255, 255, 255, 0.26), transparent 55%)`;
      }

      if (!prefersReducedMotion) {
        requestAnimationFrame(stepLanyard);
      }
    }

    if (!prefersReducedMotion) {
      // Gentle initial swing impulse on load
      velX = 6;
      requestAnimationFrame(stepLanyard);
    }
  }
  /* =========================================================
     9. IN-SITE CASE STUDY DOSSIER MODAL (Dados do GitHub)
     ========================================================= */
  const caseDialog = document.getElementById('case-dialog');
  const caseCode = document.getElementById('case-dialog-code');
  const caseTitle = document.getElementById('case-dialog-title');
  const caseSubtitle = document.getElementById('case-dialog-subtitle');
  const caseHighlights = document.getElementById('case-highlights');
  const caseContextList = document.getElementById('case-context-list');
  const caseInsightsList = document.getElementById('case-insights-list');
  const caseArchText = document.getElementById('case-architecture-text');
  const caseTablesGrid = document.getElementById('case-tables-grid');
  const caseDaxList = document.getElementById('case-dax-list');
  const caseLiveDashboard = document.getElementById('case-live-dashboard');
  const caseLiveApp = document.getElementById('case-live-app');
  const caseTabs = document.querySelectorAll('.case-tab');
  const casePanels = document.querySelectorAll('.case-panel');

  function activateCaseTab(tabKey) {
    caseTabs.forEach((t) => {
      const active = t.dataset.caseTab === tabKey;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    casePanels.forEach((p) => {
      p.classList.toggle('is-active', p.id === `case-tab-${tabKey}`);
    });
  }

  caseTabs.forEach((tab) => {
    tab.addEventListener('click', () => activateCaseTab(tab.dataset.caseTab));
  });

  function openCaseDossier(caseId) {
    const casesMap = window.PORTFOLIO_CASES || {};
    const data = casesMap[caseId];
    if (!data || !caseDialog) return;

    caseCode.textContent = data.code;
    caseTitle.textContent = data.title;
    caseSubtitle.textContent = data.subtitle;

    caseHighlights.innerHTML = '';
    data.highlights.forEach((item) => {
      const box = document.createElement('div');
      box.className = 'case-kpi';
      const val = document.createElement('strong');
      val.textContent = item.value;
      const lbl = document.createElement('span');
      lbl.textContent = item.label;
      box.append(val, lbl);
      caseHighlights.appendChild(box);
    });

    caseContextList.innerHTML = '';
    data.businessContext.forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      caseContextList.appendChild(li);
    });

    caseInsightsList.innerHTML = '';
    data.insights.forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      caseInsightsList.appendChild(li);
    });

    caseArchText.textContent = data.architecture;

    caseTablesGrid.innerHTML = '';
    data.tables.forEach((tbl) => {
      const card = document.createElement('div');
      card.className = 'case-table-card';
      const role = document.createElement('span');
      role.className = 'table-role';
      role.textContent = tbl.role;
      const name = document.createElement('strong');
      name.textContent = tbl.name;
      const desc = document.createElement('p');
      desc.textContent = tbl.desc;
      card.append(role, name, desc);
      caseTablesGrid.appendChild(card);
    });

    caseDaxList.innerHTML = '';
    data.daxMeasures.forEach((measure) => {
      const wrap = document.createElement('div');
      wrap.className = 'case-dax-item';
      const head = document.createElement('header');
      head.textContent = measure.name;
      const pre = document.createElement('pre');
      pre.textContent = measure.code;
      wrap.append(head, pre);
      caseDaxList.appendChild(wrap);
    });

    caseLiveDashboard.dataset.openDashboard = caseId;
    if (data.liveAppUrl) {
      caseLiveApp.href = data.liveAppUrl;
      caseLiveApp.classList.remove('is-hidden');
    } else {
      caseLiveApp.classList.add('is-hidden');
    }

    activateCaseTab('negocio');
    if (lenis) lenis.stop();
    caseDialog.showModal();
  }

  window.openPortfolioCase = openCaseDossier;

  document.querySelectorAll('[data-open-case]').forEach((btn) => {
    btn.addEventListener('click', () => openCaseDossier(btn.dataset.openCase));
  });

  if (caseDialog) {
    caseDialog.addEventListener('close', () => {
      if (lenis) lenis.start();
    });

    // Fallback obrigatório de light-dismiss para navegadores sem suporte a closedby (ex.: Safari)
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      caseDialog.addEventListener('click', (event) => {
        if (event.target !== caseDialog) return;
        const rect = caseDialog.getBoundingClientRect();
        const inside =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!inside) caseDialog.close();
      });
    }
  }
})();
