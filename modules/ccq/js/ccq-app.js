/* ============================================
   CCQ APP — Controlador principal do modulo
   Circulo de Controle de Qualidade
   ============================================ */

const CCQ = window.CCQ || {};

CCQ.app = (function () {
  const STORE = 'ccq_projects';
  let currentProjectId = null;
  let currentPhase = 'plan';
  let templates = [];

  /* === INICIALIZACAO === */
  async function init() {
    T4.init('ccq');

    if (!T4.auth.isAuthenticated()) {
      T4.auth.renderLoginScreen(document.getElementById('ccq-app'));
      return;
    }

    await loadTemplates();
    await refreshDashboard();
    bindEvents();
    renderPDCAMini('pdca-dashboard', null);
  }

  /* === CARREGAR TEMPLATES === */
  async function loadTemplates() {
    try {
      const resp = await fetch('data/ccq-templates.json');
      const data = await resp.json();
      templates = data.templates || [];
    } catch (e) {
      console.warn('[CCQ] Nao foi possivel carregar templates:', e);
      templates = [];
    }
  }

  /* === NAVEGACAO DE TELAS === */
  function showScreen(screenId) {
    const screens = document.querySelectorAll('.ccq-screen');
    screens.forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + screenId);
    if (target) {
      target.classList.add('active');
      target.scrollTop = 0;
      window.scrollTo(0, 0);
    }

    if (screenId === 'dashboard') {
      refreshDashboard();
    }
  }

  /* === DASHBOARD === */
  async function refreshDashboard() {
    const projects = await T4.storage.getAll(STORE);
    projects.sort((a, b) => (b.updatedAt || b.timestamp) - (a.updatedAt || a.timestamp));

    const totalEl = document.getElementById('stat-total');
    const activeEl = document.getElementById('stat-active');
    const doneEl = document.getElementById('stat-done');

    if (totalEl) totalEl.textContent = projects.length;
    if (activeEl) activeEl.textContent = projects.filter(p => p.phase !== 'done').length;
    if (doneEl) doneEl.textContent = projects.filter(p => p.phase === 'done').length;

    renderProjectsList(projects);
    renderTemplatesList();
  }

  /* === LISTA DE PROJETOS === */
  function renderProjectsList(projects) {
    const container = document.getElementById('projects-list');
    if (!container) return;

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="ccq-empty">
          <div class="ccq-empty-icon">&#9881;</div>
          <p class="ccq-empty-text">Nenhum projeto CCQ criado.<br>Clique em "+ Novo" para comecar.</p>
        </div>
      `;
      return;
    }

    const phaseLabels = {
      plan: 'Planejar',
      do: 'Executar',
      check: 'Verificar',
      act: 'Agir',
      done: 'Concluido'
    };

    container.innerHTML = projects.map(p => {
      const teamAvatars = (p.team || []).slice(0, 4).map(m => {
        const initials = m.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        return `<div class="t4-avatar t4-avatar-sm">${T4.utils.escapeHTML(initials)}</div>`;
      }).join('');

      const extra = (p.team || []).length > 4 ? `<div class="t4-avatar t4-avatar-sm">+${(p.team.length - 4)}</div>` : '';

      return `
        <div class="ccq-project-card" data-status="${p.phase || 'plan'}" data-id="${p.id}" onclick="CCQ.app.openProject('${p.id}')">
          <div class="ccq-project-card-header">
            <span class="ccq-project-card-title">${T4.utils.escapeHTML(p.name)}</span>
            <span class="ccq-project-card-phase" data-phase="${p.phase || 'plan'}">${phaseLabels[p.phase || 'plan']}</span>
          </div>
          <p class="ccq-project-card-desc">${T4.utils.escapeHTML(T4.utils.truncate(p.problem || '', 80))}</p>
          <div class="ccq-project-card-footer">
            <div class="ccq-project-card-team">${teamAvatars}${extra}</div>
            <span>${p.area || ''} &middot; ${T4.utils.formatDate(p.timestamp)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /* === LISTA DE TEMPLATES === */
  function renderTemplatesList() {
    const container = document.getElementById('templates-list');
    if (!container || templates.length === 0) return;

    const icons = {
      wagon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="22" height="10" rx="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
      fuel: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22V6a2 2 0 012-2h8a2 2 0 012 2v16"/><path d="M15 10h2a2 2 0 012 2v4a2 2 0 002 0v-8l-3-3"/><rect x="6" y="8" width="6" height="4"/></svg>',
      radio: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20v-6M6 20v-4M18 20v-4"/><path d="M6 10a6 6 0 0112 0"/><path d="M2 10a10 10 0 0120 0"/></svg>',
      clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
    };

    container.innerHTML = templates.map(t => `
      <div class="ccq-template-card" onclick="CCQ.app.useTemplate('${t.id}')">
        <div class="ccq-template-icon">${icons[t.icon] || icons.wagon}</div>
        <div class="ccq-template-info">
          <div class="ccq-template-name">${T4.utils.escapeHTML(t.name)}</div>
          <div class="ccq-template-desc">${T4.utils.escapeHTML(T4.utils.truncate(t.description, 60))}</div>
        </div>
      </div>
    `).join('');
  }

  /* === USAR TEMPLATE === */
  function useTemplate(templateId) {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;

    showScreen('create');

    const nameInput = document.getElementById('proj-name');
    const areaSelect = document.getElementById('proj-area');
    const problemInput = document.getElementById('proj-problem');

    if (nameInput) nameInput.value = tpl.name;
    if (areaSelect) {
      const opt = Array.from(areaSelect.options).find(o => o.value === tpl.area);
      if (opt) areaSelect.value = tpl.area;
    }
    if (problemInput) problemInput.value = tpl.description;

    CCQ.projects.clearTeamForm();
    (tpl.suggestedTeamRoles || []).forEach(r => {
      CCQ.projects.addTeamMember(r.description, r.role);
    });

    T4.state.set('pendingTemplate', tpl);
    T4.notifications.info('Modelo carregado. Ajuste os dados e crie o projeto.');
  }

  /* === ABRIR PROJETO === */
  async function openProject(projectId) {
    currentProjectId = projectId;
    const project = await T4.storage.get(STORE, projectId);
    if (!project) {
      T4.notifications.error('Projeto nao encontrado.');
      return;
    }

    T4.state.set('currentProject', project);
    currentPhase = project.phase || 'plan';

    document.getElementById('detail-title').textContent = T4.utils.truncate(project.name, 25);
    renderPDCAWheel(project);
    renderPhaseButtons(project);
    renderDetailContent(project);
    showScreen('detail');
  }

  /* === PDCA MINI (dashboard) === */
  function renderPDCAMini(containerId, project) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const phase = project ? (project.phase || 'plan') : null;
    container.innerHTML = `
      <svg viewBox="0 0 64 64" width="64" height="64">
        <path d="M32 2 A30 30 0 0 1 62 32 L32 32 Z" fill="${phase === 'plan' ? '#60a5fa' : 'rgba(96,165,250,0.2)'}"/>
        <path d="M62 32 A30 30 0 0 1 32 62 L32 32 Z" fill="${phase === 'do' ? '#34d399' : 'rgba(52,211,153,0.2)'}"/>
        <path d="M32 62 A30 30 0 0 1 2 32 L32 32 Z" fill="${phase === 'check' ? '#fbbf24' : 'rgba(251,191,36,0.2)'}"/>
        <path d="M2 32 A30 30 0 0 1 32 2 L32 32 Z" fill="${phase === 'act' ? '#f87171' : 'rgba(248,113,113,0.2)'}"/>
        <circle cx="32" cy="32" r="14" fill="#0a0b0f"/>
        <text x="32" y="28" text-anchor="middle" font-size="6" font-weight="700" fill="#f472b6" font-family="JetBrains Mono,monospace">PDCA</text>
        <text x="32" y="38" text-anchor="middle" font-size="5" fill="#8b8fa3" font-family="Outfit,sans-serif">CCQ</text>
      </svg>
    `;
  }

  /* === PDCA WHEEL (detalhe) === */
  function renderPDCAWheel(project) {
    const container = document.getElementById('detail-pdca');
    if (!container) return;

    const phase = project.phase || 'plan';
    const phases = ['plan', 'do', 'check', 'act'];
    const labels = { plan: 'P', do: 'D', check: 'C', act: 'A' };

    container.innerHTML = `
      <div class="ccq-pdca-wheel">
        ${phases.map(p => `
          <div class="ccq-pdca-segment ${p === phase ? 'active' : 'inactive'}" data-phase="${p}" onclick="CCQ.app.setPhase('${p}')">
            ${labels[p]}
          </div>
        `).join('')}
        <div class="ccq-pdca-center">${phase === 'done' ? 'OK' : labels[phase]}</div>
      </div>
    `;
  }

  /* === BOTOES DE FASE === */
  function renderPhaseButtons(project) {
    const btns = document.querySelectorAll('.ccq-phase-btn');
    btns.forEach(btn => {
      const p = btn.getAttribute('data-phase');
      btn.classList.toggle('active', p === (project.phase || 'plan'));
    });
  }

  /* === MUDAR FASE === */
  async function setPhase(phase) {
    if (!currentProjectId) return;
    currentPhase = phase;

    const project = await T4.storage.get(STORE, currentProjectId);
    if (!project) return;

    project.phase = phase;
    await T4.storage.put(STORE, project);
    T4.state.set('currentProject', project);

    renderPDCAWheel(project);
    renderPhaseButtons(project);
    renderDetailContent(project);
    T4.notifications.success('Fase alterada para ' + { plan: 'Planejar', do: 'Executar', check: 'Verificar', act: 'Agir' }[phase]);
  }

  /* === CONTEUDO DO DETALHE === */
  function renderDetailContent(project) {
    const container = document.getElementById('detail-content');
    if (!container) return;

    const phase = project.phase || 'plan';

    let html = '';

    html += `
      <div class="ccq-detail-section">
        <div class="ccq-detail-section-title">Problema</div>
        <div class="ccq-detail-section-text">${T4.utils.escapeHTML(project.problem || 'Nao definido')}</div>
      </div>
    `;

    if (project.goal) {
      html += `
        <div class="ccq-detail-section">
          <div class="ccq-detail-section-title">Meta SMART</div>
          <div class="ccq-detail-section-text">${T4.utils.escapeHTML(project.goal)}</div>
        </div>
      `;
    }

    if (project.team && project.team.length > 0) {
      html += `
        <div class="ccq-detail-section">
          <div class="ccq-detail-section-title">Equipe (${project.team.length} membros)</div>
          <div class="ccq-team-members">
            ${project.team.map(m => `
              <div class="ccq-member-chip">
                <span>${T4.utils.escapeHTML(m.name)}</span>
                <span class="ccq-member-chip-role">${T4.utils.escapeHTML(m.role)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  /* === ABRIR FERRAMENTA === */
  function openTool(toolName) {
    if (!currentProjectId) {
      T4.notifications.warning('Selecione um projeto primeiro.');
      return;
    }

    const toolTitles = {
      brainstorming: 'Brainstorming',
      ishikawa: 'Diagrama de Ishikawa',
      '5porques': '5 Porques',
      '5w2h': 'Plano de Acao 5W2H',
      gut: 'Matriz GUT',
      pareto: 'Grafico de Pareto',
      histogram: 'Histograma',
      controle: 'Carta de Controle',
      timeline: 'Cronograma',
      presentation: 'Apresentacao',
      photos: 'Antes / Depois'
    };

    document.getElementById('tools-title').textContent = toolTitles[toolName] || 'Ferramenta';

    if (toolName === 'presentation') {
      CCQ.presentations.render(currentProjectId);
      showScreen('presentation');
      return;
    }

    showScreen('tools');

    switch (toolName) {
      case 'brainstorming':
        CCQ.methodology.renderBrainstorming(currentProjectId);
        break;
      case 'ishikawa':
        CCQ.methodology.renderIshikawa(currentProjectId);
        break;
      case '5porques':
        CCQ.methodology.render5Porques(currentProjectId);
        break;
      case '5w2h':
        CCQ.methodology.render5W2H(currentProjectId);
        break;
      case 'gut':
        CCQ.methodology.renderGUT(currentProjectId);
        break;
      case 'pareto':
        CCQ.charts.renderPareto(currentProjectId);
        break;
      case 'histogram':
        CCQ.charts.renderHistogram(currentProjectId);
        break;
      case 'controle':
        CCQ.charts.renderControlChart(currentProjectId);
        break;
      case 'timeline':
        CCQ.timeline.render(currentProjectId);
        break;
      case 'photos':
        CCQ.projects.renderPhotos(currentProjectId);
        break;
    }
  }

  /* === EXCLUIR PROJETO === */
  async function deleteProject() {
    if (!currentProjectId) return;
    const confirmed = await T4.notifications.confirm(
      'Tem certeza que deseja excluir este projeto? Esta acao nao pode ser desfeita.',
      { title: 'Excluir Projeto', type: 'danger', confirmText: 'Excluir', cancelText: 'Cancelar' }
    );
    if (!confirmed) return;

    await T4.storage.remove(STORE, currentProjectId);
    currentProjectId = null;
    T4.notifications.success('Projeto excluido.');
    showScreen('dashboard');
  }

  /* === BIND EVENTS === */
  function bindEvents() {
    const btnNew = document.getElementById('btn-new-project');
    if (btnNew) btnNew.addEventListener('click', () => {
      CCQ.projects.clearForm();
      T4.state.set('pendingTemplate', null);
      showScreen('create');
    });

    const btnDelete = document.getElementById('btn-delete-project');
    if (btnDelete) btnDelete.addEventListener('click', deleteProject);

    const toolsGrid = document.getElementById('tools-grid');
    if (toolsGrid) {
      toolsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.ccq-tool-card');
        if (card) {
          const tool = card.getAttribute('data-tool');
          openTool(tool);
          T4.utils.vibrate(10);
        }
      });
    }

    const phaseBtns = document.querySelectorAll('.ccq-phase-btn');
    phaseBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const phase = btn.getAttribute('data-phase');
        setPhase(phase);
      });
    });

    const toolsBack = document.getElementById('btn-tools-back');
    if (toolsBack) toolsBack.addEventListener('click', () => {
      if (currentProjectId) {
        openProject(currentProjectId);
      } else {
        showScreen('dashboard');
      }
    });

    const form = document.getElementById('form-project');
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      CCQ.projects.createProject();
    });
  }

  /* === GETTERS === */
  function getCurrentProjectId() { return currentProjectId; }
  function getTemplates() { return templates; }
  function getStore() { return STORE; }

  /* INICIAR */
  document.addEventListener('DOMContentLoaded', init);

  return {
    showScreen,
    openProject,
    openTool,
    setPhase,
    useTemplate,
    deleteProject,
    getCurrentProjectId,
    getTemplates,
    getStore,
    refreshDashboard,
    renderPDCAMini
  };
})();

window.CCQ = CCQ;
