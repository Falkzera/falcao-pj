import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as E from "./estado.ts";

test("O arquivo de exemplo dos dados locais é lido sem perder nenhum campo", () => {
  const exemplo = JSON.parse(
    readFileSync(new URL("../../dados/exemplo.json", import.meta.url), "utf8"),
  );
  const e = E.padrao(exemplo);
  for (const secao of ["hoje", "empresa", "custos"] as const) {
    assert.deepEqual(Object.keys(exemplo[secao]).sort(), Object.keys(e[secao]).sort(), secao);
  }
  for (const id of Object.keys(exemplo.contrato)) assert.ok(id in e.contrato, id);
  assert.equal(e.contrato.teto.valor, 0);
});
