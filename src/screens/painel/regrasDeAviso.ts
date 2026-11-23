/* Avisos do painel. Função pura: recebe o resultado das contas e devolve a lista,
   do mais grave para o mais leve. */
import type { Parametros, ResultadoPj } from "../../dominio/calculo.ts";
import { REGRAS as R } from "../../dominio/regras.ts";
import { brl, numero } from "../../lib/formato.ts";

export type TomAviso = "danger" | "warning" | "info";

export interface Aviso {
  tom: TomAviso;
  titulo: string;
  texto: string;
}

const GRAVIDADE: Record<TomAviso, number> = { danger: 0, warning: 1, info: 2 };

export function avisosDoPainel(
  p: Parametros,
  pj: ResultadoPj,
  diferenca: number,
  estimadosDaConta: number,
): Aviso[] {
  const avisos: Aviso[] = [];
  if (pj.rbt12 > R.simples.limite) {
    avisos.push({
      tom: "danger",
      titulo: "Fora do Simples",
      texto: `O faturamento do CNPJ passa de ${brl(R.simples.limite, 0)} por ano, o limite do Simples Nacional.`,
    });
  }
  if (pj.lucro < 0) {
    avisos.push({
      tom: "danger",
      titulo: "Empresa no prejuízo",
      texto: "Pró-labore e custos passam do que sobra depois do DAS.",
    });
  }
  if (pj.anexo === "V") {
    avisos.push({
      tom: "warning",
      titulo: "Anexo V",
      texto: `Fator R em ${numero(pj.fatorR * 100, 1)}%. Abaixo de 28%, a empresa paga a partir de 15,5%. Suba o pró-labore para voltar ao Anexo III.`,
    });
  }
  if (p.teto > 0 && p.brutoMensal > p.teto) {
    avisos.push({
      tom: "warning",
      titulo: "Acima do teto",
      texto: `${brl(p.brutoMensal, 0)} passa do teto de ${brl(p.teto, 0)} que o contratante pode pagar.`,
    });
  }
  if (diferenca >= 0 && diferenca < 0.15) {
    avisos.push({
      tom: "warning",
      titulo: "Margem curta",
      texto:
        "Menos de 15% acima de hoje. Como PJ você não recebe nos dias de doença e contribui menos para a aposentadoria.",
    });
  }
  if (pj.proLabore < R.salarioMinimo) {
    avisos.push({
      tom: "warning",
      titulo: "Pró-labore baixo",
      texto: `Abaixo do salário mínimo (${brl(R.salarioMinimo)}), o pró-labore não serve como base do INSS.`,
    });
  }
  if (pj.rbt12 > R.simples.anexos.III[0][0] && pj.rbt12 <= R.simples.limite) {
    avisos.push({
      tom: "info",
      titulo: "Segunda faixa do Simples",
      texto: `O CNPJ fatura ${brl(pj.rbt12, 0)} por ano e a alíquota efetiva sobe para ${numero(pj.aliquota * 100)}%. Com um CNPJ por pessoa, ela fica em 6%.`,
    });
  }
  if (pj.proLabore > R.ir.reducao.isencaoAte) {
    avisos.push({
      tom: "info",
      titulo: "IR no pró-labore",
      texto: "Pró-labore acima de R$ 5 mil volta a pagar imposto de renda.",
    });
  }
  if (estimadosDaConta > 0) {
    avisos.push({
      tom: "info",
      titulo: "Ainda é estimativa",
      texto: `${estimadosDaConta} dos 4 itens do contrato que mudam esta conta ainda não foram confirmados.`,
    });
  }
  return avisos.sort((a, b) => GRAVIDADE[a.tom] - GRAVIDADE[b.tom]);
}
