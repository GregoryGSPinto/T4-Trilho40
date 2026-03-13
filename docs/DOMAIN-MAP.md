# Mapa de Dominios — T4 Trilho 4.0

## Visao Geral

O T4 organiza sua logica de negocio em dominios inspirados em Domain-Driven Design (DDD). Cada dominio encapsula responsabilidades especificas da operacao ferroviaria, com services dedicados e preparados para evolucao independente.

---

## Dominios Identificados

### 1. Jornada

- **Responsabilidade:** Controle do turno de trabalho do maquinista, incluindo inicio/fim de jornada, intrajornadas, alertas de limite horario e passagem de turno (handover)
- **Modulos:** Timer Jornada (`timerJornada`), Boa Jornada (`boajornada`)
- **Service:** `domain/jornada-service.js` → `T4.domain.jornada`
- **Dados:**
  - `t4-jornada-ativa` — jornada em andamento (inicio, ativa, intrajornadas)
  - `t4-jornada-historico` — ultimas 30 jornadas concluidas
  - `t4-boa-jornada-{id}` — formularios de handover preenchidos
- **Regras de Negocio:**
  - Fases de alerta: normal (< 10h), atencao (10-11h), alerta (11-11.5h), critico (>= 11.5h)
  - Limite legal de 12h por jornada
  - Historico limitado a 30 registros (FIFO)
- **API Futura:** `POST /api/v1/jornada/iniciar`, `PUT /api/v1/jornada/{id}/encerrar`, `GET /api/v1/jornada/historico`, `POST /api/v1/jornada/boa-jornada`

### 2. Seguranca

- **Responsabilidade:** Analise de risco da tarefa (ART) — formulario obrigatorio por Norma Regulamentadora antes de executar qualquer atividade operacional
- **Modulos:** ART (`art`)
- **Service:** `domain/seguranca-service.js` → `T4.domain.seguranca`
- **Dados:**
  - `t4-art-{id}` — formularios ART preenchidos (avaliacao 360 de seguranca, matriz de risco, eventos indesejados)
- **Regras de Negocio:**
  - ART e obrigatoria antes de toda operacao
  - Registro deve ser imutavel apos preenchimento (compliance)
  - Suporta anexo de foto/documento
- **API Futura:** `POST /api/v1/seguranca/art`, `GET /api/v1/seguranca/art/{id}`, `GET /api/v1/seguranca/art?turno={turno}`

### 3. Comunicacao

- **Responsabilidade:** Registro de comunicacoes operacionais via radio com o CCO (Centro de Controle Operacional) e gestao de avisos entre maquinistas
- **Modulos:** Log CCO (`logCco`), Avisos Operacionais (`avisos`)
- **Service:** `domain/comunicacao-service.js` → `T4.domain.comunicacao`
- **Dados:**
  - `t4_logcco` — logs de comunicacao do turno (id, hora, direcao, categoria, descricao)
  - `t4_avisos` — avisos operacionais (id, texto, lido, timestamp)
- **Regras de Negocio:**
  - Logs ordenados por mais recente (prepend)
  - Avisos possuem status lido/nao-lido
  - Timestamp automatico em cada registro
  - Suporte a exportacao do log do turno
- **API Futura:** `POST /api/v1/comunicacao/log`, `GET /api/v1/comunicacao/log?turno={turno}`, `POST /api/v1/comunicacao/aviso`, `PUT /api/v1/comunicacao/aviso/{id}/lido`

### 4. Operacional

- **Responsabilidade:** Ferramentas de apoio ao contexto operacional diario do maquinista — contatos de emergencia, calculadora de formulas ferroviarias
- **Modulos:** Contatos (`contatos`), Calculadora (`calculadora`)
- **Service:** (futuro) `domain/operacional-service.js` → `T4.domain.operacional`
- **Dados:**
  - Contatos operacionais (CCO, lider, manutencao, emergencia, colegas)
  - Calculos efemeros (sem persistencia — peso/eixo, frenagem, 10psi, gradiente compensado)
- **Regras de Negocio:**
  - Contatos acessiveis com 1 toque (click-to-call)
  - Formulas especificas da operacao ferroviaria EFVM
- **API Futura:** `GET /api/v1/operacional/contatos?patio={patio}`, `GET /api/v1/operacional/formulas`

### 5. Conhecimento

- **Responsabilidade:** Base de conhecimento ferroviario — regulamento operacional, assistente IA, glossario tecnico
- **Modulos:** ROF Digital (`rof-digital`), AdamBoot IA (`adamboot`)
- **Service:** (futuro) `domain/conhecimento-service.js` → `T4.domain.conhecimento`
- **Dados:**
  - IndexedDB: `rof_articles`, `rof_bookmarks`, `rof_history`
  - IndexedDB: `adamboot_conversations`, `adamboot_knowledge`
  - JSON estatico: `rof-articles.json`, `rof-keywords.json`, `rof-categories.json`
  - JSON estatico: `adamboot-faq.json`, `adamboot-glossary.json`, `adamboot-prompts.json`
- **Regras de Negocio:**
  - ROF: busca full-text com filtro por km, trecho e categoria
  - ROF: quiz interativo por artigo
  - AdamBoot: chat com contexto operacional integrado (patio, turno, trem)
  - AdamBoot: controle por voz (Web Speech API)
  - AdamBoot: personalidade configuravel
- **API Futura:** `GET /api/v1/conhecimento/rof/busca?q={termo}`, `POST /api/v1/conhecimento/adamboot/chat`, `GET /api/v1/conhecimento/glossario`

### 6. Treinamento

- **Responsabilidade:** Capacitacao e avaliacao do maquinista — simulacao de conducao, cenarios operacionais, projetos de melhoria continua
- **Modulos:** EFVM 360 (interno — `efvm360`), Simulador EFVM (externo — `simulador`), CCQ (externo — `ccq`)
- **Service:** (futuro) `domain/treinamento-service.js` → `T4.domain.treinamento`
- **Dados:**
  - IndexedDB: `efvm360_simulations`, `efvm360_scores`
  - IndexedDB: `ccq_projects`, `ccq_charts`
  - JSON estatico: `efvm-track-profile.json`, `efvm-stations.json`, `efvm-restrictions.json`
  - JSON estatico: `ccq-templates.json`
- **Regras de Negocio:**
  - Simulador: fisica de frenagem, cenarios de trem carregado/vazio, sistema de pontuacao
  - Simulador: HUD com velocimetro, pressao, distancia
  - CCQ: ciclo PDCA, Ishikawa, 5W2H, Pareto, timeline de projetos
- **API Futura:** `POST /api/v1/treinamento/simulacao`, `GET /api/v1/treinamento/scores`, `POST /api/v1/treinamento/ccq/projeto`

### 7. Identidade

- **Responsabilidade:** Autenticacao, sessao, perfil do usuario e gerenciamento de contexto operacional
- **Service:** `shared/js/t4-auth.js` → `T4.auth`
- **Dados:**
  - `t4_session` — sessao ativa (userId, nome, matricula, funcao, patio, turno, avatar, loginAt)
  - `t4_users` — lista de usuarios demo
  - `t4_context` — contexto operacional (patio, turno, trem, maquinista)
- **Regras de Negocio:**
  - Login via matricula (4 digitos) + PIN (4 digitos)
  - Sessao persistida em localStorage (sem expiracao atualmente)
  - Patio e trem atualizaveis em runtime
  - Turno calculado automaticamente por horario (A: 6-14h, B: 14-22h, C: 22-6h)
- **API Futura:** `POST /api/v1/auth/login` (SSO Azure AD), `POST /api/v1/auth/logout`, `GET /api/v1/auth/perfil`, `PUT /api/v1/auth/contexto`

### 8. Shell (Core)

- **Responsabilidade:** Navegacao, busca, alertas, configuracao — orquestracao do ecossistema
- **Modulos:** Hub (dashboard principal)
- **Service:** `shell/module-registry.js` → `T4Shell`, `shared/js/t4-router.js` → `T4.router`
- **Dados:**
  - `T4Shell.MODULE_DATA` — catalogo de 22 modulos com metadados
  - `T4Shell.SEARCH_INDEX` — indice de busca com 40+ termos
  - `T4Shell.MODULE_CATEGORIES` — classificacao dos modulos
  - `t4_lastModule`, `t4_lastNavigation` — estado de navegacao
- **Regras de Negocio:**
  - Modulos internos abrem dentro do shell (SPA navigation)
  - Modulos externos abrem em nova aba com `noopener,noreferrer`
  - Busca unificada por modulos, glossario, artigos ROF e navegacao
  - Deteccao automatica de base path para deploy flexivel

---

## Diagrama de Dependencias entre Dominios

```
                    ┌─────────────┐
                    │  Identidade │
                    │  (T4.auth)  │
                    └──────┬──────┘
                           │ depende de
              ┌────────────┼────────────────┐
              │            │                │
              ▼            ▼                ▼
       ┌──────────┐ ┌──────────┐    ┌──────────────┐
       │ Jornada  │ │Seguranca │    │ Comunicacao   │
       │          │ │  (ART)   │    │ (Log/Avisos)  │
       └────┬─────┘ └──────────┘    └──────────────┘
            │
            │ usa dados de
            ▼
     ┌──────────────┐
     │  Operacional │
     │ (Contatos,   │
     │  Calculadora)│
     └──────────────┘

       ┌──────────────┐    ┌──────────────┐
       │ Conhecimento │    │ Treinamento  │
       │ (ROF,        │    │ (Simulador,  │
       │  AdamBoot)   │    │  CCQ)        │
       └──────────────┘    └──────────────┘
              │                    │
              └────────┬───────────┘
                       │ independentes
                       ▼
                ┌──────────────┐
                │    Shell     │
                │   (Core)    │
                │ Orquestra   │
                │ todos       │
                └──────────────┘
```

**Regras de dependencia:**
- **Shell** depende de **Identidade** (requer login)
- **Jornada**, **Seguranca** e **Comunicacao** dependem de **Identidade** (contexto do usuario)
- **Conhecimento** e **Treinamento** sao independentes (funcionam sem login em modo local)
- **Operacional** consome dados de **Jornada** (contexto do turno) quando disponivel
- Nenhum dominio depende diretamente de outro dominio de negocio — acoplamento via contexto compartilhado (`T4.context`)

---

## Fronteiras de API Futuras

| Dominio | Base Path | Endpoints Principais | Autenticacao |
|---------|-----------|---------------------|-------------|
| Identidade | `/api/v1/auth` | `POST /login`, `POST /logout`, `GET /perfil`, `PUT /contexto` | Azure AD SSO |
| Jornada | `/api/v1/jornada` | `POST /iniciar`, `PUT /{id}/encerrar`, `GET /historico`, `POST /boa-jornada` | JWT Bearer |
| Seguranca | `/api/v1/seguranca` | `POST /art`, `GET /art/{id}`, `GET /art?turno={t}` | JWT Bearer |
| Comunicacao | `/api/v1/comunicacao` | `POST /log`, `GET /log?turno={t}`, `POST /aviso`, `PUT /aviso/{id}/lido` | JWT Bearer |
| Operacional | `/api/v1/operacional` | `GET /contatos?patio={p}`, `GET /formulas` | JWT Bearer |
| Conhecimento | `/api/v1/conhecimento` | `GET /rof/busca?q={q}`, `POST /adamboot/chat`, `GET /glossario` | JWT Bearer |
| Treinamento | `/api/v1/treinamento` | `POST /simulacao`, `GET /scores`, `POST /ccq/projeto` | JWT Bearer |

### Versionamento de API

- Todas as APIs usam prefixo `/api/v1/` para versionamento explicito
- Quebras de contrato exigem nova versao (`/api/v2/`)
- Deprecacao com header `Sunset` e prazo minimo de 6 meses

### Formato de Resposta Padrao

```json
{
  "success": true,
  "data": { },
  "meta": {
    "timestamp": "2026-03-13T12:00:00Z",
    "requestId": "uuid"
  }
}
```

### Formato de Erro Padrao

```json
{
  "success": false,
  "error": {
    "code": "JORNADA_ATIVA_EXISTENTE",
    "message": "Ja existe uma jornada ativa para este maquinista",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-03-13T12:00:00Z",
    "requestId": "uuid"
  }
}
```
