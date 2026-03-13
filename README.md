# T4 — Trilho 4.0

**Ecossistema digital de missao critica para maquinistas da EFVM (Estrada de Ferro Vitoria a Minas).**

Shell operacional mobile-first com modulos plugaveis, integracoes externas isoladas e camada de dominio preparada para backend corporativo.

---

## Visao do Produto

O T4 e o **sistema operacional do maquinista**. Funciona como hub central do ecossistema digital, integrando funcionalidades nativas, conteudo local e pontes para sistemas corporativos.

| Etapa da Jornada | Modulos T4 |
|---|---|
| Convocacao e prontidao | Prontidao, Convocacao |
| Preparacao do turno | ART, Boa Jornada, VES |
| Conducao | Timer Jornada, Log CCO, Calculadora, Simulador |
| Comunicacao | Log CCO, Contatos Rapidos, Avisos |
| Consulta normativa | ROF Digital, AdamBoot IA |
| Seguranca | ART, Emergencia, Contatos, Avisos |
| Suporte | EPI, CCQ, EFVM 360, IRIS |
| Encerramento | Boa Jornada, Timer Jornada |

---

## Classificacao dos Modulos

| Modulo | Categoria | Backend Futuro |
|--------|-----------|----------------|
| Timer Jornada | Feature Nativa (sync) | MySQL: jornadas |
| Log CCO | Feature Nativa (sync) | MySQL: logs comunicacao |
| Boa Jornada | Feature Nativa (sync) | MySQL: handover |
| ART | Feature Nativa (sync) | MySQL: analise risco |
| Avisos | Feature Nativa (sync) | MySQL: avisos |
| Calculadora | Feature Nativa (local) | — |
| Contatos | Feature Nativa (local) | — |
| ROF Digital | Conteudo Local | ElasticSearch futuro |
| AdamBoot IA | Conteudo Local | LLM API futuro |
| Simulador EFVM | Launcher Externo | — |
| EFVM 360 | Launcher Externo | — |
| CCQ | Launcher Externo | — |
| eDados, VES, IRIS... | Integracao Corporativa | SSO Azure AD |

---

## Arquitetura

```
T4 Trilho 4.0
├── index.html                      # Shell HTML (cockpit operacional)
├── shell/                          # Orquestracao do shell
│   ├── module-registry.js          # Registro central de modulos
│   ├── shell-init.js               # Bootstrap e inicializacao
│   ├── shell-navigation.js         # Navegacao e modais
│   ├── shell-config.js             # Configuracoes do usuario
│   ├── shell-alertas.js            # Sistema de alertas
│   ├── shell-busca.js              # Busca global
│   └── shell-login.js              # Fluxo de login
├── domain/                         # Servicos de dominio
│   ├── jornada-service.js          # Timer + Boa Jornada
│   ├── seguranca-service.js        # ART
│   ├── comunicacao-service.js      # Log CCO + Avisos
│   └── operacional-service.js      # Contatos + contexto
├── infrastructure/                 # Infraestrutura tecnica
│   └── storage-adapter.js          # Adapter pattern para dados
├── integrations/                   # Integracoes externas isoladas
│   ├── registry.js                 # Registro centralizado de URLs
│   └── integration-config.json     # Configuracao de sistemas externos
├── shared/                         # Biblioteca compartilhada
│   ├── css/
│   │   ├── t4-design-system.css    # Tokens, paleta Vale, tipografia
│   │   ├── t4-components.css       # Componentes reutilizaveis
│   │   └── t4-animations.css       # Keyframes e transicoes
│   ├── js/
│   │   ├── t4-core.js              # Namespace T4, utils, events, state
│   │   ├── t4-storage.js           # IndexedDB + localStorage
│   │   ├── t4-router.js            # Navegacao entre modulos
│   │   ├── t4-auth.js              # Autenticacao (demo mode isolado)
│   │   ├── t4-notifications.js     # Toasts, modais, push
│   │   ├── t4-logger.js            # Logging com debug flag
│   │   └── t4-module-utils.js      # Utilitarios compartilhados
│   └── data/
│       └── demo-users.json         # Credenciais demo (externalizadas)
├── modules/                        # Modulos plugaveis por dominio
│   ├── hub/                        # Dashboard cockpit
│   ├── timer-jornada/              # Timer 12h com alertas
│   ├── log-cco/                    # Log de comunicacoes
│   ├── boa-jornada/                # Troca de turno
│   ├── art/                        # Analise de risco
│   ├── calculadora/                # Calculadoras ferroviarias
│   ├── contatos/                   # Contatos rapidos
│   ├── avisos/                     # Avisos operacionais
│   ├── rof-digital/                # ROF Digital + Quiz
│   ├── adamboot/                   # IA ferroviaria
│   ├── efvm360/                    # Simulador
│   └── ccq/                        # Qualidade
├── sw.js                           # Service Worker unificado
├── manifest.json                   # PWA manifest
└── docs/                           # Documentacao tecnica
    ├── ARCHITECTURE.md
    ├── DATA-STRATEGY.md
    ├── DOMAIN-MAP.md
    ├── SECURITY.md
    └── AZURE-READINESS.md
```

### Stack

- **Frontend:** HTML5 + CSS3 + JavaScript vanilla (sem frameworks)
- **Arquitetura:** Shell + Modulos plugaveis + Domain Services + Adapter Pattern
- **Persistencia:** localStorage + IndexedDB (adapter para API futura)
- **Offline:** Service Worker (cache-first assets, network-first dados)
- **PWA:** Manifest, standalone display, portrait orientation
- **Design System:** Paleta Vale, Outfit + JetBrains Mono, modo dia/noite

### Camadas

```
UI (index.html + modules/)
  ↓
Shell (shell/*.js)
  ↓
Domain Services (domain/*.js)
  ↓
Infrastructure (infrastructure/storage-adapter.js)
  ↓
localStorage/IndexedDB (hoje) → REST API (futuro)
```

---

## Como Executar

```bash
npx serve . -p 3000
```

Acesse `http://localhost:3000`

**Login demo:** Matricula `0001` / PIN `1234`

---

## Documentacao

| Documento | Conteudo |
|-----------|---------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura detalhada |
| [DATA-STRATEGY.md](docs/DATA-STRATEGY.md) | Estrategia de dados e migracao |
| [DOMAIN-MAP.md](docs/DOMAIN-MAP.md) | Mapa de dominios e servicos |
| [SECURITY.md](docs/SECURITY.md) | Postura de seguranca |
| [AZURE-READINESS.md](docs/AZURE-READINESS.md) | Preparacao para Azure |

---

## Proximos Passos

1. **Backend por dominio** — APIs REST separadas (jornada, seguranca, comunicacao)
2. **SSO corporativo** — Substituir auth demo por Azure AD
3. **MySQL** — Banco transacional para jornadas, ART, logs, avisos
4. **Sincronizacao** — Conectar fila offline com APIs
5. **Notificacoes push** — Alertas de BOLL via push service
6. **Observabilidade** — Azure Monitor + telemetria anonimizada
7. **Testes E2E** — Suite Playwright
8. **CI/CD** — Pipeline automatizado

---

**Desenvolvido por Gregory Pinto — Maquinista Senior EFVM, Vale**
