import { forwardRef } from "react";
import { LIMITES } from "../../dominio/estado.ts";
import { MoneyInput, type MoneyInputProps } from "../ui/MoneyInput";

/**
 * O campo de dinheiro das telas: o `MoneyInput` com o limite do sistema, para
 * ninguém digitar um valor que quebre o painel. As telas usam este, nunca o
 * `MoneyInput` direto.
 */
export const CampoDinheiro = forwardRef<HTMLInputElement, Omit<MoneyInputProps, "max">>(
  function CampoDinheiro(props, ref) {
    return <MoneyInput ref={ref} max={LIMITES.dinheiro} {...props} />;
  },
);
