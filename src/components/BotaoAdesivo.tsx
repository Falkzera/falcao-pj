import { forwardRef } from "react";
import { cn } from "../lib/cn";
import { Button, type ButtonProps, type ButtonVariant } from "./ui/Button";

// ---------------------------------------------------------------------------
// O botão do app com traço e sombra dura: o `Button` de ui/, sem alteração, com o jeito do
// adesivo nas variantes que têm fundo ou contorno (o principal, o de contorno e o de apagar).
// O sem fundo (`ghost`) e o link ficam como vêm. O desenho mora em styles/adesivo.css
// (`botao-adesivo` e a classe do jeito), e o afundar no toque, em lib/afundar.ts, que
// reconhece a classe.
// ---------------------------------------------------------------------------

/** As variantes com fundo ou contorno e o nome do jeito de cada uma em adesivo.css. */
const JEITO: Partial<Record<ButtonVariant, string>> = {
  default: "botao-adesivo-principal",
  outline: "botao-adesivo-contorno",
  destructive: "botao-adesivo-apagar",
};

export const BotaoAdesivo = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const jeito = JEITO[props.variant ?? "default"];
  return (
    <Button
      {...props}
      ref={ref}
      className={cn(jeito && ["botao-adesivo", jeito], props.className)}
    />
  );
});
BotaoAdesivo.displayName = "BotaoAdesivo";
