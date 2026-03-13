/* ============================================
   CCQ METHODOLOGY — Ferramentas de qualidade
   Brainstorming, Ishikawa, 5 Porques, 5W2H, GUT
   ============================================ */

CCQ.methodology = (function () {
  const STORE_KEY = 'ccq_projects';

  /* ============================
     BRAINSTORMING
     ============================ */
  async function renderBrainstorming(projectId) {
    const container = document.getElementById('tool-content');
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!container || !project) return;

    const ideas = project.brainstorming || [];
    const categories = ['Metodo', 'Maquina', 'Material', 'Mao de obra', 'Meio ambiente', 'Medicao', 'Geral'];

    container.innerHTML = `
      <div class="t4-mb-md">
        <div class="ccq-data-row">
          <input type="text" id="bs-idea-input" class="t4-input" placeholder="Nova ideia...">
          <select id="bs-cat-select" class="t4-input t4-select" style="flex:0.7">
            ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <button class="t4-btn t4-btn-sm ccq-btn-accent" id="bs-add-btn">+</button>
        </div>
      </div>
      <div class="ccq-brainstorm-grid" id="bs-grid"></div>
    `;

    renderBrainstormIdeas(ideas);

    document.getElementById('bs-add-btn').addEventListener('click', () => addIdea(projectId));
    document.getElementById('bs-idea-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addIdea(projectId); }
    });
  }

  function renderBrainstormIdeas(ideas) {
    const grid = document.getElementById('bs-grid');
    if (!grid) return;

    if (ideas.length === 0) {
      grid.innerHTML = '<div class="ccq-empty"><div class="ccq-empty-icon">&#128161;</div><p class="ccq-empty-text">Nenhuma ideia adicionada.<br>Comece o brainstorming!</p></div>';
      return;
    }

    grid.innerHTML = ideas.map((idea, i) => `
      <div class="ccq-idea-card" data-index="${i}">
        <div class="ccq-idea-actions">
          <button onclick="CCQ.methodology.editIdea(${i})" title="Editar">&#9998;</button>
          <button onclick="CCQ.methodology.deleteIdea(${i})" title="Excluir">&times;</button>
        </div>
        <div class="ccq-idea-text">${T4.utils.escapeHTML(idea.text)}</div>
        <div class="ccq-idea-category">${T4.utils.escapeHTML(idea.category || 'Geral')}</div>
      </div>
    `).join('');
  }

  async function addIdea(projectId) {
    const input = document.getElementById('bs-idea-input');
    const catSelect = document.getElementById('bs-cat-select');
    const text = input.value.trim();
    if (!text) return;

    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;
    if (!project.brainstorming) project.brainstorming = [];

    project.brainstorming.push({ text: text, category: catSelect.value });
    await T4.storage.put(STORE_KEY, project);

    input.value = '';
    input.focus();
    renderBrainstormIdeas(project.brainstorming);
    T4.utils.vibrate(10);
  }

  async function editIdea(index) {
    const projectId = CCQ.app.getCurrentProjectId();
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project || !project.brainstorming[index]) return;

    const idea = project.brainstorming[index];
    const card = document.querySelectorAll('.ccq-idea-card')[index];
    if (!card) return;

    card.innerHTML = `
      <input type="text" class="ccq-inline-input" id="bs-edit-input" value="${T4.utils.escapeHTML(idea.text)}">
      <div class="t4-flex t4-gap-sm t4-mt-sm">
        <button class="t4-btn t4-btn-sm ccq-btn-accent" id="bs-edit-save">Salvar</button>
        <button class="t4-btn t4-btn-sm t4-btn-ghost" id="bs-edit-cancel">Cancelar</button>
      </div>
    `;

    const editInput = document.getElementById('bs-edit-input');
    editInput.focus();
    editInput.select();

    document.getElementById('bs-edit-save').addEventListener('click', async () => {
      const newText = editInput.value.trim();
      if (newText) {
        project.brainstorming[index].text = newText;
        await T4.storage.put(STORE_KEY, project);
      }
      renderBrainstormIdeas(project.brainstorming);
    });

    document.getElementById('bs-edit-cancel').addEventListener('click', () => {
      renderBrainstormIdeas(project.brainstorming);
    });

    editInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const newText = editInput.value.trim();
        if (newText) {
          project.brainstorming[index].text = newText;
          await T4.storage.put(STORE_KEY, project);
        }
        renderBrainstormIdeas(project.brainstorming);
      }
      if (e.key === 'Escape') renderBrainstormIdeas(project.brainstorming);
    });
  }

  async function deleteIdea(index) {
    const projectId = CCQ.app.getCurrentProjectId();
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project || !project.brainstorming[index]) return;

    project.brainstorming.splice(index, 1);
    await T4.storage.put(STORE_KEY, project);
    renderBrainstormIdeas(project.brainstorming);
    T4.utils.vibrate(10);
  }

  /* ============================
     ISHIKAWA (FISHBONE) DIAGRAM
     ============================ */
  async function renderIshikawa(projectId) {
    const container = document.getElementById('tool-content');
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!container || !project) return;

    if (!project.ishikawa) {
      project.ishikawa = { metodo: [], maquina: [], material: [], maoDeObra: [], meioAmbiente: [], medicao: [] };
    }

    const goldColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold').trim() || '#E5A100';
    const catConfig = [
      { key: 'metodo', label: 'Metodo', color: '#60a5fa' },
      { key: 'maquina', label: 'Maquina', color: '#34d399' },
      { key: 'material', label: 'Material', color: '#fbbf24' },
      { key: 'maoDeObra', label: 'Mao de Obra', color: '#f87171' },
      { key: 'meioAmbiente', label: 'Meio Ambiente', color: '#a78bfa' },
      { key: 'medicao', label: 'Medicao', color: goldColor }
    ];

    container.innerHTML = `
      <div class="ccq-ishikawa-container" id="ishi-svg-container"></div>
      <div class="t4-mt-lg" style="display:flex;flex-direction:column;gap:8px;" id="ishi-categories"></div>
    `;

    renderIshikawaSVG(project, catConfig);
    renderIshikawaCategories(project, projectId, catConfig);
  }

  function renderIshikawaSVG(project, catConfig) {
    const svgContainer = document.getElementById('ishi-svg-container');
    if (!svgContainer) return;

    const W = 640;
    const H = 400;
    const headX = W - 40;
    const spineY = H / 2;
    const ishi = project.ishikawa;

    let svg = `<svg class="ccq-ishikawa-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

    /* Espinha principal */
    svg += `<line x1="40" y1="${spineY}" x2="${headX}" y2="${spineY}" class="ishi-spine"/>`;

    /* Cabeca (efeito) */
    svg += `<polygon points="${headX},${spineY - 30} ${W},${spineY} ${headX},${spineY + 30}" class="ishi-head"/>`;
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold').trim() || '#E5A100';
    svg += `<text x="${headX - 5}" y="${spineY + 4}" text-anchor="end" font-size="10" font-weight="700" fill="${accentColor}">EFEITO</text>`;

    /* Ramos superiores e inferiores (6M) */
    const topCats = catConfig.slice(0, 3);
    const botCats = catConfig.slice(3, 6);
    const branchSpacing = (headX - 80) / 3;

    topCats.forEach((cat, i) => {
      const bx = 80 + i * branchSpacing;
      const causes = ishi[cat.key] || [];

      svg += `<line x1="${bx}" y1="${spineY}" x2="${bx + 50}" y2="${spineY - 100}" class="ishi-branch" stroke="${cat.color}"/>`;
      svg += `<text x="${bx + 55}" y="${spineY - 105}" class="ishi-category" fill="${cat.color}">${cat.label}</text>`;

      causes.forEach((cause, j) => {
        const cy = spineY - 85 + j * 16;
        const cx = bx + 20 + j * 5;
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 30}" y2="${cy}" class="ishi-sub" stroke="${cat.color}"/>`;
        svg += `<text x="${cx + 33}" y="${cy + 3}" class="ishi-cause" fill="${cat.color}">${T4.utils.escapeHTML(T4.utils.truncate(cause.text, 25))}</text>`;
      });
    });

    botCats.forEach((cat, i) => {
      const bx = 80 + i * branchSpacing;
      const causes = ishi[cat.key] || [];

      svg += `<line x1="${bx}" y1="${spineY}" x2="${bx + 50}" y2="${spineY + 100}" class="ishi-branch" stroke="${cat.color}"/>`;
      svg += `<text x="${bx + 55}" y="${spineY + 118}" class="ishi-category" fill="${cat.color}">${cat.label}</text>`;

      causes.forEach((cause, j) => {
        const cy = spineY + 55 + j * 16;
        const cx = bx + 20 + j * 5;
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 30}" y2="${cy}" class="ishi-sub" stroke="${cat.color}"/>`;
        svg += `<text x="${cx + 33}" y="${cy + 3}" class="ishi-cause" fill="${cat.color}">${T4.utils.escapeHTML(T4.utils.truncate(cause.text, 25))}</text>`;
      });
    });

    svg += '</svg>';
    svgContainer.innerHTML = svg;
  }

  function renderIshikawaCategories(project, projectId, catConfig) {
    const container = document.getElementById('ishi-categories');
    if (!container) return;
    const ishi = project.ishikawa;

    container.innerHTML = catConfig.map(cat => {
      const count = (ishi[cat.key] || []).length;
      return `
        <button class="ccq-ishikawa-category-btn" onclick="CCQ.methodology.openIshikawaCategory('${cat.key}', '${projectId}')">
          <span class="ccq-cat-dot" style="background:${cat.color}"></span>
          <span>${cat.label}</span>
          <span class="ccq-cat-count">${count} causa${count !== 1 ? 's' : ''}</span>
        </button>
      `;
    }).join('');
  }

  async function openIshikawaCategory(catKey, projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    const catLabels = {
      metodo: 'Metodo', maquina: 'Maquina', material: 'Material',
      maoDeObra: 'Mao de Obra', meioAmbiente: 'Meio Ambiente', medicao: 'Medicao'
    };

    const causes = project.ishikawa[catKey] || [];

    const container = document.getElementById('tool-content');
    container.innerHTML = `
      <div class="t4-mb-md">
        <button class="t4-btn t4-btn-sm t4-btn-ghost t4-mb-md" onclick="CCQ.methodology.renderIshikawa('${projectId}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          Voltar ao diagrama
        </button>
        <h3 class="t4-mb-md">${catLabels[catKey]}</h3>
        <div class="ccq-data-row">
          <input type="text" id="ishi-cause-input" class="t4-input" placeholder="Nova causa...">
          <button class="t4-btn t4-btn-sm ccq-btn-accent" id="ishi-add-cause">+</button>
        </div>
      </div>
      <div id="ishi-causes-list" class="t4-list"></div>
    `;

    renderIshikawaCauses(causes, catKey, projectId);

    document.getElementById('ishi-add-cause').addEventListener('click', () => addIshikawaCause(catKey, projectId));
    document.getElementById('ishi-cause-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addIshikawaCause(catKey, projectId); }
    });
  }

  function renderIshikawaCauses(causes, catKey, projectId) {
    const list = document.getElementById('ishi-causes-list');
    if (!list) return;

    if (causes.length === 0) {
      list.innerHTML = '<div class="ccq-empty"><p class="ccq-empty-text">Nenhuma causa nesta categoria.</p></div>';
      return;
    }

    list.innerHTML = causes.map((c, i) => `
      <div class="t4-list-item" style="justify-content:space-between">
        <span style="flex:1">${T4.utils.escapeHTML(c.text)}</span>
        <button class="t4-btn t4-btn-sm t4-btn-ghost" onclick="CCQ.methodology.removeIshikawaCause('${catKey}', ${i}, '${projectId}')" style="color:var(--t4-status-danger)">&times;</button>
      </div>
    `).join('');
  }

  async function addIshikawaCause(catKey, projectId) {
    const input = document.getElementById('ishi-cause-input');
    const text = input.value.trim();
    if (!text) return;

    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    if (!project.ishikawa[catKey]) project.ishikawa[catKey] = [];
    project.ishikawa[catKey].push({ id: T4.utils.uid(), text: text });
    await T4.storage.put(STORE_KEY, project);

    input.value = '';
    input.focus();
    renderIshikawaCauses(project.ishikawa[catKey], catKey, projectId);
    T4.utils.vibrate(10);
  }

  async function removeIshikawaCause(catKey, index, projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    project.ishikawa[catKey].splice(index, 1);
    await T4.storage.put(STORE_KEY, project);
    renderIshikawaCauses(project.ishikawa[catKey], catKey, projectId);
  }

  /* ============================
     5 PORQUES (5 WHYS)
     ============================ */
  async function render5Porques(projectId) {
    const container = document.getElementById('tool-content');
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!container || !project) return;

    if (!project.porques) {
      project.porques = { answers: ['', '', '', '', ''], rootCause: '' };
    }

    const porques = project.porques;
    const labels = [
      'Por que o problema ocorre?',
      'Por que isso acontece?',
      'Por que essa situacao existe?',
      'Por que isso nao foi resolvido antes?',
      'Qual a causa raiz?'
    ];

    container.innerHTML = `
      <div class="ccq-detail-section t4-mb-md">
        <div class="ccq-detail-section-title">Problema</div>
        <div class="ccq-detail-section-text">${T4.utils.escapeHTML(project.problem || '')}</div>
      </div>

      <div class="ccq-porques-chain" id="porques-chain">
        ${porques.answers.map((ans, i) => `
          <div class="ccq-porque-item">
            <div class="ccq-porque-number">${i + 1}o POR QUE</div>
            <div class="ccq-porque-label">${labels[i]}</div>
            <textarea class="ccq-inline-input" data-index="${i}" placeholder="Responda aqui..." rows="2">${T4.utils.escapeHTML(ans)}</textarea>
          </div>
        `).join('')}
      </div>

      <div class="ccq-root-cause t4-mt-lg">
        <div class="ccq-root-cause-label">CAUSA RAIZ IDENTIFICADA</div>
        <textarea class="ccq-inline-input" id="root-cause-input" placeholder="Descreva a causa raiz..." rows="2">${T4.utils.escapeHTML(porques.rootCause || '')}</textarea>
      </div>

      <button class="t4-btn t4-btn-block ccq-btn-accent-full t4-mt-lg" id="save-porques">Salvar Respostas</button>
    `;

    document.getElementById('save-porques').addEventListener('click', () => save5Porques(projectId));
  }

  async function save5Porques(projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    const textareas = document.querySelectorAll('#porques-chain textarea');
    const answers = [];
    textareas.forEach(ta => {
      answers[parseInt(ta.dataset.index)] = ta.value.trim();
    });

    const rootCause = document.getElementById('root-cause-input').value.trim();

    project.porques = { answers: answers, rootCause: rootCause };
    await T4.storage.put(STORE_KEY, project);
    T4.notifications.success('Respostas salvas!');
  }

  /* ============================
     5W2H ACTION PLAN
     ============================ */
  async function render5W2H(projectId) {
    const container = document.getElementById('tool-content');
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!container || !project) return;

    if (!project.acoes5w2h) project.acoes5w2h = [];

    container.innerHTML = `
      <div class="t4-flex-between t4-mb-md">
        <h4>Plano de Acao</h4>
        <button class="t4-btn t4-btn-sm ccq-btn-accent" id="add-5w2h">+ Nova Acao</button>
      </div>
      <div class="ccq-5w2h-list" id="list-5w2h"></div>
    `;

    render5W2HItems(project.acoes5w2h, projectId);
    document.getElementById('add-5w2h').addEventListener('click', () => add5W2HItem(projectId));
  }

  function render5W2HItems(items, projectId) {
    const list = document.getElementById('list-5w2h');
    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = '<div class="ccq-empty"><div class="ccq-empty-icon">&#128203;</div><p class="ccq-empty-text">Nenhuma acao definida.</p></div>';
      return;
    }

    const fields = [
      { key: 'what', label: 'O QUE (What)' },
      { key: 'why', label: 'POR QUE (Why)' },
      { key: 'where', label: 'ONDE (Where)' },
      { key: 'when', label: 'QUANDO (When)' },
      { key: 'who', label: 'QUEM (Who)' },
      { key: 'how', label: 'COMO (How)' },
      { key: 'howMuch', label: 'QUANTO (How Much)' }
    ];

    list.innerHTML = items.map((item, i) => `
      <div class="ccq-5w2h-item">
        <div class="ccq-5w2h-item-header">
          <span class="ccq-5w2h-item-num">Acao #${i + 1}</span>
          <div class="t4-flex t4-gap-sm">
            <button class="t4-btn t4-btn-sm t4-btn-ghost" onclick="CCQ.methodology.edit5W2HItem(${i}, '${projectId}')">Editar</button>
            <button class="t4-btn t4-btn-sm t4-btn-ghost" style="color:var(--t4-status-danger)" onclick="CCQ.methodology.delete5W2HItem(${i}, '${projectId}')">&times;</button>
          </div>
        </div>
        <div class="ccq-5w2h-grid">
          ${fields.map(f => `
            <div class="ccq-5w2h-field">
              <span class="ccq-5w2h-field-label">${f.label}</span>
              <div class="ccq-5w2h-field-value">${T4.utils.escapeHTML(item[f.key] || '-')}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  async function add5W2HItem(projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    show5W2HForm(projectId, null, project.acoes5w2h.length);
  }

  function show5W2HForm(projectId, existingItem, index) {
    const container = document.getElementById('tool-content');
    const item = existingItem || {};

    const fields = [
      { key: 'what', label: 'O QUE fazer?', placeholder: 'Descreva a acao' },
      { key: 'why', label: 'POR QUE fazer?', placeholder: 'Justificativa' },
      { key: 'where', label: 'ONDE sera feito?', placeholder: 'Local' },
      { key: 'when', label: 'QUANDO sera feito?', placeholder: 'Prazo' },
      { key: 'who', label: 'QUEM fara?', placeholder: 'Responsavel' },
      { key: 'how', label: 'COMO sera feito?', placeholder: 'Metodo' },
      { key: 'howMuch', label: 'QUANTO custara?', placeholder: 'Custo estimado' }
    ];

    container.innerHTML = `
      <button class="t4-btn t4-btn-sm t4-btn-ghost t4-mb-md" onclick="CCQ.methodology.render5W2H('${projectId}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        Voltar
      </button>
      <h3 class="t4-mb-md">${existingItem ? 'Editar Acao' : 'Nova Acao'}</h3>
      ${fields.map(f => `
        <div class="t4-input-group t4-mb-md">
          <label class="t4-label">${f.label}</label>
          <input type="text" class="t4-input" id="w2h-${f.key}" value="${T4.utils.escapeHTML(item[f.key] || '')}" placeholder="${f.placeholder}">
        </div>
      `).join('')}
      <button class="t4-btn t4-btn-block ccq-btn-accent-full t4-mt-md" id="save-5w2h-item">Salvar Acao</button>
    `;

    document.getElementById('save-5w2h-item').addEventListener('click', async () => {
      const project = await T4.storage.get(STORE_KEY, projectId);
      if (!project) return;

      const newItem = {};
      fields.forEach(f => {
        newItem[f.key] = document.getElementById('w2h-' + f.key).value.trim();
      });

      if (!newItem.what) {
        T4.notifications.warning('Informe ao menos "O QUE" sera feito.');
        return;
      }

      if (!project.acoes5w2h) project.acoes5w2h = [];

      if (existingItem) {
        project.acoes5w2h[index] = newItem;
      } else {
        project.acoes5w2h.push(newItem);
      }

      await T4.storage.put(STORE_KEY, project);
      T4.notifications.success('Acao salva!');
      render5W2H(projectId);
    });
  }

  async function edit5W2HItem(index, projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project || !project.acoes5w2h[index]) return;
    show5W2HForm(projectId, project.acoes5w2h[index], index);
  }

  async function delete5W2HItem(index, projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    project.acoes5w2h.splice(index, 1);
    await T4.storage.put(STORE_KEY, project);
    render5W2HItems(project.acoes5w2h, projectId);
    T4.notifications.success('Acao removida.');
  }

  /* ============================
     GUT MATRIX
     ============================ */
  async function renderGUT(projectId) {
    const container = document.getElementById('tool-content');
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!container || !project) return;

    if (!project.gutItems) project.gutItems = [];

    container.innerHTML = `
      <div class="t4-mb-md">
        <p class="t4-text-sm t4-text-secondary t4-mb-md">Gravidade x Urgencia x Tendencia. Pontuacao de 1 (baixo) a 5 (critico).</p>
        <div class="ccq-data-row">
          <input type="text" id="gut-problem-input" class="t4-input" placeholder="Problema / Causa" style="flex:2">
          <button class="t4-btn t4-btn-sm ccq-btn-accent" id="gut-add-btn">+</button>
        </div>
      </div>
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <table class="ccq-gut-table" id="gut-table">
          <thead>
            <tr>
              <th style="min-width:120px">Problema</th>
              <th>G</th>
              <th>U</th>
              <th>T</th>
              <th>GxUxT</th>
              <th>#</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="gut-tbody"></tbody>
        </table>
      </div>
    `;

    renderGUTRows(project.gutItems, projectId);

    document.getElementById('gut-add-btn').addEventListener('click', () => addGUTItem(projectId));
    document.getElementById('gut-problem-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addGUTItem(projectId); }
    });
  }

  function renderGUTRows(items, projectId) {
    const tbody = document.getElementById('gut-tbody');
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--t4-text-muted);padding:24px;">Nenhum item na matriz.</td></tr>';
      return;
    }

    const sorted = items.map((item, origIdx) => ({ ...item, origIdx }));
    sorted.sort((a, b) => (b.g * b.u * b.t) - (a.g * a.u * a.t));

    tbody.innerHTML = sorted.map((item, rank) => {
      const total = item.g * item.u * item.t;
      const scoreClass = (v) => v >= 4 ? 'high' : v >= 3 ? 'medium' : 'low';

      return `
        <tr>
          <td style="text-align:left;font-size:0.8125rem">${T4.utils.escapeHTML(item.problem)}</td>
          <td>
            <select class="ccq-gut-score-select" data-field="g" data-index="${item.origIdx}" onchange="CCQ.methodology.updateGUT(this, '${projectId}')">
              ${[1,2,3,4,5].map(v => `<option value="${v}" ${item.g === v ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
          </td>
          <td>
            <select class="ccq-gut-score-select" data-field="u" data-index="${item.origIdx}" onchange="CCQ.methodology.updateGUT(this, '${projectId}')">
              ${[1,2,3,4,5].map(v => `<option value="${v}" ${item.u === v ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
          </td>
          <td>
            <select class="ccq-gut-score-select" data-field="t" data-index="${item.origIdx}" onchange="CCQ.methodology.updateGUT(this, '${projectId}')">
              ${[1,2,3,4,5].map(v => `<option value="${v}" ${item.t === v ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
          </td>
          <td><span class="ccq-gut-total">${total}</span></td>
          <td><span class="ccq-gut-rank">${rank + 1}o</span></td>
          <td><button class="t4-btn t4-btn-sm t4-btn-ghost" style="color:var(--t4-status-danger);min-height:28px;padding:4px 8px" onclick="CCQ.methodology.removeGUTItem(${item.origIdx}, '${projectId}')">&times;</button></td>
        </tr>
      `;
    }).join('');
  }

  async function addGUTItem(projectId) {
    const input = document.getElementById('gut-problem-input');
    const text = input.value.trim();
    if (!text) return;

    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    if (!project.gutItems) project.gutItems = [];
    project.gutItems.push({ problem: text, g: 3, u: 3, t: 3 });
    await T4.storage.put(STORE_KEY, project);

    input.value = '';
    input.focus();
    renderGUTRows(project.gutItems, projectId);
  }

  async function updateGUT(selectEl, projectId) {
    const field = selectEl.dataset.field;
    const index = parseInt(selectEl.dataset.index);
    const value = parseInt(selectEl.value);

    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project || !project.gutItems[index]) return;

    project.gutItems[index][field] = value;
    await T4.storage.put(STORE_KEY, project);
    renderGUTRows(project.gutItems, projectId);
  }

  async function removeGUTItem(index, projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    project.gutItems.splice(index, 1);
    await T4.storage.put(STORE_KEY, project);
    renderGUTRows(project.gutItems, projectId);
  }

  return {
    renderBrainstorming,
    editIdea,
    deleteIdea,
    renderIshikawa,
    openIshikawaCategory,
    removeIshikawaCause,
    render5Porques,
    render5W2H,
    edit5W2HItem,
    delete5W2HItem,
    renderGUT,
    updateGUT,
    removeGUTItem
  };
})();
