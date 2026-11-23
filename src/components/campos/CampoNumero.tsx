import { useEffect, useState } from "react";
import { Input, type InputProps } from "../ui/Input";

interface CampoNumeroProps extends Omit<InputProps, "value" | "onChange" | "type"> {
  valor: number;
  aoMudar: (valor: number) => void;
}

/**
 * Número inteiro ou decimal sem máscara (horas, dias, pessoas).
 *
 * Guarda o texto digitado enquanto o campo está em foco: sem isso, apagar o
 * número para digitar outro voltava na hora para "0" e empurrava o cursor.
 */
export function CampoNumero({ valor, aoMudar, onFocus, onBlur, ...resto }: CampoNumeroProps) {
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
        setTexto(e.target.value);
        const n = Number.parseFloat(e.target.value);
        aoMudar(Number.isFinite(n) ? n : 0);
      }}
    />
  );
}
