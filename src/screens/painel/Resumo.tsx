import { Bank, Briefcase, Clock, type Icon, Scales } from "@phosphor-icons/react";
import { Selo, type TomDoSelo } from "../../components/Selo";
import { useResultado } from "../../estado/ConsultorContext";
import { brl, numero, pct } from "../../lib/formato";

function veredito(diferenca: number): { tom: TomDoSelo; rotulo: string } {
  if (diferenca >= 0.15) return { tom: "sucesso", rotulo: "Compensa" };
  if (diferenca >= 0) return { tom: "atencao", rotulo: "Margem pequena" };
  return { tom: "perigo", rotulo: "Perde para hoje" };
}

function Numero({
  titulo,
  valor,
  detalhe,
  Icone,
  destaque,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  Icone: Icon;
  destaque?: string;
}) {
  return (
    <div className="cartao flex flex-col gap-2 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="rotulo text-text-muted">{titulo}</p>
        <Icone size={20} className="shrink-0 text-text-muted" aria-hidden />
      </div>
      <p className="display tabular text-[2.25rem] text-text-primary">{valor}</p>
      {/* Uma linha cada, sem quebra: a altura do cartão não muda com o valor. */}
      <p className="truncate text-sm text-text-secondary">{detalhe}</p>
      {destaque && (
        <p>
          <span className="selo whitespace-nowrap bg-[var(--cor-ouro-miolo)] text-[var(--marinho)]">
            {destaque}
          </span>
        </p>
      )}
    </div>
  );
}

/**
 * Resumo no topo do painel.
 *
 * ALTURA FIXA de propósito: este bloco fica acima do gráfico, e qualquer coisa
 * que apareça ou suma aqui enquanto o controle deslizante se move empurra o
 * gráfico para cima e para baixo. Por isso a linha do veredito é uma linha só
 * (o texto corta, não quebra) e os avisos moram abaixo do gráfico.
 */
export function Resumo() {
  const { p, hoje, pj, empate, diferenca } = useResultado();
  const v = veredito(diferenca);
  const hora = p.horasMes > 0 ? p.brutoMensal / p.horasMes : 0;

  return (
    <section aria-label="Resumo" className="space-y-4">
      <div className="flex h-7 items-center gap-3">
        <Selo tom={v.tom}>{v.rotulo}</Selo>
        <p className="min-w-0 truncate text-sm text-text-secondary">
          Com {brl(p.brutoMensal, 0)} por mês e {numero(pj.meses)} meses pagos no ano, no Anexo{" "}
          {pj.anexo}.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Numero
          titulo="Líquido por ano como PJ"
          valor={brl(pj.liquido, 0)}
          detalhe={`${brl(pj.liquido / 12, 0)} por mês`}
          destaque={`${pct(diferenca)} sobre hoje`}
          Icone={Briefcase}
        />
        <Numero
          titulo="Líquido por ano hoje"
          valor={brl(hoje.total, 0)}
          detalhe={`${brl(hoje.total / 12, 0)} por mês`}
          Icone={Bank}
        />
        <Numero
          titulo="Bruto que empata com hoje"
          valor={empate === null ? "acima de 60 mil" : brl(empate, 0)}
          detalhe={
            empate === null || p.horasMes <= 0 ? "por mês" : `${brl(empate / p.horasMes)} por hora`
          }
          Icone={Scales}
        />
        <Numero
          titulo="Valor da hora"
          valor={brl(hora)}
          detalhe={`com ${numero(p.horasMes, 0)} h por mês`}
          Icone={Clock}
        />
      </div>
    </section>
  );
}
