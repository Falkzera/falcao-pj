import { useEffect, useState } from "react";
import { Input, type InputProps } from "../ui/Input";

interface CampoNumeroProps extends Omit<InputProps, "value" | "onChange" | "type" | "min" | "max"> {
  valor: number;
  aoMudar: (valor: number) => void;
  min?: number;
  /** Obrigatório: número sem teto deixava digitar o que quebrasse a tela. */
  max: number;
}

/**
 * Número inteiro ou decimal sem máscara (horas, dias, pessoas).
 *
 * Guarda o texto digitado enquanto o campo está em foco: sem isso, apagar o
 * número para digitar outro voltava na hora para "0" e empurrava o cursor.
 * O que passa do máximo vira o máximo, e abaixo do mínimo a conta usa o mínimo.
 */
export function CampoNumero({
  valor,
  aoMudar,
  min = 0,
  max,
  onFocus,
  onBlur,
  ...resto
}: CampoNumeroProps) {
  const [texto, setTexto] = useState(String(valor));
  const [focado, setFocado] = useState(false);

  useEffect(() => {
    if (!focado) setTexto(String(valor));
  }, [valor, focado]);

  return (
    <Input
      {...resto}
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      value={texto}
      onFocus={(e) => {
        setFocado(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocado(false);
        onBlur?.(e);
      }}
      onChange={(e) => {
        const n = Number.parseFloat(e.target.value);
        if (n > max) {
          setTexto(String(max));
          aoMudar(max);
          return;
        }
        setTexto(e.target.value);
        aoMudar(Number.isFinite(n) ? Math.max(min, n) : min);
      }}
    />
  );
}
