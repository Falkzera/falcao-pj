import { Cartao } from "../../components/Tela";
import * as C from "../../dominio/calculo.ts";
import { useResultado } from "../../estado/ConsultorContext";
import { cn } from "../../lib/cn";
import { brl, pct } from "../../lib/formato";
import { brutosDosCenarios } from "./escala.ts";

const FORMAS = [
  { nome: "Sem folga", folga: 0, feriados: 0 },
  { nome: "Com folga", folga: 21, feriados: 0 },
  { nome: "Folga e feriados", folga: 21, feriados: 12 },
];

export function Cenarios() {
  const { p, hoje } = useResultado();
  const atual = Math.round(p.brutoMensal);
  const brutos = brutosDosCenarios(atual, p.teto);

  return (
    <Cartao
      titulo="Cenários"
      descricao={`Líquido por ano e diferença sobre hoje, ${p.teto > 0 ? "no teto" : "na proposta"} e em 90% e 80% ${p.teto > 0 ? "dele" : "dela"}. A célula marcada é a escolhida agora.`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-[0.9375rem]">
          <thead>
            <tr className="rotulo border-border border-b text-text-muted">
              <th scope="col" className="py-2 text-left font-bold">
                Bruto mensal
              </th>
              {FORMAS.map((f) => (
                <th key={f.nome} scope="col" className="py-2 text-right font-bold">
                  {f.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {brutos.map((g) => (
              <tr key={g} className="border-border-subtle border-b">
                <th scope="row" className="tabular py-2.5 text-left font-bold">
                  {brl(g, 0)}
                </th>
                {FORMAS.map((f) => {
                  const liquido = C.pj(
                    { ...p, folgaDias: f.folga, feriadosDias: f.feriados },
                    g,
                  ).liquido;
                  const d = hoje.total > 0 ? liquido / hoje.total - 1 : 0;
                  const marcada =
                    g === atual && f.folga === p.folgaDias && f.feriados === p.feriadosDias;
                  return (
                    <td
                      key={f.nome}
                      className={cn(
                        "rounded-2xl px-2 py-2.5 text-right",
                        marcada &&
                          "bg-[var(--cor-ceu-miolo)] ring-2 ring-[var(--tinta)] ring-inset",
                      )}
                    >
                      <span className="tabular font-semibold">{brl(liquido, 0)}</span>
                      <span
                        className={cn(
                          "tabular block font-bold text-xs",
                          d >= 0 ? "text-success" : "text-danger",
                        )}
                      >
                        {pct(d)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="text-text-secondary">
              <th scope="row" className="py-2.5 text-left font-semibold">
                Empate com hoje
              </th>
              {FORMAS.map((f) => {
                const b = C.empate(
                  { ...p, folgaDias: f.folga, feriadosDias: f.feriados },
                  hoje.total,
                );
                return (
                  <td key={f.nome} className="tabular py-2.5 text-right">
                    {b === null ? "não empata" : brl(b, 0)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </Cartao>
  );
}
