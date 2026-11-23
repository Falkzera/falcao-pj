# src/styles

## Propósito

Os tokens e o CSS global. É a única fonte de cor do sistema: componente usa token, nunca hex.

## Arquivos

| Arquivo | Responde por |
|---|---|
| `estilo.css` | Tokens do tema claro (fundo, texto, traço, tinta, avisos, cores da família), camadas do Tailwind e as classes de componente (`display`, `cartao`, `chip`, `segmentos`, `selo`, a barra de navegação) |
| `adesivo.css` | O traço de 2 px e a sombra dura dos cartões, chips e botões, e o afundar no toque |

## Padrões

- Só tema claro. Token novo entra em `estilo.css` e, se precisar de opacidade no Tailwind, também em `tailwind.config.ts`.
- `adesivo.css` vem depois de `estilo.css` em `main.tsx` e fica fora das camadas do Tailwind, para vencer as utilities.
- O `check:tokens` (`scripts/`) reprova utility com modificador de opacidade que não existe na escala.
