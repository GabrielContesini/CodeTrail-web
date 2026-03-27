# Performance Budget

## Alvos pragmáticos

- `landing/auth`: LCP abaixo de `2.5s` em desktop bom e abaixo de `3.2s` em mobile intermediário.
- `workspace`: INP abaixo de `200ms` nas ações principais e abaixo de `250ms` em páginas densas.
- `bundle de páginas críticas`: evitar adicionar bibliotecas novas sem necessidade e manter animações fora do caminho crítico.

## Pontos críticos observados

- Elementos permanentes com blur no workspace aumentam custo de composição.
- Motion contínuo em background pode aquecer notebooks e degradar scroll.
- Checkout, billing e sincronizações precisam sempre exibir feedback claro sem bloquear a percepção da interface.

## Decisões aplicadas

- Painéis do workspace ficaram mais sólidos e menos vítreos.
- A política de motion agora respeita `prefers-reduced-motion`, `visibilitychange` e reduz custo fora do viewport.
- O fundo da landing usa parallax em camadas DOM com degradação automática em mobile e dispositivos fracos.
- Navegação interna passou a evitar reloads desnecessários para preservar estado e reduzir trabalho de render.
