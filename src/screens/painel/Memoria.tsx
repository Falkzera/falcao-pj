import { Cartao } from "../../components/Tela";
import { REGRAS } from "../../dominio/regras.ts";
import { useConsultor, useResultado } from "../../estado/ConsultorContext";
import { cn } from "../../lib/cn";
import { brl, comSinal, mil, negativo, numero, pct } from "../../lib/formato";

type Linha = { item: string; como?: string; valor: string; tipo?: "sub" | "total" | "grupo" };

const DESCRICAO_PL = {
  fatorR: "28% do faturamento, mínimo do Fator R",
  isento: "R$ 5 mil, maior valor sem IR",
  minimo: "salário mínimo",
  outro: "valor escolhido",
};

function Tabela({ titulo, linhas }: { titulo: string; linhas: Linha[] }) {
  return (
    <div className="min-w-0 space-y-3">
      <h3 className="rotulo text-text-muted">{titulo}</h3>
      <table className="w-full text-[0.9375rem]">
        <tbody>
          {linhas.map((l) =>
            l.tipo === "grupo" ? (
              <tr key={l.item}>
                <td colSpan={2} className="rotulo pt-5 pb-2 text-text-muted">
                  {l.item}
                </td>
              </tr>
            ) : (
              <tr
                key={l.item}
                className={cn(
                  "border-border-subtle border-b",
                  l.tipo === "sub" && "bg-bg-primary",
                  l.tipo === "total" && "border-[var(--tinta)] border-t-2 border-b-0",
                )}
              >
                <td className="w-full py-2.5 pr-3 pl-2 align-top">
                  <span className={cn("block font-semibold", l.tipo === "total" && "font-bold")}>
                    {l.item}
                  </span>
                  {l.como && <span className="block text-text-muted text-xs">{l.como}</span>}
                </td>
                <td
                  className={cn(
                    "tabular whitespace-nowrap py-2.5 pr-2 text-right align-top font-semibold",
                    l.tipo === "total" && "font-bold",
                  )}
                >
                  {l.valor}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Memoria() {
  const { estado } = useConsultor();
  const { p, hoje: h, pj: r } = useResultado();

  const hoje: Linha[] = [
    { item: "Salário bruto", como: "do contracheque", valor: brl(h.salario) },
    { item: "INSS", como: "tabela progressiva de 2026, de 7,5% a 14%", valor: negativo(h.inss) },
    {
      item: "IR",
      como: `${brl(h.ir.imposto)} pela tabela, menos ${brl(h.ir.reducao)} de desconto da Lei 15.270`,
      valor: negativo(h.ir.ir),
    },
    { item: "Líquido por mês", como: "salário − INSS − IR", valor: brl(h.liquido), tipo: "sub" },
    { item: "12 salários", como: "12 × líquido por mês", valor: brl(12 * h.liquido) },
    {
      item: "13º salário",
      como: p.recebe13Ferias ? "mesma conta do salário" : "não recebe",
      valor: brl(h.decimoTerceiro),
    },
    {
      item: "1/3 de férias",
      como: p.recebe13Ferias
        ? `${brl(h.terco.bruto)} bruto, menos ${brl(h.terco.inss)} de INSS e ${brl(h.terco.ir)} de IR a mais no mês das férias`
        : "não recebe",
      valor: brl(h.terco.liquido),
    },
    {
      item: "FGTS",
      como: p.temFgts ? "8% sobre salários, 13º e férias" : "não tem",
      valor: brl(h.fgts),
    },
    { item: "Líquido por ano", valor: brl(h.total), tipo: "total" },
    { item: "Média por mês", como: "líquido por ano ÷ 12", valor: brl(h.total / 12) },
  ];

  const pj: Linha[] = [
    { item: "Bruto mensal", como: "valor da nota num mês trabalhado", valor: brl(r.bruto) },
    {
      item: "Meses pagos no ano",
      como: `12 − (${numero(p.folgaDias, 0)} dias de folga + ${numero(p.feriadosDias, 0)} feriados) ÷ 21`,
      valor: numero(r.meses),
    },
    { item: "Faturamento anual", como: "bruto × meses pagos", valor: brl(r.receita), tipo: "sub" },
    {
      item: "Simples Nacional (DAS)",
      como: `Fator R ${numero(r.fatorR * 100, 1)}%, Anexo ${r.anexo}, alíquota efetiva ${numero(r.aliquota * 100)}% (faturamento do CNPJ: ${brl(r.rbt12, 0)} por ano)`,
      valor: negativo(r.das),
    },
    {
      item: "INSS do sócio",
      como: `11% de ${brl(Math.min(r.proLabore, REGRAS.inss.teto))} de pró-labore por mês (${DESCRICAO_PL[estado.empresa.proLaboreRegra]}), × 12`,
      valor: negativo(r.inssAno),
    },
    {
      item: "IR do pró-labore",
      como:
        r.irAno > 0.005
          ? `${brl(r.irMes)} por mês × 12`
          : "zero, porque pró-labore até R$ 5 mil é isento",
      valor: negativo(r.irAno),
    },
    {
      item: "Custos fixos",
      como: `(${brl(p.contador, 0)} contador + ${brl(p.taxas, 0)} taxas + ${brl(r.assinaturaMes, 0)} assinatura + ${brl(p.outros, 0)} outros) × 12`,
      valor: negativo(r.fixosAno),
    },
    { item: "Líquido por ano", valor: brl(r.liquido), tipo: "total" },
    { item: "Média por mês", como: "líquido por ano ÷ 12", valor: brl(r.liquido / 12) },
    {
      item: "Diferença sobre hoje",
      como: `${comSinal(r.liquido / 12 - h.total / 12, 2)} por mês, ${pct(h.total > 0 ? r.liquido / h.total - 1 : 0, 1)}`,
      valor: comSinal(r.liquido - h.total, 2),
      tipo: "total",
    },
    { item: "Como o dinheiro chega até você", valor: "", tipo: "grupo" },
    {
      item: "Pró-labore líquido",
      como: "pró-labore × 12 − INSS − IR",
      valor: brl(r.proLabore * 12 - r.inssAno - r.irAno),
    },
    {
      item: "Lucro distribuído",
      como: `faturamento − DAS − pró-labore − custos fixos, sem IR (${mil(r.lucro / 12)} por mês)`,
      valor: brl(r.lucro),
    },
  ];

  return (
    <Cartao titulo="Memória de cálculo">
      <div className="grid gap-8 lg:grid-cols-2">
        <Tabela titulo="Hoje" linhas={hoje} />
        <Tabela titulo="Como PJ" linhas={pj} />
      </div>
    </Cartao>
  );
}
