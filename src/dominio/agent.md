# src/dominio

## Propósito

As regras fiscais, as contas e o formato dos dados. Não conhece React nem a tela, e roda no Node para os testes. Nada fora daqui decide valor de imposto. Esta pasta não importa de nenhuma outra.

## Arquivos

| Arquivo | Responde por |
|---|---|
| `regras.ts` | O ano em vigor. O resto do sistema importa daqui |
| `regras-2026.ts` | Tabelas de 2026: INSS, IR com o desconto da Lei 15.270, Simples (Anexos III e V), Fator R, salário mínimo, limites do MEI e dos dividendos |
| `calculo.ts` | Situação de hoje (salário, 13º, 1/3 de férias, FGTS), meses pagos, pró-labore, empresa no Simples e o bruto de empate |
| `estado.ts` | Formato dos dados, itens do contrato com pergunta e situação, validação na importação, perguntas pendentes |
| `calculo.test.ts` | INSS, IR, hoje, meses pagos, Fator R e anexos, faixa com vários sócios, empate |
| `estado.test.ts` | Estado padrão, importação de arquivo estranho, tipos errados, parâmetros da conta, perguntas pendentes |
| `exemplo.test.ts` | O `dados/exemplo.json` do repositório continua no formato dos dados |

## Padrões

- Imports entre estes arquivos levam a extensão `.ts`, porque o Node roda os testes direto do TypeScript.
- O valor esperado de um teste é feito à mão a partir da tabela publicada, com a conta no comentário, e usa valores fictícios (salário de R$ 6.000).
- Campo novo do contrato que mude a conta entra em `CAMPOS` com `conta: true` e em `parametros()`. Campo que só aparece em aviso (como o `teto`) entra em `parametros()` sem `conta`.
- Toda entrada vinda de arquivo passa por `normalizar()`, que descarta chave desconhecida e devolve ao padrão o valor de tipo errado.
- Ano novo é arquivo novo (`regras-AAAA.ts`, no mesmo formato) e uma linha trocada em `regras.ts`.

## Decisões recentes

- 2026-11-23. INSS e IR arredondados em centavos. Sem isso, renda de exatamente R$ 5 mil deixava um resíduo de imposto e o pró-labore do Fator R subia um centavo.
- 2026-11-23. O INSS corta cada faixa nos centavos antes de somar. Arredondar o total dava 2 centavos a mais que um contracheque real, e o IR, um centavo a menos.
- 2026-11-23. Meses pagos = 12 − (dias de folga + feriados) ÷ 21. O pró-labore e os custos fixos continuam nos 12 meses.
- 2026-11-23. O teto do contratante virou item do contrato (zero quer dizer sem teto), em vez de número fixo nas regras: ele é do contrato de cada pessoa, não da lei.
- 2026-11-23. O custo dividido entre sócios se chama assinatura (`assinaturaTotal` e `assinaturaPessoas`), sem nome de produto.
- 2026-11-23. Número vindo de arquivo fica entre 0 e 1 bilhão, e a situação só aceita as chaves próprias de `SITUACOES` (`Object.hasOwn`). Um `"__proto__"` passava pelo `in`, e um teto de 1e308 travava a tela.

## Pendências conhecidas

- O cálculo usa o faturamento anual como RBT12. O acompanhamento mês a mês (onda 2) precisa da receita e da folha dos 12 meses anteriores de verdade, com a regra de início de atividade.
- O 13º assume que o desconto da Lei 15.270 também vale para ele.
- A situação de hoje só conhece o INSS do regime geral.
