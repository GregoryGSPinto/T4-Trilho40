# Prontidao para Azure — T4 Trilho 4.0

## Resumo Executivo

O T4 Trilho 4.0 foi arquitetado com separacao de camadas (UI, dominio, infraestrutura) e adapter pattern, o que permite migracao incremental para Azure sem reescrever modulos existentes. Este documento mapeia cada servico Azure relevante, o estado atual de prontidao e as fases de migracao.

---

## 1. Alinhamento Arquitetural

| Camada T4 | Servico Azure | Prontidao | Esforco |
|-----------|--------------|-----------|---------|
| Frontend (PWA) | Azure App Service / Static Web Apps | Alta | Baixo |
| Domain Services | Azure Functions / App Service API | Media | Medio |
| Storage Adapter | Azure SQL Database | Alta | Medio |
| Autenticacao | Azure Active Directory | Media | Medio |
| API Gateway | Azure API Management | Alta | Baixo |
| Conteudo estatico | Azure Blob Storage + CDN | Alta | Baixo |
| Busca (ROF) | Azure Cognitive Search | Media | Medio |
| Observabilidade | Azure Monitor + Application Insights | Alta | Baixo |
| Service Worker | N/A (client-side) | N/A | Nenhum |
| Background Sync | Azure Service Bus / Event Grid | Media | Medio |

---

## 2. Azure Static Web Apps — Hospedagem do Frontend

### Por que Static Web Apps (e nao App Service)

O T4 e uma PWA composta por HTML, CSS, JS e JSON estaticos — nao requer server-side rendering. Azure Static Web Apps e ideal porque:

- Deploy automatico via GitHub/Azure DevOps
- HTTPS e dominio customizado incluso
- CDN global integrado
- Staging environments por branch
- Serverless API routes (Azure Functions) integradas

### Configuracao Sugerida

```json
{
  "routes": [
    { "route": "/api/*", "allowedRoles": ["authenticated"] },
    { "route": "/modules/*", "allowedRoles": ["anonymous"] },
    { "route": "/*", "serve": "/index.html", "statusCode": 200 }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/shared/*", "/modules/*"]
  }
}
```

### Mapeamento de Arquivos

| Diretorio T4 | Deploy Azure | Observacao |
|-------------|-------------|-----------|
| `index.html`, `manifest.json`, `sw.js` | Raiz do Static Web App | Servidos como assets estaticos |
| `shared/` | `/shared/` | CSS, JS, icones — cacheados pelo CDN |
| `modules/` | `/modules/` | Cada modulo como subdiretorio |
| `integrations/` | `/integrations/` | Configs de integracao |
| `shell/`, `domain/`, `infrastructure/` | `/shell/`, `/domain/`, `/infrastructure/` | JS client-side |

---

## 3. Azure SQL Database — Migracao de Dados

### De localStorage/IndexedDB para Azure SQL

| Dado Atual | Tabela Azure SQL | Tipo | Justificativa |
|-----------|-----------------|------|---------------|
| `t4-jornada-ativa` | `jornadas` | Transacional | Dados regulatorios — limite 12h |
| `t4-jornada-historico` | `jornada_historico` | Transacional | Auditoria de horas trabalhadas |
| `t4-boa-jornada-{id}` | `boa_jornada` | Transacional | Rastreabilidade de handover |
| `t4-art-{id}` | `art_formularios` | Transacional | Obrigatorio por NR — retencao legal |
| `t4_logcco` | `log_cco` | Transacional | Registro de comunicacoes |
| `t4_avisos` | `avisos_operacionais` | Transacional | Condicoes da via |
| `t4_session` | (gerenciado pelo Azure AD) | Identidade | Substituido por JWT |
| `t4_users` | (gerenciado pelo Azure AD) | Identidade | Substituido por diretorio corporativo |

### Schema Sugerido (MySQL-compatible)

```sql
-- Jornadas
CREATE TABLE jornadas (
    id CHAR(36) PRIMARY KEY,
    maquinista_id VARCHAR(20) NOT NULL,
    inicio DATETIME NOT NULL,
    fim DATETIME NULL,
    patio VARCHAR(10) NOT NULL,
    turno CHAR(1) NOT NULL,
    status ENUM('ativa', 'encerrada', 'excedida') DEFAULT 'ativa',
    intrajornadas JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_maquinista (maquinista_id),
    INDEX idx_status (status)
);

-- ART (Analise de Risco)
CREATE TABLE art_formularios (
    id CHAR(36) PRIMARY KEY,
    maquinista_id VARCHAR(20) NOT NULL,
    jornada_id CHAR(36),
    dados JSON NOT NULL,
    anexos JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jornada_id) REFERENCES jornadas(id)
);

-- Log CCO
CREATE TABLE log_cco (
    id CHAR(36) PRIMARY KEY,
    maquinista_id VARCHAR(20) NOT NULL,
    jornada_id CHAR(36),
    hora DATETIME NOT NULL,
    direcao ENUM('enviado', 'recebido') NOT NULL,
    categoria VARCHAR(50),
    descricao TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jornada_id) REFERENCES jornadas(id),
    INDEX idx_jornada (jornada_id)
);

-- Avisos Operacionais
CREATE TABLE avisos_operacionais (
    id CHAR(36) PRIMARY KEY,
    autor_id VARCHAR(20) NOT NULL,
    texto TEXT NOT NULL,
    tipo VARCHAR(30),
    km_referencia DECIMAL(6,1),
    trecho VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trecho (trecho),
    INDEX idx_ativo (ativo)
);

-- Boa Jornada (Handover)
CREATE TABLE boa_jornada (
    id CHAR(36) PRIMARY KEY,
    maquinista_saindo_id VARCHAR(20) NOT NULL,
    maquinista_entrando_id VARCHAR(20),
    jornada_id CHAR(36),
    dados JSON NOT NULL,
    anexos JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jornada_id) REFERENCES jornadas(id)
);
```

### Tier Recomendado

| Ambiente | Tier Azure SQL | vCores | Storage | Custo Estimado |
|----------|---------------|--------|---------|---------------|
| Desenvolvimento | Basic (DTU) | — | 2 GB | ~R$ 25/mes |
| Homologacao | Standard S1 | — | 250 GB | ~R$ 75/mes |
| Producao | General Purpose | 2 vCores | 32 GB | ~R$ 500/mes |

---

## 4. Azure Active Directory — SSO

### Integracao com T4.auth

O modulo `shared/js/t4-auth.js` ja expoe a interface necessaria:

| Metodo T4 | Mapeamento Azure AD |
|-----------|-------------------|
| `T4.auth.login(matricula, pin)` | Substituir por redirect para Azure AD |
| `T4.auth.getUser()` | Decodificar `id_token` JWT |
| `T4.auth.isAuthenticated()` | Verificar validade do `access_token` |
| `T4.auth.logout()` | Chamar endpoint de logout do Azure AD |
| `T4.auth.getSession()` | Ler claims do JWT |

### Configuracao do App Registration

| Parametro | Valor |
|-----------|-------|
| Application Type | Single Page Application (SPA) |
| Redirect URIs | `https://t4.vale.com/`, `https://t4.vale.com/auth/callback` |
| API Permissions | `User.Read`, `openid`, `profile`, `email` |
| Token Configuration | Access token (v2), ID token, Groups claim |
| Supported Account Types | Single tenant (Vale) |

### Grupos e Roles

| Grupo Azure AD | Role T4 | Permissoes |
|----------------|---------|-----------|
| `T4-Maquinistas` | maquinista | Acesso a todos os modulos, CRUD nos proprios dados |
| `T4-Lideres` | lider | Tudo de maquinista + ver dados da equipe |
| `T4-Admin` | admin | Tudo + gestao de avisos globais, configuracao |

---

## 5. Azure API Management — Gateway

### Topologia

```
T4 PWA (Browser)
  │
  ▼
Azure API Management (APIM)
  │  - Rate limiting
  │  - JWT validation
  │  - Request logging
  │  - CORS
  │
  ├──▶ /api/v1/jornada/*    → Azure Function (Jornada)
  ├──▶ /api/v1/seguranca/*  → Azure Function (Seguranca)
  ├──▶ /api/v1/comunicacao/* → Azure Function (Comunicacao)
  ├──▶ /api/v1/operacional/* → Azure Function (Operacional)
  ├──▶ /api/v1/conhecimento/*→ Azure Function (Conhecimento)
  ├──▶ /api/v1/treinamento/* → Azure Function (Treinamento)
  └──▶ /api/v1/auth/*       → Azure AD (passthrough)
```

### Politicas APIM

| Politica | Configuracao |
|----------|-------------|
| Rate Limiting | 100 req/min por usuario |
| JWT Validation | Validar `access_token` do Azure AD |
| CORS | `Origin: https://t4.vale.com` |
| Response Caching | 5 min para dados de contatos e formulas |
| IP Filtering | Rede corporativa Vale (producao) |

---

## 6. Azure Blob Storage — Conteudo Estatico

### Uso Proposto

| Tipo de Conteudo | Container Blob | Acesso |
|-----------------|---------------|--------|
| Fotos anexadas (ART, Boa Jornada) | `t4-anexos` | Privado (SAS token) |
| Dados ROF (artigos JSON) | `t4-rof-data` | Publico (CDN) |
| Dados EFVM (estacoes, perfil via) | `t4-efvm-data` | Publico (CDN) |
| Templates CCQ | `t4-ccq-templates` | Publico (CDN) |
| Backups de dados | `t4-backups` | Privado |

### CDN

- Azure CDN perfil Standard da Microsoft
- Custom domain: `cdn.t4.vale.com`
- Cache rules: 24h para JSON estatico, 7d para CSS/JS/imagens
- Purge automatico no deploy

---

## 7. Azure Cognitive Search — Busca no ROF

### Por que Cognitive Search (e nao full-text no SQL)

O ROF Digital possui busca por linguagem natural com IA. Azure Cognitive Search oferece:

- Busca full-text com relevancia (BM25)
- Busca semantica (com Azure OpenAI)
- Filtros por km, trecho, categoria
- Sugestoes e autocomplete
- Sinonimos configurados

### Indice Proposto

| Campo | Tipo | Searchable | Filterable | Facetable |
|-------|------|-----------|-----------|----------|
| `id` | string | - | Sim | - |
| `titulo` | string | Sim | - | - |
| `conteudo` | string | Sim | - | - |
| `categoria` | string | Sim | Sim | Sim |
| `km_inicio` | decimal | - | Sim | - |
| `km_fim` | decimal | - | Sim | - |
| `trecho` | string | Sim | Sim | Sim |
| `palavras_chave` | string[] | Sim | Sim | Sim |

---

## 8. Azure Monitor — Observabilidade

### Application Insights

| Telemetria | Origem | Configuracao |
|-----------|--------|-------------|
| Page Views | T4 PWA | Auto-collect via SDK JS |
| Custom Events | `T4.events.emit()` | `appInsights.trackEvent()` |
| Exceptions | `try/catch` em storage/auth | `appInsights.trackException()` |
| Dependencies | API calls (futuro) | Auto-collect |
| User Sessions | `T4.auth.getSession()` | Custom dimension |
| Availability | Ping test | Azure Monitor |

### Metricas Customizadas

| Metrica | Descricao | Uso |
|---------|-----------|-----|
| `jornada.duracao` | Duracao da jornada em horas | Alertas de jornada excedida |
| `modulo.acessos` | Acessos por modulo | Priorizacao de desenvolvimento |
| `offline.tempo` | Tempo offline por sessao | SLA de conectividade |
| `sync.pendentes` | Itens na sync queue | Saude da sincronizacao |
| `art.preenchimentos` | ARTs preenchidas por turno | Compliance |

### Alertas

| Alerta | Condicao | Acao |
|--------|---------|------|
| Jornada excedida | `jornada.duracao > 12` | Email para lider + registro |
| Sync queue acumulada | `sync.pendentes > 50` | Investigar conectividade |
| Erro de autenticacao em massa | `auth.failures > 10 em 5min` | Alerta de seguranca |
| Modulo indisponivel | Availability < 99% | Notificar equipe |

---

## 9. Fases de Migracao

### Fase 0 — Atual (Local-Only)

```
Status: CONCLUIDO
Deploy: Vercel (gratuito)
Backend: Nenhum
Dados: localStorage + IndexedDB
Auth: Demo (matricula + PIN)
```

### Fase 1 — Hospedagem Azure (2-4 semanas)

```
Objetivo: Mover frontend para infraestrutura corporativa
Servicos: Azure Static Web Apps, Azure CDN
Mudancas no codigo: Nenhuma
Custo: ~R$ 50/mes

Tarefas:
□ Criar Azure Static Web App
□ Configurar CI/CD (GitHub Actions → Azure)
□ Configurar dominio customizado (t4.vale.com)
□ Configurar HTTPS com certificado corporativo
□ Validar Service Worker no novo dominio
□ Testar offline mode
```

### Fase 2 — Autenticacao Corporativa (4-6 semanas)

```
Objetivo: Substituir login demo por SSO Azure AD
Servicos: Azure AD, MSAL.js
Mudancas no codigo: shared/js/t4-auth.js
Custo: Incluso na licenca Microsoft 365

Tarefas:
□ Criar App Registration no Azure AD
□ Integrar MSAL.js no t4-auth.js
□ Mapear grupos AD para roles T4
□ Remover DEFAULT_USERS
□ Implementar logout + token refresh
□ Testar com usuarios reais (piloto)
```

### Fase 3 — API Backend (8-12 semanas)

```
Objetivo: Backend para dados transacionais criticos
Servicos: Azure Functions, Azure SQL, API Management
Mudancas no codigo: infrastructure/storage-adapter.js
Custo: ~R$ 800/mes

Tarefas:
□ Criar Azure SQL Database + schema
□ Implementar Azure Functions por dominio
□ Configurar API Management (gateway)
□ Atualizar storage-adapter.js para chamar APIs
□ Implementar sync queue → API (online/offline)
□ Migrar dados de jornada, ART, log CCO
□ Testes de carga e resiliencia offline
```

### Fase 4 — Observabilidade e Busca (4-6 semanas)

```
Objetivo: Monitoramento e busca inteligente
Servicos: Application Insights, Cognitive Search, Azure OpenAI (opcional)
Mudancas no codigo: Adicionar SDK telemetria, atualizar ROF search
Custo: ~R$ 300/mes

Tarefas:
□ Integrar Application Insights SDK
□ Configurar metricas e alertas customizados
□ Criar indice Cognitive Search para ROF
□ Migrar busca do ROF Digital para Azure Search
□ Dashboard de analytics no Azure Portal
□ (Opcional) Integrar Azure OpenAI para AdamBoot
```

### Fase 5 — Escala e Producao (4-6 semanas)

```
Objetivo: Hardening para uso em escala
Servicos: Azure Front Door, Azure Key Vault, Azure DevOps
Custo: ~R$ 1.500/mes (estimativa para 500 usuarios)

Tarefas:
□ Azure Front Door para WAF e DDoS protection
□ Azure Key Vault para secrets (connection strings, API keys)
□ Pipeline CI/CD completo (build, test, staging, producao)
□ Penetration testing
□ Documentacao de runbook operacional
□ Treinamento da equipe de suporte
□ Go-live com rollout gradual (piloto → geral)
```

---

## 10. Estimativa de Custos Azure (Producao — 500 usuarios)

| Servico | Tier | Custo Mensal (R$) |
|---------|------|------------------|
| Static Web Apps | Standard | 50 |
| Azure SQL | General Purpose (2 vCores) | 500 |
| Azure Functions | Consumption | 100 |
| API Management | Developer | 250 |
| Blob Storage + CDN | Standard | 50 |
| Application Insights | Pay-as-you-go | 100 |
| Cognitive Search | Basic | 150 |
| Azure AD | Incluso no M365 | 0 |
| **Total estimado** | | **~R$ 1.200/mes** |

*Valores estimados em marco/2026. Custos reais dependem de volume de uso e acordos corporativos Vale com Microsoft.*
