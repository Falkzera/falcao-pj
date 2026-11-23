# src/components

## Propósito

Peças de interface e a marca. O visual é o dos apps Falcão no tema claro. As peças não conhecem as contas: recebem valores prontos por props ou leem o estado pelo contexto.

## Arquivos

| Arquivo | Origem | Responde por |
|---|---|---|
| `ui/Alert`, `Button`, `Checkbox`, `Field`, `fieldChrome`, `Input`, `LimiteDeErro`, `Textarea`, `Toast` | Falcão Questões | Primitivos de campo, botão, aviso e limite de erro |
| `ui/MoneyInput.tsx` | Falcão Finance | Campo de dinheiro com máscara da direita para a esquerda |
| `BotaoAdesivo.tsx`, `Segmentos.tsx`, `NavInferior.tsx` | Falcão Questões | Botão com traço e sombra dura, escolha em segmentos, barra de baixo do celular |
| `marca/logo-morph.tsx`, `marca/marca-formas.ts` | Identidade visual Falcão | O símbolo oficial, que vira `lf/` no hover |
| `Moldura.tsx` | Deste projeto | Topo com o logotipo, navegação no topo (computador) e embaixo (celular) |
| `navegacao.ts` | Deste projeto | Os três destinos: Painel, Contrato, Regras |
| `Tela.tsx` | Deste projeto | Miolo da tela com título, e o `Cartao` com título de seção |
| `Selo.tsx` | Deste projeto | Selo pequeno de estado |
| `campos/CampoNumero.tsx`, `campos/SeloSituacao.tsx` | Deste projeto | Número sem máscara e selo da situação de um item do contrato |

## Padrões

- As peças que vieram de outros apps Falcão mantêm o comportamento de lá. Conserto nelas é bem-vindo; mudança de visual (cor, fonte, forma) se discute numa issue antes. A única adaptação é a lista de destinos do `NavInferior`, que lê `navegacao.ts`.
- O símbolo da marca nunca é desenhado à mão: os caminhos de `marca/marca-formas.ts` são os oficiais, e o símbolo não gira, não distorce, não espelha.
- Peça clicável ou cartão leva as classes de `styles/adesivo.css` (`cartao`, `chip`, `botao-adesivo`), que dão o traço e a sombra dura.
- Cor só por token de `styles/estilo.css`. As cores da família (ouro, menta, lilás, céu) levam texto marinho por cima.

## Decisões recentes

- 2026-11-23. Visual dos apps Falcão no tema claro, sem seletor de tema. Barlow e Barlow Condensed, tinta marinho.
- 2026-11-23. A entrada da `Tela` respeita "reduzir movimento", como a barra de baixo.

## Pendências conhecidas

- Sem a abertura animada da marca (véu e penas), que fica para os apps que são produto.
