# T4 — Trilho 4.0

Ecossistema mobile-first de aplicações para o maquinista ferroviário 4.0.

Plataforma modular tipo "home screen de smartphone" onde cada módulo é um app independente conectado a um Hub Central.

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **EFVM 360** | Simulador de condução ferroviária da EFVM |
| **CCQ** | Círculo de Controle de Qualidade com ferramentas PDCA |
| **ROF Digital** | Regulamento de Operação Ferroviária com busca inteligente |
| **AdamBoot** | Assistente IA do maquinista com voz |

## Apps Integrados

- **OPTIMA WORK AI** — Alocação de equipagem
- **VFZ Passagem de Serviço** — Passagem de serviço ferroviário

## Stack

- PWA mobile-first (HTML5 + CSS3 + JavaScript vanilla)
- Design System T4 compartilhado
- Service Workers para funcionalidade offline
- IndexedDB para persistência local

## Como Executar

```bash
npx serve . -p 3000
```

Acesse `http://localhost:3000` no navegador.

**Login demo:** Matrícula `0001` / PIN `1234`

## Estrutura

```
├── index.html              # Hub Central
├── shared/                 # Design System T4
├── modules/
│   ├── efvm360/           # Simulador Ferroviário
│   ├── ccq/               # Círculo de Qualidade
│   ├── rof-digital/       # ROF Digital
│   └── adamboot/          # Assistente IA
├── integrations/          # Links para apps externos
└── service-worker.js      # Cache offline
```
