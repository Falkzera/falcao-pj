import { lazy, Suspense } from "react";
import { Tela } from "../../components/Tela";
import { AcoesDosDados } from "./AcoesDosDados";
import { Avisos } from "./Avisos";
import { Cenarios } from "./Cenarios";
import { Composicao } from "./Composicao";
import { Memoria } from "./Memoria";
import { Resumo } from "./Resumo";
import { Simulacao } from "./Simulacao";

// Recharts pesa uns 250 KB: entra sob demanda, com um bloco do mesmo tamanho no lugar.
const GraficoLiquido = lazy(() => import("./GraficoLiquido"));

/**
 * Ordem da coluna da direita: gráfico primeiro, avisos depois. Nada acima do
 * gráfico muda de altura enquanto o controle deslizante se move, então o ponto
 * que a pessoa está olhando não sai do lugar.
 */
export default function PainelScreen() {
  return (
    <Tela
      titulo="Vale a pena ir para PJ?"
      descricao="O que sobra por ano como PJ, contra o que você recebe hoje com carteira assinada ou em cargo comissionado."
      acoes={<AcoesDosDados />}
    >
      <Resumo />
      <div className="grid items-start gap-6 lg:grid-cols-[24rem_minmax(0,1fr)]">
        <Simulacao />
        <div className="min-w-0 space-y-6">
          <Suspense
            fallback={<div className="h-[30rem] animate-pulse rounded-[28px] bg-bg-tertiary" />}
          >
            <GraficoLiquido />
          </Suspense>
          <Avisos />
          <Composicao />
          <Cenarios />
        </div>
      </div>
      <Memoria />
    </Tela>
  );
}
