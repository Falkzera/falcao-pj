# src/screens

## Propósito

As telas. Uma tela lê o estado por `useConsultor()` e as contas por `useResultado()` (`src/estado/`), e compõe as peças de `src/components/`. Nenhuma tela faz conta fiscal.

## Arquivos

| Arquivo | Responde por |
|---|---|
| `painel/PainelScreen.tsx` | Monta o painel: resumo, simulação à esquerda, gráfico e avisos à direita, memória embaixo |
| `painel/Resumo.tsx` | Veredito, o placar (hoje, como PJ e a diferença, por ano e por mês) e o bruto que empata |
| `painel/Simulacao.tsx` | Campos da situação de hoje, da proposta, da empresa e dos custos |
| `painel/GraficoLiquido.tsx` | Gráfico (Recharts, carregado sob demanda) do líquido anual por bruto mensal, com a leitura do ponto escolhido e do empate |
| `painel/escala.ts` | Faixa do bruto, que o controle e o gráfico dividem, marcas redondas dos eixos e os brutos da tabela de cenários |
| `painel/Avisos.tsx`, `regrasDeAviso.ts` | Avisos do painel; a regra de cada um é função pura |
| `painel/Composicao.tsx` | Para onde vai o faturamento, por mês e por ano |
| `painel/Cenarios.tsx`, `Memoria.tsx` | Tabela de cenários e memória de cálculo |
| `painel/AcoesDosDados.tsx` | Exportar, importar e voltar ao padrão |
| `painel/*.test.ts` | Escala e cenários, aviso de teto, e o layout que segura o gráfico no lugar |
| `limites.test.ts` | Toda tela usa o campo de dinheiro com limite, e todo texto do contrato tem limite de letras |
| `contrato/ContratoScreen.tsx` | Itens do contrato com valor, situação e anotação, e a cópia das perguntas |
| `regras/RegrasScreen.tsx` | Tabelas do ano em vigor, premissas e fontes |

## Padrões

- Toda rota entra por `lazy()` com um esqueleto no lugar (`App.tsx`); a moldura fica em `src/components/Moldura.tsx`.
- Tela começa por `<Tela>` e agrupa conteúdo em `<Cartao>` (`src/components/Tela.tsx`). Número grande em `.display tabular`; valor de tabela em `font-semibold tabular`, alinhado à direita.
- Na coluna da direita do painel, o gráfico vem antes de tudo que aparece e some.
- Lógica com regra (aviso, escala, cenário) mora num `.ts` com teste, e o `.tsx` só desenha. O nome do `.ts` não repete o do componente, porque o macOS não distingue maiúscula e o import se confunde.

## Decisões recentes

- 2026-11-23. Avisos saíram de cima do gráfico. Mexendo no controle deslizante, um aviso aparecia ou sumia e o gráfico subia e descia na página.
- 2026-11-23. Eixo vertical do gráfico com escala própria (degraus de 10 mil em volta da curva e da linha de hoje). Começar em zero achatava a reta.
- 2026-11-23. A faixa do bruto sai do salário de hoje e do teto (`escala.ts`), e não de valores fixos, para servir a qualquer salário. Ela não depende do bruto escolhido, senão andaria enquanto o controle desliza.
- 2026-11-23. Os cenários partem do teto (ou da proposta, sem teto) e de 90% e 80% dele, a faixa em que se negocia.
- 2026-11-23. A composição do faturamento mostra também o valor por mês, a média dos 12 meses.
- 2026-11-23. Toda diferença sobre hoje sai em reais e em porcentagem, por ano e por mês (placar, gráfico, cenários, memória). Só a porcentagem não dizia quanto entra no bolso.
- 2026-11-23. O gráfico diz o que cada eixo mede (bruto por mês embaixo, líquido por ano do lado) e lê, abaixo da curva, o ponto escolhido e o empate. O empate é um bruto mensal num gráfico de líquido anual, e sem a leitura parecia um ganho por mês.
- 2026-11-23. A escala do gráfico tem teto (R$ 1 milhão por mês) e no máximo umas dez marcas por eixo. Um teto absurdo no arquivo importado gerava milhões de marcas, e acima de 1e22 o laço não terminava.

## Pendências conhecidas

- Tabelas de cenários e memória são tabelas também no celular (com rolagem lateral nos cenários). Uma versão em cartões para o celular ainda não foi feita.
