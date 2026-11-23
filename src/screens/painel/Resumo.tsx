import type { ReactNode } from "react";
import { Selo, type TomDoSelo } from "../../components/Selo";
import { useResultado } from "../../estado/ConsultorContext";
import { cn } from "../../lib/cn";
import { brl, comSinal, numero, pct } from "../../lib/formato";

function veredito(diferenca: number): { tom: TomDoSelo; rotulo: string } {
  if (diferenca >= 0.15) return { tom: "sucesso", rotulo: "Compensa" };
  if (diferenca >= 0) return { tom: "atencao", rotulo: "Margem pequena" };
  return { tom: "perigo", rotulo: "Perde para hoje" };
}

/**
 * Um bloco do placar: o valor por ano em destaque, a média por mês logo abaixo e uma
 * nota. Cada linha é uma linha só, para a altura não mudar com o valor.
 */
function Bloco({
  rotulo,
  ano,
  mes,
  nota,
  porAno = "por ano",
  porMes = "por mês",
  cor = "text-text-primary",
  className,
}: {
  rotulo: string;
  ano: string;
  mes: string;
  nota: ReactNode;
  porAno?: string;
  porMes?: string;
  cor?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5 p-5 sm:p-6", className)}>
      <p className="rotulo truncate text-text-muted">{rotulo}</p>
      <p className="flex items-baseline gap-2 overflow-hidden whitespace-nowrap">
        <span className={cn("display tabular text-[2.25rem] lg:text-[2.5rem]", cor)}>{ano}</span>
        <span className="text-sm text-text-muted">{porAno}</span>
      </p>
      <p className="flex items-baseline gap-2 overflow-hidden whitespace-nowrap">
        <span className={cn("tabular font-bold text-xl", cor)}>{mes}</span>
        <span className="text-sm text-text-muted">{porMes}</span>
      </p>
      <div className="flex h-6 min-w-0 items-center text-sm text-text-secondary">
        <span className="min-w-0 truncate">{nota}</span>
      </div>
    </div>
  );
}

/**
 * Resumo no topo do painel: o placar (hoje, como PJ e a diferença, por ano e por mês)
 * e, ao lado, o bruto que empata, com o valor da hora dele e o da proposta.
 *
 * ALTURA FIXA de propósito: este bloco fica acima do gráfico, e qualquer coisa
 * que apareça ou suma aqui enquanto o controle deslizante se move empurra o
 * gráfico para cima e para baixo. Por isso cada linha é uma linha só (o texto
 * corta, não quebra) e os avisos moram abaixo do gráfico.
 */
export function Resumo() {
  const { p, hoje, pj, empate, diferenca } = useResultado();
  const v = veredito(diferenca);
  const hora = p.horasMes > 0 ? p.brutoMensal / p.horasMes : 0;
  const ganho = pj.liquido - hoje.total;
  const corDoGanho = ganho >= 0 ? "text-success" : "text-danger";

  return (
    <section aria-label="Resumo" className="space-y-4">
      <div className="flex h-7 items-center gap-3">
        <Selo tom={v.tom}>{v.rotulo}</Selo>
        <p className="min-w-0 truncate text-sm text-text-secondary">
          Com {brl(p.brutoMensal, 0)} por mês e {numero(pj.meses)} meses pagos no ano, no Anexo{" "}
          {pj.anexo}.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <div className="cartao grid divide-y-2 divide-border-subtle overflow-hidden lg:grid-cols-3 lg:divide-x-2 lg:divide-y-0">
          <Bloco
            rotulo="Hoje, líquido"
            ano={brl(hoje.total, 0)}
            mes={brl(hoje.total / 12, 0)}
            nota={
              p.recebe13Ferias
                ? `média com 13º e férias${p.temFgts ? ", e o FGTS" : ""}`
                : "o salário líquido do mês"
            }
          />
          <Bloco
            rotulo="Como PJ, líquido"
            ano={brl(pj.liquido, 0)}
            mes={brl(pj.liquido / 12, 0)}
            nota="média dos 12 meses, sem impostos e custos"
          />
          <Bloco
            rotulo="Diferença sobre hoje"
            ano={comSinal(ganho)}
            mes={comSinal(ganho / 12)}
            cor={corDoGanho}
            className="bg-[var(--cor-ouro-miolo)]"
            nota={<Selo tom={ganho >= 0 ? "sucesso" : "perigo"}>{pct(diferenca)} sobre hoje</Selo>}
          />
        </div>
        <div className="cartao">
          <Bloco
            rotulo="Bruto que empata com hoje"
            ano={empate === null ? "acima de 60 mil" : brl(empate, 0)}
            porAno="por mês"
            mes={empate === null || p.horasMes <= 0 ? "" : brl(empate / p.horasMes)}
            porMes="a hora"
            nota={`a proposta paga ${brl(hora)} a hora`}
          />
        </div>
      </div>
    </section>
  );
}
