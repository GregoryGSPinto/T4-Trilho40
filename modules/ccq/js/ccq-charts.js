/* ============================================
   CCQ CHARTS — Graficos de qualidade
   Pareto, Histograma, Carta de Controle
   Canvas + SVG, sem bibliotecas externas
   ============================================ */

CCQ.charts = (function () {
  const STORE_KEY = 'ccq_projects';

  /* ============================
     PARETO CHART
     ============================ */
  async function renderPareto(projectId) {
    const container = document.getElementById('tool-content');
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!container || !project) return;

    if (!project.paretoData) project.paretoData = [];

    container.innerHTML = `
      <p class="t4-text-sm t4-text-secondary t4-mb-md">Grafico de Pareto: barras ordenadas por frequencia + linha cumulativa (80/20).</p>
      <div class="ccq-data-row">
        <input type="text" id="pareto-label" class="t4-input" placeholder="Categoria" style="flex:1.5">
        <input type="number" id="pareto-value" class="t4-input" placeholder="Valor" style="flex:0.7" inputmode="numeric">
        <button class="t4-btn t4-btn-sm ccq-btn-accent" id="pareto-add">+</button>
      </div>
      <div class="ccq-chart-container t4-mt-md">
        <div class="ccq-chart-title">Grafico de Pareto</div>
        <canvas id="pareto-canvas" class="ccq-chart-canvas"></canvas>
      </div>
      <div id="pareto-data-list" class="t4-mt-md"></div>
    `;

    drawPareto(project.paretoData);
    renderParetoDataList(project.paretoData, projectId);

    document.getElementById('pareto-add').addEventListener('click', () => addParetoItem(projectId));
    document.getElementById('pareto-value').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addParetoItem(projectId); }
    });
  }

  function drawPareto(data) {
    const canvas = document.getElementById('pareto-canvas');
    if (!canvas || data.length === 0) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = 250 * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = '#555a6e';
        ctx.font = '13px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Adicione dados para gerar o grafico', canvas.offsetWidth / 2, 125);
      }
      return;
    }

    const sorted = [...data].sort((a, b) => b.value - a.value);
    const total = sorted.reduce((s, d) => s + d.value, 0);

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = 250;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const padding = { top: 30, right: 40, bottom: 40, left: 40 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;
    const maxVal = sorted[0].value;
    const barW = Math.min(40, (chartW / sorted.length) - 4);
    const gap = (chartW - barW * sorted.length) / (sorted.length + 1);

    /* Eixos */
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, H - padding.bottom);
    ctx.lineTo(W - padding.right, H - padding.bottom);
    ctx.stroke();

    /* Linhas de grade */
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH * i / 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#555a6e';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal * (4 - i) / 4), padding.left - 6, y + 4);
    }

    /* Escala % no lado direito */
    for (let p = 0; p <= 100; p += 25) {
      const y = padding.top + chartH * (1 - p / 100);
      ctx.fillStyle = '#555a6e';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p + '%', W - padding.right + 4, y + 4);
    }

    /* Barras */
    let cumulative = 0;
    const linePoints = [];

    sorted.forEach((item, i) => {
      const x = padding.left + gap + i * (barW + gap);
      const barH = (item.value / maxVal) * chartH;
      const y = H - padding.bottom - barH;

      const grad = ctx.createLinearGradient(x, y, x, H - padding.bottom);
      grad.addColorStop(0, '#c084fc');
      grad.addColorStop(1, '#f472b6');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      /* Label */
      ctx.fillStyle = '#8b8fa3';
      ctx.font = '9px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const label = item.label.length > 8 ? item.label.substring(0, 7) + '..' : item.label;
      ctx.fillText(label, x + barW / 2, H - padding.bottom + 14);

      /* Valor sobre a barra */
      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillText(item.value, x + barW / 2, y - 6);

      /* Linha cumulativa */
      cumulative += item.value;
      const pct = cumulative / total;
      const lineY = padding.top + chartH * (1 - pct);
      linePoints.push({ x: x + barW / 2, y: lineY });
    });

    /* Desenhar linha cumulativa */
    if (linePoints.length > 1) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(linePoints[0].x, linePoints[0].y);
      for (let i = 1; i < linePoints.length; i++) {
        ctx.lineTo(linePoints[i].x, linePoints[i].y);
      }
      ctx.stroke();

      linePoints.forEach(pt => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      /* Linha 80% */
      const y80 = padding.top + chartH * 0.2;
      ctx.strokeStyle = 'rgba(248,113,113,0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y80);
      ctx.lineTo(W - padding.right, y80);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(248,113,113,0.6)';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('80%', padding.left + 4, y80 - 4);
    }
  }

  function renderParetoDataList(data, projectId) {
    const list = document.getElementById('pareto-data-list');
    if (!list) return;

    if (data.length === 0) return;

    list.innerHTML = '<div class="ccq-detail-section-title t4-mb-sm">Dados</div>' +
      data.map((d, i) => `
        <div class="t4-list-item" style="padding:8px 12px">
          <span style="flex:1;font-size:0.8125rem">${T4.utils.escapeHTML(d.label)}</span>
          <span style="font-family:var(--t4-font-display);font-size:0.8125rem;color:var(--ccq-accent)">${d.value}</span>
          <button class="t4-btn t4-btn-sm t4-btn-ghost" style="color:var(--t4-status-danger);min-height:28px;padding:4px" onclick="CCQ.charts.removeParetoItem(${i}, '${projectId}')">&times;</button>
        </div>
      `).join('');
  }

  async function addParetoItem(projectId) {
    const labelInput = document.getElementById('pareto-label');
    const valueInput = document.getElementById('pareto-value');
    const label = labelInput.value.trim();
    const value = parseFloat(valueInput.value);

    if (!label || isNaN(value) || value <= 0) {
      T4.notifications.warning('Informe categoria e valor numerico positivo.');
      return;
    }

    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;
    if (!project.paretoData) project.paretoData = [];

    project.paretoData.push({ label, value });
    await T4.storage.put(STORE_KEY, project);

    labelInput.value = '';
    valueInput.value = '';
    labelInput.focus();

    drawPareto(project.paretoData);
    renderParetoDataList(project.paretoData, projectId);
  }

  async function removeParetoItem(index, projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    project.paretoData.splice(index, 1);
    await T4.storage.put(STORE_KEY, project);

    drawPareto(project.paretoData);
    renderParetoDataList(project.paretoData, projectId);
  }

  /* ============================
     HISTOGRAMA
     ============================ */
  async function renderHistogram(projectId) {
    const container = document.getElementById('tool-content');
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!container || !project) return;

    if (!project.histogramData) project.histogramData = [];

    container.innerHTML = `
      <p class="t4-text-sm t4-text-secondary t4-mb-md">Adicione valores individuais. O histograma agrupara automaticamente em faixas.</p>
      <div class="ccq-data-row">
        <input type="number" id="hist-value" class="t4-input" placeholder="Valor" inputmode="decimal" style="flex:1">
        <input type="number" id="hist-bins" class="t4-input" placeholder="Faixas" value="5" min="2" max="20" style="flex:0.5">
        <button class="t4-btn t4-btn-sm ccq-btn-accent" id="hist-add">+</button>
      </div>
      <div class="ccq-chart-container t4-mt-md">
        <div class="ccq-chart-title">Histograma</div>
        <canvas id="hist-canvas" class="ccq-chart-canvas"></canvas>
      </div>
      <div id="hist-data-summary" class="t4-mt-md"></div>
      <div id="hist-raw-data" class="t4-mt-sm"></div>
    `;

    const bins = parseInt(document.getElementById('hist-bins').value) || 5;
    drawHistogram(project.histogramData, bins);
    renderHistDataSummary(project.histogramData);
    renderHistRawData(project.histogramData, projectId);

    document.getElementById('hist-add').addEventListener('click', () => addHistValue(projectId));
    document.getElementById('hist-value').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addHistValue(projectId); }
    });
    document.getElementById('hist-bins').addEventListener('change', () => {
      const b = parseInt(document.getElementById('hist-bins').value) || 5;
      drawHistogram(project.histogramData, b);
    });
  }

  function drawHistogram(rawData, numBins) {
    const canvas = document.getElementById('hist-canvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = 250;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    if (rawData.length < 2) {
      ctx.fillStyle = '#555a6e';
      ctx.font = '13px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Adicione pelo menos 2 valores', W / 2, H / 2);
      return;
    }

    const min = Math.min(...rawData);
    const max = Math.max(...rawData);
    const range = max - min || 1;
    const binWidth = range / numBins;

    const bins = [];
    for (let i = 0; i < numBins; i++) {
      bins.push({ min: min + i * binWidth, max: min + (i + 1) * binWidth, count: 0 });
    }

    rawData.forEach(v => {
      let idx = Math.floor((v - min) / binWidth);
      if (idx >= numBins) idx = numBins - 1;
      bins[idx].count++;
    });

    const maxCount = Math.max(...bins.map(b => b.count));
    const padding = { top: 30, right: 20, bottom: 40, left: 40 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;
    const barW = chartW / numBins - 2;

    /* Eixos */
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, H - padding.bottom);
    ctx.lineTo(W - padding.right, H - padding.bottom);
    ctx.stroke();

    /* Barras */
    bins.forEach((bin, i) => {
      const x = padding.left + i * (barW + 2) + 1;
      const barH = maxCount > 0 ? (bin.count / maxCount) * chartH : 0;
      const y = H - padding.bottom - barH;

      const grad = ctx.createLinearGradient(x, y, x, H - padding.bottom);
      grad.addColorStop(0, '#c084fc');
      grad.addColorStop(1, '#f472b6');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW, barH);

      /* Borda */
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.strokeRect(x, y, barW, barH);

      /* Label de faixa */
      ctx.fillStyle = '#8b8fa3';
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(bin.min.toFixed(1), x + barW / 2, H - padding.bottom + 12);

      /* Contagem */
      if (bin.count > 0) {
        ctx.fillStyle = '#f472b6';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.fillText(bin.count, x + barW / 2, y - 6);
      }
    });

    /* Labels do eixo Y */
    for (let i = 0; i <= 4; i++) {
      const val = Math.round(maxCount * (4 - i) / 4);
      const y = padding.top + chartH * i / 4;
      ctx.fillStyle = '#555a6e';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val, padding.left - 6, y + 4);
    }
  }

  function renderHistDataSummary(data) {
    const el = document.getElementById('hist-data-summary');
    if (!el || data.length === 0) { if (el) el.innerHTML = ''; return; }

    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    const sorted = [...data].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
    const variance = data.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    el.innerHTML = `
      <div class="ccq-detail-section">
        <div class="ccq-detail-section-title">Estatisticas</div>
        <div class="t4-grid-2 t4-gap-sm">
          <div><span class="t4-text-sm t4-text-muted">N: </span><span class="t4-text-sm">${data.length}</span></div>
          <div><span class="t4-text-sm t4-text-muted">Media: </span><span class="t4-text-sm">${mean.toFixed(2)}</span></div>
          <div><span class="t4-text-sm t4-text-muted">Mediana: </span><span class="t4-text-sm">${median.toFixed(2)}</span></div>
          <div><span class="t4-text-sm t4-text-muted">Desvio: </span><span class="t4-text-sm">${stdDev.toFixed(2)}</span></div>
          <div><span class="t4-text-sm t4-text-muted">Min: </span><span class="t4-text-sm">${Math.min(...data).toFixed(2)}</span></div>
          <div><span class="t4-text-sm t4-text-muted">Max: </span><span class="t4-text-sm">${Math.max(...data).toFixed(2)}</span></div>
        </div>
      </div>
    `;
  }

  function renderHistRawData(data, projectId) {
    const el = document.getElementById('hist-raw-data');
    if (!el) return;

    if (data.length === 0) { el.innerHTML = ''; return; }

    el.innerHTML = `
      <div class="t4-flex-between t4-mb-sm">
        <span class="ccq-detail-section-title">Valores (${data.length})</span>
        <button class="t4-btn t4-btn-sm t4-btn-ghost" style="color:var(--t4-status-danger)" onclick="CCQ.charts.clearHistData('${projectId}')">Limpar tudo</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;">
        ${data.map((v, i) => `
          <span class="ccq-member-chip" style="cursor:pointer" onclick="CCQ.charts.removeHistValue(${i}, '${projectId}')">
            ${v.toFixed(1)} <span style="color:var(--t4-text-muted);margin-left:2px">&times;</span>
          </span>
        `).join('')}
      </div>
    `;
  }

  async function addHistValue(projectId) {
    const input = document.getElementById('hist-value');
    const value = parseFloat(input.value);
    if (isNaN(value)) { T4.notifications.warning('Informe um valor numerico.'); return; }

    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;
    if (!project.histogramData) project.histogramData = [];

    project.histogramData.push(value);
    await T4.storage.put(STORE_KEY, project);

    input.value = '';
    input.focus();

    const bins = parseInt(document.getElementById('hist-bins').value) || 5;
    drawHistogram(project.histogramData, bins);
    renderHistDataSummary(project.histogramData);
    renderHistRawData(project.histogramData, projectId);
  }

  async function removeHistValue(index, projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    project.histogramData.splice(index, 1);
    await T4.storage.put(STORE_KEY, project);

    const bins = parseInt(document.getElementById('hist-bins').value) || 5;
    drawHistogram(project.histogramData, bins);
    renderHistDataSummary(project.histogramData);
    renderHistRawData(project.histogramData, projectId);
  }

  async function clearHistData(projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    project.histogramData = [];
    await T4.storage.put(STORE_KEY, project);
    renderHistogram(projectId);
  }

  /* ============================
     CARTA DE CONTROLE
     ============================ */
  async function renderControlChart(projectId) {
    const container = document.getElementById('tool-content');
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!container || !project) return;

    if (!project.controlData) project.controlData = [];

    container.innerHTML = `
      <p class="t4-text-sm t4-text-secondary t4-mb-md">Carta de controle com Limite Superior (LSC), Linha Central (LC) e Limite Inferior (LIC). Desvios +/- 3 sigma.</p>
      <div class="ccq-data-row">
        <input type="text" id="ctrl-label" class="t4-input" placeholder="Amostra" style="flex:1">
        <input type="number" id="ctrl-value" class="t4-input" placeholder="Valor" inputmode="decimal" style="flex:0.7">
        <button class="t4-btn t4-btn-sm ccq-btn-accent" id="ctrl-add">+</button>
      </div>
      <div class="ccq-chart-container t4-mt-md">
        <div class="ccq-chart-title">Carta de Controle</div>
        <canvas id="ctrl-canvas" class="ccq-chart-canvas"></canvas>
      </div>
      <div id="ctrl-legend" class="t4-mt-sm"></div>
      <div id="ctrl-data-list" class="t4-mt-md"></div>
    `;

    drawControlChart(project.controlData);
    renderControlDataList(project.controlData, projectId);

    document.getElementById('ctrl-add').addEventListener('click', () => addControlValue(projectId));
    document.getElementById('ctrl-value').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addControlValue(projectId); }
    });
  }

  function drawControlChart(data) {
    const canvas = document.getElementById('ctrl-canvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = 250;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    if (data.length < 2) {
      ctx.fillStyle = '#555a6e';
      ctx.font = '13px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Adicione pelo menos 2 amostras', W / 2, H / 2);
      renderControlLegend(null, null, null);
      return;
    }

    const values = data.map(d => d.value);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length);
    const lsc = mean + 3 * stdDev;
    const lic = mean - 3 * stdDev;

    const minY = Math.min(lic, ...values) - stdDev * 0.5;
    const maxY = Math.max(lsc, ...values) + stdDev * 0.5;
    const rangeY = maxY - minY || 1;

    const padding = { top: 30, right: 20, bottom: 40, left: 50 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    /* Eixos */
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, H - padding.bottom);
    ctx.lineTo(W - padding.right, H - padding.bottom);
    ctx.stroke();

    function yPos(val) {
      return padding.top + chartH * (1 - (val - minY) / rangeY);
    }

    function xPos(i) {
      return padding.left + (i / (data.length - 1 || 1)) * chartW;
    }

    /* LSC */
    ctx.strokeStyle = 'rgba(248,113,113,0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, yPos(lsc));
    ctx.lineTo(W - padding.right, yPos(lsc));
    ctx.stroke();
    ctx.fillStyle = '#f87171';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('LSC ' + lsc.toFixed(1), padding.left - 4, yPos(lsc) + 3);

    /* LIC */
    ctx.beginPath();
    ctx.moveTo(padding.left, yPos(lic));
    ctx.lineTo(W - padding.right, yPos(lic));
    ctx.stroke();
    ctx.fillText('LIC ' + lic.toFixed(1), padding.left - 4, yPos(lic) + 3);

    /* LC (media) */
    ctx.strokeStyle = 'rgba(251,191,36,0.5)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padding.left, yPos(mean));
    ctx.lineTo(W - padding.right, yPos(mean));
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('LC ' + mean.toFixed(1), padding.left - 4, yPos(mean) + 3);

    ctx.setLineDash([]);

    /* Linha de dados */
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = xPos(i);
      const y = yPos(d.value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    /* Pontos */
    data.forEach((d, i) => {
      const x = xPos(i);
      const y = yPos(d.value);
      const outOfControl = d.value > lsc || d.value < lic;

      ctx.fillStyle = outOfControl ? '#f87171' : '#f472b6';
      ctx.beginPath();
      ctx.arc(x, y, outOfControl ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (outOfControl) {
        ctx.strokeStyle = 'rgba(248,113,113,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      /* Label X */
      ctx.fillStyle = '#8b8fa3';
      ctx.font = '8px Outfit, sans-serif';
      ctx.textAlign = 'center';
      if (data.length <= 15 || i % Math.ceil(data.length / 10) === 0) {
        const lbl = d.label || (i + 1);
        ctx.fillText(lbl, x, H - padding.bottom + 14);
      }
    });

    renderControlLegend(lsc, mean, lic);
  }

  function renderControlLegend(lsc, mean, lic) {
    const el = document.getElementById('ctrl-legend');
    if (!el) return;

    if (lsc === null) { el.innerHTML = ''; return; }

    el.innerHTML = `
      <div class="t4-flex t4-gap-md" style="justify-content:center;font-size:0.75rem;">
        <span style="color:#f87171">&#9644; LSC: ${lsc.toFixed(2)}</span>
        <span style="color:#fbbf24">&#9644; LC: ${mean.toFixed(2)}</span>
        <span style="color:#f87171">&#9644; LIC: ${lic.toFixed(2)}</span>
      </div>
    `;
  }

  function renderControlDataList(data, projectId) {
    const el = document.getElementById('ctrl-data-list');
    if (!el || data.length === 0) { if (el) el.innerHTML = ''; return; }

    el.innerHTML = '<div class="ccq-detail-section-title t4-mb-sm">Amostras</div>' +
      data.map((d, i) => `
        <div class="t4-list-item" style="padding:6px 12px">
          <span style="font-family:var(--t4-font-display);font-size:0.75rem;color:var(--t4-text-muted);width:30px">#${i + 1}</span>
          <span style="flex:1;font-size:0.8125rem">${T4.utils.escapeHTML(d.label || 'Amostra ' + (i + 1))}</span>
          <span style="font-family:var(--t4-font-display);font-size:0.8125rem;color:var(--ccq-accent)">${d.value.toFixed(2)}</span>
          <button class="t4-btn t4-btn-sm t4-btn-ghost" style="color:var(--t4-status-danger);min-height:28px;padding:4px" onclick="CCQ.charts.removeControlValue(${i}, '${projectId}')">&times;</button>
        </div>
      `).join('');
  }

  async function addControlValue(projectId) {
    const labelInput = document.getElementById('ctrl-label');
    const valueInput = document.getElementById('ctrl-value');
    const label = labelInput.value.trim();
    const value = parseFloat(valueInput.value);

    if (isNaN(value)) { T4.notifications.warning('Informe um valor numerico.'); return; }

    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;
    if (!project.controlData) project.controlData = [];

    project.controlData.push({ label: label || 'Amostra ' + (project.controlData.length + 1), value: value });
    await T4.storage.put(STORE_KEY, project);

    labelInput.value = '';
    valueInput.value = '';
    labelInput.focus();

    drawControlChart(project.controlData);
    renderControlDataList(project.controlData, projectId);
  }

  async function removeControlValue(index, projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    project.controlData.splice(index, 1);
    await T4.storage.put(STORE_KEY, project);

    drawControlChart(project.controlData);
    renderControlDataList(project.controlData, projectId);
  }

  return {
    renderPareto,
    removeParetoItem,
    renderHistogram,
    removeHistValue,
    clearHistData,
    renderControlChart,
    removeControlValue
  };
})();
