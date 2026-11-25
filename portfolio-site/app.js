(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* =========================================================
     0. OS CLOCK (Retro-PC Live Brasilia Time)
     ========================================================= */
  const osClock = document.getElementById('os-clock');
  const mobileOsClock = document.getElementById('mobile-os-clock');
  if (osClock || mobileOsClock) {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    });
    const tickClock = () => {
      const label = `${formatter.format(new Date())} BRT`;
      if (osClock) osClock.textContent = label;
      if (mobileOsClock) mobileOsClock.textContent = label;
    };
    tickClock();
    window.setInterval(tickClock, 30000);
  }

  /* =========================================================
     1. LENIS SMOOTH SCROLL (Desktop >980px only; Touch stays native)
     ========================================================= */
  let lenis = null;
  const desktopFine = finePointer && window.innerWidth > 980;
  if (!prefersReducedMotion && desktopFine && typeof window.Lenis === 'function') {
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
  }

  function scrollToAnchor(targetEl) {
    if (!targetEl) return;
    if (lenis) {
      lenis.scrollTo(targetEl, { offset: -68 });
      return;
    }
    const y = targetEl.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({
      top: Math.max(0, y),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    if (anchor.closest('#mobile-drawer')) return;
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        event.preventDefault();
        scrollToAnchor(targetEl);
      }
    });
  });

  /* =========================================================
     1B. MOBILE SWIPEABLE NAVIGATION DRAWER & BOTTOM DOCK
     ========================================================= */
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawerClose = document.getElementById('mobile-drawer-close');
  if (mobileDrawer && mobileMenuBtn && mobileDrawerClose) {
    const scroller = mobileDrawer.querySelector('.mobile-drawer-scroller');
    const sheet = mobileDrawer.querySelector('.mobile-drawer-sheet');
    if (scroller && sheet) {
      let pendingTargetEl = null;

      async function openDrawer() {
        pendingTargetEl = null;
        if (!mobileDrawer.open) {
          mobileDrawer.showModal();
        }
        if (!CSS.supports('scroll-initial-target', 'nearest')) {
          scroller.scrollTo({ left: sheet.offsetWidth, behavior: 'instant' });
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        }
        if (mobileDrawer.open) {
          scroller.scrollTo({ left: 0, behavior: prefersReducedMotion ? 'instant' : 'auto' });
        }
      }

      function closeDrawer(targetEl = null) {
        pendingTargetEl = targetEl;
        if (!mobileDrawer.open) return;
        scroller.scrollTo({ left: sheet.offsetWidth, behavior: prefersReducedMotion ? 'instant' : 'auto' });
      }

      if (!CSS.supports('animation-timeline: scroll()')) {
        scroller.addEventListener(
          'scroll',
          () => {
            const w = Math.max(1, sheet.offsetWidth);
            const ratio = Math.max(0, Math.min(1, 1 - scroller.scrollLeft / w));
            mobileDrawer.style.setProperty('--drawer-backdrop', ratio.toFixed(3));
          },
          { passive: true }
        );
      }

      const visibleThreshold = 1 / Math.max(320, window.innerWidth);
      const drawerObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries.at(-1);
          if (!entry) return;
          if (entry.intersectionRatio < visibleThreshold && mobileDrawer.open) {
            mobileDrawer.close();
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            if (pendingTargetEl) {
              const target = pendingTargetEl;
              pendingTargetEl = null;
              window.requestAnimationFrame(() => scrollToAnchor(target));
            }
          } else if (entry.intersectionRatio >= 0.99 && mobileDrawer.open) {
            mobileMenuBtn.setAttribute('aria-expanded', 'true');
          }
        },
        { root: mobileDrawer, threshold: [visibleThreshold, 0.99] }
      );
      drawerObserver.observe(sheet);

      mobileMenuBtn.addEventListener('click', openDrawer);
      mobileDrawerClose.addEventListener('click', () => closeDrawer());

      mobileDrawer.addEventListener('click', (e) => {
        if (!sheet.contains(e.target)) closeDrawer();
      });

      mobileDrawer.addEventListener('cancel', (e) => {
        if (e.cancelable) {
          e.preventDefault();
          closeDrawer();
        }
      });

      mobileDrawer.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
          const id = link.getAttribute('href');
          const el = id && id !== '#' ? document.querySelector(id) : null;
          e.preventDefault();
          closeDrawer(el);
        });
      });

      window.matchMedia('(min-width: 981px)').addEventListener('change', (mq) => {
        if (mq.matches && mobileDrawer.open) {
          mobileDrawer.close();
          mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  const dockItems = Array.from(document.querySelectorAll('.mobile-dock-item'));
  if (dockItems.length) {
    const setActiveDock = (id) => {
      dockItems.forEach((item) => {
        const active = item.dataset.dockTarget === id;
        item.classList.toggle('is-active', active);
        if (active) item.setAttribute('aria-current', 'location');
        else item.removeAttribute('aria-current');
      });
    };

    const dockObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveDock(visible[0].target.id);
        }
      },
      { rootMargin: '-32% 0px -48% 0px', threshold: [0.05, 0.25, 0.5] }
    );

    dockItems.forEach((item) => {
      const sec = item.dataset.dockTarget && document.getElementById(item.dataset.dockTarget);
      if (sec) dockObserver.observe(sec);
    });
  }

  /* =========================================================
     2. DIRECTIONAL CURSOR (Soyeb / Framer Marketplace Style)
     ========================================================= */
  const dirCursor = document.getElementById('directional-cursor');
  if (dirCursor && finePointer && !prefersReducedMotion) {
    document.body.classList.add('has-directional-cursor');
    const arrow = dirCursor.querySelector('.cursor-arrow');
    const supportsPopover =
      Object.hasOwn(HTMLElement.prototype, 'popover') &&
      typeof dirCursor.showPopover === 'function';

    function promoteCursorToTopLayer() {
      if (!supportsPopover) return;
      try {
        if (dirCursor.matches(':popover-open')) {
          dirCursor.hidePopover();
        }
        dirCursor.showPopover();
      } catch {
        // Ignore transient top-layer state errors
      }
    }

    if (supportsPopover) {
      dirCursor.setAttribute('popover', 'manual');
      document.body.classList.add('has-toplayer-cursor');
      promoteCursorToTopLayer();

      const dialogObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'attributes' && m.target instanceof HTMLDialogElement && m.target.hasAttribute('open')) {
            promoteCursorToTopLayer();
            break;
          }
        }
      });

      document.querySelectorAll('dialog').forEach((dlg) => {
        dialogObserver.observe(dlg, { attributes: true, attributeFilter: ['open'] });
      });
    }

    let targetX = -100;
    let targetY = -100;
    let curX = -100;
    let curY = -100;
    let curAngle = -45;
    let targetAngle = -45;
    let curScale = 1;
    let targetScale = 1;
    let lastScrollY = window.scrollY;

    function normalizeAngleDelta(current, target) {
      const diff = ((target - current + 540) % 360) - 180;
      return current + diff;
    }

    window.addEventListener('pointermove', (e) => {
      const dx = e.clientX - targetX;
      const dy = e.clientY - targetY;
      targetX = e.clientX;
      targetY = e.clientY;

      const speed = Math.hypot(dx, dy);
      if (speed > 2.2) {
        const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
        targetAngle = normalizeAngleDelta(targetAngle, deg);
        targetScale = Math.min(1.32, 1 + speed * 0.012);
      }

      const targetEl = e.target instanceof Element ? e.target : null;
      const blockedByModalFallback = !supportsPopover && Boolean(document.querySelector('dialog[open]'));
      const overNative = blockedByModalFallback || Boolean(targetEl?.closest('input, select, textarea, iframe'));
      dirCursor.classList.toggle('is-visible', !overNative);

      const interactive = targetEl?.closest('a, button, summary, [role="button"], .orbit-card, .lanyard-card, .flip-card');
      dirCursor.classList.toggle('is-interactive', Boolean(interactive));
    });

    document.querySelectorAll('iframe').forEach((frame) => {
      const hideOnIframe = () => dirCursor.classList.remove('is-visible');
      frame.addEventListener('mouseenter', hideOnIframe);
      frame.addEventListener('pointerenter', hideOnIframe);
    });

    window.addEventListener('scroll', () => {
      const sy = window.scrollY;
      const dy = sy - lastScrollY;
      lastScrollY = sy;
      if (Math.abs(dy) > 2) {
        targetAngle = normalizeAngleDelta(targetAngle, dy > 0 ? 90 : -90);
        targetScale = 1.18;
      }
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
      dirCursor.classList.remove('is-visible');
    });

    function animateCursor() {
      curX += (targetX - curX) * 0.22;
      curY += (targetY - curY) * 0.22;
      curAngle += (targetAngle - curAngle) * 0.16;
      targetScale += (1 - targetScale) * 0.1;
      curScale += (targetScale - curScale) * 0.18;

      dirCursor.style.transform = `translate3d(${(curX - 11).toFixed(2)}px, ${(curY - 11).toFixed(2)}px, 0)`;
      if (arrow) {
        arrow.style.transform = `rotate(${curAngle.toFixed(1)}deg) scale(${curScale.toFixed(3)})`;
      }
      requestAnimationFrame(animateCursor);
    }
    requestAnimationFrame(animateCursor);
  }

  /* =========================================================
     3. ARTISTIC HERO PARALLAX & SCROLL-STATE MORPH (Orynthiq)
     ========================================================= */
  const heroShell = document.getElementById('topo');
  const heroArtImg = document.querySelector('.hero-art-img');
  const heroState1 = document.getElementById('hero-state-1');
  const heroState2 = document.getElementById('hero-state-2');
  const heroFill = document.getElementById('hero-progress-fill');
  const heroPct = document.getElementById('hero-progress-pct');

  const supportsNativeParallax = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

  if (heroShell && !prefersReducedMotion) {
    function updateHeroScrollState() {
      if (window.innerWidth <= 980) {
        if (heroState1) {
          heroState1.style.opacity = '1';
          heroState1.style.transform = 'none';
        }
        return;
      }

      const rect = heroShell.getBoundingClientRect();
      const totalScrollable = Math.max(1, heroShell.offsetHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / totalScrollable));

      if (!supportsNativeParallax && heroArtImg) {
        const yShift = -24 + progress * 88;
        const scale = 1.03 + progress * 0.13;
        heroArtImg.style.transform = `translate3d(0, ${yShift.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      }

      if (heroState1) {
        const p1 = Math.max(0, Math.min(1, (progress - 0.15) / 0.42));
        heroState1.style.opacity = String(1 - p1);
        heroState1.style.transform = `translate3d(0, ${(-p1 * 48).toFixed(1)}px, 0) scale(${(1 - p1 * 0.04).toFixed(3)})`;
        heroState1.style.pointerEvents = p1 > 0.7 ? 'none' : 'auto';
      }

      if (heroState2) {
        const p2 = Math.max(0, Math.min(1, (progress - 0.42) / 0.36));
        heroState2.style.opacity = String(p2);
        heroState2.style.transform = `translate3d(0, ${((1 - p2) * 56).toFixed(1)}px, 0) scale(${(0.96 + p2 * 0.04).toFixed(3)})`;
        heroState2.setAttribute('aria-hidden', String(p2 < 0.25));
      }

      if (heroFill) heroFill.style.width = `${Math.round(progress * 100)}%`;
      if (heroPct) heroPct.textContent = `${String(Math.round(progress * 100)).padStart(2, '0')}%`;
    }

    if ('IntersectionObserver' in window) {
      let heroActive = true;
      const heroObs = new IntersectionObserver((entries) => {
        heroActive = entries[0].isIntersecting;
      });
      heroObs.observe(heroShell);
      window.addEventListener('scroll', () => {
        if (heroActive) updateHeroScrollState();
      }, { passive: true });
      window.addEventListener('resize', updateHeroScrollState);
    } else {
      window.addEventListener('scroll', updateHeroScrollState, { passive: true });
    }
    updateHeroScrollState();
  }

  /* =========================================================
     4. PIXEL BUTTON (Imesh Dilshan Style)
     ========================================================= */
  document.querySelectorAll('.pixel-btn').forEach((btn) => {
    const grid = document.createElement('span');
    grid.className = 'pixel-grid';
    grid.setAttribute('aria-hidden', 'true');

    const totalCells = 30;
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
     5. TEXT SCRAMBLE (Aidan Looker Style)
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
     6. HALFTONE PRO BACKDROP CANVAS
     ========================================================= */
  const halftoneCanvas = document.getElementById('halftone-canvas');
  if (halftoneCanvas) {
    const ctx = halftoneCanvas.getContext('2d');
    const mouse = { x: -9999, y: -9999 };
    let needsRender = true;

    function resizeHalftone() {
      const mobileCap = window.innerWidth <= 980 ? 1.25 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, mobileCap);
      halftoneCanvas.width = Math.floor(window.innerWidth * dpr);
      halftoneCanvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      needsRender = true;
    }

    function drawHalftone() {
      if (needsRender) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const spacing = w <= 980 ? 34 : 24;
        ctx.clearRect(0, 0, w, h);

        for (let y = spacing / 2; y < h; y += spacing) {
          for (let x = spacing / 2; x < w; x += spacing) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.hypot(dx, dy);
            const influence = Math.max(0, 1 - dist / 240);
            const radius = 0.7 + influence * 2.0;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle =
              influence > 0.15
                ? `rgba(255, 90, 31, ${0.14 + influence * 0.4})`
                : 'rgba(244, 243, 239, 0.065)';
            ctx.fill();
          }
        }
        needsRender = false;
      }
      if (!prefersReducedMotion) requestAnimationFrame(drawHalftone);
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
     7. ATOMIC GLOBE (Dedicated Stage in SYS.00)
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

    if (globeToggle && isPaused) globeToggle.textContent = 'Retomar globo';

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

      ctx.save();
      ctx.translate(cx, cy);
      [0.42, -0.58, 1.15].forEach((tilt, idx) => {
        ctx.save();
        ctx.rotate(tilt + rotY * (idx % 2 === 0 ? 0.15 : -0.1));
        ctx.scale(1, 0.34);
        ctx.beginPath();
        ctx.arc(0, 0, radius * (1.22 + idx * 0.05), 0, Math.PI * 2);
        ctx.strokeStyle =
          idx === 0 ? 'rgba(255, 90, 31, 0.48)' : 'rgba(244, 243, 239, 0.15)';
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

      const frontHot = projected.filter((p) => p.highlight && p.z > -0.15);
      ctx.strokeStyle = 'rgba(255, 90, 31, 0.3)';
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
      if (!isPaused && !dragging) rotY += 0.0045;
      renderGlobe();
      requestAnimationFrame(animateGlobe);
    }

    renderGlobe();
    requestAnimationFrame(animateGlobe);
  }

  /* =========================================================
     8. MILK GLASS FOLDER + PRINT LIGHTBOX DIALOG (Clean src reset)
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

  if (printDialog) {
    printDialog.addEventListener('close', () => {
      if (dialogImg) dialogImg.removeAttribute('src');
    });

    if (!('closedBy' in HTMLDialogElement.prototype)) {
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
  }

  /* =========================================================
     9. STRATA ORBIT GALLERY (Compact Front Scale for 1366x768)
     ========================================================= */
  const orbitShell = document.getElementById('orbit-shell');
  const orbitRing = document.getElementById('orbit-ring');
  const orbitCards = Array.from(document.querySelectorAll('.orbit-card'));
  const orbitCounter = document.getElementById('orbit-counter');
  const orbitPrev = document.getElementById('orbit-prev');
  const orbitNext = document.getElementById('orbit-next');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const orbitModeBtn = document.getElementById('orbit-mode-btn');
  const gridModeBtn = document.getElementById('grid-mode-btn');

  let orbitManualOffset = 0;
  let orbitScrollAngle = 0;
  let currentOrbitAngle = 0;
  let orbitLoopId = 0;

  function getVisibleOrbitCards() {
    return orbitCards.filter((card) => !card.classList.contains('is-filtered-out'));
  }

  function isMobileCarouselMode() {
    return Boolean(orbitShell && !orbitShell.classList.contains('is-grid') && window.innerWidth <= 980);
  }

  function syncModeButtonLabel() {
    if (!orbitModeBtn) return;
    orbitModeBtn.textContent = window.innerWidth <= 980 ? 'Carrossel' : 'Órbita Strata';
  }

  function clearInlineOrbitTransforms() {
    orbitCards.forEach((card) => {
      card.style.transform = '';
      card.style.zIndex = '';
      const veil = card.querySelector('.orbit-card-veil');
      if (veil) veil.style.opacity = '';
    });
  }

  function setFrontCardByIndex(idx) {
    const visible = getVisibleOrbitCards();
    const count = visible.length;
    if (!count) {
      if (orbitCounter) orbitCounter.textContent = '00 / 00';
      return;
    }
    const clamped = Math.max(0, Math.min(count - 1, idx));
    visible.forEach((card, i) => {
      card.classList.toggle('is-front', i === clamped);
    });
    if (orbitCounter) {
      orbitCounter.textContent = `${String(clamped + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
    }
  }

  function computeOrbitScrollAngle() {
    if (!orbitShell || orbitShell.classList.contains('is-grid') || window.innerWidth <= 980) {
      orbitScrollAngle = 0;
      return;
    }
    const rect = orbitShell.getBoundingClientRect();
    const scrollable = Math.max(1, orbitShell.offsetHeight - window.innerHeight);
    const p = Math.max(0, Math.min(1, -rect.top / scrollable));
    orbitScrollAngle = p * Math.PI * 2;
  }

  function renderOrbit() {
    if (!orbitShell || orbitShell.classList.contains('is-grid') || isMobileCarouselMode()) return;
    const visible = getVisibleOrbitCards();
    const count = visible.length;
    if (count === 0) return;

    const targetAngle = orbitScrollAngle + orbitManualOffset;
    currentOrbitAngle += (targetAngle - currentOrbitAngle) * (prefersReducedMotion ? 1 : 0.14);

    const vw = window.innerWidth;
    const rx = Math.min(480, Math.max(210, vw * 0.34));
    const ry = vw < 768 ? 85 : 115;

    let frontIdx = 0;
    let maxDepth = -1;

    visible.forEach((card, i) => {
      const baseAngle = (i / count) * Math.PI * 2;
      const theta = baseAngle - currentOrbitAngle;

      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const depth = (cosT + 1) / 2;

      if (depth > maxDepth) {
        maxDepth = depth;
        frontIdx = i;
      }

      const tx = sinT * rx;
      const ty = cosT * ry - ry * 0.35;
      const scale = 0.62 + depth * 0.48; // 0.62 back -> 1.10 front
      const rotY = -sinT * 28;
      const zIdx = Math.round(depth * 1000);

      card.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${scale.toFixed(3)}) perspective(1400px) rotateY(${rotY.toFixed(2)}deg)`;
      card.style.zIndex = String(zIdx);

      const veil = card.querySelector('.orbit-card-veil');
      if (veil) {
        const veilAlpha = Math.max(0, (1 - depth) * 0.68);
        veil.style.opacity = veilAlpha.toFixed(3);
      }
    });

    setFrontCardByIndex(frontIdx);
  }

  function stepOrbitLoop() {
    orbitLoopId = 0;
    if (!orbitShell || orbitShell.classList.contains('is-grid') || isMobileCarouselMode()) {
      clearInlineOrbitTransforms();
      return;
    }
    computeOrbitScrollAngle();
    renderOrbit();
    orbitLoopId = requestAnimationFrame(stepOrbitLoop);
  }

  function ensureOrbitLoop() {
    syncModeButtonLabel();
    if (!orbitShell || orbitShell.classList.contains('is-grid') || isMobileCarouselMode()) {
      if (orbitLoopId) {
        cancelAnimationFrame(orbitLoopId);
        orbitLoopId = 0;
      }
      clearInlineOrbitTransforms();
      if (isMobileCarouselMode()) setFrontCardByIndex(0);
      return;
    }
    if (!orbitLoopId) {
      orbitLoopId = requestAnimationFrame(stepOrbitLoop);
    }
  }

  ensureOrbitLoop();
  window.addEventListener('resize', ensureOrbitLoop, { passive: true });

  // Mobile Scroll-Snap State Sync for Orbit Counter
  if (orbitRing) {
    if ('onscrollsnapchange' in HTMLElement.prototype) {
      orbitRing.addEventListener('scrollsnapchange', (e) => {
        if (!isMobileCarouselMode()) return;
        const visible = getVisibleOrbitCards();
        const idx = visible.indexOf(e.snapTargetInline);
        if (idx !== -1) setFrontCardByIndex(idx);
      });
    } else {
      const snapObserver = new IntersectionObserver(
        (entries) => {
          if (!isMobileCarouselMode()) return;
          const visible = getVisibleOrbitCards();
          let best = null;
          let bestRatio = 0;
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
              bestRatio = entry.intersectionRatio;
              best = entry.target;
            }
          });
          if (best) {
            const idx = visible.indexOf(best);
            if (idx !== -1) setFrontCardByIndex(idx);
          }
        },
        { root: orbitRing, threshold: [0.55, 0.85] }
      );
      orbitCards.forEach((c) => snapObserver.observe(c));
    }
  }

  function rotateByStep(dir) {
    const visible = getVisibleOrbitCards();
    const count = Math.max(1, visible.length);
    if (isMobileCarouselMode() && orbitRing) {
      const curIdx = Math.max(0, visible.findIndex((c) => c.classList.contains('is-front')));
      const nextIdx = (curIdx + dir + count) % count;
      const targetCard = visible[nextIdx];
      if (targetCard) {
        const left = targetCard.offsetLeft - (orbitRing.clientWidth - targetCard.offsetWidth) / 2;
        orbitRing.scrollTo({
          left: Math.max(0, left),
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
        setFrontCardByIndex(nextIdx);
      }
      return;
    }
    orbitManualOffset += (dir * (Math.PI * 2)) / count;
  }

  if (orbitPrev) orbitPrev.addEventListener('click', () => rotateByStep(-1));
  if (orbitNext) orbitNext.addEventListener('click', () => rotateByStep(1));

  orbitCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      if (orbitShell.classList.contains('is-grid') || isMobileCarouselMode()) return;
      if (e.target.closest('a, button')) return;
      const visible = getVisibleOrbitCards();
      const idx = visible.indexOf(card);
      if (idx === -1) return;
      const targetBase = (idx / visible.length) * Math.PI * 2;
      const currentTotal = orbitScrollAngle + orbitManualOffset;
      const delta = ((targetBase - currentTotal + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      orbitManualOffset += delta;
    });
  });

  if (orbitRing) {
    let draggingOrbit = false;
    let dragStartX = 0;

    orbitRing.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a, button') || orbitShell.classList.contains('is-grid') || isMobileCarouselMode()) return;
      draggingOrbit = true;
      dragStartX = e.clientX;
      orbitRing.setPointerCapture(e.pointerId);
    });

    orbitRing.addEventListener('pointermove', (e) => {
      if (!draggingOrbit) return;
      const dx = e.clientX - dragStartX;
      dragStartX = e.clientX;
      orbitManualOffset -= dx * 0.0055;
    });

    orbitRing.addEventListener('pointerup', () => {
      draggingOrbit = false;
    });

    orbitRing.addEventListener('keydown', (e) => {
      if (orbitShell.classList.contains('is-grid')) return;
      if (e.key === 'ArrowRight') rotateByStep(1);
      else if (e.key === 'ArrowLeft') rotateByStep(-1);
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.filter;
      filterButtons.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      orbitCards.forEach((card) => {
        const match = cat === 'all' || card.dataset.category === cat;
        card.classList.toggle('is-filtered-out', !match);
      });

      orbitManualOffset = -orbitScrollAngle;
      if (isMobileCarouselMode() && orbitRing) {
        orbitRing.scrollTo({ left: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        setFrontCardByIndex(0);
      }
    });
  });

  if (orbitModeBtn && gridModeBtn && orbitShell) {
    orbitModeBtn.addEventListener('click', () => {
      orbitShell.classList.remove('is-grid');
      orbitModeBtn.classList.add('is-active');
      gridModeBtn.classList.remove('is-active');
      ensureOrbitLoop();
    });

    gridModeBtn.addEventListener('click', () => {
      orbitShell.classList.add('is-grid');
      gridModeBtn.classList.add('is-active');
      orbitModeBtn.classList.remove('is-active');
      ensureOrbitLoop();
    });
  }

  /* =========================================================
     10. INTERACTIVE PROJECT INDEX (Umbra Index Pattern)
     ========================================================= */
  const INDEX_PROJECTS = {
    adega: {
      tag: 'BI · STAR SCHEMA · COMERCIAL B2B',
      title: 'Adega & Distribuidora',
      desc: 'Modelo Star Schema sobre 5.250 pedidos B2B simulados em Python, revelando 68,6% de concentração de receita no Weekend Rush e margem global de 33,43%.',
      metric: 'R$ 9,32 Mi · 5.250 pedidos',
      primaryLabel: 'ABRIR DASHBOARD',
      primaryAction: () => window.openPortfolioDashboard && window.openPortfolioDashboard('adega'),
      secondaryLabel: 'VER CASE',
      secondaryAction: () => window.openPortfolioCase && window.openPortfolioCase('adega'),
    },
    'ong-viva': {
      tag: 'BI · GALAXY SCHEMA · TERCEIRO SETOR',
      title: 'ONG Viva Comunidade',
      desc: 'Arquitetura Multi-Fato ligando captação (fDoacoes) e execução social (fAtendimentos) por programa e perfil PF vs. PJ.',
      metric: 'R$ 2,62 Mi · 1.550 atendimentos',
      primaryLabel: 'ABRIR DASHBOARD',
      primaryAction: () => window.openPortfolioDashboard && window.openPortfolioDashboard('ong-viva'),
      secondaryLabel: 'VER CASE',
      secondaryAction: () => window.openPortfolioCase && window.openPortfolioCase('ong-viva'),
    },
    petshop: {
      tag: 'BI · STAR SCHEMA · CUSTOMER ANALYTICS',
      title: 'PetShop Gatitos',
      desc: 'Análise de comportamento de tutores (efeito Multi-Pet +45% ticket), bairros estratégicos e evolução de receita 2020–2022.',
      metric: 'R$ 2,03 Mi · 57 mil itens',
      primaryLabel: 'ABRIR DASHBOARD',
      primaryAction: () => window.openPortfolioDashboard && window.openPortfolioDashboard('petshop'),
      secondaryLabel: 'VER CASE',
      secondaryAction: () => window.openPortfolioCase && window.openPortfolioCase('petshop'),
    },
    supplychain: {
      tag: 'BI · ROLE-PLAYING · LOGÍSTICA',
      title: 'Supply Chain & Logística',
      desc: 'Torre de controle logística com 8.150 pedidos, 4 datas via USERELATIONSHIP, OTIF de transportadoras e subsídio de frete por região.',
      metric: 'R$ 13,83 Mi · 84,58% OTIF',
      primaryLabel: 'ABRIR DASHBOARD',
      primaryAction: () => window.openPortfolioDashboard && window.openPortfolioDashboard('supplychain'),
      secondaryLabel: 'VER CASE',
      secondaryAction: () => window.openPortfolioCase && window.openPortfolioCase('supplychain'),
    },
    'ong-multi': {
      tag: 'BI · CONSTELLATION SCHEMA · 3 FATOS',
      title: 'ONG Multi-Programas',
      desc: 'Três tabelas fato (doações, atendimentos e orçamento mensal) em 2 painéis executivos com prestação de contas por zona e área de foco.',
      metric: 'R$ 13,12 Mi · 3.550 atendimentos',
      primaryLabel: 'ABRIR DASHBOARD',
      primaryAction: () => window.openPortfolioDashboard && window.openPortfolioDashboard('ong-multi'),
      secondaryLabel: 'VER CASE',
      secondaryAction: () => window.openPortfolioCase && window.openPortfolioCase('ong-multi'),
    },
    padaria: {
      tag: 'BI · MYSQL AWS RDS · LGPD',
      title: 'Padaria Diniz (BI & LGPD)',
      desc: '4 páginas analíticas sobre Views SQL mascaradas (CPF, telefone e e-mail ofuscados), margem real de 43,62%, SLA de 28 min e gestão de estoque.',
      metric: 'R$ 79,3 Mil · 4 páginas BI',
      primaryLabel: 'ABRIR DASHBOARD',
      primaryAction: () => window.openPortfolioDashboard && window.openPortfolioDashboard('padaria'),
      secondaryLabel: 'VER CASE',
      secondaryAction: () => window.openPortfolioCase && window.openPortfolioCase('padaria'),
    },
    'padaria-web': {
      tag: 'FULL-STACK · NODE.JS · WCAG 2.1 AA',
      title: 'Padaria Diniz (E-commerce Live)',
      desc: 'Plataforma web em produção no Render com catálogo de 160+ itens, fluxo "Peça e Retire", transações ACID em MySQL e acessibilidade AA.',
      metric: '160+ itens · Live no Render',
      primaryLabel: 'ACESSAR SITE LIVE',
      primaryAction: () => window.open('https://padaria-antigravity.onrender.com/padaria-landinpage.html', '_blank', 'noopener,noreferrer'),
      secondaryLabel: 'VER CASE COMPLETO',
      secondaryAction: () => window.openPortfolioCase && window.openPortfolioCase('padaria'),
    },
    'clube-gringas': {
      tag: 'PROJETO REAL · ONG · RESTRITO A PRINTS',
      title: 'ONG Clube Gringas',
      desc: 'Projeto real para organização sem fins lucrativos exibido estritamente por capturas visuais na pasta Milk Glass, sem exposição de código ou dados sensíveis.',
      metric: '04 slots visuais · Prints Only',
      primaryLabel: 'IR PARA PASTA DE PRINTS',
      primaryAction: () => {
        const el = document.getElementById('clube-gringas');
        if (el) scrollToAnchor(el);
      },
      secondaryLabel: null,
      secondaryAction: null,
    },
  };

  const indexRows = document.querySelectorAll('.index-row');
  const idxTag = document.getElementById('index-preview-tag');
  const idxTitle = document.getElementById('index-preview-title');
  const idxDesc = document.getElementById('index-preview-desc');
  const idxMetric = document.getElementById('index-preview-metric');
  const idxPrimaryBtn = document.getElementById('index-primary-btn');
  const idxSecondaryBtn = document.getElementById('index-secondary-btn');
  const mobileDrawersMap = new Map();
  let activeIndexKey = 'adega';

  function buildMobileIndexDrawer(row, item) {
    const li = row.closest('li');
    if (!li) return null;

    const drawer = document.createElement('div');
    drawer.className = 'idx-mobile-drawer';

    const inner = document.createElement('div');
    inner.className = 'idx-mobile-inner';

    const content = document.createElement('div');
    content.className = 'idx-mobile-content';

    const tag = document.createElement('span');
    tag.className = 'mono tag-orange';
    tag.style.alignSelf = 'flex-start';
    tag.textContent = item.tag;

    const desc = document.createElement('p');
    desc.textContent = item.desc;

    const metric = document.createElement('div');
    metric.className = 'index-preview-metric mono';
    const metricLabel = document.createElement('span');
    metricLabel.textContent = 'DESTAQUE';
    const metricVal = document.createElement('strong');
    metricVal.textContent = item.metric;
    metric.append(metricLabel, metricVal);

    const actions = document.createElement('div');
    actions.className = 'idx-mobile-actions';

    if (item.primaryLabel && item.primaryAction) {
      const btn1 = document.createElement('button');
      btn1.type = 'button';
      btn1.className = 'pixel-btn pixel-btn-accent pixel-btn-sm';
      const lbl1 = document.createElement('span');
      lbl1.className = 'pixel-label';
      lbl1.textContent = item.primaryLabel;
      btn1.appendChild(lbl1);
      btn1.addEventListener('click', (e) => {
        e.stopPropagation();
        item.primaryAction();
      });
      actions.appendChild(btn1);
    }

    if (item.secondaryLabel && item.secondaryAction) {
      const btn2 = document.createElement('button');
      btn2.type = 'button';
      btn2.className = 'pixel-btn pixel-btn-ghost pixel-btn-sm';
      const lbl2 = document.createElement('span');
      lbl2.className = 'pixel-label';
      lbl2.textContent = item.secondaryLabel;
      btn2.appendChild(lbl2);
      btn2.addEventListener('click', (e) => {
        e.stopPropagation();
        item.secondaryAction();
      });
      actions.appendChild(btn2);
    }

    content.append(tag, desc, metric, actions);
    inner.appendChild(content);
    drawer.appendChild(inner);
    li.appendChild(drawer);
    return drawer;
  }

  function selectIndexProject(key) {
    const item = INDEX_PROJECTS[key];
    if (!item) return;
    activeIndexKey = key;

    indexRows.forEach((row) => {
      row.classList.toggle('is-active', row.dataset.indexId === key);
    });

    if (idxTag) idxTag.textContent = item.tag;
    if (idxTitle) idxTitle.textContent = item.title;
    if (idxDesc) idxDesc.textContent = item.desc;
    if (idxMetric) idxMetric.textContent = item.metric;

    if (idxPrimaryBtn) {
      const lbl = idxPrimaryBtn.querySelector('.pixel-label');
      if (lbl) lbl.textContent = item.primaryLabel;
    }

    if (idxSecondaryBtn) {
      if (item.secondaryLabel) {
        const lbl2 = idxSecondaryBtn.querySelector('.pixel-label');
        if (lbl2) lbl2.textContent = item.secondaryLabel;
        idxSecondaryBtn.classList.remove('is-hidden');
      } else {
        idxSecondaryBtn.classList.add('is-hidden');
      }
    }
  }

  indexRows.forEach((row) => {
    const key = row.dataset.indexId;
    const item = INDEX_PROJECTS[key];
    if (item) {
      const drawer = buildMobileIndexDrawer(row, item);
      if (drawer) {
        mobileDrawersMap.set(key, drawer);
        if (row.classList.contains('is-active') && window.innerWidth <= 980) {
          drawer.classList.add('is-open');
          row.setAttribute('aria-expanded', 'true');
        } else {
          row.setAttribute('aria-expanded', 'false');
        }
      }
    }

    row.addEventListener('mouseenter', () => selectIndexProject(key));
    row.addEventListener('focus', () => selectIndexProject(key));
    row.addEventListener('click', () => {
      selectIndexProject(key);
      if (window.innerWidth <= 980) {
        const currentDrawer = mobileDrawersMap.get(key);
        const wasOpen = currentDrawer?.classList.contains('is-open');
        mobileDrawersMap.forEach((d, k) => {
          d.classList.toggle('is-open', k === key && !wasOpen);
        });
        indexRows.forEach((r) => {
          r.setAttribute('aria-expanded', String(r.dataset.indexId === key && !wasOpen));
        });
        return;
      }
      if (item && item.primaryAction) item.primaryAction();
    });
  });

  if (idxPrimaryBtn) {
    idxPrimaryBtn.addEventListener('click', () => {
      const item = INDEX_PROJECTS[activeIndexKey];
      if (item && item.primaryAction) item.primaryAction();
    });
  }

  if (idxSecondaryBtn) {
    idxSecondaryBtn.addEventListener('click', () => {
      const item = INDEX_PROJECTS[activeIndexKey];
      if (item && item.secondaryAction) item.secondaryAction();
    });
  }

  /* =========================================================
     11. LANYARD PASS PHYSICS (BuiltByKern Style)
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
    let pendingTouchId = null;
    let startPointerX = 0;
    let startPointerY = 0;
    let startPosX = 0;
    let startPosY = 0;

    lanyardCard.addEventListener('pointerdown', (e) => {
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      startPosX = posX;
      startPosY = posY;
      if (e.pointerType === 'touch') {
        pendingTouchId = e.pointerId;
        isDragging = false;
      } else {
        isDragging = true;
        pendingTouchId = null;
        velX = 0;
        velY = 0;
        try {
          lanyardCard.setPointerCapture(e.pointerId);
        } catch {
          // Ignore capture errors
        }
      }
    });

    lanyardCard.addEventListener('pointermove', (e) => {
      if (pendingTouchId === e.pointerId && !isDragging) {
        const dx = e.clientX - startPointerX;
        const dy = e.clientY - startPointerY;
        if (Math.hypot(dx, dy) < 6) return;
        if (Math.abs(dx) >= Math.abs(dy)) {
          isDragging = true;
          velX = 0;
          velY = 0;
          try {
            lanyardCard.setPointerCapture(e.pointerId);
          } catch {
            // Ignore capture errors
          }
        } else {
          pendingTouchId = null;
          return;
        }
      }
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
      pendingTouchId = null;
    };
    lanyardCard.addEventListener('pointerup', releaseCard);
    lanyardCard.addEventListener('pointercancel', releaseCard);

    function stepLanyard() {
      if (!isDragging) {
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

      if (!prefersReducedMotion) requestAnimationFrame(stepLanyard);
    }

    if (!prefersReducedMotion) {
      velX = 6;
      requestAnimationFrame(stepLanyard);
    }
  }

  /* =========================================================
     12. IN-SITE CASE STUDY DOSSIER MODAL (Dados do GitHub)
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

  /* =========================================================
     3D TILT ON FLIP CARDS (Padaria Diniz & ONG Clube Gringas)
     ========================================================= */
  document.querySelectorAll('[data-flip-card]').forEach((card) => {
    const inner = card.querySelector('.flip-card-inner');
    if (!inner) return;

    const glares = card.querySelectorAll('.flip-glare');
    let isFlipped = false;
    let tiltX = 0;
    let tiltY = 0;
    let flipTimer = 0;

    function renderTransform() {
      const baseY = isFlipped ? 180 : 0;
      if (prefersReducedMotion) {
        inner.style.transform = `rotateY(${baseY}deg)`;
        return;
      }
      inner.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${(baseY + tiltY).toFixed(2)}deg)`;
    }

    function toggleFlip() {
      isFlipped = !isFlipped;
      card.classList.add('is-flipping');
      card.classList.toggle('is-flipped', isFlipped);
      if (flipTimer) window.clearTimeout(flipTimer);
      flipTimer = window.setTimeout(() => {
        card.classList.remove('is-flipping');
      }, 680);
      renderTransform();
    }

    if (finePointer && !prefersReducedMotion) {
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        tiltX = -ny * 20;
        tiltY = nx * 24;

        const gx = `${((nx + 0.5) * 100).toFixed(1)}%`;
        const gy = `${((ny + 0.5) * 100).toFixed(1)}%`;
        glares.forEach((g) => {
          g.style.setProperty('--gx', gx);
          g.style.setProperty('--gy', gy);
        });

        card.classList.add('is-tilting');
        renderTransform();
      });

      const resetTilt = () => {
        tiltX = 0;
        tiltY = 0;
        card.classList.remove('is-tilting');
        renderTransform();
      };

      card.addEventListener('pointerleave', resetTilt);
      card.addEventListener('pointercancel', resetTilt);
    }

    card.addEventListener('click', (e) => {
      if (e.target.closest('a, button:not([data-flip-trigger])')) return;
      toggleFlip();
    });

    card.addEventListener('keydown', (e) => {
      if (e.target === card && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        toggleFlip();
      }
    });
  });
})();
