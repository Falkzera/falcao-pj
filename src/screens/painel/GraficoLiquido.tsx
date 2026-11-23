import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { Cartao } from "../../components/Tela";
import * as C from "../../dominio/calculo.ts";
import { useConsultor, useResultado } from "../../estado/ConsultorContext";
import { brl, mil, pct } from "../../lib/formato";
import { faixaDoBruto, marcasEntre } from "./escala.ts";

const TEXTO_EIXO = {
  fill: "var(--text-muted)",
  fontSize: 12,
  fontFamily: '"Barlow", system-ui, sans-serif',
};

function Dica({ active, payload, alvo }: TooltipProps<number, string> & { alvo: number }) {
  const ponto = payload?.[0]?.payload as { bruto: number; pj: number } | undefined;
  if (!active || !ponto) return null;
  return (
    <div className="rounded-2xl border-2 border-[var(--traco)] bg-bg-secondary px-3 py-2 text-sm shadow-[3px_3px_0_var(--labio)]">
      <p className="tabular font-bold text-text-primary">{brl(ponto.bruto, 0)} por mês</p>
      <p className="text-text-secondary">
        PJ: <span className="tabular">{brl(ponto.pj, 0)}</span> por ano
      </p>
      <p className="text-text-muted">{pct(ponto.pj / alvo - 1)} sobre hoje</p>
    </div>
  );
}

function Legenda({ comTeto }: { comTeto: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-text-secondary">
      <span className="inline-flex items-center gap-2">
        <i className="w-5 border-[var(--tinta)] border-t-[3px]" aria-hidden /> Líquido como PJ
      </span>
      <span className="inline-flex items-center gap-2">
        <i className="w-5 border-text-secondary border-t-2 border-dashed" aria-hidden /> Líquido
        hoje
      </span>
      <span className="inline-flex items-center gap-2">
        <i
          className="h-2.5 w-2.5 rounded-full border-2 border-text-secondary bg-bg-secondary"
          aria-hidden
        />{" "}
        Ponto de empate
      </span>
      {comTeto && (
        <span className="inline-flex items-center gap-2">
          <i className="w-5 border-text-muted border-t border-dotted" aria-hidden /> Teto do
          contratante
        </span>
      )}
    </div>
  );
}

/**
 * Líquido anual como PJ para cada bruto mensal, contra o líquido de hoje.
 *
 * A curva não depende do bruto escolhido, só dos outros parâmetros: arrastar o
 * controle move apenas o ponto, e a escala fica parada. Sem animação na linha,
 * porque ela redesenharia a cada passo do controle.
 */
export default function GraficoLiquido() {
  const { alterar } = useConsultor();
  const { p, hoje, pj, empate } = useResultado();
  const { brutoMensal: _escolhido, ...resto } = p;
  const chave = JSON.stringify(resto);
  const faixa = faixaDoBruto(p.salario, p.teto);
  const { de: X0, ate: X1 } = faixa;

  // biome-ignore lint/correctness/useExhaustiveDependencies: a chave resume tudo o que a curva usa
  const dados = useMemo(() => {
    const pontos: { bruto: number; pj: number }[] = [];
    for (let g = X0; g <= X1; g += faixa.passo) pontos.push({ bruto: g, pj: C.pj(p, g).liquido });
    return pontos;
  }, [chave]);

  // Escala do eixo vertical: da curva e da linha de hoje, com folga e em degraus de 10 mil.
  // Começar no zero achatava a reta e escondia a diferença que interessa.
  const valores = [...dados.map((d) => d.pj), hoje.total];
  const dominio: [number, number] = [
    Math.floor((Math.min(...valores) - 5000) / 10000) * 10000,
    Math.ceil((Math.max(...valores) + 5000) / 10000) * 10000,
  ];
  const marcasY = marcasEntre(dominio[0], dominio[1], 6);

  const escolher = (bruto: number) =>
    alterar((r) => {
      r.contrato.brutoMensal.valor = Math.round(bruto / 50) * 50;
    });

  return (
    <Cartao
      titulo="Líquido por ano conforme o bruto"
      descricao="Passe o mouse para ver cada valor. Clique no gráfico para escolher o bruto mensal."
    >
      <Legenda comTeto={p.teto > 0} />
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dados}
            margin={{ top: 28, right: 20, bottom: 8, left: 4 }}
            onClick={(estadoDoClique) => {
              const rotulo = estadoDoClique?.activeLabel;
              if (rotulo !== undefined) escolher(Number(rotulo));
            }}
            className="cursor-crosshair"
          >
            <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
            <XAxis
              dataKey="bruto"
              type="number"
              domain={[X0, X1]}
              ticks={faixa.marcas}
              tickFormatter={(v: number) => `${v / 1000} mil`}
              tick={TEXTO_EIXO}
              tickLine={false}
              axisLine={{ stroke: "var(--border-default)" }}
            />
            <YAxis
              domain={dominio}
              ticks={marcasY}
              allowDataOverflow
              tickFormatter={(v: number) => `${Math.round(v / 1000)} mil`}
              tick={TEXTO_EIXO}
              tickLine={false}
              axisLine={false}
              width={58}
            />
            <Tooltip
              content={<Dica alvo={hoje.total} />}
              cursor={{ stroke: "var(--text-muted)" }}
              isAnimationActive={false}
            />
            {p.teto > 0 && (
              <ReferenceLine
                x={p.teto}
                stroke="var(--text-muted)"
                strokeDasharray="3 4"
                label={{ value: "teto", position: "top", fill: "var(--text-muted)", fontSize: 11 }}
              />
            )}
            <ReferenceLine
              y={hoje.total}
              stroke="var(--text-secondary)"
              strokeDasharray="6 5"
              label={{
                value: `Hoje ${mil(hoje.total)}`,
                position: "insideTopLeft",
                fill: "var(--text-secondary)",
                fontSize: 11,
              }}
            />
            <Line
              type="linear"
              dataKey="pj"
              stroke="var(--tinta)"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 5, fill: "var(--cor-ceu)", stroke: "var(--marinho)", strokeWidth: 2 }}
            />
            {empate !== null && empate >= X0 && empate <= X1 && (
              <ReferenceDot
                x={empate}
                y={hoje.total}
                r={5}
                fill="var(--bg-secondary)"
                stroke="var(--text-secondary)"
                strokeWidth={2}
                label={{
                  value: `empate ${brl(empate, 0)}`,
                  position: "bottom",
                  fill: "var(--text-secondary)",
                  fontSize: 11,
                }}
              />
            )}
            {p.brutoMensal >= X0 && p.brutoMensal <= X1 && (
              <ReferenceDot
                x={p.brutoMensal}
                y={pj.liquido}
                r={6}
                fill="var(--cor-ouro)"
                stroke="var(--marinho)"
                strokeWidth={2.5}
                label={{
                  value: mil(pj.liquido),
                  position: "left",
                  fill: "var(--text-primary)",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Cartao>
  );
}
