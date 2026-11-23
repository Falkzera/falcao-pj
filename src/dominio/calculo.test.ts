/* Os valores esperados foram calculados à mão a partir das tabelas publicadas de 2026,
   não pelo próprio código. A conta de cada um está no comentário do teste. */
import assert from "node:assert/strict";
import { test } from "node:test";
import * as C from "./calculo.ts";

const perto = (real: number, esperado: number, tolerancia = 0.01) =>
  assert.ok(Math.abs(real - esperado) <= tolerancia, `esperado ${esperado}, veio ${real}`);

const BASE: C.Parametros = {
  salario: 6000,
  dependentes: 0,
  recebe13Ferias: true,
  temFgts: false,
  brutoMensal: 10500,
  horasMes: 160,
  folgaDias: 21,
  feriadosDias: 12,
  teto: 0,
  proLaboreRegra: "fatorR",
  proLaboreValor: 5000,
  pessoasNoCnpj: 1,
  contador: 300,
  taxas: 40,
  outros: 200,
};

test("INSS de um salário de R$ 6.000 pela tabela progressiva de 2026 dá R$ 641,50", () => {
  // cada faixa cortada nos centavos, como na folha:
  // 1.621 × 7,5% = 121,575 → 121,57; 1.281,84 × 9% = 115,3656 → 115,36
  // 1.451,43 × 12% = 174,1716 → 174,17; 1.645,73 × 14% = 230,4022 → 230,40; soma 641,50
  perto(C.inss(6000), 641.5, 1e-9);
});

test("INSS corta cada faixa nos centavos em vez de arredondar o total", () => {
  // regressão: arredondar o total dava 2 centavos a mais que um contracheque real.
  // 4.354,27 + 1.000 = 5.354,27 → 121,57 + 115,36 + 174,17 + 1.000 × 14% (140,00) = 551,10;
  // o total sem corte é 551,1122, que arredondado daria 551,11
  perto(C.inss(5354.27), 551.1, 1e-9);
});

test("INSS para no teto de R$ 8.475,55", () => {
  perto(C.inss(20000), C.inss(8475.55), 1e-9);
});

test("IR de R$ 6.000 aplica o desconto da Lei 15.270 de R$ 179,75 e fica em R$ 385,11", () => {
  // base 6.000 − 641,50 = 5.358,50 → × 27,5% − 908,73 = 564,8575 → 564,86
  // desconto 978,62 − 0,133145 × 6.000 = 179,75 → 564,86 − 179,75 = 385,11
  const r = C.irMensal(6000, C.inss(6000), 0);
  perto(r.imposto, 564.86, 1e-9);
  perto(r.reducao, 179.75, 1e-9);
  perto(r.ir, 385.11, 1e-9);
});

test("Renda de até R$ 5 mil não paga IR", () => {
  assert.equal(C.irMensal(5000, 550, 0).ir, 0);
  assert.equal(C.irMensal(4999.99, 0, 0).ir, 0);
});

test("Acima de R$ 7.350 não há desconto da lei nova", () => {
  assert.equal(C.irMensal(7350.01, C.inss(7350.01), 0).reducao, 0);
  perto(C.irMensal(7350, C.inss(7350), 0).reducao, 0);
});

test("Cada dependente abate R$ 189,59 da base do IR", () => {
  const sem = C.irMensal(9000, C.inss(9000), 0).ir;
  const com = C.irMensal(9000, C.inss(9000), 1).ir;
  perto(sem - com, 189.59 * 0.275);
});

test("Hoje: 12 salários, 13º e 1/3 de férias somam R$ 65.721,32 líquidos para R$ 6.000", () => {
  // INSS e IR em centavos, como na folha. Líquido mensal 6.000 − 641,50 − 385,11 = 4.973,39
  // mês das férias 8.000: INSS 121,57 + 115,36 + 174,17 + 3.645,73 × 14% (510,40) = 921,50
  // IR (8.000 − 921,50) × 27,5% − 908,73 = 1.037,86, sem desconto acima de 7.350
  // líquido 6.040,64 → 1/3 líquido 1.067,25
  // 12 × 4.973,39 + 4.973,39 + 1.067,25 = 65.721,32
  const h = C.hoje(BASE);
  perto(h.liquido, 4973.39);
  perto(h.terco.inss, 280.0);
  perto(h.terco.ir, 652.75);
  perto(h.terco.liquido, 1067.25);
  perto(h.total, 65721.32);
});

test("Renda de exatamente R$ 5 mil dá imposto zero, sem resíduo de centavos", () => {
  // regressão: o desconto máximo de 312,89 contra um imposto de 312,8900000000001 deixava 1e-13
  assert.equal(C.irMensal(5000, 0, 0).ir, 0);
});

test("Pró-labore do Fator R não sobe um centavo por resíduo de ponto flutuante", () => {
  // regressão: 28% × 109.500 ÷ 12 = 2.555 exatos, e o arredondamento para cima dava 2.555,01
  assert.equal(C.proLabore({ proLaboreRegra: "fatorR", proLaboreValor: 0 }, 109500), 2555);
});

test("FGTS entra no total de hoje só quando existe", () => {
  // 8% × (12 × 6.000 + 6.000 + 2.000) = 6.400
  perto(C.hoje({ ...BASE, temFgts: true }).fgts, 6400);
  assert.equal(C.hoje(BASE).fgts, 0);
});

test("21 dias de folga e 12 feriados deixam 12 − 33/21 meses pagos", () => {
  perto(C.mesesPagos(BASE), 12 - 33 / 21, 1e-9);
  assert.equal(C.mesesPagos({ ...BASE, folgaDias: 0, feriadosDias: 0 }), 12);
});

test("Com o pró-labore no mínimo do Fator R, a empresa fica no Anexo III com 6%", () => {
  const r = C.pj(BASE, 10500);
  assert.equal(r.anexo, "III");
  perto(r.aliquota, 0.06, 1e-9);
  assert.ok(r.fatorR >= 0.28);
});

test("Líquido PJ é o faturamento menos DAS, INSS, IR e custos fixos", () => {
  // faturamento 10.500 × (12 − 33/21) = 109.500; DAS 6% = 6.570
  // pró-labore 28% × 109.500 ÷ 12 = 2.555 → INSS 11% × 2.555 × 12 = 3.372,60; IR zero
  // custos (300 contador + 40 taxas + 200 de outros gastos) × 12 = 6.480
  // líquido 109.500 − 6.570 − 3.372,60 − 6.480 = 93.077,40
  const r = C.pj(BASE, 10500);
  perto(r.receita, 109500);
  perto(r.proLabore, 2555);
  perto(r.inssAno, 3372.6);
  assert.equal(r.irAno, 0);
  perto(r.fixosAno, 6480);
  perto(r.liquido, 93077.4);
  perto(r.lucro, 65790); // 109.500 − 6.570 − 2.555 × 12 − 6.480
});

test("Com pró-labore de um salário mínimo, a empresa cai no Anexo V com 15,5%", () => {
  const r = C.pj({ ...BASE, proLaboreRegra: "minimo" }, 10500);
  assert.equal(r.anexo, "V");
  perto(r.aliquota, 0.155, 1e-9);
});

test("Pró-labore de R$ 5 mil fica isento de IR e mantém o Anexo III", () => {
  const r = C.pj({ ...BASE, proLaboreRegra: "isento" }, 10500);
  assert.equal(r.proLabore, 5000);
  assert.equal(r.irAno, 0);
  assert.equal(r.anexo, "III");
});

test("Quatro pessoas no mesmo CNPJ faturando R$ 126 mil cada pagam 10% efetivos", () => {
  // RBT12 504.000 → (504.000 × 13,5% − 17.640) ÷ 504.000 = 10%
  const r = C.pj({ ...BASE, folgaDias: 0, feriadosDias: 0, pessoasNoCnpj: 4 }, 10500);
  perto(r.rbt12, 504000);
  perto(r.aliquota, 0.1, 1e-9);
});

test("O bruto de empate dá o mesmo líquido de hoje", () => {
  const alvo = C.hoje(BASE).total;
  const g = C.empate(BASE, alvo);
  assert.ok(g !== null);
  perto(C.pj(BASE, g).liquido, alvo);
});

test("Empate inalcançável devolve null", () => {
  assert.equal(C.empate(BASE, 10_000_000), null);
});
