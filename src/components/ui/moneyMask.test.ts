import assert from "node:assert/strict";
import { test } from "node:test";
import { formatCentsBRL, nextCents, parsePasteToReais, withinMax } from "./moneyMask.ts";

test("Cada dígito digitado entra como o centavo mais à direita", () => {
  assert.equal(nextCents("R$ 1,234", 123), 1234);
  assert.equal(nextCents("", 5), null);
  assert.equal(formatCentsBRL(123456), "R$ 1.234,56");
});

test("Dígito que passa do limite é ignorado e o valor fica como estava", () => {
  // regressão: o campo aceitava qualquer quantidade de dígitos, e R$ 99 sextilhões
  // num custo deixavam a tela com números de 30 casas
  const limite = 1_000_000;
  assert.equal(nextCents("R$ 1.000.000,000", 100_000_000, limite), 100_000_000);
  assert.equal(nextCents("R$ 1.000.000,001", 100_000_000, limite), 100_000_000);
  assert.equal(nextCents("R$ 99.999,991", 9_999_999, limite), 99_999_991);
});

test("Colar valor acima do limite não passa", () => {
  assert.equal(parsePasteToReais("R$ 1.234,56"), 1234.56);
  assert.equal(parsePasteToReais("1.234"), 1234);
  assert.equal(parsePasteToReais("abc"), null);
  assert.equal(withinMax(100_000_000, 1_000_000), true);
  assert.equal(withinMax(100_000_001, 1_000_000), false);
  assert.equal(withinMax(10 ** 30, undefined), true);
});
