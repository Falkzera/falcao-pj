# src/lib

## Propósito

Utilidades sem estado e sem tela, usadas pelas peças e pelas telas. Não importa de `src/screens/` nem de `src/estado/`.

## Arquivos

| Arquivo | Responde por |
|---|---|
| `formato.ts` | Número, dinheiro (`R$ 1.234,56`), valor negativo, milhares e porcentagem em português do Brasil |
| `movimento.ts` | As constantes de movimento (molas, entrada, tremida) e a preferência de reduzir movimento |
| `afundar.ts` | O afundar das peças com `data-afunda` no toque, ligado uma vez em `main.tsx` |
| `cn.ts` | Junta classes do Tailwind sem conflito (`clsx` com `tailwind-merge`) |

## Padrões

- Dinheiro na tela sempre por `brl()`; o sinal de menos é o `−` tipográfico.
- Animação nova usa uma constante de `movimento.ts`; tempo novo só quando o gesto é novo.
