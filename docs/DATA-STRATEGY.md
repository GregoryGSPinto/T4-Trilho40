# Estrategia de Dados — T4 Trilho 4.0

## Principios

1. **Local-first:** Dados funcionam 100% offline — essencial para operacao ferroviaria em trechos sem cobertura de rede
2. **Sync-ready:** Estrutura preparada para sincronizacao — sync queue ja implementada em `shared/js/t4-storage.js`
3. **Domain-driven:** Dados organizados por dominio de negocio (jornada, seguranca, comunicacao)
4. **Adapter pattern:** Fonte de dados substituivel sem alterar UI — `infrastructure/storage-adapter.js` resolve para localStorage hoje, API REST amanha

---

## Camadas de Dados

### 1. Dados Locais (localStorage)

Prefixo padrao: `t4_` (key-value) ou `t4-{dominio}-{chave}` (registros de dominio).

| Chave | Dominio | Descricao | Sync Futuro |
|-------|---------|-----------|-------------|
| `t4_session` | Identidade | Sessao do usuario logado (userId, nome, matricula, funcao, patio, turno, avatar, loginAt) | Sim — JWT |
| `t4_users` | Identidade | Lista de usuarios demo (matricula, PIN, perfil) | Sim — Azure AD |
| `t4_context` | Shell | Contexto operacional (patio, turno, trem, maquinista) | Sim — perfil |
| `t4_logcco` | Comunicacao | Logs de comunicacao radio do turno atual | Sim — alta prioridade |
| `t4_avisos` | Comunicacao | Avisos operacionais (condicoes da via, patios) | Sim — alta prioridade |
| `t4_lastModule` | Shell | Ultimo modulo acessado | Nao |
| `t4_lastNavigation` | Shell | Timestamp da ultima navegacao | Nao |
| `t4_redirectAfterLogin` | Shell | URL para redirecionar apos login | Nao |
| `t4-jornada-ativa` | Jornada | Jornada em andamento (inicio, ativa, intrajornadas) | Sim — alta prioridade |
| `t4-jornada-historico` | Jornada | Historico de jornadas (max 30 registros) | Sim — media prioridade |
| `t4-boa-jornada-{id}` | Jornada | Formularios de troca de turno preenchidos | Sim — alta prioridade |
| `t4-art-{id}` | Seguranca | Formularios ART preenchidos | Sim — alta prioridade (obrigatorio por lei) |

### 2. Dados Complexos (IndexedDB)

Banco: `t4_trilho40` (versao 1). Todos os stores possuem `keyPath: 'id'` e indices `timestamp` e `type`.

| Store | Modulo | Uso | Volume Estimado |
|-------|--------|-----|-----------------|
| `efvm360_simulations` | EFVM 360 | Simulacoes de conducao salvas | Baixo (~50 registros) |
| `efvm360_scores` | EFVM 360 | Pontuacoes e rankings | Baixo (~100 registros) |
| `ccq_projects` | CCQ | Projetos de qualidade (PDCA, Ishikawa, 5W2H) | Baixo (~20 registros) |
| `ccq_charts` | CCQ | Graficos e diagramas gerados | Baixo (~50 registros) |
| `rof_articles` | ROF Digital | Artigos do regulamento cacheados | Medio (~500 artigos) |
| `rof_bookmarks` | ROF Digital | Artigos favoritos do usuario | Baixo (~30 registros) |
| `rof_history` | ROF Digital | Historico de buscas e consultas | Baixo (~100 registros) |
| `adamboot_conversations` | AdamBoot | Historico de conversas com a IA | Medio (~200 conversas) |
| `adamboot_knowledge` | AdamBoot | Base de conhecimento cacheada (FAQ, glossario) | Medio (~300 entradas) |
| `hub_preferences` | Hub | Preferencias do hub (layout, favoritos) | Baixo (~10 registros) |
| `sync_queue` | Infraestrutura | Fila de acoes pendentes para sincronizacao | Variavel |

### 3. Dados Estaticos (JSON)

Arquivos JSON carregados como assets e cacheados pelo Service Worker:

| Arquivo | Modulo | Conteudo |
|---------|--------|----------|
| `modules/rof-digital/data/rof-articles.json` | ROF Digital | Artigos do regulamento ferroviario |
| `modules/rof-digital/data/rof-keywords.json` | ROF Digital | Palavras-chave para busca |
| `modules/rof-digital/data/rof-categories.json` | ROF Digital | Categorias de artigos |
| `modules/adamboot/data/adamboot-faq.json` | AdamBoot | Perguntas frequentes |
| `modules/adamboot/data/adamboot-glossary.json` | AdamBoot | Glossario ferroviario |
| `modules/adamboot/data/adamboot-prompts.json` | AdamBoot | Templates de prompts IA |
| `modules/efvm360/data/efvm-track-profile.json` | EFVM 360 | Perfil da via (km, gradientes) |
| `modules/efvm360/data/efvm-stations.json` | EFVM 360 | Estacoes da EFVM |
| `modules/efvm360/data/efvm-restrictions.json` | EFVM 360 | Restricoes de velocidade por trecho |
| `modules/ccq/data/ccq-templates.json` | CCQ | Templates de projetos CCQ |

### 4. Dados de Integracao Externa

Configurados em `integrations/integration-config.json`. Comunicacao via `window.open()` com `noopener,noreferrer`.

| Integracao | URL | Troca de Dados |
|------------|-----|----------------|
| OPTIMA Work AI | `https://optima-work-ai.vercel.app` | Query params (matricula, patio, turno) |
| VFZ Passagem de Servico | `https://vfz-passagem-servico.vercel.app` | Query params (maquinista, matricula, patio, turno, trem) |
| Simulador EFVM | `https://simulador-efvm.vercel.app/` | Nenhuma |
| EFVM 360 | `https://efvm360.vercel.app/login/` | Nenhuma |
| IRIS | `https://iris.valeglobal.net/login` | Nenhuma |
| VES | SuccessFactors URL | Nenhuma |
| Prontidao | `https://vale.sistemaprontos.com.br/` | Nenhuma |
| eDados | Portal RH Vale | Nenhuma |
| Solicitar EPI | Formulario Vale Forms | Nenhuma |

---

## Candidatos a Banco Relacional (MySQL / Azure SQL Futuro)

### Prioridade Alta — Dados Transacionais Criticos

| Tabela | Dominio | Origem Atual | Justificativa |
|--------|---------|-------------|---------------|
| `usuarios` | Identidade | `t4_users` (localStorage) | Substituir credenciais demo por Azure AD |
| `perfis` | Identidade | `t4_session` (localStorage) | Funcao, patio, turno — dados corporativos |
| `permissoes` | Identidade | Inexistente | RBAC necessario para producao |
| `jornadas` | Jornada | `t4-jornada-ativa`, `t4-jornada-historico` | Dados regulatorios (limite 12h por lei) |
| `boa_jornada` | Jornada | `t4-boa-jornada-{id}` | Handover de turno — rastreabilidade operacional |
| `art_formularios` | Seguranca | `t4-art-{id}` | Obrigatorio por NR (Norma Regulamentadora) |
| `log_cco` | Comunicacao | `t4_logcco` | Registro de comunicacoes radio — auditoria |
| `avisos_operacionais` | Comunicacao | `t4_avisos` | Condicoes da via em tempo real |

### Prioridade Media — Dados de Suporte

| Tabela | Dominio | Origem Atual | Justificativa |
|--------|---------|-------------|---------------|
| `jornada_historico` | Jornada | `t4-jornada-historico` | Analytics de horas trabalhadas |
| `favoritos_rof` | Conhecimento | IDB `rof_bookmarks` | Compartilhar entre dispositivos |
| `preferencias_usuario` | Shell | `t4_context`, IDB `hub_preferences` | Sync entre dispositivos |
| `trilha_auditoria` | Transversal | IDB `sync_queue` | Compliance e rastreabilidade |

### Nao-Relacional / Externo

| Dado | Tecnologia Sugerida | Justificativa |
|------|--------------------|--------------  |
| Artigos ROF | ElasticSearch ou Azure Cognitive Search | Busca full-text com relevancia |
| Conversas AdamBoot | CosmosDB ou Blob Storage | Dados semi-estruturados, alto volume |
| Glossario ferroviario | JSON estático ou Redis | Leitura frequente, escrita rara |
| Scores simulador | Azure Table Storage | Dados tabulares simples, analytics |
| Cache de assets | Azure CDN + Blob Storage | Distribuicao global de conteudo |
| Telemetria | Azure Application Insights | Metricas, logs, traces |

---

## Estrategia de Migracao

### Fase 1 — Atual (Local-Only)

```
Modulo → Domain Service → localStorage / IndexedDB
                          (sem rede, sem backend)
```

- Todos os dados persistem no navegador do usuario
- Sem sincronizacao entre dispositivos
- Perda de dados ao limpar cache do navegador
- Adequado para demo e prototipo

### Fase 2 — API REST por Dominio + Sync Queue

```
Modulo → Domain Service → Storage Adapter → API REST /api/v1/{dominio}
                                           ↓ (offline)
                                           Sync Queue (IndexedDB)
                                           ↓ (online)
                                           API REST (retry)
```

- Adapter detecta conectividade via `T4.utils.isOnline()`
- Online: chamadas REST diretas com fallback local
- Offline: grava em `sync_queue` (ja implementado) e processa ao reconectar
- Endpoints por dominio: `/api/v1/jornada`, `/api/v1/seguranca`, `/api/v1/comunicacao`

### Fase 3 — Banco Relacional para Dados Transacionais

```
API REST → Servico de Dominio (backend) → MySQL / Azure SQL
                                         → Azure Blob (anexos)
                                         → ElasticSearch (busca ROF)
```

- MySQL para dados transacionais (jornada, ART, log CCO)
- Azure Blob Storage para fotos e documentos anexados
- ElasticSearch para busca full-text no ROF

### Fase 4 — Event Sourcing para Auditoria

```
API REST → Event Store → Projecoes (Read Models)
                        → Audit Log (imutavel)
                        → Analytics (BI)
```

- Eventos imutaveis para compliance regulatorio
- Projecoes para consultas otimizadas
- Integracao com BI para dashboards gerenciais

---

## Adapter Pattern — Implementacao

O `infrastructure/storage-adapter.js` ja implementa o pattern:

```
UI Layer (modules/*/js/*.js)
  ↓ chama
Domain Service (domain/*.js)
  ↓ usa
T4.data (infrastructure/storage-adapter.js)
  ↓ resolve para
localStorage (hoje) → API REST (futuro)
```

**Interface do adapter (`T4.data`):**

| Metodo | Assinatura | Descricao |
|--------|-----------|-----------|
| `save` | `save(domain, key, data)` | Persiste registro por dominio |
| `get` | `get(domain, key)` | Recupera registro unico |
| `getAll` | `getAll(domain)` | Lista registros de um dominio |
| `remove` | `remove(domain, key)` | Remove registro |
| `kv.get` | `kv.get(key)` | Key-value simples (config, sessao) |
| `kv.set` | `kv.set(key, value)` | Key-value simples |
| `kv.remove` | `kv.remove(key)` | Remove chave simples |
| `kv.has` | `kv.has(key)` | Verifica existencia |

**Convencao de chaves:**
- Registros de dominio: `t4-{dominio}-{chave}` (ex: `t4-art-abc123`)
- Key-value simples: `t4_{chave}` (ex: `t4_session`)

Para migrar para API REST, basta trocar a implementacao interna dos metodos `save`, `get`, `getAll` e `remove` por chamadas `fetch()` — nenhum modulo precisa ser alterado.
