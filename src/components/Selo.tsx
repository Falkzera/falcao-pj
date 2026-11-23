import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type TomDoSelo = "sucesso" | "atencao" | "perigo" | "info" | "neutro";

const TOM: Record<TomDoSelo, string> = {
  sucesso: "bg-success/12 text-success",
  atencao: "bg-warning/12 text-warning",
  perigo: "bg-danger/12 text-danger",
  info: "bg-info/12 text-info",
  neutro: "bg-bg-tertiary text-text-secondary",
};

/** Selo pequeno de estado. A cor nunca é a única pista: o texto diz o estado. */
export function Selo({
  tom,
  children,
  title,
}: {
  tom: TomDoSelo;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span className={cn("selo", TOM[tom])} title={title}>
      {children}
    </span>
  );
}
