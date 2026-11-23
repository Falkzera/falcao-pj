import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "../lib/cn";
import { MOLA } from "../lib/movimento";

export interface Segmento<T extends string> {
  value: T;
  label: string;
  /** O nome lido pelo leitor de tela, quando o rótulo curto não diz tudo ("10" e "10 questões"). */
  nome?: string;
}

/**
 * Escolha única em segmentos lado a lado, para poucas opções curtas (formato, quantidade,
 * ordem). A pílula da seleção desliza até o escolhido, como nos chips.
 */
export function Segmentos<T extends string>({
  opcoes,
  value,
  onChange,
  "aria-label": rotulo,
  compacto = false,
  className,
}: {
  opcoes: readonly Segmento<T>[];
  value: T;
  onChange: (v: T) => void;
  "aria-label": string;
  compacto?: boolean;
  className?: string;
}) {
  const grupo = useId();
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className={cn("segmentos", compacto && "segmentos-compactos", className)}
    >
      {opcoes.map((o) => {
        const ativo = value === o.value;
        return (
          <motion.button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={ativo}
            aria-label={o.nome}
            onClick={() => onChange(o.value)}
            data-afunda="0.95"
            className={cn("segmento", ativo && "segmento-ativo")}
          >
            {ativo && (
              <motion.span
                layoutId={`segmento-${grupo}`}
                className="chip-ativo-fundo"
                transition={MOLA}
              />
            )}
            <span className="relative">{o.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
