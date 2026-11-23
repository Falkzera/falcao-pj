import assert from "node:assert/strict";
import { test } from "node:test";
import { brutosDosCenarios, faixaDoBruto, marcasEntre } from "./escala.ts";

test("A faixa do bruto vai de 80% do salário de hoje até o dobro dele, em milhares", () => {
  // 80% de 6.000 = 4.800 → 4 mil; o dobro, 12 mil; largura de 8 mil com marca a cada mil
  const f = faixaDoBruto(6000, 0);
  assert.equal(f.de, 4000);
  assert.equal(f.ate, 12000);
  assert.deepEqual(f.marcas, [4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000]);
});

test("Com teto, a faixa passa um pouco do teto para ele aparecer no gráfico", () => {
  // 115% de 12.000 = 13.800 → 14 mil, acima do dobro do salário
  assert.equal(faixaDoBruto(6000, 12000).ate, 14000);
});

test("Salário alto ganha marcas mais espaçadas, no máximo umas dez", () => {
  // 16 mil a 40 mil: marca a cada 5 mil
  const f = faixaDoBruto(20000, 0);
  assert.deepEqual([f.de, f.ate], [16000, 40000]);
  assert.deepEqual(f.marcas, [20000, 25000, 30000, 35000, 40000]);
});

test("Sem salário de hoje, a faixa ainda existe", () => {
  const f = faixaDoBruto(0, 0);
  assert.ok(f.ate > f.de && f.de > 0);
});

test("Os cenários usam o teto, 90% e 80% dele e a proposta, arredondados a R$ 100", () => {
  // 90% de 10.500 = 9.450 → 9.500 (sem resíduo de ponto flutuante); 80% = 8.400
  assert.deepEqual(brutosDosCenarios(9000, 10500), [8400, 9000, 9500, 10500]);
});

test("Sem teto, os cenários partem da proposta e não repetem valor", () => {
  assert.deepEqual(brutosDosCenarios(9000, 0), [7200, 8100, 9000]);
});

test("Teto ou salário absurdos não travam a tela: a escala tem no máximo umas dez marcas", () => {
  // regressão: teto de R$ 1 trilhão dava 11,5 milhões de marcas, e acima de 1e22 o laço
  // não terminava, porque somar o intervalo já não mudava o número
  for (const [salario, teto] of [
    [6000, 1e12],
    [6000, 1e22],
    [1e308, 0],
    [6000, 1e308],
  ]) {
    const f = faixaDoBruto(salario, teto);
    assert.ok(Number.isFinite(f.ate) && f.marcas.length <= 11, `${salario} ${teto}`);
    assert.ok((f.ate - f.de) / f.passo <= 101, "a curva continua com uns cem pontos");
  }
});

test("Marcas entre dois valores saem redondas, e nenhuma quando a faixa não é finita", () => {
  assert.deepEqual(marcasEntre(20000, 120000, 6), [20000, 40000, 60000, 80000, 100000, 120000]);
  assert.deepEqual(marcasEntre(0, Number.POSITIVE_INFINITY, 6), []);
});
