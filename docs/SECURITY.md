# Postura de Seguranca — T4 Trilho 4.0

## Contexto

O T4 Trilho 4.0 e uma PWA utilizada por maquinistas da EFVM em ambiente operacional ferroviario. Atualmente opera em modo demonstracao (demo) com dados locais. Este documento detalha a postura de seguranca atual, riscos identificados e o caminho para hardening de producao.

---

## 1. Modelo de Autenticacao

### Implementacao Atual

| Aspecto | Detalhe |
|---------|---------|
| **Mecanismo** | Matricula (4 digitos) + PIN (4 digitos) |
| **Armazenamento de credenciais** | Hardcoded em `shared/js/t4-auth.js` → `DEFAULT_USERS` |
| **Sessao** | Objeto JSON em `localStorage` (chave `t4_session`) |
| **Expiracao** | Nenhuma — sessao persiste indefinidamente |
| **Arquivo** | `shared/js/t4-auth.js` |

### Credenciais Demo

| Matricula | PIN | Nome | Funcao |
|-----------|-----|------|--------|
| 0001 | 1234 | Gregory | Maquinista Senior |
| 0002 | 5678 | Carlos Silva | Maquinista |
| 0003 | 9012 | Roberto Santos | Maquinista Auxiliar |

**Risco:** Em producao, credenciais hardcoded devem ser completamente removidas. A lista `DEFAULT_USERS` e o mecanismo de login local servem exclusivamente para demonstracao.

### Evolucao para Producao

1. Remover `DEFAULT_USERS` e login local
2. Integrar Azure AD via OAuth 2.0 / OpenID Connect
3. Token JWT com expiracao (ex: 8h alinhado ao turno)
4. Refresh token com rotacao
5. Sessao em cookie `httpOnly`, `Secure`, `SameSite=Strict`

---

## 2. Isolamento do Modo Demo

O modo demo e isolado por design:

| Componente | Isolamento |
|------------|-----------|
| Credenciais | Definidas apenas em `t4-auth.js`, nao espalhadas pelo codigo |
| Dados | Todos em `localStorage`/`IndexedDB` do navegador — nao ha transmissao de rede |
| Sessao | Objeto local sem token — nao serve para autenticacao em APIs |
| Integracao | Links externos abrem sem passar credenciais (exceto query params de contexto) |

**Para ativar producao:** Substituir `T4.auth.login()` por chamada ao endpoint SSO. O resto do sistema nao muda — todos os modulos ja usam `T4.auth.isAuthenticated()` e `T4.auth.getUser()` como abstractions.

---

## 3. Analise de Exposicao de Dados

### Dados em localStorage

| Chave | Sensibilidade | Risco | Mitigacao |
|-------|--------------|-------|-----------|
| `t4_session` | Media | Contem nome, matricula, funcao | Mover para cookie httpOnly |
| `t4_users` | Alta (demo) | Contem PINs em texto plano | Remover em producao |
| `t4_context` | Baixa | Patio, turno — dados operacionais | Aceitavel |
| `t4_logcco` | Media | Comunicacoes operacionais | Criptografar em producao |
| `t4-art-*` | Alta | Dados regulatorios de seguranca | Criptografar e sincronizar |
| `t4-jornada-*` | Media | Dados de jornada de trabalho | Sincronizar com backend |

### Superficie de Ataque

| Vetor | Status | Detalhe |
|-------|--------|---------|
| XSS (Cross-Site Scripting) | Mitigado | `T4.utils.escapeHTML()` usado em output dinamico |
| CSRF | N/A | Sem backend — sem requisicoes autenticadas |
| Injecao de dados | Baixo | `JSON.parse` com try/catch em todo acesso a storage |
| Man-in-the-middle | Mitigado | HTTPS obrigatorio (Vercel/Azure) |
| localStorage tampering | Risco aceito (demo) | Usuario pode alterar dados locais via DevTools |
| Service Worker hijacking | Baixo | SW registrado na mesma origem |

---

## 4. Prevencao de XSS

A funcao `T4.utils.escapeHTML()` (definida em `shared/js/t4-core.js`) e utilizada para sanitizar todo conteudo dinamico antes de insercao no DOM:

```javascript
escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
```

**Pontos de atencao:**
- Toasts e notificacoes usam `escapeHTML()` via `shared/js/t4-notifications.js`
- Modais de confirmacao usam `escapeHTML()` no titulo e mensagem
- Templates de modulos devem seguir o mesmo padrao

**Recomendacao para producao:**
- Implementar Content Security Policy (CSP) via headers HTTP
- CSP sugerida: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.t4.vale.com`
- Desabilitar `eval()` e `inline scripts`

---

## 5. Tratamento de Links Externos

Todos os links externos utilizam `window.open(url, '_blank', 'noopener,noreferrer')`:

| Arquivo | Implementacao |
|---------|-------------|
| `shared/js/t4-router.js` → `openExternal()` | `window.open(url, '_blank', 'noopener,noreferrer')` |
| `integrations/vfz-link.js` → `open()` | `window.open(url, '_blank', 'noopener,noreferrer')` |
| `integrations/optima-link.js` → `open()` | `window.open(url, '_blank', 'noopener,noreferrer')` |

**Protecoes:**
- `noopener`: Impede que a pagina aberta acesse `window.opener` da pagina T4
- `noreferrer`: Nao envia header `Referer` para o destino

**Dados passados via query params para integracoes:**
- VFZ: matricula, nome, patio, turno, trem (dados de contexto, nao credenciais)
- OPTIMA: matricula, patio, turno (dados de contexto)

---

## 6. Politica de Logging e Debug

| Aspecto | Implementacao |
|---------|-------------|
| Logs de inicializacao | Removidos (`T4.init` — "Log de inicializacao removido por seguranca") |
| Erros de storage | Logados via `console.error` sem expor dados (apenas tipo de erro) |
| Erros de IndexedDB | `event.target.errorCode` sem stack trace |
| Service Worker | Logs marcados com `[SW]` para identificacao |

**Recomendacoes para producao:**
- Substituir `console.*` por logger centralizado com niveis (debug/info/warn/error)
- Integrar com Azure Application Insights para telemetria
- Nunca logar dados pessoais (nome, matricula) em ambiente de producao
- Implementar log rotation para logs client-side

---

## 7. Integracao SSO Futura (Azure AD)

### Fluxo Proposto

```
┌─────────┐     ┌──────────┐     ┌──────────────┐
│ T4 PWA  │────>│ Azure AD │────>│ API Gateway  │
│         │<────│  (SSO)   │     │ (validacao)  │
│         │     └──────────┘     └──────────────┘
│         │         │
│         │    Token JWT
│         │    (id_token +
│         │     access_token)
└─────────┘
```

1. Usuario acessa T4 → redirecionado para Azure AD login
2. Azure AD autentica via credenciais corporativas Vale
3. T4 recebe `id_token` (identidade) e `access_token` (autorizacao)
4. `access_token` enviado em header `Authorization: Bearer {token}` para APIs
5. Token armazenado em cookie `httpOnly` (nao em localStorage)
6. Refresh token com rotacao automatica

### Configuracao Azure AD

| Parametro | Valor Sugerido |
|-----------|---------------|
| Grant Type | Authorization Code + PKCE |
| Redirect URI | `https://t4.vale.com/auth/callback` |
| Scopes | `openid profile email api://t4-api/read api://t4-api/write` |
| Token Lifetime | 8 horas (1 turno) |
| MFA | Opcional (dependendo da politica corporativa) |

---

## 8. Recomendacoes para Hardening de Producao

### Prioridade Critica

| # | Recomendacao | Esforco | Impacto |
|---|-------------|---------|---------|
| 1 | Remover credenciais demo (`DEFAULT_USERS`) | Baixo | Alto |
| 2 | Implementar SSO Azure AD | Alto | Alto |
| 3 | Migrar sessao de localStorage para cookie httpOnly | Medio | Alto |
| 4 | Implementar CSP headers | Baixo | Alto |
| 5 | Criptografar dados ART em localStorage (CryptoJS/WebCrypto) | Medio | Alto |

### Prioridade Alta

| # | Recomendacao | Esforco | Impacto |
|---|-------------|---------|---------|
| 6 | Adicionar expiracao de sessao (8h = 1 turno) | Baixo | Medio |
| 7 | Implementar RBAC (maquinista vs. lider vs. admin) | Medio | Medio |
| 8 | Rate limiting no API Gateway | Baixo | Medio |
| 9 | Audit trail para ART e Log CCO | Medio | Alto |
| 10 | Validacao de input server-side (alem do escapeHTML client-side) | Medio | Alto |

### Prioridade Media

| # | Recomendacao | Esforco | Impacto |
|---|-------------|---------|---------|
| 11 | Subresource Integrity (SRI) para CDN assets | Baixo | Baixo |
| 12 | Referrer-Policy header | Baixo | Baixo |
| 13 | X-Content-Type-Options: nosniff | Baixo | Baixo |
| 14 | X-Frame-Options: DENY | Baixo | Baixo |
| 15 | Penetration testing antes do go-live | Alto | Alto |

---

## 9. Conformidade Regulatoria

| Norma | Relevancia | Status |
|-------|-----------|--------|
| LGPD (Lei Geral de Protecao de Dados) | Dados pessoais de maquinistas (nome, matricula) | Pendente — necessita consentimento e politica de privacidade |
| NR (Normas Regulamentadoras) | ART obrigatoria — dados devem ser retidos por prazo legal | Pendente — retencao apenas local |
| ANTT (regulacao ferroviaria) | Registros de jornada e comunicacao CCO | Pendente — sem backend para retencao oficial |
| ISO 27001 (se aplicavel) | Gestao de seguranca da informacao | Parcialmente preparado — adapter pattern facilita controles |
