# Design System T4

## Identidade Visual

- **Tema**: Escuro industrial, estilo sala de controle ferroviária
- **Grid background**: Linhas finas 40x40px formando grid técnico
- **Tipografia**: JetBrains Mono (dados/números), Outfit (texto/títulos)

## Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `--t4-bg-primary` | `#0a0b0f` | Fundo principal |
| `--t4-brand-orange` | `#ff6b2b` | Cor principal da marca |
| `--t4-accent-simulador` | `#a855f7` | EFVM 360 (roxo) |
| `--t4-accent-ccq` | `#f472b6` | CCQ (rosa) |
| `--t4-accent-rof` | `#ffc72b` | ROF Digital (amarelo) |
| `--t4-accent-adamboot` | `#34d399` | AdamBoot (verde esmeralda) |

## Componentes

- **Cards**: `.t4-card`, `.t4-card-interactive`, `.t4-card-glow`
- **Botões**: `.t4-btn`, `.t4-btn-primary`, `.t4-btn-secondary`, `.t4-btn-ghost`
- **Inputs**: `.t4-input`, `.t4-search`, `.t4-select`
- **Chips**: `.t4-chip`, `.t4-chip-active`, `.t4-chip-group`
- **Modal**: `.t4-modal-backdrop`, `.t4-modal` (bottom sheet)
- **Toast**: `.t4-toast`, `.t4-toast-ok`, `.t4-toast-danger`

## Animações

- **fadeUp**: Entrada padrão de elementos
- **scale(0.95)**: Feedback de toque
- **Transições**: 0.3s ease padrão
- **Respeita prefers-reduced-motion**
