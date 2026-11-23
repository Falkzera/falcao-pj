import { Plus, X } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
import { BotaoAdesivo } from "../../components/BotaoAdesivo";
import { CampoDinheiro } from "../../components/campos/CampoDinheiro";
import { LIMITES, TIPOS_DE_GASTO, type TipoDeGasto } from "../../dominio/estado.ts";
import { useConsultor } from "../../estado/ConsultorContext";

const TIPOS = Object.entries(TIPOS_DE_GASTO) as [TipoDeGasto, string][];

/**
 * Os gastos além do contador e das taxas, numa lista. "Adicionar gasto" abre os tipos;
 * o escolhido vira uma linha com o valor do mês, e o foco vai direto para o valor.
 * Cada um põe só a parte que paga: uma assinatura dividida entre quatro entra pela quarta parte.
 */
export function OutrosGastos() {
  const { estado, alterar } = useConsultor();
  const gastos = estado.custos.gastos;
  const [escolhendo, setEscolhendo] = useState(false);
  const [focar, setFocar] = useState<number | null>(null);
  const valores = useRef<(HTMLInputElement | null)[]>([]);
  const botao = useRef<HTMLButtonElement>(null);
  const idDosTipos = useId();
  const cheio = gastos.length >= LIMITES.gastos;

  useEffect(() => {
    if (focar === null) return;
    valores.current[focar]?.focus();
    setFocar(null);
  }, [focar]);

  function adicionar(tipo: TipoDeGasto) {
    alterar((r) => {
      r.custos.gastos.push({ tipo, valor: 0 });
    });
    setEscolhendo(false);
    setFocar(gastos.length);
  }

  function remover(i: number) {
    alterar((r) => {
      r.custos.gastos.splice(i, 1);
    });
    botao.current?.focus();
  }

  function fecharTipos() {
    setEscolhendo(false);
    botao.current?.focus();
  }

  return (
    <div className="space-y-3">
      <p className="font-semibold text-sm text-text-secondary">Outros gastos</p>
      {gastos.length > 0 ? (
        <ul className="space-y-3">
          {gastos.map((g, i) => (
            <li key={i} className="flex items-end gap-2">
              <CampoDinheiro
                ref={(el) => {
                  valores.current[i] = el;
                }}
                className="min-w-0 flex-1"
                label={TIPOS_DE_GASTO[g.tipo]}
                value={g.valor}
                onChange={(n) =>
                  alterar((r) => {
                    r.custos.gastos[i].valor = n ?? 0;
                  })
                }
              />
              <BotaoAdesivo
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0"
                aria-label={`Remover ${TIPOS_DE_GASTO[g.tipo]}`}
                onClick={() => remover(i)}
              >
                <X size={18} weight="bold" />
              </BotaoAdesivo>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text-muted text-xs">
          Assinatura, plano de saúde, equipamento e o que mais sair todo mês por causa do trabalho.
        </p>
      )}
      <BotaoAdesivo
        ref={botao}
        variant="outline"
        size="sm"
        disabled={cheio}
        aria-expanded={escolhendo}
        aria-controls={escolhendo ? idDosTipos : undefined}
        onClick={() => setEscolhendo((aberto) => !aberto)}
      >
        <Plus size={16} weight="bold" /> Adicionar gasto
      </BotaoAdesivo>
      {cheio && <p className="text-text-muted text-xs">A lista vai até {LIMITES.gastos} gastos.</p>}
      {escolhendo && (
        <fieldset
          id={idDosTipos}
          onKeyDown={(e) => {
            if (e.key === "Escape") fecharTipos();
          }}
        >
          <legend className="sr-only">Tipo do gasto</legend>
          <div className="flex flex-wrap gap-2">
            {TIPOS.map(([tipo, nome]) => (
              <button
                key={tipo}
                type="button"
                onClick={() => adicionar(tipo)}
                className="chip rounded-full bg-bg-secondary px-3 py-1.5 font-semibold text-sm text-text-primary hover:bg-bg-tertiary"
              >
                {nome}
              </button>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
