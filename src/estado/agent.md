# src/estado

## Propósito

A ponte entre o domínio e a tela. Guarda o estado em React, salva no localStorage a cada mudança e refaz as contas só quando o estado muda. Importa de `src/dominio/` e é importado pelas telas e pela moldura.

## Arquivos

| Arquivo | Responde por |
|---|---|
| `ConsultorContext.tsx` | `ConsultorProvider`, `useConsultor()` (estado, alterar, substituir, restaurar) e `useResultado()` (as contas do momento) |

## Padrões

- Toda mudança passa por `alterar()`, que trabalha numa cópia (`structuredClone`) e nunca no estado atual.
- O arquivo de dados pessoais (`dados/meus-dados.json`) entra por `import.meta.glob` só quando `import.meta.env.DEV`. O build nunca o leva.
- Ordem de partida: o que está no localStorage; sem ele, o arquivo pessoal; sem ele, o exemplo de `base()`.

## Decisões recentes

- 2026-11-23. O arquivo pessoal ficou restrito ao `npm run dev`, para que um build publicado nunca carregue os dados de quem o gerou.
