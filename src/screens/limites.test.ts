/* Regras dos campos que dá para conferir lendo o código das telas. */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const telas = (pasta: URL): string[] =>
  readdirSync(pasta, { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => readFileSync(new URL(f, pasta), "utf8"));

test("Campo de dinheiro das telas passa pelo CampoDinheiro, que tem o limite", () => {
  // regressão: o MoneyInput direto não tinha limite, e um custo de R$ 99 sextilhões
  // quebrava o painel
  for (const codigo of telas(new URL("./", import.meta.url)))
    assert.equal(codigo.includes("ui/MoneyInput"), false);
});

test("Todo campo de texto do contrato tem limite de letras", () => {
  const contrato = readFileSync(new URL("./contrato/ContratoScreen.tsx", import.meta.url), "utf8");
  const campos = contrato.match(/<Input\b/g)?.length ?? 0;
  const limites = contrato.match(/maxLength=\{LIMITES\.texto\}/g)?.length ?? 0;
  assert.ok(campos > 0);
  assert.equal(limites, campos);
});
