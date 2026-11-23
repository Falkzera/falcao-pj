import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { Field } from "./Field";
import { FIELD_CONTROL, fieldShellState } from "./fieldChrome";

// ---------------------------------------------------------------------------
// Textarea: o campo de texto longo que faltava.
//
// A casca NAO reusa `FIELD_SHELL`: aquela e `h-11` e centraliza o conteudo no
// eixo vertical, o que so faz sentido pra uma linha. Aqui a altura vem das
// linhas e o texto comeca no topo. O que se mantem identico ao resto da
// familia e o que o usuario le como "campo": raio, borda, fundo, anel e o
// mesmo gesto de erro.
// ---------------------------------------------------------------------------

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | boolean;
  errorKey?: number | string;
  label?: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  /** Preenchido e sem erro: o asterisco vira check. Ver <Field>. */
  valido?: boolean;
  /** Linhas visiveis. Default 4. */
  rows?: number;
  /**
   * Mostra o contador `123 / 500` no rodape do campo. Exige `maxLength`.
   * O contador vira danger nos ultimos 10% do limite, antes de estourar:
   * avisar depois de cortar o texto e tarde demais.
   */
  showCount?: boolean;
  /** Classes no bloco inteiro: rotulo, caixa e mensagem. */
  className?: string;
  /** Classes so na CAIXA do campo. */
  controlClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    error,
    errorKey,
    label,
    hint,
    required,
    valido,
    rows = 4,
    showCount,
    className,
    controlClassName,
    ...props
  },
  ref,
) {
  const max = props.maxLength;
  const used = typeof props.value === "string" ? props.value.length : 0;
  const nearLimit = Boolean(max) && used >= (max as number) * 0.9;

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      errorKey={errorKey}
      required={required}
      valido={valido}
      htmlFor={props.id}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <div
          className={cn(
            "w-full rounded-xl border bg-bg-tertiary px-4 py-3 transition-colors duration-200",
            fieldShellState(invalid, props.disabled),
            controlClassName,
          )}
        >
          <textarea
            ref={ref}
            rows={rows}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            className={cn(FIELD_CONTROL, "resize-y leading-relaxed")}
            {...props}
            id={id}
          />
          {showCount && max ? (
            <div
              className={cn(
                "pt-1 text-right font-mono text-[11px] tabular-nums",
                nearLimit ? "text-danger" : "text-text-muted",
              )}
              aria-live="polite"
            >
              {used} / {max}
            </div>
          ) : null}
        </div>
      )}
    </Field>
  );
});
