/* ============================================
   CCQ PRESENTATIONS — Gerador de apresentacoes
   Slides baseados nos dados do projeto
   ============================================ */

CCQ.presentations = (function () {
  const STORE_KEY = 'ccq_projects';
  let currentSlide = 0;
  let totalSlides = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  /* === RENDER === */
  async function render(projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    const slides = buildSlides(project);
    totalSlides = slides.length;
    currentSlide = 0;

    const container = document.getElementById('presentation-container');
    container.innerHTML = slides.map((slide, i) => `
      <div class="ccq-slide ${slide.class || ''} ${i === 0 ? 'active' : ''}" data-index="${i}">
        ${slide.html}
      </div>
    `).join('');

    updateCounter();
    bindPresentationEvents(container);
  }

  /* === CONSTRUIR SLIDES === */
  function buildSlides(project) {
    const slides = [];
    const user = T4.auth.getUser();
    const phaseLabels = { plan: 'Planejar', do: 'Executar', check: 'Verificar', act: 'Agir', done: 'Concluido' };

    /* 1. Capa */
    const styles = getComputedStyle(document.documentElement);
    const bgPrimary = styles.getPropertyValue('--bg-primary').trim() || '#0a0e12';
    const accentGold = styles.getPropertyValue('--accent-gold').trim() || '#E5A100';
    const textMuted = styles.getPropertyValue('--text-muted').trim() || '#556677';

    slides.push({
      class: 'ccq-slide-cover',
      html: `
        <div style="margin-bottom:24px">
          <svg viewBox="0 0 80 80" width="80" height="80">
            <path d="M40 2 A38 38 0 0 1 78 40 L40 40 Z" fill="#60a5fa"/>
            <path d="M78 40 A38 38 0 0 1 40 78 L40 40 Z" fill="#34d399"/>
            <path d="M40 78 A38 38 0 0 1 2 40 L40 40 Z" fill="#fbbf24"/>
            <path d="M2 40 A38 38 0 0 1 40 2 L40 40 Z" fill="#f87171"/>
            <circle cx="40" cy="40" r="18" fill="${bgPrimary}"/>
            <text x="40" y="38" text-anchor="middle" font-size="8" font-weight="700" fill="${accentGold}" font-family="JetBrains Mono,monospace">CCQ</text>
            <text x="40" y="48" text-anchor="middle" font-size="6" fill="${textMuted}">PDCA</text>
          </svg>
        </div>
        <div class="ccq-slide-title">${esc(project.name)}</div>
        <div class="ccq-slide-subtitle">${esc(project.area || '')} &middot; ${phaseLabels[project.phase || 'plan']}</div>
        <p class="t4-text-sm t4-text-muted">${esc(user ? user.nome : '')} &middot; ${T4.utils.formatDate(project.createdAt, 'long')}</p>
      `
    });

    /* 2. Problema */
    slides.push({
      html: `
        <div class="ccq-slide-title" style="font-size:1.125rem;color:var(--ccq-act)">Problema Identificado</div>
        <div class="ccq-slide-content">
          <div class="ccq-detail-section">
            <div class="ccq-detail-section-text" style="font-size:1rem;line-height:1.7">${esc(project.problem || 'Nao definido')}</div>
          </div>
          ${project.goal ? `
            <div class="ccq-detail-section t4-mt-md">
              <div class="ccq-detail-section-title">Meta SMART</div>
              <div class="ccq-detail-section-text">${esc(project.goal)}</div>
            </div>
          ` : ''}
        </div>
      `
    });

    /* 3. Equipe */
    if (project.team && project.team.length > 0) {
      slides.push({
        html: `
          <div class="ccq-slide-title" style="font-size:1.125rem;color:var(--ccq-plan)">Equipe CCQ</div>
          <div class="ccq-slide-content">
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${project.team.map(m => {
                const initials = m.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                return `
                  <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--t4-bg-card);border-radius:var(--t4-radius-md);">
                    <div class="t4-avatar" style="background:var(--ccq-accent-light);color:var(--ccq-accent)">${initials}</div>
                    <div>
                      <div style="font-weight:600;font-size:0.9375rem">${esc(m.name)}</div>
                      <div style="font-size:0.8125rem;color:var(--ccq-accent)">${esc(m.role)}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `
      });
    }

    /* 4. Brainstorming */
    if (project.brainstorming && project.brainstorming.length > 0) {
      slides.push({
        html: `
          <div class="ccq-slide-title" style="font-size:1.125rem;color:var(--ccq-do)">Brainstorming</div>
          <div class="ccq-slide-content">
            <p class="t4-text-sm t4-text-muted t4-mb-md">${project.brainstorming.length} ideias levantadas</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${project.brainstorming.map(idea => `
                <div class="ccq-member-chip" style="cursor:default">
                  <span>${esc(idea.text)}</span>
                  <span class="ccq-member-chip-role">${esc(idea.category || '')}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `
      });
    }

    /* 5. Ishikawa */
    if (project.ishikawa) {
      const totalCauses = Object.values(project.ishikawa).reduce((s, arr) => s + (arr ? arr.length : 0), 0);
      if (totalCauses > 0) {
        const catLabels = {
          metodo: 'Metodo', maquina: 'Maquina', material: 'Material',
          maoDeObra: 'Mao de Obra', meioAmbiente: 'Meio Ambiente', medicao: 'Medicao'
        };
        const catColors = {
          metodo: '#60a5fa', maquina: '#34d399', material: '#fbbf24',
          maoDeObra: '#f87171', meioAmbiente: '#a78bfa', medicao: accentGold
        };

        slides.push({
          html: `
            <div class="ccq-slide-title" style="font-size:1.125rem;color:var(--ccq-accent)">Diagrama de Ishikawa</div>
            <div class="ccq-slide-content">
              <p class="t4-text-sm t4-text-muted t4-mb-md">${totalCauses} causas mapeadas nos 6Ms</p>
              ${Object.entries(project.ishikawa).filter(([, arr]) => arr && arr.length > 0).map(([key, arr]) => `
                <div class="t4-mb-md">
                  <div style="font-size:0.8125rem;font-weight:700;color:${catColors[key] || accentGold};margin-bottom:4px;">${catLabels[key] || key}</div>
                  <div style="display:flex;flex-wrap:wrap;gap:4px;">
                    ${arr.map(c => `<span class="ccq-member-chip" style="cursor:default;font-size:0.6875rem">${esc(c.text)}</span>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          `
        });
      }
    }

    /* 6. 5 Porques */
    if (project.porques && project.porques.answers && project.porques.answers.some(a => a)) {
      slides.push({
        html: `
          <div class="ccq-slide-title" style="font-size:1.125rem;color:var(--ccq-check)">5 Porques</div>
          <div class="ccq-slide-content">
            <div class="ccq-porques-chain">
              ${project.porques.answers.filter(a => a).map((ans, i) => `
                <div class="ccq-porque-item">
                  <div class="ccq-porque-number">${i + 1}o POR QUE</div>
                  <div class="ccq-porque-answer">${esc(ans)}</div>
                </div>
              `).join('')}
            </div>
            ${project.porques.rootCause ? `
              <div class="ccq-root-cause t4-mt-md">
                <div class="ccq-root-cause-label">CAUSA RAIZ</div>
                <div style="font-size:0.9375rem;color:var(--t4-text-primary)">${esc(project.porques.rootCause)}</div>
              </div>
            ` : ''}
          </div>
        `
      });
    }

    /* 7. Pareto */
    if (project.paretoData && project.paretoData.length > 0) {
      const sorted = [...project.paretoData].sort((a, b) => b.value - a.value);
      const maxVal = sorted[0].value;

      slides.push({
        html: `
          <div class="ccq-slide-title" style="font-size:1.125rem;color:var(--ccq-accent)">Grafico de Pareto</div>
          <div class="ccq-slide-content">
            <div class="ccq-pareto-bars" style="margin-bottom:32px;">
              ${sorted.map(d => {
                const pct = (d.value / maxVal) * 100;
                return `
                  <div class="ccq-pareto-bar" style="height:${pct}%">
                    <span class="ccq-pareto-bar-value">${d.value}</span>
                    <span class="ccq-pareto-bar-label">${esc(d.label)}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `
      });
    }

    /* 8. Plano de Acao */
    if (project.acoes5w2h && project.acoes5w2h.length > 0) {
      slides.push({
        html: `
          <div class="ccq-slide-title" style="font-size:1.125rem;color:var(--ccq-do)">Plano de Acao 5W2H</div>
          <div class="ccq-slide-content">
            ${project.acoes5w2h.map((acao, i) => `
              <div class="ccq-detail-section t4-mb-sm">
                <div class="ccq-detail-section-title">Acao #${i + 1}</div>
                <div style="font-size:0.875rem;font-weight:600;color:var(--t4-text-primary);margin-bottom:8px">${esc(acao.what || '')}</div>
                <div class="t4-text-sm t4-text-secondary">${esc(acao.why || '')}</div>
                <div class="t4-text-sm t4-text-muted t4-mt-sm">${esc(acao.who || '')} &middot; ${esc(acao.when || '')}</div>
              </div>
            `).join('')}
          </div>
        `
      });
    }

    /* 9. Resultados / GUT */
    if (project.gutItems && project.gutItems.length > 0) {
      const sorted = [...project.gutItems].sort((a, b) => (b.g * b.u * b.t) - (a.g * a.u * a.t));
      slides.push({
        html: `
          <div class="ccq-slide-title" style="font-size:1.125rem;color:var(--ccq-check)">Priorizacao GUT</div>
          <div class="ccq-slide-content">
            ${sorted.slice(0, 5).map((item, i) => `
              <div class="t4-list-item" style="margin-bottom:4px">
                <span class="ccq-gut-rank">${i + 1}o</span>
                <span style="flex:1;font-size:0.875rem">${esc(item.problem)}</span>
                <span class="ccq-gut-total">${item.g * item.u * item.t}</span>
              </div>
            `).join('')}
          </div>
        `
      });
    }

    /* 10. Antes/Depois */
    if (project.photoBefore || project.photoAfter) {
      slides.push({
        html: `
          <div class="ccq-slide-title" style="font-size:1.125rem">Antes e Depois</div>
          <div class="ccq-slide-content">
            <div class="ccq-before-after">
              <div class="ccq-before-after-panel">
                <div class="ccq-before-after-label before">Antes</div>
                ${project.photoBefore
                  ? `<img src="${project.photoBefore}" class="ccq-before-after-img" alt="Antes">`
                  : '<div class="ccq-before-after-img" style="display:flex;align-items:center;justify-content:center;color:var(--t4-text-muted);font-size:0.75rem">Sem foto</div>'
                }
              </div>
              <div class="ccq-before-after-panel">
                <div class="ccq-before-after-label after">Depois</div>
                ${project.photoAfter
                  ? `<img src="${project.photoAfter}" class="ccq-before-after-img" alt="Depois">`
                  : '<div class="ccq-before-after-img" style="display:flex;align-items:center;justify-content:center;color:var(--t4-text-muted);font-size:0.75rem">Sem foto</div>'
                }
              </div>
            </div>
          </div>
        `
      });
    }

    return slides;
  }

  /* === NAVEGACAO === */
  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    const slides = document.querySelectorAll('.ccq-slide');
    slides.forEach(s => s.classList.remove('active'));
    slides[index].classList.add('active');
    currentSlide = index;
    updateCounter();
  }

  function nextSlide() { goToSlide(currentSlide + 1); }
  function prevSlide() { goToSlide(currentSlide - 1); }

  function updateCounter() {
    const counter = document.getElementById('slide-counter');
    if (counter) counter.textContent = `${currentSlide + 1} / ${totalSlides}`;
  }

  /* === EVENTOS === */
  function bindPresentationEvents(container) {
    /* Swipe */
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) nextSlide();
        else prevSlide();
      }
    }, { passive: true });

    /* Click nas metades */
    container.addEventListener('click', (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x > rect.width * 0.6) nextSlide();
      else if (x < rect.width * 0.4) prevSlide();
    });

    /* Teclado */
    const keyHandler = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      else if (e.key === 'ArrowLeft') prevSlide();
      else if (e.key === 'Escape') exitPresentation();
    };
    document.addEventListener('keydown', keyHandler);
    container._keyHandler = keyHandler;

    /* Botoes de controle */
    const exitBtn = document.getElementById('pres-exit');
    if (exitBtn) exitBtn.addEventListener('click', exitPresentation);

    const fsBtn = document.getElementById('pres-fullscreen');
    if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);
  }

  function exitPresentation() {
    const container = document.getElementById('presentation-container');
    if (container && container._keyHandler) {
      document.removeEventListener('keydown', container._keyHandler);
    }

    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    const projectId = CCQ.app.getCurrentProjectId();
    if (projectId) {
      CCQ.app.openProject(projectId);
    } else {
      CCQ.app.showScreen('dashboard');
    }
  }

  function toggleFullscreen() {
    const el = document.getElementById('screen-presentation');
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  /* === EXPORTAR HTML === */
  async function exportHTML(projectId) {
    const project = await T4.storage.get(STORE_KEY, projectId);
    if (!project) return;

    const slides = buildSlides(project);

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CCQ - ${esc(project.name)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Outfit',sans-serif;background:#0a0e12;color:#f0f2f5;overflow:hidden}
.slide{width:100vw;height:100vh;display:none;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center}
.slide.active{display:flex}
.slide h2{font-size:1.5rem;margin-bottom:16px}
.slide p{color:#94a3b8;margin-bottom:8px}
.nav{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:12px}
.nav button{background:rgba(255,255,255,0.1);border:none;color:#f0f2f5;padding:8px 16px;border-radius:8px;cursor:pointer}
</style>
</head>
<body>
${slides.map((s, i) => `<div class="slide ${i === 0 ? 'active' : ''}" data-i="${i}">${s.html}</div>`).join('\n')}
<div class="nav">
<button onclick="go(-1)">Anterior</button>
<span id="cnt" style="color:#94a3b8;align-self:center">1/${slides.length}</span>
<button onclick="go(1)">Proximo</button>
</div>
<script>
let c=0,t=${slides.length};
function go(d){
  const sl=document.querySelectorAll('.slide');
  const n=c+d;
  if(n<0||n>=t)return;
  sl[c].classList.remove('active');
  sl[n].classList.add('active');
  c=n;
  document.getElementById('cnt').textContent=(c+1)+'/'+t;
}
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1);});
</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ccq-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    T4.notifications.success('Apresentacao exportada!');
  }

  /* Util */
  function esc(str) {
    return T4.utils.escapeHTML(str || '');
  }

  return {
    render,
    nextSlide,
    prevSlide,
    goToSlide,
    exitPresentation,
    toggleFullscreen,
    exportHTML
  };
})();
