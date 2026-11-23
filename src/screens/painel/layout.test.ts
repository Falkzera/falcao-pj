/* Regras de arrumação do painel que dá para conferir lendo o código, sem abrir navegador. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const ler = (arquivo: string) => readFileSync(new URL(arquivo, import.meta.url), "utf8");

test("Os avisos ficam abaixo do gráfico, para o gráfico não pular quando eles aparecem", () => {
  // regressão: com os avisos acima do gráfico, mexer no controle deslizante fazia
  // aviso aparecer e sumir, e o gráfico subia e descia na página
  const painel = ler("./PainelScreen.tsx");
  const grafico = painel.indexOf("<GraficoLiquido");
  const avisos = painel.indexOf("<Avisos");
  assert.ok(grafico > 0 && avisos > 0, "o painel precisa ter gráfico e avisos");
  assert.ok(grafico < avisos, "os avisos vieram antes do gráfico");
});

test("O resumo, que fica acima do gráfico, não mostra avisos e tem a linha do veredito fixa", () => {
  const resumo = ler("./Resumo.tsx");
  assert.equal(resumo.includes("<Alert"), false, "aviso no resumo muda a altura acima do gráfico");
  assert.match(resumo, /className="flex h-7 items-center/);
  assert.match(resumo, /truncate/);
});
