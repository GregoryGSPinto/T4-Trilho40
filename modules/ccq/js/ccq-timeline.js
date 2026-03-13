/* ============================================
   CCQ TIMELINE — Cronograma visual
   Marcos, fases PDCA, progresso temporal
   ============================================ */

CCQ.timeline = (function () {
  const STORE_KEY = 'ccq_projects';

  /* === RENDER === */
  async function render(projectId) {
    const container = document.getElementById('tool-content');
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!container || !project) return;

    if (!project.milestones) project.milestones = [];

    container.innerHTML = `
      <div class="t4-mb-md">
        <p class="t4-text-sm t4-text-secondary t4-mb-md">Gerencie o cronograma do projeto com marcos e fases PDCA.</p>
        <button class="t4-btn t4-btn-sm ccq-btn-accent t4-mb-md" id="tl-add-milestone">+ Novo Marco</button>
      </div>

      <div id="tl-phase-progress" class="t4-mb-lg"></div>
      <div id="tl-timeline" class="ccq-timeline"></div>
      <div id="tl-form" style="display:none"></div>
    `;

    renderPhaseProgress(project);
    renderTimeline(project.milestones, projectId);

    document.getElementById('tl-add-milestone').addEventListener('click', () => showMilestoneForm(projectId, null));
  }

  /* === PROGRESSO DAS FASES === */
  function renderPhaseProgress(project) {
    const el = document.getElementById('tl-phase-progress');
    if (!el) return;

    const phases = [
      { key: 'plan', label: 'Planejar', color: '#60a5fa' },
      { key: 'do', label: 'Executar', color: '#34d399' },
      { key: 'check', label: 'Verificar', color: '#fbbf24' },
      { key: 'act', label: 'Agir', color: '#f87171' }
    ];

    const currentPhase = project.phase || 'plan';
    const currentIdx = phases.findIndex(p => p.key === currentPhase);

    el.innerHTML = `
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        ${phases.map((p, i) => {
          const isDone = i < currentIdx || currentPhase === 'done';
          const isCurrent = i === currentIdx && currentPhase !== 'done';
          const opacity = isDone ? 1 : isCurrent ? 0.8 : 0.2;

          return `
            <div style="flex:1;text-align:center;">
              <div style="height:6px;background:${p.color};opacity:${opacity};border-radius:3px;margin-bottom:4px;transition:opacity 0.3s ease"></div>
              <span style="font-size:0.625rem;font-family:var(--t4-font-display);color:${isCurrent ? p.color : 'var(--t4-text-muted)'};font-weight:${isCurrent ? '700' : '400'}">${p.label}</span>
            </div>
          `;
        }).join('')}
      </div>
      <div style="text-align:center;font-size:0.75rem;color:var(--t4-text-muted);">
        Fase atual: <span style="color:${phases[currentIdx >= 0 ? currentIdx : 0].color};font-weight:600">${currentPhase === 'done' ? 'Concluido' : phases[currentIdx >= 0 ? currentIdx : 0].label}</span>
      </div>
    `;
  }

  /* === TIMELINE === */
  function renderTimeline(milestones, projectId) {
    const container = document.getElementById('tl-timeline');
    if (!container) return;

    if (milestones.length === 0) {
      container.innerHTML = `
        <div class="ccq-empty">
          <div class="ccq-empty-icon">&#128197;</div>
          <p class="ccq-empty-text">Nenhum marco definido.<br>Adicione marcos para acompanhar o progresso.</p>
        </div>
      `;
      return;
    }

    const sorted = [...milestones].sort((a, b) => new Date(a.date) - new Date(b.date));
    const now = new Date();

    const phaseColors = {
      plan: 'plan',
      do: 'do-phase',
      check: 'check',
      act: 'act-phase'
    };

    container.innerHTML = sorted.map((ms, i) => {
      const msDate = new Date(ms.date);
      const isPast = msDate <= now;
      const isToday = msDate.toDateString() === now.toDateString();
      const dotClass = ms.done ? 'done' : isToday ? 'active' : (phaseColors[ms.phase] || '');

      const phaseLabel = { plan: 'Planejar', do: 'Executar', check: 'Verificar', act: 'Agir' };
      const phaseColor = { plan: 'var(--ccq-plan)', do: 'var(--ccq-do)', check: 'var(--ccq-check)', act: 'var(--ccq-act)' };

      return `
        <div class="ccq-timeline-item">
          <div class="ccq-timeline-dot ${dotClass}"></div>
          <div class="ccq-timeline-content">
            <div class="ccq-timeline-date">${T4.utils.formatDate(ms.date)}${isToday ? ' (Hoje)' : ''}</div>
            <div class="ccq-timeline-title">${T4.utils.escapeHTML(ms.title)}</div>
            ${ms.description ? `<div class="ccq-timeline-desc">${T4.utils.escapeHTML(ms.description)}</div>` : ''}
            ${ms.phase ? `<span class="ccq-timeline-phase-label" style="background:${phaseColor[ms.phase] || 'var(--ccq-accent)'}20;color:${phaseColor[ms.phase] || 'var(--ccq-accent)'}">${phaseLabel[ms.phase] || ms.phase}</span>` : ''}
            <div style="display:flex;gap:8px;margin-top:8px;">
              <button class="t4-btn t4-btn-sm t4-btn-ghost" onclick="CCQ.timeline.toggleDone(${i}, '${projectId}')" style="font-size:0.75rem">
                ${ms.done ? '&#10003; Feito' : '&#9675; Pendente'}
              </button>
              <button class="t4-btn t4-btn-sm t4-btn-ghost" onclick="CCQ.timeline.editMilestone(${i}, '${projectId}')" style="font-size:0.75rem">Editar</button>
              <button class="t4-btn t4-btn-sm t4-btn-ghost" style="color:var(--t4-status-danger);font-size:0.75rem" onclick="CCQ.timeline.removeMilestone(${i}, '${projectId}')">&times;</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* === FORMULARIO DE MARCO === */
  function showMilestoneForm(projectId, existingMilestone, index) {
    const formContainer = document.getElementById('tl-form');
    if (!formContainer) return;

    const ms = existingMilestone || {};
    const today = new Date().toISOString().split('T')[0];

    formContainer.style.display = 'block';
    formContainer.innerHTML = `
      <div class="ccq-detail-section t4-mt-md">
        <div class="ccq-detail-section-title">${existingMilestone ? 'Editar Marco' : 'Novo Marco'}</div>
        <div class="t4-input-group t4-mb-md">
          <label class="t4-label">Titulo *</label>
          <input type="text" id="ms-title" class="t4-input" placeholder="Nome do marco" value="${T4.utils.escapeHTML(ms.title || '')}">
        </div>
        <div class="t4-input-group t4-mb-md">
          <label class="t4-label">Data *</label>
          <input type="date" id="ms-date" class="t4-input" value="${ms.date || today}">
        </div>
        <div class="t4-input-group t4-mb-md">
          <label class="t4-label">Descricao</label>
          <input type="text" id="ms-desc" class="t4-input" placeholder="Descricao opcional" value="${T4.utils.escapeHTML(ms.description || '')}">
        </div>
        <div class="t4-input-group t4-mb-md">
          <label class="t4-label">Fase PDCA</label>
          <select id="ms-phase" class="t4-input t4-select">
            <option value="plan" ${ms.phase === 'plan' ? 'selected' : ''}>Planejar</option>
            <option value="do" ${ms.phase === 'do' ? 'selected' : ''}>Executar</option>
            <option value="check" ${ms.phase === 'check' ? 'selected' : ''}>Verificar</option>
            <option value="act" ${ms.phase === 'act' ? 'selected' : ''}>Agir</option>
          </select>
        </div>
        <div class="t4-flex t4-gap-sm">
          <button class="t4-btn t4-btn-block ccq-btn-accent-full" id="ms-save">Salvar</button>
          <button class="t4-btn t4-btn-block t4-btn-secondary" id="ms-cancel">Cancelar</button>
        </div>
      </div>
    `;

    formContainer.scrollIntoView({ behavior: 'smooth' });

    document.getElementById('ms-save').addEventListener('click', async () => {
      const title = document.getElementById('ms-title').value.trim();
      const date = document.getElementById('ms-date').value;
      const description = document.getElementById('ms-desc').value.trim();
      const phase = document.getElementById('ms-phase').value;

      if (!title || !date) {
        T4.notifications.warning('Informe titulo e data do marco.');
        return;
      }

      const project = await T4.storage.get(STORE_KEY, projectId);
      if (!project) return;
      if (!project.milestones) project.milestones = [];

      const milestone = { title, date, description, phase, done: ms.done || false };

      if (existingMilestone && index !== undefined && index !== null) {
        project.milestones[index] = milestone;
      } else {
        project.milestones.push(milestone);
      }

      await T4.storage.put(STORE_KEY, project);
      formContainer.style.display = 'none';
      formContainer.innerHTML = '';
      renderTimeline(project.milestones, projectId);
      T4.notifications.success('Marco salvo!');
    });

    document.getElementById('ms-cancel').addEventListener('click', () => {
      formContainer.style.display = 'none';
      formContainer.innerHTML = '';
    });
  }

  /* === TOGGLE DONE === */
  async function toggleDone(index, projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project || !project.milestones[index]) return;

    project.milestones[index].done = !project.milestones[index].done;
    await T4.storage.put(STORE_KEY, project);
    renderTimeline(project.milestones, projectId);
    T4.utils.vibrate(10);
  }

  /* === EDITAR === */
  async function editMilestone(index, projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project || !project.milestones[index]) return;

    showMilestoneForm(projectId, project.milestones[index], index);
  }

  /* === REMOVER === */
  async function removeMilestone(index, projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    project.milestones.splice(index, 1);
    await T4.storage.put(STORE_KEY, project);
    renderTimeline(project.milestones, projectId);
    T4.notifications.success('Marco removido.');
  }

  return {
    render,
    toggleDone,
    editMilestone,
    removeMilestone
  };
})();
