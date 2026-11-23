import { motion, useReducedMotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { ENTRADA } from "../lib/movimento";

/**
 * O miolo de uma tela, com o título no jeito do Questões (Barlow Condensed,
 * extranegrito). Entra com um fade curto e 8 px de subida, sem saída animada.
 */
export function Tela({
  titulo,
  descricao,
  acoes,
  children,
  className,
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  // Com "reduzir movimento" a tela já nasce no lugar, como a barra de baixo.
  const reduzir = useReducedMotionConfig();
  return (
    <motion.div
      initial={reduzir ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={ENTRADA}
      className={cn("space-y-6", className)}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="display text-[2rem] text-text-primary lg:text-[2.5rem]">{titulo}</h1>
          {descricao && (
            <p className="max-w-2xl text-[1.0625rem] text-text-secondary">{descricao}</p>
          )}
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
      {children}
    </motion.div>
  );
}

/** Um cartão de conteúdo com título de seção. */
export function Cartao({
  titulo,
  descricao,
  children,
  className,
}: {
  titulo?: ReactNode;
  descricao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("cartao space-y-4 p-5 sm:p-6", className)}>
      {(titulo || descricao) && (
        <div className="space-y-1">
          {titulo && <h2 className="titulo-secao">{titulo}</h2>}
          {descricao && <p className="text-sm text-text-muted">{descricao}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
