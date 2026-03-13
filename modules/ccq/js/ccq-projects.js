/* ============================================
   CCQ PROJECTS — Gerenciamento de projetos
   CRUD, equipe, evidencias fotograficas
   ============================================ */

CCQ.projects = (function () {
  let tempTeam = [];
  let photoBeforeBase64 = null;
  let photoAfterBase64 = null;

  /* === CRIAR PROJETO === */
  async function createProject() {
    const name = document.getElementById('proj-name').value.trim();
    const area = document.getElementById('proj-area').value;
    const problem = document.getElementById('proj-problem').value.trim();
    const goal = document.getElementById('proj-goal').value.trim();

    if (!name || !area || !problem) {
      T4.notifications.warning('Preencha os campos obrigatorios: nome, area e problema.');
      return;
    }

    const user = T4.auth.getUser();
    const pendingTpl = T4.state.get('pendingTemplate');

    const project = {
      name: name,
      area: area,
      problem: problem,
      goal: goal,
      phase: 'plan',
      team: [...tempTeam],
      photoBefore: photoBeforeBase64,
      photoAfter: null,
      brainstorming: pendingTpl ? (pendingTpl.sampleBrainstorming || []) : [],
      ishikawa: {
        metodo: [],
        maquina: [],
        material: [],
        maoDeObra: [],
        meioAmbiente: [],
        medicao: []
      },
      porques: { answers: ['', '', '', '', ''], rootCause: '' },
      acoes5w2h: pendingTpl ? (pendingTpl.sample5W2H || []) : [],
      gutItems: [],
      paretoData: [],
      histogramData: [],
      controlData: [],
      milestones: [],
      createdBy: user ? user.nome : 'Anonimo',
      createdAt: Date.now()
    };

    if (pendingTpl && pendingTpl.sampleBrainstorming) {
      const ishi = project.ishikawa;
      const catMap = {
        'Metodo': 'metodo',
        'Maquina': 'maquina',
        'Material': 'material',
        'Mao de obra': 'maoDeObra',
        'Meio ambiente': 'meioAmbiente',
        'Medicao': 'medicao'
      };
      pendingTpl.sampleBrainstorming.forEach(item => {
        const key = catMap[item.category];
        if (key && ishi[key]) {
          ishi[key].push({ id: T4.utils.uid(), text: item.text });
        }
      });
    }

    const saved = await T4.storage.put(CCQ.app.getStore(), project);
    T4.state.set('pendingTemplate', null);
    T4.notifications.success('Projeto "' + name + '" criado com sucesso!');
    clearForm();
    CCQ.app.openProject(saved.id);
  }

  /* === LIMPAR FORMULARIO === */
  function clearForm() {
    const form = document.getElementById('form-project');
    if (form) form.reset();
    tempTeam = [];
    photoBeforeBase64 = null;
    photoAfterBase64 = null;
    renderTeamChips();
    const preview = document.getElementById('preview-before');
    if (preview) preview.innerHTML = '';
  }

  /* === LIMPAR EQUIPE === */
  function clearTeamForm() {
    tempTeam = [];
    renderTeamChips();
  }

  /* === ADICIONAR MEMBRO === */
  function addTeamMember(name, role) {
    if (!name) return;
    tempTeam.push({
      id: T4.utils.uid(),
      name: name,
      role: role || 'Membro'
    });
    renderTeamChips();
  }

  /* === REMOVER MEMBRO === */
  function removeTeamMember(memberId) {
    tempTeam = tempTeam.filter(m => m.id !== memberId);
    renderTeamChips();
  }

  /* === RENDER CHIPS DE EQUIPE === */
  function renderTeamChips() {
    const container = document.getElementById('team-members-container');
    if (!container) return;

    container.innerHTML = tempTeam.map(m => `
      <div class="ccq-member-chip">
        <span>${T4.utils.escapeHTML(m.name)}</span>
        <span class="ccq-member-chip-role">${T4.utils.escapeHTML(m.role)}</span>
        <button type="button" class="ccq-member-chip-remove" onclick="CCQ.projects.removeTeamMember('${m.id}')">&times;</button>
      </div>
    `).join('');
  }

  /* === FOTO ANTES/DEPOIS === */
  function renderPhotos(projectId) {
    const container = document.getElementById('tool-content');
    if (!container) return;

    T4.storage.get(CCQ.app.getStore(), projectId).then(project => {
      if (!project) return;

      container.innerHTML = `
        <div class="ccq-before-after">
          <div class="ccq-before-after-panel">
            <div class="ccq-before-after-label before">Antes</div>
            ${project.photoBefore
              ? `<img src="${project.photoBefore}" class="ccq-before-after-img" alt="Foto antes">`
              : `<div class="ccq-before-after-img" style="display:flex;align-items:center;justify-content:center;color:var(--t4-text-muted);font-size:0.75rem;">Sem foto</div>`
            }
            <input type="file" id="photo-before-input" accept="image/*" capture="environment" class="ccq-file-input">
            <label for="photo-before-input" class="ccq-file-label t4-mt-sm" style="justify-content:center">
              <span>Selecionar foto</span>
            </label>
          </div>
          <div class="ccq-before-after-panel">
            <div class="ccq-before-after-label after">Depois</div>
            ${project.photoAfter
              ? `<img src="${project.photoAfter}" class="ccq-before-after-img" alt="Foto depois">`
              : `<div class="ccq-before-after-img" style="display:flex;align-items:center;justify-content:center;color:var(--t4-text-muted);font-size:0.75rem;">Sem foto</div>`
            }
            <input type="file" id="photo-after-input" accept="image/*" capture="environment" class="ccq-file-input">
            <label for="photo-after-input" class="ccq-file-label t4-mt-sm" style="justify-content:center">
              <span>Selecionar foto</span>
            </label>
          </div>
        </div>
      `;

      document.getElementById('photo-before-input').addEventListener('change', (e) => handlePhotoUpload(e, projectId, 'photoBefore'));
      document.getElementById('photo-after-input').addEventListener('change', (e) => handlePhotoUpload(e, projectId, 'photoAfter'));
    });
  }

  /* === UPLOAD DE FOTO === */
  function handlePhotoUpload(event, projectId, field) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      T4.notifications.warning('Imagem muito grande. Maximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
      const base64 = e.target.result;

      const project = await T4.storage.get(CCQ.app.getStore(), projectId);
      if (!project) return;

      project[field] = base64;
      await T4.storage.put(CCQ.app.getStore(), project);

      renderPhotos(projectId);
      T4.notifications.success('Foto salva com sucesso!');
    };
    reader.readAsDataURL(file);
  }

  /* === BIND DO FORMULARIO === */
  function bindFormEvents() {
    const btnAdd = document.getElementById('btn-add-member');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        const nameInput = document.getElementById('member-name');
        const roleInput = document.getElementById('member-role');
        const name = nameInput.value.trim();
        const role = roleInput.value.trim();
        if (!name) {
          T4.notifications.warning('Informe o nome do membro.');
          return;
        }
        addTeamMember(name, role);
        nameInput.value = '';
        roleInput.value = '';
        nameInput.focus();
      });
    }

    const photoInput = document.getElementById('proj-photo-before');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          T4.notifications.warning('Imagem muito grande. Maximo 5MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = function (ev) {
          photoBeforeBase64 = ev.target.result;
          const preview = document.getElementById('preview-before');
          if (preview) {
            preview.innerHTML = `<img src="${photoBeforeBase64}" alt="Preview">`;
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', bindFormEvents);

  return {
    createProject,
    clearForm,
    clearTeamForm,
    addTeamMember,
    removeTeamMember,
    renderPhotos,
    handlePhotoUpload
  };
})();
