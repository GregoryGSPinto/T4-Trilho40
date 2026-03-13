# Guia de Criação de Módulos

## Estrutura de um Módulo

```
modules/novo-modulo/
├── index.html          # Página principal
├── css/
│   └── novo-modulo.css # Estilos específicos
├── js/
│   └── novo-modulo-app.js  # Controller principal
└── data/
    └── dados.json      # Dados estáticos
```

## Checklist

1. Importar Design System T4 (CSS e JS do `shared/`)
2. Verificar autenticação com `T4.auth.requireAuth()`
3. Inicializar módulo com `T4.init('nome-modulo')`
4. Usar `T4.storage` para persistência
5. Funcionar offline (dados em cache/IndexedDB)
6. Mobile-first, max-width 430px
7. Touch targets mínimo 44x44px
8. Textos em português brasileiro
