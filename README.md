# T4 — Trilho 4.0

**Ecossistema digital de missao critica para maquinistas da EFVM (Estrada de Ferro Vitoria a Minas).**

Plataforma mobile-first tipo cockpit operacional, onde cada modulo atende uma etapa real da jornada ferroviaria — da convocacao ao encerramento do turno.

---

## Visao do Produto

O T4 nao e uma colecao de apps. E o **sistema operacional do maquinista**.

Toda a experiencia gira em torno da jornada operacional real:

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

## Modulos

### Operacionais (desenvolvidos no T4)

| Modulo | Funcao | Status |
|--------|--------|--------|
| **Timer Jornada** | Controle de jornada 12h com alertas em 10h, 11h, 11h30 | Operacional |
| **Log CCO** | Registro de comunicacoes radio com o Centro de Controle | Operacional |
| **Boa Jornada** | Formulario digital de troca de turno com checklist | Operacional |
| **ART** | Analise de Risco da Tarefa — avaliacao 360 de seguranca | Operacional |
| **Calculadora** | 8 calculadoras ferroviarias em tempo real | Operacional |
| **Contatos** | Contatos rapidos — emergencia, CCO, lideres, manutencao | Operacional |
| **Avisos** | Sistema de avisos operacionais entre maquinistas e lideres | Operacional |
| **ROF Digital** | Regulamento de Operacao Ferroviaria com busca inteligente | Operacional |
| **AdamBoot IA** | Assistente de inteligencia artificial ferroviaria | Operacional |
| **Simulador EFVM** | Simulador de conducao com fisica e cenarios reais | Operacional |
| **CCQ** | Circulo de Controle de Qualidade — PDCA, Ishikawa, 5W2H | Operacional |
| **EFVM 360** | Plataforma completa com Academy, Exames e Performance | Operacional |

### Sistemas Corporativos (links externos)

| Sistema | Funcao |
|---------|--------|
| **eDados** | Indicadores e metricas operacionais |
| **VES** | Verificacao de Equipamento de Seguranca |
| **IRIS** | Registro e investigacao de incidentes |
| **Prontidao** | Controle de prontidao da equipagem |
| **Solicitar EPI** | Formulario de solicitacao de EPIs |
| **GDB** | Gestao de Dados |
| **Painel CCO** | Centro de Controle Operacional |
| **Equipfer** | Gestao de equipamentos ferroviarios |
| **Convocacao** | Sistema de convocacao e escala |
| **Central Info** | Portal de comunicados e normas |

---

## Arquitetura

```
T4 Trilho 4.0
├── index.html                  # Hub Central (cockpit operacional)
├── shared/
│   ├── css/
│   │   ├── t4-design-system.css   # Tokens, paleta Vale, tipografia, modo dia/noite
│   │   ├── t4-components.css      # Componentes reutilizaveis, estados de confianca
│   │   └── t4-animations.css      # Keyframes e transicoes
│   └── js/
│       ├── t4-core.js             # Namespace T4, utils, events, DOM, state, context
│       ├── t4-storage.js          # IndexedDB + localStorage com fila de sync
│       ├── t4-router.js           # Navegacao entre modulos
│       ├── t4-auth.js             # Autenticacao (matricula + PIN)
│       └── t4-notifications.js    # Toasts, modais de confirmacao, push
├── modules/
│   ├── hub/                       # Dashboard e acoes rapidas
│   ├── timer-jornada/             # Timer 12h com alertas
│   ├── log-cco/                   # Log de comunicacoes CCO
│   ├── boa-jornada/               # Troca de turno
│   ├── art/                       # Analise de risco
│   ├── calculadora/               # Calculadoras ferroviarias
│   ├── contatos/                  # Contatos rapidos
│   ├── avisos/                    # Avisos operacionais
│   ├── rof-digital/               # ROF Digital + Quiz
│   ├── adamboot/                  # IA ferroviaria
│   ├── efvm360/                   # Simulador
│   └── ccq/                       # Qualidade
├── service-worker.js              # Cache offline (network-first + cache-first)
├── manifest.json                  # PWA manifest
└── integrations/                  # Configs de apps externos
```

### Stack

- **Frontend:** HTML5 + CSS3 + JavaScript vanilla (sem frameworks)
- **Persistencia:** localStorage + IndexedDB (via T4.storage)
- **Offline:** Service Worker com cache-first para assets, network-first para dados
- **PWA:** Manifest, icons, standalone display, portrait orientation
- **Design System:** Paleta Vale (teal, green, cyan, gold), Outfit + JetBrains Mono
- **Tema:** Modo dia/noite automatico (prefers-color-scheme)

### Padrao de Modulo

Cada modulo segue a estrutura:
```
modules/{nome}/
├── index.html          # Pagina standalone com imports do design system
├── css/{nome}.css      # Estilos com prefixo unico ({prefixo}-)
└── js/{nome}-app.js    # IIFE com toda a logica do modulo
```

### Persistencia

| Camada | Uso | Exemplos |
|--------|-----|----------|
| `T4.storage.local` | Preferencias, sessao, config | `t4_session`, `t4_context` |
| `localStorage` direto | Dados de modulo | `t4-jornada-ativa`, `t4-log-cco` |
| `IndexedDB` | Dados complexos | `efvm360_scores`, `ccq_projects` |
| `Sync Queue` | Acoes offline | `sync_queue` store |

### Seguranca

- Autenticacao por matricula + PIN (demo; backend em producao)
- Sessao persistida em localStorage (`t4_session`)
- XSS: sanitizacao via `T4.utils.escapeHTML()`
- Links externos: `noopener,noreferrer`
- Sem API keys ou secrets no frontend

---

## Como Executar

```bash
npx serve . -p 3000
```

Acesse `http://localhost:3000`

**Login demo:** Matricula `0001` / PIN `1234`

---

## Jornada Operacional Mapeada

```
CONVOCACAO → PRONTIDAO → CHEGADA AO PATIO
    ↓
PREPARACAO (ART + VES + Boa Jornada)
    ↓
INICIO DA JORNADA (Timer Jornada → Start)
    ↓
CONDUCAO (Log CCO + Calculadora + Contatos + Avisos)
    ↓
INTRAJORNADA (Timer → Pausa)
    ↓
RETORNO A CONDUCAO
    ↓
ALERTAS DE JORNADA (10h → 11h → 11h30 → 12h)
    ↓
ENCERRAMENTO (Timer → Stop + Boa Jornada)
```

---

## Proximos Passos

1. **Backend real** — Substituir autenticacao demo por integracao com SSO Vale
2. **Sincronizacao** — Conectar fila offline com API REST
3. **Notificacoes push** — Integrar com servico de push para alertas de BOLL
4. **Telemetria** — Metricas de uso anonimizadas para evolucao do produto
5. **Testes** — Suite de testes E2E com Playwright
6. **CI/CD** — Pipeline de deploy automatizado

---

**Desenvolvido por Gregory Pinto — Maquinista Senior EFVM, Vale**
