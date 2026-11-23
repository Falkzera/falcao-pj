# scripts

## Propósito

Verificações que o `npm run verify` e o CI rodam, sem dependência além do próprio projeto.

## Arquivos

| Arquivo | Responde por |
|---|---|
| `check-tokens.mjs` | Falha quando uma utility do Tailwind não gera CSS (opacidade fora da escala, token que não existe). O Tailwind descarta essas classes em silêncio, e a peça renderiza sem o estilo |
