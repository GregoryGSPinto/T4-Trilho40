# Roadmap — T4 Trilho 4.0

## Transformacao Arquitetural — Concluida

### Fase A — Reestruturacao Modular (Concluida)

- [x] Hub Central com navegacao entre modulos
- [x] Design System T4 completo (`shared/css/t4-design-system.css`, `t4-components.css`, `t4-animations.css`)
- [x] Sistema de roteamento entre modulos (`shared/js/t4-router.js`)
- [x] Registro centralizado de modulos (`shell/module-registry.js`)
- [x] Classificacao de modulos por categoria (Launcher, Content, Native Local, Native Sync, Core)
- [x] Indice de busca unificado (`T4Shell.SEARCH_INDEX`)

### Fase B — Camada de Dominio (Concluida)

- [x] Domain service de Jornada (`domain/jornada-service.js`)
- [x] Domain service de Seguranca (`domain/seguranca-service.js`)
- [x] Domain service de Comunicacao (`domain/comunicacao-service.js`)
- [x] Isolamento de logica de negocio nos domain services

### Fase C — Camada de Infraestrutura (Concluida)

- [x] Storage Adapter com pattern substituivel (`infrastructure/storage-adapter.js`)
- [x] Abstracacao IndexedDB + localStorage (`shared/js/t4-storage.js`)
- [x] Sistema de autenticacao abstrato (`shared/js/t4-auth.js`)
- [x] Sync Queue para operacoes offline (`T4.storage.addToSyncQueue`)
- [x] Reconnection handler (`window.addEventListener('online')`)

### Fase D — Camada Offline (Concluida)

- [x] Service Worker com estrategias diferenciadas (`sw.js`)
  - Network-first para HTML e JSON
  - Cache-first (stale-while-revalidate) para CSS, JS e imagens
- [x] Pre-cache de assets essenciais na instalacao
- [x] Cache de modulos em background
- [x] Background Sync event handler
- [x] Fallback para index.html em navegacao offline

### Fase E — Modulos Operacionais (Concluida)

- [x] Boa Jornada — formulario de troca de turno
- [x] ART — Analise de Risco da Tarefa
- [x] Timer Jornada — controle de jornada 12h com alertas
- [x] Log CCO — registro de comunicacoes radio
- [x] Calculadora — formulas ferroviarias (peso/eixo, frenagem, 10psi)
- [x] Contatos — contatos rapidos operacionais
- [x] Avisos Operacionais — avisos em tempo real entre maquinistas

### Fase F — Modulos de Conhecimento e Treinamento (Concluida)

- [x] EFVM 360 — simulador de conducao com fisica, cenarios e pontuacao
- [x] CCQ — ferramentas de qualidade (PDCA, Ishikawa, 5W2H, Pareto)
- [x] ROF Digital — regulamento ferroviario com busca por IA
- [x] AdamBoot IA — assistente com chat, voz, glossario e FAQ

### Fase G — Integracoes (Concluida)

- [x] Integracao OPTIMA Work AI (`integrations/optima-link.js`)
- [x] Integracao VFZ Passagem de Servico (`integrations/vfz-link.js`)
- [x] 13 launchers para sistemas corporativos Vale (GDB, eDados, Equipfer, IRIS, VES, etc.)

### Fase H — Documentacao Enterprise (Concluida)

- [x] Documentacao de arquitetura (`docs/ARCHITECTURE.md`)
- [x] Estrategia de dados (`docs/DATA-STRATEGY.md`)
- [x] Mapa de dominios (`docs/DOMAIN-MAP.md`)
- [x] Postura de seguranca (`docs/SECURITY.md`)
- [x] Prontidao Azure (`docs/AZURE-READINESS.md`)
- [x] Guia de modulos (`docs/MODULE-GUIDE.md`)
- [x] Design System (`docs/DESIGN-SYSTEM.md`)

---

## Roadmap Futuro

### v1.1 — Melhorias de Conteudo (Proximo)

- [ ] Dados reais completos do ROF (artigos regulatorios oficiais)
- [ ] Perfil da via EFVM com dados precisos de engenharia (gradientes, curvas, restricoes)
- [ ] Sons da locomotiva no simulador (buzina, freio, motor)
- [ ] Exportacao de apresentacao CCQ em PDF
- [ ] Integracao AdamBoot com API de IA (Claude/GPT via Azure OpenAI)

### v2.0 — Infraestrutura Azure (Trimestre 2)

- [ ] Deploy em Azure Static Web Apps com CI/CD
- [ ] Dominio customizado (t4.vale.com) com HTTPS corporativo
- [ ] Integracao Azure AD (SSO) — substituir login demo
- [ ] Application Insights para telemetria e monitoramento
- [ ] CDN Azure para assets estaticos

### v2.1 — Backend por Dominio (Trimestre 3)

- [ ] API REST `/api/v1/jornada` — backend para dados de jornada
- [ ] API REST `/api/v1/seguranca` — backend para ART
- [ ] API REST `/api/v1/comunicacao` — backend para Log CCO e Avisos
- [ ] Azure SQL Database para dados transacionais
- [ ] Migracao do storage-adapter para chamar APIs (online) com fallback local (offline)
- [ ] Sync queue processando automaticamente ao reconectar

### v2.2 — Busca Inteligente e IA (Trimestre 3-4)

- [ ] Azure Cognitive Search para ROF Digital (busca full-text com relevancia)
- [ ] Azure OpenAI para AdamBoot (respostas contextuais baseadas no ROF)
- [ ] Busca semantica por linguagem natural
- [ ] Sugestoes e autocomplete na busca

### v3.0 — Escala e Producao (Trimestre 4)

- [ ] RBAC (controle de acesso por role: maquinista, lider, admin)
- [ ] Azure API Management com rate limiting e JWT validation
- [ ] Blob Storage para anexos (fotos ART, documentos Boa Jornada)
- [ ] Audit trail para compliance regulatorio
- [ ] Dashboard gerencial com KPIs operacionais
- [ ] Penetration testing e hardening de seguranca
- [ ] Go-live com rollout gradual (piloto 50 maquinistas → geral)

### v3.1 — Expansao de Funcionalidades

- [ ] Modulo de Analytics (dados de desempenho por maquinista/equipe)
- [ ] Modulo App Cabine (checklist digital de cabine da locomotiva)
- [ ] Notificacoes push para escalas e convocacoes
- [ ] Sincronizacao multi-dispositivo (tablet + celular)
- [ ] Modo multiplayer no simulador (corrida de eficiencia entre maquinistas)

### v4.0 — Visao de Longo Prazo

- [ ] Event sourcing para auditoria imutavel
- [ ] Integracao bidirecional com sistemas corporativos (GDB, IRIS, Convocacao)
- [ ] IoT — dados da locomotiva em tempo real (velocidade, pressao, GPS)
- [ ] Geofencing — avisos automaticos por localizacao GPS do maquinista
- [ ] Digital twin — representacao digital da composicao e via

---

## Metricas de Sucesso

| Metrica | Meta v2.0 | Meta v3.0 |
|---------|----------|----------|
| Usuarios ativos | 50 (piloto) | 500+ (EFVM completa) |
| Uptime | 99% | 99.9% |
| Tempo offline suportado | Ilimitado (local) | Ilimitado com sync |
| Jornadas registradas/dia | 50 | 500+ |
| ARTs preenchidas/dia | 50 | 500+ |
| Tempo medio de login | < 5s (demo) | < 3s (SSO) |
| Sync queue max pendente | N/A | < 10 itens |
