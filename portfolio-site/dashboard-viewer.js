(() => {
  const dialog = document.getElementById('dashboard-dialog');
  if (!dialog) return;

  const titleEl = document.getElementById('bi-dialog-title');
  const codeEl = document.getElementById('bi-dialog-code');
  const projectSelect = document.getElementById('bi-project-select');
  const modeNativeBtn = document.getElementById('bi-mode-native');
  const modeEmbedBtn = document.getElementById('bi-mode-embed');
  const openCaseBtn = document.getElementById('bi-switch-case');
  const externalLink = document.getElementById('bi-external-link');
  const mobileExternalLink = document.getElementById('bi-mobile-open-tab');
  const nativeContainer = document.getElementById('bi-native-view');
  const embedContainer = document.getElementById('bi-embed-view');
  const embedIframe = document.getElementById('bi-embed-iframe');
  const subBar = document.getElementById('bi-subbar');
  const kpiGrid = document.getElementById('bi-kpi-grid');
  const chartsGrid = document.getElementById('bi-charts-grid');

  const META = {
    adega: { code: 'BI.01 // STAR SCHEMA · B2B', title: 'Adega & Distribuidora' },
    'ong-viva': { code: 'BI.02 // GALAXY SCHEMA · TERCEIRO SETOR', title: 'ONG Viva Comunidade' },
    petshop: { code: 'BI.03 // CUSTOMER ANALYTICS · VAREJO', title: 'PetShop Gatitos' },
    supplychain: { code: 'BI.04 // ROLE-PLAYING · LOGÍSTICA', title: 'Supply Chain & Logística' },
    'ong-multi': { code: 'BI.05 // CONSTELLATION SCHEMA · 2 PÁGINAS', title: 'ONG Multi-Programas' },
    padaria: { code: 'BI.06 // END-TO-END LGPD · 4 PÁGINAS', title: 'Padaria Diniz' },
  };

  let currentId = 'adega';
  let currentMode = 'native'; // 'native' | 'embed'
  let currentFilter = null;
  let currentPage = null;
  let activeCharts = [];

  const fmtBRL = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
  const fmtBRLShort = (v) => {
    const n = Number(v || 0);
    if (Math.abs(n) >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(2).replace('.', ',')} Mi`;
    if (Math.abs(n) >= 1_000) return `R$ ${(n / 1_000).toFixed(1).replace('.', ',')} Mil`;
    return fmtBRL(n);
  };
  const fmtInt = (v) => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  const fmtDec = (v, suffix = '') =>
    `${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
  const isMobileChart = () => window.innerWidth <= 980;
  const truncateLabel = (text, max = 12) => {
    const str = String(text ?? '');
    return str.length > max ? `${str.slice(0, max - 1).trimEnd()}…` : str;
  };
  const fmtAxisCompact = (v) => {
    const n = Number(v || 0);
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
    if (abs >= 1_000) return `${Math.round(n / 1_000)}k`;
    return fmtInt(n);
  };

  const PALETTE = {
    orange: '#ff5a1f',
    orangeSoft: 'rgba(255, 90, 31, 0.25)',
    amber: '#ff9f43',
    bone: '#f4f3ef',
    slate: '#64748b',
    emerald: '#22c55e',
    cyan: '#38bdf8',
    grid: 'rgba(255, 255, 255, 0.07)',
    text: '#9aa3b2',
  };

  function destroyCharts() {
    activeCharts.forEach((c) => {
      try {
        c.destroy();
      } catch (_) {}
    });
    activeCharts = [];
  }

  function createKpiCard(label, value, sub = '', accent = false) {
    const div = document.createElement('div');
    div.className = `bi-kpi-card${accent ? ' is-accent' : ''}`;
    div.innerHTML = `<span class="bi-kpi-label mono">${label}</span><strong class="bi-kpi-val">${value}</strong>${
      sub ? `<span class="bi-kpi-sub mono">${sub}</span>` : ''
    }`;
    return div;
  }

  function createChartPanel(title) {
    const panel = document.createElement('div');
    panel.className = 'bi-chart-panel';
    const h = document.createElement('header');
    h.className = 'bi-chart-head mono';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'bi-chart-title';
    titleSpan.textContent = title;

    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.className = 'bi-chart-expand-btn mono';
    expandBtn.setAttribute('aria-label', `Expandir gráfico ${title}`);
    expandBtn.setAttribute('aria-pressed', 'false');
    expandBtn.textContent = '⤢ AMPLIAR';

    const wrap = document.createElement('div');
    wrap.className = 'bi-canvas-wrap';
    const canvas = document.createElement('canvas');
    wrap.appendChild(canvas);

    expandBtn.addEventListener('click', () => {
      const zoomed = panel.classList.toggle('is-zoomed');
      expandBtn.setAttribute('aria-pressed', String(zoomed));
      expandBtn.textContent = zoomed ? '✕ FECHAR' : '⤢ AMPLIAR';
      window.requestAnimationFrame(() => {
        if (canvas.__chartInstance) canvas.__chartInstance.resize();
      });
    });

    h.append(titleSpan, expandBtn);
    panel.append(h, wrap);
    chartsGrid.appendChild(panel);
    return canvas;
  }

  function createTablePanel(title, headers, rows) {
    const panel = document.createElement('div');
    panel.className = 'bi-chart-panel is-kind-table';
    const h = document.createElement('header');
    h.className = 'bi-chart-head mono';
    const titleSpan = document.createElement('span');
    titleSpan.className = 'bi-chart-title';
    titleSpan.textContent = title;
    h.appendChild(titleSpan);
    const wrap = document.createElement('div');
    wrap.className = 'bi-table-wrap';
    const table = document.createElement('table');
    table.className = 'bi-table';

    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    headers.forEach((text) => {
      const th = document.createElement('th');
      th.className = 'mono';
      th.textContent = text;
      trh.appendChild(th);
    });
    thead.appendChild(trh);

    const tbody = document.createElement('tbody');
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      r.forEach((cell, colIdx) => {
        const td = document.createElement('td');
        td.textContent = cell;
        if (headers[colIdx]) td.dataset.label = headers[colIdx];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.append(thead, tbody);
    wrap.appendChild(table);
    panel.append(h, wrap);
    chartsGrid.appendChild(panel);
  }

  function makeChart(canvas, config) {
    if (typeof window.Chart !== 'function') return;
    const mobile = isMobileChart();
    const indexAxis = config.options?.indexAxis || 'x';
    const datasetCount = config.data?.datasets?.length || 1;
    const isDoughnut = config.type === 'doughnut';
    const panel = canvas.closest('.bi-chart-panel');

    if (panel) {
      panel.classList.remove('is-kind-doughnut', 'is-kind-hbar', 'is-kind-combo', 'is-kind-standard');
      if (isDoughnut) {
        panel.classList.add('is-kind-doughnut');
        panel.style.setProperty('--mobile-chart-h', '295px');
      } else if (indexAxis === 'y') {
        panel.classList.add('is-kind-hbar');
        const rowCount = config.data?.labels?.length || 4;
        panel.style.setProperty('--mobile-chart-h', `${Math.max(270, rowCount * 42 + 64)}px`);
      } else if (config.options?.scales?.y1) {
        panel.classList.add('is-kind-combo');
        panel.style.setProperty('--mobile-chart-h', '285px');
      } else {
        panel.classList.add('is-kind-standard');
        panel.style.setProperty('--mobile-chart-h', '265px');
      }
    }

    const defaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: PALETTE.text, font: { family: 'JetBrains Mono', size: 11 } },
        },
        tooltip: {
          backgroundColor: '#0b0e15',
          borderColor: 'rgba(255, 90, 31, 0.45)',
          borderWidth: 1,
          titleColor: PALETTE.bone,
          bodyColor: PALETTE.bone,
        },
      },
    };

    const nextOptions = {
      ...defaults,
      ...(config.options || {}),
      plugins: {
        ...defaults.plugins,
        ...((config.options && config.options.plugins) || {}),
      },
    };

    if (mobile) {
      nextOptions.interaction = {
        mode: isDoughnut ? 'nearest' : 'index',
        intersect: isDoughnut,
      };
      nextOptions.layout = { padding: { top: 4, right: 6, bottom: 2, left: 0 } };

      if (isDoughnut) {
        nextOptions.cutout = '56%';
      }

      if (!isDoughnut && datasetCount <= 1) {
        nextOptions.plugins.legend = { ...nextOptions.plugins.legend, display: false };
      } else {
        nextOptions.plugins.legend = {
          ...nextOptions.plugins.legend,
          display: true,
          position: 'bottom',
          labels: {
            color: PALETTE.text,
            boxWidth: 10,
            boxHeight: 10,
            padding: 10,
            font: { family: 'JetBrains Mono', size: 10 },
          },
        };
      }

      // Full-precision tooltips even when axis ticks are compact/truncated
      const origYCb = config.options?.scales?.y?.ticks?.callback;
      const origXCb = config.options?.scales?.x?.ticks?.callback;
      const numOrigCb = indexAxis === 'y' ? origXCb : origYCb;
      const isCurrencyChart = numOrigCb === fmtBRLShort;

      nextOptions.plugins.tooltip = {
        ...nextOptions.plugins.tooltip,
        padding: 10,
        titleFont: { family: 'Space Grotesk', size: 12, weight: '700' },
        bodyFont: { family: 'JetBrains Mono', size: 11 },
        callbacks: {
          title: (items) => items?.[0]?.label || '',
          label: (ctx) => {
            const rawVal = isDoughnut ? ctx.parsed : indexAxis === 'y' ? ctx.parsed.x : ctx.parsed.y;
            const prefix = ctx.dataset?.label ? `${ctx.dataset.label}: ` : '';
            if (isDoughnut) {
              const total = (ctx.dataset.data || []).reduce((acc, v) => acc + Number(v || 0), 0);
              const pct = total > 0 ? ((rawVal / total) * 100).toFixed(1).replace('.', ',') : '0,0';
              const valText = Math.abs(rawVal) >= 1000 ? fmtBRLShort(rawVal) : fmtInt(rawVal);
              return ` ${ctx.label}: ${valText} (${pct}%)`;
            }
            const dsYId = ctx.dataset?.yAxisID;
            if (dsYId === 'y1') {
              const y1Cb = config.options?.scales?.y1?.ticks?.callback;
              const strVal = typeof y1Cb === 'function' ? y1Cb(rawVal) : fmtDec(rawVal);
              return ` ${prefix}${strVal}`;
            }
            if (isCurrencyChart || /receita|fatur|lucro|meta|arrecad|bruto|l[ií]quido|valor|subs[ií]dio|frete/i.test(prefix)) {
              return ` ${prefix}${fmtBRL(rawVal)}`;
            }
            if (typeof numOrigCb === 'function' && String(numOrigCb(50)).includes('%')) {
              return ` ${prefix}${fmtDec(rawVal, '%')}`;
            }
            return ` ${prefix}${fmtInt(rawVal)}`;
          },
        },
      };

      if (nextOptions.scales) {
        const scaled = {};
        Object.entries(nextOptions.scales).forEach(([axisKey, axisCfg]) => {
          if (!axisCfg) return;
          const isCatAxis = (indexAxis === 'y' && axisKey === 'y') || (indexAxis !== 'y' && axisKey === 'x');
          const origTicks = axisCfg.ticks || {};
          const origCb = origTicks.callback;
          const isPctAxis = typeof origCb === 'function' && String(origCb(50)).includes('%');

          const newTicks = {
            ...origTicks,
            font: { family: 'JetBrains Mono', size: 9.5 },
          };

          if (isCatAxis) {
            newTicks.maxRotation = indexAxis === 'y' ? 0 : 35;
            newTicks.minRotation = 0;
            newTicks.autoSkip = indexAxis !== 'y';
            if (indexAxis !== 'y') newTicks.maxTicksLimit = 6;
            const limit = indexAxis === 'y' ? 14 : 11;
            newTicks.callback = function (val) {
              return truncateLabel(this.getLabelForValue(val), limit);
            };
          } else {
            newTicks.maxTicksLimit = axisKey === 'x' ? 4 : 5;
            if (isPctAxis) {
              newTicks.callback = (v) => `${Math.round(Number(v))}%`;
            } else {
              newTicks.callback = (v) => fmtAxisCompact(v);
            }
          }

          scaled[axisKey] = {
            ...axisCfg,
            ticks: newTicks,
          };
        });
        nextOptions.scales = scaled;
      }
    }

    config.options = nextOptions;
    const chart = new window.Chart(canvas.getContext('2d'), config);
    canvas.__chartInstance = chart;
    activeCharts.push(chart);
  }

  const baseScales = (yFmt) => ({
    x: {
      ticks: { color: PALETTE.text, font: { family: 'JetBrains Mono', size: 10 } },
      grid: { color: 'transparent' },
    },
    y: {
      ticks: {
        color: PALETTE.text,
        font: { family: 'JetBrains Mono', size: 10 },
        callback: yFmt || ((v) => v),
      },
      grid: { color: PALETTE.grid },
    },
  });

  function renderSubbar(items, activeValue, labelPrefix, onPick, extraPages = null) {
    subBar.innerHTML = '';
    if (extraPages && extraPages.length) {
      const pgWrap = document.createElement('div');
      pgWrap.className = 'bi-sub-group';
      extraPages.forEach((pg) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `bi-chip${currentPage === pg.id ? ' is-active' : ''}`;
        b.textContent = pg.label;
        b.addEventListener('click', () => {
          currentPage = pg.id;
          renderNative();
        });
        pgWrap.appendChild(b);
      });
      subBar.appendChild(pgWrap);
    }

    if (items && items.length) {
      const fWrap = document.createElement('div');
      fWrap.className = 'bi-sub-group';
      const lbl = document.createElement('span');
      lbl.className = 'mono bi-sub-label';
      lbl.textContent = `${labelPrefix}:`;
      fWrap.appendChild(lbl);

      items.forEach((val) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `bi-chip${activeValue === val ? ' is-active' : ''}`;
        b.textContent = val;
        b.addEventListener('click', () => {
          onPick(val);
        });
        fWrap.appendChild(b);
      });
      subBar.appendChild(fWrap);
    }
  }

  function renderNative() {
    const dbMap = window.PORTFOLIO_DASHBOARDS || {};
    const d = dbMap[currentId];
    if (!d) return;

    destroyCharts();
    kpiGrid.innerHTML = '';
    chartsGrid.innerHTML = '';

    // 1. ADEGA
    if (currentId === 'adega') {
      if (!d.filters.includes(currentFilter)) currentFilter = d.filters[0];
      renderSubbar(d.filters, currentFilter, d.filterLabel, (v) => {
        currentFilter = v;
        renderNative();
      });
      const s = d.slices[currentFilter];
      kpiGrid.append(
        createKpiCard('FATURAMENTO LÍQUIDO', fmtBRLShort(s.kpis.faturamento), fmtBRL(s.kpis.faturamento), true),
        createKpiCard('LUCRO BRUTO', fmtBRLShort(s.kpis.lucro), `Margem ${fmtDec(s.kpis.margem, '%')}`),
        createKpiCard('TICKET MÉDIO B2B', fmtBRL(s.kpis.ticket), `${fmtInt(s.kpis.pedidos)} pedidos`),
        createKpiCard('VOLUME TOTAL', `${fmtInt(s.kpis.volume)} un.`, 'Unidades faturadas')
      );

      makeChart(createChartPanel('FATURAMENTO POR DIA DA SEMANA (WEEKEND RUSH)'), {
        type: 'bar',
        data: {
          labels: s.byDow.labels,
          datasets: [
            {
              label: 'Faturamento (R$)',
              data: s.byDow.values,
              backgroundColor: s.byDow.labels.map((l) =>
                ['Qui', 'Sex', 'Sáb'].includes(l) ? PALETTE.orange : 'rgba(244,243,239,0.22)'
              ),
              borderRadius: 6,
            },
          ],
        },
        options: { scales: baseScales(fmtBRLShort) },
      });

      makeChart(createChartPanel('FATURAMENTO POR CANAL DE ATENDIMENTO'), {
        type: 'doughnut',
        data: {
          labels: s.byChannel.labels,
          datasets: [
            {
              data: s.byChannel.values,
              backgroundColor: [PALETTE.orange, PALETTE.amber, PALETTE.cyan, '#94a3b8'],
              borderColor: '#0b0e15',
              borderWidth: 2,
            },
          ],
        },
      });

      makeChart(createChartPanel('EVOLUÇÃO MENSAL DE FATURAMENTO'), {
        type: 'line',
        data: {
          labels: s.byMonth.labels,
          datasets: [
            {
              label: 'Faturamento Mensal',
              data: s.byMonth.values,
              borderColor: PALETTE.orange,
              backgroundColor: PALETTE.orangeSoft,
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: { scales: baseScales(fmtBRLShort) },
      });

      makeChart(createChartPanel('FATURAMENTO & MARGEM % POR CATEGORIA'), {
        type: 'bar',
        data: {
          labels: s.byCategory.labels,
          datasets: [
            {
              label: 'Faturamento (R$)',
              data: s.byCategory.revenue,
              backgroundColor: PALETTE.orange,
              borderRadius: 5,
              yAxisID: 'y',
            },
            {
              type: 'line',
              label: 'Margem %',
              data: s.byCategory.margin,
              borderColor: PALETTE.bone,
              backgroundColor: PALETTE.bone,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          scales: {
            ...baseScales(fmtBRLShort),
            y1: {
              position: 'right',
              ticks: { color: PALETTE.bone, callback: (v) => `${v}%` },
              grid: { drawOnChartArea: false },
            },
          },
        },
      });
    }

    // 2. ONG VIVA COMUNIDADE
    else if (currentId === 'ong-viva') {
      if (!d.filters.includes(currentFilter)) currentFilter = d.filters[0];
      renderSubbar(d.filters, currentFilter, d.filterLabel, (v) => {
        currentFilter = v;
        renderNative();
      });
      const s = d.slices[currentFilter];
      kpiGrid.append(
        createKpiCard('TOTAL ARRECADADO', fmtBRLShort(s.kpis.arrecadado), fmtBRL(s.kpis.arrecadado), true),
        createKpiCard('INVESTIMENTO SOCIAL', fmtBRLShort(s.kpis.investimento), 'Execução direta'),
        createKpiCard('TOTAL ATENDIMENTOS', fmtInt(s.kpis.atendimentos), `Custo médio ${fmtBRL(s.kpis.custoMedio)}`),
        createKpiCard('TICKET MÉDIO DOAÇÃO', fmtBRL(s.kpis.ticketMedio), 'Doações aprovadas')
      );

      makeChart(createChartPanel('EVOLUÇÃO MENSAL: ARRECADAÇÃO VS. INVESTIMENTO SOCIAL'), {
        type: 'bar',
        data: {
          labels: s.byMonth.labels,
          datasets: [
            { label: 'Arrecadado (R$)', data: s.byMonth.arrecadado, backgroundColor: PALETTE.orange, borderRadius: 4 },
            {
              type: 'line',
              label: 'Investimento Social (R$)',
              data: s.byMonth.investimento,
              borderColor: PALETTE.cyan,
              tension: 0.3,
            },
          ],
        },
        options: { scales: baseScales(fmtBRLShort) },
      });

      makeChart(createChartPanel('ARRECADAÇÃO REALIZADA VS. META POR PROJETO'), {
        type: 'bar',
        data: {
          labels: s.byProject.labels,
          datasets: [
            { label: 'Realizado', data: s.byProject.realizado, backgroundColor: PALETTE.orange, borderRadius: 4 },
            { label: 'Meta', data: s.byProject.meta, backgroundColor: 'rgba(244,243,239,0.22)', borderRadius: 4 },
          ],
        },
        options: { indexAxis: 'y', scales: { x: baseScales(fmtBRLShort).y, y: baseScales().x } },
      });

      makeChart(createChartPanel('COMPOSIÇÃO DE DOADORES (PF VS. PJ)'), {
        type: 'doughnut',
        data: {
          labels: s.byTipo.labels,
          datasets: [
            {
              data: s.byTipo.values,
              backgroundColor: [PALETTE.orange, PALETTE.cyan],
              borderColor: '#0b0e15',
              borderWidth: 2,
            },
          ],
        },
      });

      createTablePanel(
        'MATRIZ DE EXECUÇÃO POR CATEGORIA DE SERVIÇO',
        ['Categoria', 'Atendimentos', 'Custo Médio', 'Beneficiários'],
        s.serviceTable.map((r) => [r.categoria, fmtInt(r.atendimentos), fmtBRL(r.custoMedio), fmtInt(r.beneficiarios)])
      );
    }

    // 3. PETSHOP GATITOS
    else if (currentId === 'petshop') {
      if (!d.filters.includes(currentFilter)) currentFilter = d.filters[0];
      renderSubbar(d.filters, currentFilter, d.filterLabel, (v) => {
        currentFilter = v;
        renderNative();
      });
      const s = d.slices[currentFilter];
      kpiGrid.append(
        createKpiCard('TOTAL FATURAMENTO', fmtBRLShort(s.kpis.faturamento), fmtBRL(s.kpis.faturamento), true),
        createKpiCard('QTD. PRODUTOS VENDIDOS', `${fmtInt(s.kpis.qtdVendida)} un.`, 'Volume transacionado'),
        createKpiCard('MÉDIA DE PETS / TUTOR', fmtDec(s.kpis.mediaPets), 'Efeito Multi-Pet (+45%)'),
        createKpiCard('MARCAS NO CATÁLOGO', 'Cachorrito · Gatito', 'Período 2020–2022')
      );

      makeChart(createChartPanel('EVOLUÇÃO DE FATURAMENTO (ÁREA TEMPORAL)', true), {
        type: 'line',
        data: {
          labels: s.byMonth.labels,
          datasets: [
            {
              label: 'Faturamento (R$)',
              data: s.byMonth.values,
              borderColor: PALETTE.orange,
              backgroundColor: PALETTE.orangeSoft,
              fill: true,
              tension: 0.32,
            },
          ],
        },
        options: { scales: baseScales(fmtBRLShort) },
      });

      makeChart(createChartPanel('FATURAMENTO POR BAIRRO'), {
        type: 'bar',
        data: {
          labels: s.byBairro.labels,
          datasets: [
            { label: 'Faturamento (R$)', data: s.byBairro.values, backgroundColor: PALETTE.orange, borderRadius: 5 },
          ],
        },
        options: { indexAxis: 'y', scales: { x: baseScales(fmtBRLShort).y, y: baseScales().x } },
      });

      makeChart(createChartPanel('PARTICIPAÇÃO POR GÊNERO DOS TUTORES'), {
        type: 'doughnut',
        data: {
          labels: s.byGender.labels,
          datasets: [
            {
              data: s.byGender.values,
              backgroundColor: [PALETTE.orange, PALETTE.cyan],
              borderColor: '#0b0e15',
              borderWidth: 2,
            },
          ],
        },
      });
    }

    // 4. SUPPLY CHAIN
    else if (currentId === 'supplychain') {
      if (!d.filters.includes(currentFilter)) currentFilter = d.filters[0];
      renderSubbar(d.filters, currentFilter, d.filterLabel, (v) => {
        currentFilter = v;
        renderNative();
      });
      const s = d.slices[currentFilter];
      kpiGrid.append(
        createKpiCard('FATURAMENTO LÍQUIDO', fmtBRLShort(s.kpis.faturamento), fmtBRL(s.kpis.faturamento), true),
        createKpiCard('OTIF % (NO PRAZO)', fmtDec(s.kpis.otif, '%'), 'Meta contratual: 85%'),
        createKpiCard('LEAD TIME MÉDIO', `${fmtDec(s.kpis.leadTime)} dias`, 'Porta a porta'),
        createKpiCard('CUSTO FRETE REAL', fmtBRLShort(s.kpis.custoFrete), `${fmtInt(s.kpis.emTransito)} em trânsito`)
      );

      makeChart(createChartPanel('EVOLUÇÃO MENSAL: VOLUME DE PEDIDOS VS. OTIF %'), {
        type: 'bar',
        data: {
          labels: s.byMonth.labels,
          datasets: [
            { label: 'Pedidos', data: s.byMonth.pedidos, backgroundColor: 'rgba(244,243,239,0.22)', borderRadius: 4, yAxisID: 'y' },
            { type: 'line', label: 'OTIF %', data: s.byMonth.otif, borderColor: PALETTE.orange, tension: 0.25, yAxisID: 'y1' },
          ],
        },
        options: {
          scales: {
            ...baseScales(fmtInt),
            y1: { position: 'right', min: 50, max: 100, ticks: { color: PALETTE.orange, callback: (v) => `${v}%` }, grid: { drawOnChartArea: false } },
          },
        },
      });

      makeChart(createChartPanel('SCORECARD DE TRANSPORTADORAS (OTIF %)'), {
        type: 'bar',
        data: {
          labels: s.byCarrier.labels,
          datasets: [
            {
              label: 'OTIF %',
              data: s.byCarrier.otif,
              backgroundColor: s.byCarrier.otif.map((v) => (v >= 85 ? PALETTE.emerald : PALETTE.orange)),
              borderRadius: 5,
            },
          ],
        },
        options: { indexAxis: 'y', scales: { x: { max: 100, ticks: { color: PALETTE.text, callback: (v) => `${v}%` }, grid: { color: PALETTE.grid } }, y: baseScales().x } },
      });

      makeChart(createChartPanel('FATURAMENTO & MARGEM DE CONTRIBUIÇÃO POR REGIÃO'), {
        type: 'bar',
        data: {
          labels: s.byRegion.labels,
          datasets: [
            { label: 'Faturamento', data: s.byRegion.faturamento, backgroundColor: PALETTE.orange, borderRadius: 4 },
            { label: 'Margem Contrib.', data: s.byRegion.margem, backgroundColor: PALETTE.cyan, borderRadius: 4 },
          ],
        },
        options: { scales: baseScales(fmtBRLShort) },
      });

      makeChart(createChartPanel('SUBSÍDIO DE FRETE VS. FRETE COBRADO POR CATEGORIA'), {
        type: 'bar',
        data: {
          labels: s.byCategoryFreight.labels,
          datasets: [
            { label: 'Subsídio (Absorvido)', data: s.byCategoryFreight.subsidio, backgroundColor: PALETTE.orange, stack: 'f' },
            { label: 'Frete Cobrado', data: s.byCategoryFreight.cobrado, backgroundColor: 'rgba(244,243,239,0.28)', stack: 'f' },
          ],
        },
        options: { scales: { x: { stacked: true, ticks: { color: PALETTE.text } }, y: { stacked: true, ...baseScales(fmtBRLShort).y } } },
      });
    }

    // 5. ONG MULTI-PROGRAMAS (2 Pages)
    else if (currentId === 'ong-multi') {
      const pages = [
        { id: 'contas', label: '01 // Painel de Contas' },
        { id: 'operacoes', label: '02 // Painel Operações' },
      ];
      if (!['contas', 'operacoes'].includes(currentPage)) currentPage = 'contas';
      if (!d.filters.includes(currentFilter)) currentFilter = d.filters[0];
      renderSubbar(d.filters, currentFilter, d.filterLabel, (v) => {
        currentFilter = v;
        renderNative();
      }, pages);

      const s = d.slices[currentFilter];
      if (currentPage === 'contas') {
        const c = s.contas;
        kpiGrid.append(
          createKpiCard('ARRECADADO LÍQUIDO', fmtBRLShort(c.kpis.arrecadadoLiq), fmtBRL(c.kpis.arrecadadoLiq), true),
          createKpiCard('META CAPTAÇÃO ORÇADA', fmtBRLShort(c.kpis.metaCaptacao), 'fOrcamentoMetas'),
          createKpiCard('SUPERÁVIT / RESERVA', fmtBRLShort(c.kpis.superavit), 'Liquidez de continuidade'),
          createKpiCard('DOADORES RECORRENTES', fmtInt(c.kpis.recorrentes), `Ticket ${fmtBRL(c.kpis.ticketMedio)}`)
        );

        makeChart(createChartPanel('REALIZADO LÍQUIDO VS. META MENSAL'), {
          type: 'line',
          data: {
            labels: c.byMonth.labels,
            datasets: [
              { label: 'Realizado Líquido', data: c.byMonth.realizado, borderColor: PALETTE.orange, backgroundColor: PALETTE.orangeSoft, fill: true, tension: 0.3 },
              { label: 'Meta Orçada', data: c.byMonth.meta, borderColor: PALETTE.bone, borderDash: [6, 4], tension: 0.2 },
            ],
          },
          options: { scales: baseScales(fmtBRLShort) },
        });

        makeChart(createChartPanel('ARRECADAÇÃO BRUTA VS. LÍQUIDA POR CANAL'), {
          type: 'bar',
          data: {
            labels: c.byChannel.labels,
            datasets: [
              { label: 'Bruto', data: c.byChannel.bruto, backgroundColor: 'rgba(244,243,239,0.25)', borderRadius: 4 },
              { label: 'Líquido', data: c.byChannel.liquido, backgroundColor: PALETTE.orange, borderRadius: 4 },
            ],
          },
          options: { scales: baseScales(fmtBRLShort) },
        });

        makeChart(createChartPanel('COMPOSIÇÃO POR TIPO DE DOADOR'), {
          type: 'doughnut',
          data: {
            labels: c.byTipo.labels,
            datasets: [{ data: c.byTipo.values, backgroundColor: [PALETTE.orange, PALETTE.cyan, PALETTE.amber], borderColor: '#0b0e15', borderWidth: 2 }],
          },
        });

        makeChart(createChartPanel('ARRECADAÇÃO LÍQUIDA POR PROJETO'), {
          type: 'bar',
          data: {
            labels: c.byProject.labels,
            datasets: [{ label: 'Líquido (R$)', data: c.byProject.values, backgroundColor: PALETTE.orange, borderRadius: 5 }],
          },
          options: { indexAxis: 'y', scales: { x: baseScales(fmtBRLShort).y, y: baseScales().x } },
        });
      } else {
        const op = s.operacoes;
        kpiGrid.append(
          createKpiCard('TOTAL ATENDIMENTOS', fmtInt(op.kpis.atendimentos), 'Serviços entregues', true),
          createKpiCard('BENEFICIÁRIOS ÚNICOS', fmtInt(op.kpis.beneficiarios), 'Cidadãos assistidos'),
          createKpiCard('CUSTO / BENEFICIÁRIO', fmtBRL(op.kpis.custoBeneficiario), 'Eficiência social'),
          createKpiCard('HORAS VOLUNTARIADO', `${fmtInt(op.kpis.horasVoluntariado)} h`, 'Esforço mobilizado')
        );

        makeChart(createChartPanel('ATENDIMENTOS REALIZADOS VS. META MENSAL'), {
          type: 'line',
          data: {
            labels: op.byMonth.labels,
            datasets: [
              { label: 'Realizado', data: op.byMonth.realizado, borderColor: PALETTE.orange, backgroundColor: PALETTE.orangeSoft, fill: true, tension: 0.3 },
              { label: 'Meta', data: op.byMonth.meta, borderColor: PALETTE.bone, borderDash: [6, 4], tension: 0.2 },
            ],
          },
          options: { scales: baseScales(fmtInt) },
        });

        makeChart(createChartPanel('ATENDIMENTOS POR ZONA GEOGRÁFICA'), {
          type: 'bar',
          data: {
            labels: op.byZone.labels,
            datasets: [{ label: 'Atendimentos', data: op.byZone.values, backgroundColor: PALETTE.orange, borderRadius: 5 }],
          },
          options: { scales: baseScales(fmtInt) },
        });

        makeChart(createChartPanel('DISTRIBUIÇÃO POR ÁREA DE FOCO'), {
          type: 'doughnut',
          data: {
            labels: op.byArea.labels,
            datasets: [{ data: op.byArea.values, backgroundColor: [PALETTE.orange, PALETTE.cyan, PALETTE.amber, PALETTE.emerald], borderColor: '#0b0e15', borderWidth: 2 }],
          },
        });

        createTablePanel(
          'PRESTAÇÃO DE CONTAS POR PROJETO',
          ['Projeto', 'Atendimentos', 'Beneficiários', 'Arrecadado Líq.'],
          op.projectTable.map((r) => [r.projeto, fmtInt(r.atendimentos), fmtInt(r.beneficiarios), fmtBRLShort(r.arrecadado)])
        );
      }
    }

    // 6. PADARIA DINIZ (4 Real Pages)
    else if (currentId === 'padaria') {
      if (!['financeiro', 'operacional', 'clientes', 'estoque'].includes(currentPage)) currentPage = 'financeiro';
      renderSubbar(null, null, '', () => {}, d.pages);

      if (currentPage === 'financeiro') {
        const f = d.financeiro;
        kpiGrid.append(
          createKpiCard('RECEITA BRUTA', fmtBRL(f.kpis.receitaBruta), f.kpis.momPct, true),
          createKpiCard('RECEITA FATURADA', fmtBRL(f.kpis.receitaFaturada), f.kpis.faturadaPct),
          createKpiCard('LUCRO REAL', fmtBRL(f.kpis.lucroReal), `Margem ${fmtDec(f.kpis.margemReal, '%')}`),
          createKpiCard('CUSTO TOTAL (CMV)', fmtBRL(f.kpis.custoTotal), `Markup ${fmtDec(f.kpis.markupMedio, '%')}`)
        );

        makeChart(createChartPanel('FUNIL FINANCEIRO: DA RECEITA BRUTA AO LUCRO REAL'), {
          type: 'bar',
          data: {
            labels: f.funil.labels,
            datasets: [
              {
                label: 'Valor (R$)',
                data: f.funil.values,
                backgroundColor: [PALETTE.orange, PALETTE.amber, 'rgba(244,243,239,0.28)', PALETTE.emerald, PALETTE.cyan],
                borderRadius: 6,
              },
            ],
          },
          options: { scales: baseScales(fmtBRLShort) },
        });

        makeChart(createChartPanel('TIME INTELLIGENCE: MTD · QTD · YTD · ANO ANTERIOR'), {
          type: 'bar',
          data: {
            labels: f.comparativos.labels,
            datasets: [{ label: 'Receita (R$)', data: f.comparativos.values, backgroundColor: PALETTE.orange, borderRadius: 6 }],
          },
          options: { scales: baseScales(fmtBRLShort) },
        });
      } else if (currentPage === 'operacional') {
        const o = d.operacional;
        kpiGrid.append(
          createKpiCard('LEAD TIME MÉDIO', `${fmtDec(o.kpis.leadTimeMin)} min`, o.kpis.statusSla, true),
          createKpiCard('PEDIDOS NO PRAZO', fmtDec(o.kpis.pedidosNoPrazoPct, '%'), `Meta: ${o.kpis.metaMin} min`),
          createKpiCard('PEDIDOS AGENDADOS', fmtInt(o.kpis.agendadosHistorico), 'Modalidade Peça e Retire'),
          createKpiCard('RECEITA EM ABERTO', fmtBRL(o.kpis.receitaEmAberto), `Fila ativa: ${o.kpis.filaAtiva}`)
        );

        makeChart(createChartPanel('EFICIÊNCIA DE SLA (META 30 MIN)'), {
          type: 'doughnut',
          data: {
            labels: o.slaBreakdown.labels,
            datasets: [{ data: o.slaBreakdown.values, backgroundColor: [PALETTE.emerald, PALETTE.orange], borderColor: '#0b0e15', borderWidth: 2 }],
          },
        });

        makeChart(createChartPanel('RESUMO DA ESTEIRA OPERACIONAL'), {
          type: 'bar',
          data: {
            labels: o.filaStatus.labels,
            datasets: [{ label: 'Quantidade', data: o.filaStatus.values, backgroundColor: PALETTE.orange, borderRadius: 6 }],
          },
          options: { scales: baseScales(fmtInt) },
        });
      } else if (currentPage === 'clientes') {
        const cl = d.clientes;
        kpiGrid.append(
          createKpiCard('TOTAL GERAL PEDIDOS', fmtInt(cl.kpis.totalPedidos), `Conversão ${fmtDec(cl.kpis.conversaoPct, '%')}`, true),
          createKpiCard('TICKET MÉDIO', fmtBRL(cl.kpis.ticketMedio), `${fmtInt(cl.kpis.volumeItens)} itens vendidos`),
          createKpiCard('CLIENTES ÚNICOS (LGPD)', fmtInt(cl.kpis.clientesUnicos), `Freq. média ${fmtDec(cl.kpis.frequenciaMedia)}x`),
          createKpiCard('PEDIDOS CANCELADOS', fmtInt(cl.kpis.cancelados), '13,26% do total')
        );

        makeChart(createChartPanel('SHARE FINANCEIRO — RECEITA POR SETOR'), {
          type: 'doughnut',
          data: {
            labels: cl.setorReceita.labels.map((l, i) => `${l} (${cl.setorReceita.pcts[i]}%)`),
            datasets: [{ data: cl.setorReceita.values, backgroundColor: [PALETTE.orange, PALETTE.amber, PALETTE.cyan, PALETTE.emerald], borderColor: '#0b0e15', borderWidth: 2 }],
          },
        });

        makeChart(createChartPanel('MIX FÍSICO — VOLUME DE ITENS POR SETOR'), {
          type: 'bar',
          data: {
            labels: cl.setorVolume.labels,
            datasets: [{ label: 'Unidades', data: cl.setorVolume.values, backgroundColor: PALETTE.orange, borderRadius: 6 }],
          },
          options: { scales: baseScales(fmtInt) },
        });

        createTablePanel(
          'MOTIVOS DE CANCELAMENTO (ANÁLISE DE PERDAS)',
          ['Justificativa', 'Qtd.', '% Total'],
          cl.cancelamentos.map((r) => [r.motivo, fmtInt(r.qtd), `${r.pct}%`]),
          true
        );
      } else {
        const e = d.estoque;
        kpiGrid.append(
          createKpiCard('ESTOQUE TOTAL', `${fmtInt(e.kpis.estoqueTotal)} un.`, `${e.kpis.skusAtivos} SKUs ativos`, true),
          createKpiCard('CAPITAL IMOBILIZADO', fmtBRL(e.kpis.valorCusto), 'Valor a preço de custo'),
          createKpiCard('POTENCIAL DE VENDA', fmtBRL(e.kpis.valorVenda), `Lucro proj. ${fmtBRL(e.kpis.lucroProjetado)}`),
          createKpiCard('TAXA DE RUPTURA', fmtDec(e.kpis.taxaRuptura, '%'), `${e.kpis.esgotados} esgotados · ${e.kpis.alerta} alerta`)
        );

        makeChart(createChartPanel('SAÚDE DOS SKUs EM ESTOQUE'), {
          type: 'doughnut',
          data: {
            labels: e.statusSkus.labels,
            datasets: [{ data: e.statusSkus.values, backgroundColor: [PALETTE.emerald, PALETTE.amber, PALETTE.orange], borderColor: '#0b0e15', borderWidth: 2 }],
          },
        });

        makeChart(createChartPanel('CAPITAL IMOBILIZADO VS. VENDA & LUCRO PROJETADO'), {
          type: 'bar',
          data: {
            labels: e.financeiroEstoque.labels,
            datasets: [{ label: 'Valor (R$)', data: e.financeiroEstoque.values, backgroundColor: [PALETTE.slate, PALETTE.orange, PALETTE.emerald], borderRadius: 6 }],
          },
          options: { scales: baseScales(fmtBRLShort) },
        });
      }
    }

    // Auto-stretch horizontally so all panels fit in a single zero-scroll screen on desktop
    const panelCount = chartsGrid.children.length;
    chartsGrid.classList.remove('cols-2', 'cols-3', 'cols-4');
    if (panelCount <= 2) chartsGrid.classList.add('cols-2');
    else if (panelCount === 3) chartsGrid.classList.add('cols-3');
    else chartsGrid.classList.add('cols-4');
  }

  function applyMode(mode) {
    currentMode = mode;
    const dbMap = window.PORTFOLIO_DASHBOARDS || {};
    const d = dbMap[currentId];
    if (!d) return;

    const isNative = mode === 'native';
    modeNativeBtn.classList.toggle('is-active', isNative);
    modeEmbedBtn.classList.toggle('is-active', !isNative);
    nativeContainer.classList.toggle('is-hidden', !isNative);
    embedContainer.classList.toggle('is-hidden', isNative);

    if (isNative) {
      renderNative();
    } else if (embedIframe.src !== d.embedUrl) {
      embedIframe.src = d.embedUrl;
    }
  }

  function openDashboard(id) {
    const dbMap = window.PORTFOLIO_DASHBOARDS || {};
    if (!dbMap[id]) return;

    currentId = id;
    currentFilter = null;
    currentPage = null;

    const meta = META[id] || { code: 'BI // DASHBOARD', title: id };
    codeEl.textContent = meta.code;
    titleEl.textContent = meta.title;
    if (projectSelect) projectSelect.value = id;
    if (externalLink) externalLink.href = dbMap[id].embedUrl;
    if (mobileExternalLink) mobileExternalLink.href = dbMap[id].embedUrl;

    // Reset iframe when switching project so embed loads fresh if toggled
    embedIframe.src = 'about:blank';

    if (window.__portfolioLenis) window.__portfolioLenis.stop();
    if (!dialog.open) dialog.showModal();
    applyMode('native');
  }

  window.openPortfolioDashboard = openDashboard;

  document.querySelectorAll('[data-open-dashboard]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const caseDlg = document.getElementById('case-dialog');
      if (caseDlg && caseDlg.open) caseDlg.close();
      openDashboard(btn.dataset.openDashboard);
    });
  });

  if (projectSelect) {
    projectSelect.addEventListener('change', (e) => openDashboard(e.target.value));
  }

  if (modeNativeBtn) modeNativeBtn.addEventListener('click', () => applyMode('native'));
  if (modeEmbedBtn) modeEmbedBtn.addEventListener('click', () => applyMode('embed'));

  if (openCaseBtn) {
    openCaseBtn.addEventListener('click', () => {
      dialog.close();
      if (typeof window.openPortfolioCase === 'function') {
        window.openPortfolioCase(currentId);
      }
    });
  }

  dialog.addEventListener('close', () => {
    destroyCharts();
    embedIframe.src = 'about:blank';
    if (window.__portfolioLenis) window.__portfolioLenis.start();
  });

  // Escape exits fullscreen mobile chart zoom before dismissing dialog
  dialog.addEventListener('cancel', (e) => {
    const zoomedPanel = dialog.querySelector('.bi-chart-panel.is-zoomed');
    if (zoomedPanel) {
      e.preventDefault();
      zoomedPanel.classList.remove('is-zoomed');
      const btn = zoomedPanel.querySelector('.bi-chart-expand-btn');
      if (btn) {
        btn.setAttribute('aria-pressed', 'false');
        btn.textContent = '⤢ AMPLIAR';
      }
      const c = zoomedPanel.querySelector('canvas');
      if (c && c.__chartInstance) {
        window.requestAnimationFrame(() => c.__chartInstance.resize());
      }
    }
  });

  // Re-adapt charts cleanly if crossing 980px breakpoint or rotating device
  let lastViewportWidth = window.innerWidth;
  let lastMobileFlag = isMobileChart();
  let resizeTimer = 0;
  window.addEventListener(
    'resize',
    () => {
      if (!dialog.open || currentMode !== 'native') return;
      const nowMobile = isMobileChart();
      const nowW = window.innerWidth;
      if (nowMobile === lastMobileFlag && Math.abs(nowW - lastViewportWidth) < 80) return;
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        lastViewportWidth = window.innerWidth;
        lastMobileFlag = isMobileChart();
        renderNative();
      }, 180);
    },
    { passive: true }
  );

  // Fallback obrigatório de light-dismiss para Safari
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) dialog.close();
    });
  }
})();
