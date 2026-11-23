# Mapa de histórias

## Esqueleto

Decidir a proposta → negociar na reunião → abrir a empresa → acompanhar cada mês → cumprir as obrigações do ano

## Ondas

| Onda | Histórias | Estado |
|---|---|---|
| 1 | 1.1 a 1.7 | Feita, no histórico inicial do repositório |
| 2 | 2.1 a 2.4 | Próxima |
| 3 | 3.1 e 3.2 | Depois da onda 2 |

## Fila

1. 2.1 Registrar o contrato assinado
2. 2.2 Lançar o mês
3. 2.3 DAS do mês com a RBT12 real
4. 2.4 Quanto distribuir de lucro
5. 3.1 Agenda de obrigações
6. 3.2 Aviso de obrigação perto do vencimento

## Onda 2, mês a mês

### 2.1 Registrar o contrato assinado
Como PJ, quero passar cada item do contrato para "No contrato" com o valor oficial, para que o painel deixe de usar estimativa.

### 2.2 Lançar o mês
Como PJ, quero lançar horas trabalhadas, valor da nota, data de emissão e data de recebimento de cada mês, para ter o histórico que o Simples usa.

### 2.3 DAS do mês com a RBT12 real
Como PJ, quero que o DAS de cada mês saia da receita e da folha dos 12 meses anteriores, para pagar o valor certo.

```gherkin
Cenário: Primeiro mês da empresa
  Dado uma empresa aberta neste mês, sem receita anterior
  Quando eu lanço a primeira nota
  Então a RBT12 é a receita do mês multiplicada por 12, como manda a regra de início de atividade

Cenário: Fator R abaixo de 28% num mês
  Dado que a folha dos últimos 12 meses ficou abaixo de 28% da receita
  Quando o DAS do mês é calculado
  Então o mês sai pelo Anexo V e o sistema avisa quanto de pró-labore falta
```

### 2.4 Quanto distribuir de lucro
Como PJ, quero saber quanto posso tirar de lucro no mês sem imposto, para não deixar dinheiro parado na empresa nem tirar além do que há em caixa.

## Onda 3, obrigações

### 3.1 Agenda de obrigações
Como PJ, quero ver no ano o vencimento do DAS, do INSS do pró-labore, da DEFIS, da declaração do IR e da renovação do certificado digital.

### 3.2 Aviso de obrigação perto do vencimento
Como PJ, quero ver no painel o que vence nos próximos 7 dias.

## As histórias feitas

### 1.1 Comparar hoje com a proposta
Painel com líquido anual de hoje e como PJ, diferença, bruto de empate, valor da hora, gráfico, composição do faturamento, cenários e memória de cálculo.

```gherkin
Cenário: Imposto de renda com a lei nova
  Dado um salário de R$ 6.000 sem dependentes
  Quando o IR de 2026 é calculado
  Então o INSS é R$ 641,50, com cada faixa cortada nos centavos como na folha
  E o imposto pela tabela é R$ 564,86, o desconto é R$ 179,75 e o IR fica em R$ 385,11

Cenário: Pró-labore no mínimo do Fator R
  Dado R$ 10.500 por mês com um mês de folga e 12 feriados sem receber, e R$ 540 de custos fixos por mês
  Quando a empresa é calculada
  Então o pró-labore é R$ 2.555, a empresa fica no Anexo III com 6% e o líquido anual é R$ 93.077,40

Cenário: Quatro sócios no mesmo CNPJ
  Dado quatro pessoas faturando R$ 126 mil por ano cada no mesmo CNPJ
  Quando a alíquota é calculada
  Então ela é de 10% efetivos, e não de 6%
```

### 1.2 Itens do contrato com situação
Aba Contrato com 15 itens, entre eles o teto que o contratante pode pagar, cada um estimado, confirmado na reunião ou no contrato, com anotação. Os 4 que mudam a conta aparecem marcados no painel.

```gherkin
Cenário: Acima do teto do contratante
  Dado um teto de R$ 9.000 no contrato
  Quando o bruto escolhido passa de R$ 9.000
  Então o painel avisa que o valor passa do teto, e com teto zero nunca avisa
```

### 1.3 Perguntas da reunião
O que ainda é estimativa vira lista de perguntas, com filtro e botão de copiar.

### 1.4 Guardar e levar os dados
Dados guardados no navegador, com exportar e importar arquivo. Arquivo estranho ou com campo de tipo errado não quebra o sistema. Os números de quem usa podem partir de `dados/meus-dados.json`, fora do git e lido só no `npm run dev`.

```gherkin
Cenário: Arquivo de exemplo no formato dos dados
  Dado o arquivo dados/exemplo.json do repositório
  Quando o sistema abre a partir dele
  Então todos os campos do exemplo são lidos e o teto fica em zero, que quer dizer sem teto
```

### 1.5 Mesma cara dos outros sistemas Falcão
Vite, React e Tailwind no visual dos apps Falcão, só no tema claro: Barlow, tinta marinho, cartões com traço e sombra dura, barra de baixo no celular e navegação no topo no computador. A escala do gráfico e do controle sai do salário de hoje e do teto, e não do valor escolhido.

```gherkin
Cenário: Gráfico parado enquanto o controle desliza
  Dado o painel aberto
  Quando eu arrasto o controle do valor bruto e um aviso aparece ou some
  Então o gráfico não muda de lugar na página, porque os avisos ficam abaixo dele
```

### 1.6 Para onde vai o faturamento, por mês
A tabela da composição do faturamento ganha a coluna por mês, a média dos 12 meses, ao lado da coluna por ano.

### 1.7 Quanto ganho hoje, quanto vou ganhar e a diferença
No topo do painel, um placar com o líquido de hoje, o líquido como PJ e a diferença, por ano e por mês, e a diferença também em porcentagem. Gráfico, cenários e memória de cálculo mostram a diferença em reais ao lado da porcentagem.

```gherkin
Cenário: Diferença em reais com sinal
  Dado uma diferença de R$ 25.013,40 sobre hoje
  Quando ela aparece na tela
  Então aparece como +R$ 25.013, e uma perda aparece como −R$ 1.234

Cenário: Escala que não trava
  Dado um teto de R$ 1 trilhão num arquivo importado
  Quando o painel desenha o gráfico
  Então a escala para em R$ 1 milhão por mês e tem no máximo umas dez marcas
```
