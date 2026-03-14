# T4 Trilho 4.0 — Arquitetura

## Visao Geral

O T4 e o sistema operacional digital do maquinista da EFVM (Estrada de Ferro Vitoria a Minas). Funciona como shell central (hub) com modulos plugaveis, integracoes externas isoladas e camada de dominio preparada para backend futuro.

O sistema e uma PWA (Progressive Web App) offline-first, mobile-first, construida em HTML5 + CSS3 + JavaScript vanilla — sem frameworks — para maximizar performance em dispositivos moveis com conectividade limitada ao longo da ferrovia.

---

## Arquitetura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO (Maquinista)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    FRONTEND SHELL (PWA)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  index.html (Hub Central)                                 │   │
│  │  shell/module-registry.js (Catalogo de modulos)           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │
│  │   Shared     │  │   Domain    │  │   Infrastructure    │     │
│  │  shared/js/  │  │  domain/*.js│  │ infrastructure/*.js  │     │
│  │  shared/css/ │  │             │  │                      │     │
│  └─────────────┘  └─────────────┘  └─────────────────────┘     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  MODULOS (modules/*/)                                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐   │   │
│  │  │Boa Jorn.│ │  ART    │ │ Timer J.│ │ Log CCO      │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────────┘   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐   │   │
│  │  │Calculad.│ │Contatos │ │ Avisos  │ │ ROF Digital  │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────────┘   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                    │   │
│  │  │AdamBoot │ │EFVM 360 │ │  CCQ    │                    │   │
│  │  └─────────┘ └─────────┘ └─────────┘                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  INTEGRACOES (integrations/*.js)                          │   │
│  │  VFZ Passagem de Servico  |  OPTIMA Work AI               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SERVICE WORKER (sw.js)                                    │   │
│  │  Cache offline  |  Sync queue  |  Background sync         │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  FUTURO: Backend                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │API Gateway│──│ Domain APIs  │──│ MySQL / Azure SQL        │   │
│  │(Azure APIM)│ │ REST /api/v1 │  │ + Azure Blob Storage     │   │
│  └──────────┘  └──────────────┘  └──────────────────────────┘   │
│  Azure AD (SSO) ──── Azure Monitor ──── Azure App Service        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Diretorios

```
T4_Trilho_4.0/
├── index.html                          # Shell HTML principal (Hub Central)
├── manifest.json                       # Manifesto PWA
├── sw.js                               # Service Worker (cache + sync strategies)
├── package.json                        # Metadados do projeto
│
├── shell/                              # Camada de orquestracao do Shell
│   └── module-registry.js              # Catalogo de modulos, indice de busca, categorias
│
├── domain/                             # Camada de dominio (logica de negocio)
│   ├── jornada-service.js              # Jornada ativa, historico, Boa Jornada
│   ├── seguranca-service.js            # ART (Analise de Risco da Tarefa)
│   └── comunicacao-service.js          # Log CCO, Avisos operacionais
│
├── infrastructure/                     # Camada de infraestrutura (acesso a dados)
│   └── storage-adapter.js              # Adapter pattern: localStorage hoje, API futuro
│
├── shared/                             # Recursos compartilhados entre modulos
│   ├── css/
│   │   ├── t4-design-system.css        # Variaveis, tipografia, cores, grid
│   │   ├── t4-components.css           # Botoes, cards, inputs, modais
│   │   └── t4-animations.css           # Animacoes e transicoes
│   ├── js/
│   │   ├── t4-core.js                  # T4.utils, T4.events, T4.dom, T4.state, T4.context
│   │   ├── t4-storage.js              # IndexedDB + localStorage abstraction
│   │   ├── t4-auth.js                  # Autenticacao matricula + PIN
│   │   ├── t4-router.js               # Navegacao entre modulos
│   │   └── t4-notifications.js         # Toasts, confirmacoes, push notifications
│   └── icons/
│       └── t4-logo.svg                 # Logotipo T4
│
├── modules/                            # Modulos plugaveis
│   ├── hub/                            # Dashboard principal
│   │   ├── css/hub-specific.css
│   │   └── js/
│   │       ├── hub-dashboard.js
│   │       └── hub-quick-actions.js
│   ├── boa-jornada/                    # Formulario de troca de turno
│   ├── art/                            # Analise de Risco da Tarefa
│   ├── timer-jornada/                  # Controle de jornada 12h
│   ├── log-cco/                        # Registro de comunicacoes radio
│   ├── calculadora/                    # Calculadora ferroviaria
│   ├── contatos/                       # Contatos operacionais
│   ├── avisos/                         # Avisos operacionais em tempo real
│   ├── rof-digital/                    # ROF digitalizado com busca IA
│   ├── adamboot/                       # Assistente IA ferroviario
│   ├── efvm360/                        # Simulador de conducao
│   └── ccq/                            # Circulo de Controle de Qualidade
│
├── integrations/                       # Integracoes com sistemas externos
│   ├── integration-config.json         # URLs e status das integracoes
│   ├── vfz-link.js                     # Link para VFZ Passagem de Servico
│   └── optima-link.js                  # Link para OPTIMA Work AI
│
└── docs/                               # Documentacao do projeto
    ├── ARCHITECTURE.md                 # Este documento
    ├── DATA-STRATEGY.md                # Estrategia de dados
    ├── DOMAIN-MAP.md                   # Mapa de dominios
    ├── SECURITY.md                     # Postura de seguranca
    ├── AZURE-READINESS.md              # Prontidao para Azure
    ├── ROADMAP.md                      # Roteiro de evolucao
    ├── MODULE-GUIDE.md                 # Guia de modulos
    └── DESIGN-SYSTEM.md               # Design system
```

---

## Classificacao dos Modulos

| Modulo | Chave | Categoria | Descricao | Backend Futuro | Persistencia Atual |
|--------|-------|-----------|-----------|----------------|-------------------|
| Boa Jornada | `boajornada` | D. Native Sync | Formulario digital de troca de turno | REST API `/api/v1/jornada` | localStorage via `T4.data` |
| ART | `art` | D. Native Sync | Analise de Risco da Tarefa (obrigatorio por lei) | REST API `/api/v1/seguranca` | localStorage via `T4.data` |
| Timer Jornada | `timerJornada` | D. Native Sync | Controle de jornada com alertas em 10h, 11h, 11h30 | REST API `/api/v1/jornada` | localStorage direto |
| Log CCO | `logCco` | D. Native Sync | Registro de comunicacoes com CCO | REST API `/api/v1/comunicacao` | localStorage direto |
| Calculadora | `calculadora` | C. Native Local | Calculadora ferroviaria (peso/eixo, frenagem, 10psi) | Nenhum | Sem persistencia |
| Contatos | `contatos` | C. Native Local | Contatos rapidos (CCO, lider, emergencia) | REST API `/api/v1/operacional` | localStorage |
| Avisos | `avisos` | D. Native Sync | Avisos operacionais de maquinistas para colegas | REST API `/api/v1/comunicacao` | localStorage direto |
| ROF Digital | `rof-digital` | B. Conteudo Local | ROF digitalizado com busca IA | ElasticSearch futuro | IndexedDB (`rof_articles`, `rof_bookmarks`, `rof_history`) |
| AdamBoot IA | `adamboot` | B. Conteudo Local | Assistente IA ferroviario com voz | API IA externa (Claude/GPT) | IndexedDB (`adamboot_conversations`, `adamboot_knowledge`) |
| EFVM 360 | `efvm360` | B. Conteudo Local | Simulador de conducao local | Analytics futuro | IndexedDB (`efvm360_simulations`, `efvm360_scores`) |
| CCQ | `ccq` | A. Launcher | Circulo de Controle de Qualidade | Link externo | IndexedDB (`ccq_projects`, `ccq_charts`) |
| Simulador EFVM | `simulador` | A. Launcher | Link para simulador externo | N/A (externo) | Nenhuma |
| EFVM 360 (ext) | `efvm360-ext` | A. Launcher | Plataforma EFVM 360 completa | N/A (externo) | Nenhuma |
| GDB | `gdb` | A. Launcher | Gestao de Dados operacional | N/A (externo) | Nenhuma |
| eDados | `edados` | A. Launcher | Indicadores e metricas EFVM | N/A (externo) | Nenhuma |
| Equipfer | `equipfer` | A. Launcher | Gestao de equipamentos ferroviarios | N/A (externo) | Nenhuma |
| Painel CCO | `cco` | A. Launcher | Centro de Controle Operacional | N/A (externo) | Nenhuma |
| Convocacao | `convocacao` | A. Launcher | Escala e convocacao de equipagem | N/A (externo) | Nenhuma |
| IRIS | `iris` | A. Launcher | Registro de incidentes | N/A (externo) | Nenhuma |
| Central Info | `central` | A. Launcher | Portal de comunicados e normas | N/A (externo) | Nenhuma |
| VES | `ves` | A. Launcher | Verificacao de equipamentos seguranca | N/A (externo) | Nenhuma |
| Prontidao | `prontidao` | A. Launcher | Controle de prontidao da equipagem | N/A (externo) | Nenhuma |
| Solicitar EPI | `epi` | A. Launcher | Solicitacao de EPIs via portal Vale | N/A (externo) | Nenhuma |
| Hub | (core) | E. Core Shell | Dashboard, navegacao, busca, alertas | Config sync | localStorage |

### Legenda de Categorias

- **A. Launcher:** Link externo — o T4 apenas abre o sistema corporativo em nova aba com `noopener,noreferrer`
- **B. Conteudo Local:** Conteudo cacheado localmente com dados em IndexedDB, funciona offline
- **C. Native Local:** Feature nativa que nao necessita backend (calculos, dados estaticos)
- **D. Native Sync:** Feature nativa com dados locais hoje, preparada para sincronizacao futura via API REST
- **E. Core Shell:** Funcionalidade central do shell (hub, navegacao, busca, config)

---

## Fluxo de Dados

### Camada de Apresentacao (UI)

| Componente | Arquivo(s) | Responsabilidade |
|------------|-----------|------------------|
| Shell HTML | `index.html` | SPA principal do Hub com login, dashboard, modais de modulos |
| Modulos | `modules/*/index.html` | Paginas independentes por modulo |
| Design System | `shared/css/t4-design-system.css` | Variaveis CSS, tipografia, cores, grid |
| Componentes | `shared/css/t4-components.css` | Botoes, cards, inputs, modais, toasts |
| Animacoes | `shared/css/t4-animations.css` | Transicoes e micro-interacoes |

### Camada de Shell (Orquestracao)

| Componente | Arquivo | Responsabilidade |
|------------|---------|------------------|
| Registro de Modulos | `shell/module-registry.js` | Metadados, indice de busca, categorias |
| Bootstrapping | `shared/js/t4-core.js` → `T4.init()` | Inicializacao, conectividade, contexto |
| Navegacao | `shared/js/t4-router.js` | Roteamento entre modulos, deep links |
| Preferencias | `T4.storage.local` | Configuracoes do usuario |
| Notificacoes | `shared/js/t4-notifications.js` | Toasts, confirmacoes, push |
| Busca | `shell/module-registry.js` → `T4Shell.SEARCH_INDEX` | Indice de termos pesquisaveis |

### Camada de Dominio (Logica de Negocio)

| Service | Arquivo | Dominio | Metodos Principais |
|---------|---------|---------|-------------------|
| Jornada | `domain/jornada-service.js` | Turno de trabalho | `getAtiva()`, `saveAtiva()`, `calcElapsed()`, `getPhase()`, `saveBoaJornada()` |
| Seguranca | `domain/seguranca-service.js` | Analise de risco | `getAllART()`, `saveART()`, `getART()`, `removeART()` |
| Comunicacao | `domain/comunicacao-service.js` | Comunicacoes CCO | `getAllLogs()`, `addLog()`, `getAllAvisos()`, `addAviso()`, `markAvisoRead()` |
| Operacional | (futuro) `domain/operacional-service.js` | Contatos, calculadora | Ainda nao extraido |

### Camada de Infraestrutura

| Componente | Arquivo | Responsabilidade |
|------------|---------|------------------|
| Storage Adapter | `infrastructure/storage-adapter.js` | Adapter pattern: `T4.data.save()`, `T4.data.get()`, `T4.data.getAll()` |
| Storage (IDB + LS) | `shared/js/t4-storage.js` | IndexedDB (dados complexos) + localStorage (preferencias) |
| Autenticacao | `shared/js/t4-auth.js` | Login matricula+PIN, sessao, perfil |
| Sync Queue | `shared/js/t4-storage.js` → `addToSyncQueue()` | Fila de acoes pendentes para sincronizacao |

### Camada Offline (Service Worker)

| Componente | Arquivo | Estrategia |
|------------|---------|-----------|
| Service Worker | `sw.js` | HTML/JSON: Network-first; CSS/JS/IMG: Cache-first (stale-while-revalidate) |
| Pre-cache | `sw.js` → `CORE_ASSETS` | Assets essenciais cacheados na instalacao |
| Modulos cache | `sw.js` → `MODULE_ASSETS` | Assets de modulos cacheados em background |
| Background Sync | `sw.js` → evento `sync` | Processa fila quando reconecta |

---

## Comunicacao entre Componentes

```
┌─────────────────────────────────────────────┐
│  T4.events (Event Bus)                       │
│  emit('auth:login')  → Modulos reagem       │
│  emit('context:update') → Atualiza UI       │
│  emit('connectivity:online') → Sync queue   │
│  emit('state:change') → Watchers            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  T4.context (Estado Operacional)             │
│  { patio, turno, trem, maquinista }         │
│  Persistido em localStorage (t4_context)    │
│  Compartilhado entre todos os modulos       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  T4.state (Estado da Aplicacao)              │
│  Reativo com watchers                        │
│  { activeModule, online }                   │
└─────────────────────────────────────────────┘
```

---

## Seguranca

| Aspecto | Implementacao Atual | Evolucao Futura |
|---------|--------------------|-----------------|
| Autenticacao | Matricula + PIN (demo) | SSO via Azure AD |
| Sessao | `localStorage` (t4_session) | Cookie httpOnly + token JWT |
| Prevencao XSS | `T4.utils.escapeHTML()` em todo output dinamico | CSP headers server-side |
| Links externos | `noopener, noreferrer` em todo `window.open()` | Mantido |
| Logging | Debug-gated (logs removidos em producao) | Azure Monitor / Application Insights |
| Demo mode | Credenciais isoladas em `t4-auth.js` → `DEFAULT_USERS` | Removido em producao |
| Dados sensiveis | Dados locais apenas (sem transmissao) | HTTPS + TLS 1.3 |

---

## Estrategia de Evolucao

Cada camada evolui independentemente, sem quebrar as demais:

| Camada | Atual | Evolucao | Impacto nos Modulos |
|--------|-------|----------|-------------------|
| UI (Apresentacao) | HTML/CSS/JS vanilla | Possivel migracao para Web Components | Nenhum — interface via Design System |
| Shell | `module-registry.js` estatico | Registro dinamico via API | Nenhum — modulos ja sao desacoplados |
| Dominio | `domain/*.js` com localStorage | Domain services chamam API REST | Nenhum — modulos usam services |
| Infraestrutura | `storage-adapter.js` → localStorage | Adapter resolve para fetch/API | Nenhum — adapter e transparente |
| Autenticacao | Matricula + PIN local | Azure AD SSO + JWT | Minimo — `T4.auth` ja abstrai |
| Offline | Service Worker + cache | SW + Background Sync + Push | Nenhum — transparente |
| Backend | Nenhum | Azure App Service + MySQL | Nenhum — adapter pattern isola |

---

## Principios Arquiteturais

1. **Offline-first:** Toda funcionalidade essencial opera sem conectividade
2. **Mobile-first:** UI otimizada para telas de 430px, touch targets de 44x44px
3. **Modular:** Modulos independentes com contrato via `T4.*` API
4. **Sem frameworks:** HTML5 + CSS3 + JavaScript vanilla para performance maxima
5. **Adapter pattern:** Fonte de dados substituivel sem alterar camada de UI
6. **Domain-driven:** Logica de negocio isolada em services por dominio
7. **Progressive enhancement:** Funcionalidades avancadas (push, sync) degradam graciosamente
