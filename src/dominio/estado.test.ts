import assert from "node:assert/strict";
import { test } from "node:test";
import * as E from "./estado.ts";

test("O estado padrão traz todos os itens do contrato como estimativa", () => {
  const e = E.padrao();
  for (const campo of E.CAMPOS) assert.equal(e.contrato[campo.id].situacao, "estimado", campo.id);
  assert.equal(E.pendentes(e).length, E.CAMPOS.length);
});

test("Importar algo que não é o arquivo do sistema dá erro claro", () => {
  assert.throws(() => E.normalizar(null), /não tem os dados/);
  assert.throws(() => E.normalizar("texto"), /não tem os dados/);
});

test("Importar dados com campos faltando ou sobrando completa com o padrão e descarta o resto", () => {
  const e = E.normalizar({ hoje: { salario: 7000, lixo: 1 }, estranho: true });
  assert.equal(e.hoje.salario, 7000);
  assert.equal(e.hoje.dependentes, E.padrao().hoje.dependentes);
  assert.equal("lixo" in e.hoje, false);
  assert.equal("estranho" in e, false);
});

test("Valor de tipo errado volta para o padrão", () => {
  const e = E.normalizar({ hoje: { salario: "muito" }, contrato: { horasMes: { valor: "x" } } });
  assert.equal(e.hoje.salario, E.padrao().hoje.salario);
  assert.equal(e.contrato.horasMes.valor, E.padrao().contrato.horasMes.valor);
});

test("Situação desconhecida volta para estimativa", () => {
  const e = E.normalizar({ contrato: { brutoMensal: { valor: 9000, situacao: "talvez" } } });
  assert.equal(e.contrato.brutoMensal.valor, 9000);
  assert.equal(e.contrato.brutoMensal.situacao, "estimado");
});

test("Opção fora da lista volta para o padrão", () => {
  const e = E.normalizar({ contrato: { local: { valor: "Lua" } } });
  assert.equal(e.contrato.local.valor, E.padrao().contrato.local.valor);
});

test("Os parâmetros da conta vêm do contrato", () => {
  const e = E.padrao();
  e.contrato.brutoMensal.valor = 9000;
  e.contrato.folgaDias.valor = 0;
  const p = E.parametros(e);
  assert.equal(p.brutoMensal, 9000);
  assert.equal(p.folgaDias, 0);
  assert.equal(p.salario, e.hoje.salario);
  assert.equal(p.contador, e.custos.contador);
});

test("As perguntas da reunião listam só o que ainda é estimativa", () => {
  const e = E.padrao();
  e.contrato.brutoMensal.situacao = "confirmado";
  e.contrato.horasMes.situacao = "contrato";
  const ids = E.pendentes(e).map((c) => c.id);
  assert.equal(ids.includes("brutoMensal"), false);
  assert.equal(ids.includes("horasMes"), false);
  assert.equal(ids.length, E.CAMPOS.length - 2);
  assert.match(E.textoPerguntas(e), /Feriados/);
});

test("Dados iniciais locais substituem o exemplo sem sair do formato", () => {
  const e = E.padrao({ hoje: { salario: 8123.45 } });
  assert.equal(e.hoje.salario, 8123.45);
  assert.equal(e.contrato.brutoMensal.situacao, "estimado");
});

test("Arquivo importado não passa de 4 pessoas no CNPJ nem de menos de 1", () => {
  assert.equal(E.normalizar({ empresa: { pessoasNoCnpj: 99 } }).empresa.pessoasNoCnpj, 4);
  assert.equal(E.normalizar({ empresa: { pessoasNoCnpj: 0 } }).empresa.pessoasNoCnpj, 1);
});

test("Regra de pró-labore desconhecida volta para o Fator R", () => {
  assert.equal(
    E.normalizar({ empresa: { proLaboreRegra: "inventada" } }).empresa.proLaboreRegra,
    "fatorR",
  );
});

test("Anotação que não é texto vira vazio, e nunca código na tela", () => {
  const e = E.normalizar({ contrato: { local: { nota: { html: "<img>" } } } });
  assert.equal(e.contrato.local.nota, "");
});

test("Situação com nome herdado de objeto, como __proto__, volta para estimativa", () => {
  // regressão: `in` enxergava as chaves herdadas, e "__proto__" passava como situação
  for (const situacao of ["__proto__", "toString", "constructor"]) {
    const e = E.normalizar({ contrato: { local: { situacao } } });
    assert.equal(e.contrato.local.situacao, "estimado", situacao);
  }
});

test("Número negativo ou absurdo no arquivo volta para o padrão", () => {
  const e = E.normalizar({ hoje: { salario: -5000 }, contrato: { teto: { valor: 1e308 } } });
  assert.equal(e.hoje.salario, E.padrao().hoje.salario);
  assert.equal(e.contrato.teto.valor, 0);
});

test("Arquivo com valor acima do limite do campo volta para o padrão", () => {
  // regressão: o limite era 1 bilhão para tudo, e R$ 99 sextilhões digitados num campo
  // de custo deixavam a tela com números de 30 casas
  const e = E.normalizar({
    hoje: { salario: 2_000_000, dependentes: 500 },
    contrato: { teto: { valor: 1_500_000 }, horasMes: { valor: 10_000 } },
    custos: { contador: 5_000_000 },
  });
  const p = E.padrao();
  assert.equal(e.hoje.salario, p.hoje.salario);
  assert.equal(e.hoje.dependentes, p.hoje.dependentes);
  assert.equal(e.contrato.teto.valor, 0);
  assert.equal(e.contrato.horasMes.valor, p.contrato.horasMes.valor);
  assert.equal(e.custos.contador, p.custos.contador);
});

test("Valor no limite do campo é aceito", () => {
  const e = E.normalizar({
    hoje: { salario: E.LIMITES.dinheiro, dependentes: E.LIMITES.dependentes },
    contrato: { horasMes: { valor: 744 } },
  });
  assert.equal(e.hoje.salario, E.LIMITES.dinheiro);
  assert.equal(e.hoje.dependentes, E.LIMITES.dependentes);
  assert.equal(e.contrato.horasMes.valor, 744);
});

test("Todo item de número do contrato tem limite próprio", () => {
  for (const c of E.CAMPOS.filter((x) => x.tipo === "numero"))
    assert.ok(c.max !== undefined && c.max > 0, c.id);
  const horas = E.CAMPOS.find((c) => c.id === "horasMes");
  assert.ok(horas);
  assert.equal(E.limiteDe(horas), 744);
});

test("Texto e anotação do contrato ficam com no máximo o limite de letras", () => {
  const e = E.normalizar({
    contrato: { reajuste: { valor: "b".repeat(5000), nota: "a".repeat(5000) } },
  });
  assert.equal(String(e.contrato.reajuste.valor).length, E.LIMITES.texto);
  assert.equal(e.contrato.reajuste.nota.length, E.LIMITES.texto);
});
