# Arquitetura — T4 Trilho 4.0

## Visão Geral

O T4 é um ecossistema modular de PWAs. Cada módulo funciona de forma independente (abrindo seu próprio `index.html`) e também integrado ao Hub Central.

## Princípios

1. **Offline-first**: Service Worker cacheia todos os assets. IndexedDB persiste dados localmente.
2. **Mobile-first**: Max-width 430px, touch targets 44x44px, safe areas para notch.
3. **Modular**: Cada módulo é independente mas compartilha o Design System T4.
4. **Sem frameworks**: HTML5 + CSS3 + JavaScript vanilla para máxima performance.

## Fluxo de Dados

```
Hub Central → T4.router.navigate() → Módulo
Módulo → T4.storage (IndexedDB) → Persistência local
Módulo → T4.context → Contexto operacional compartilhado
Módulo → T4.auth → Sessão do maquinista
```

## Comunicação entre Módulos

- **T4.context**: Estado operacional (pátio, turno, trem) compartilhado via localStorage.
- **T4.events**: Barramento de eventos para comunicação desacoplada.
- **URL params**: Parâmetros passados via query string na navegação.

## Cache e Offline

- **Service Worker**: Estratégia Network First para HTML/JSON, Cache First para CSS/JS.
- **IndexedDB**: Dados dos módulos (simulações, projetos CCQ, favoritos ROF, conversas AdamBoot).
- **localStorage**: Preferências, sessão, contexto operacional.
- **Sync Queue**: Fila de sincronização para quando voltar online.
