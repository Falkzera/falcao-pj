import assert from "node:assert/strict";
import { test } from "node:test";
import * as C from "../../dominio/calculo.ts";
import * as E from "../../dominio/estado.ts";
import { avisosDoPainel } from "./regrasDeAviso.ts";

const titulos = (teto: number, bruto: number) => {
  const p = { ...E.parametros(E.padrao()), teto, brutoMensal: bruto };
  return avisosDoPainel(p, C.pj(p, bruto), 0.3, 0).map((a) => a.titulo);
};

test("Bruto acima do teto do contratante gera aviso", () => {
  assert.ok(titulos(9000, 9500).includes("Acima do teto"));
  assert.equal(titulos(9000, 9000).includes("Acima do teto"), false);
});

test("Teto zero quer dizer contrato sem teto", () => {
  assert.equal(titulos(0, 20000).includes("Acima do teto"), false);
});
