import {
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEventHandler,
  forwardRef,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../../lib/cn";
import { Field } from "./Field";
import { fieldShellState } from "./fieldChrome";
import { formatCentsBRL, nextCents, parsePasteToReais, withinMax } from "./moneyMask";

// ---------------------------------------------------------------------------
// MoneyInput (BRL): canonical Falcao System Design primitive
// ---------------------------------------------------------------------------
// Right-to-left, mask-as-you-type currency input. The user NEVER types a
// decimal separator. Every digit pressed is the NEW rightmost cent. This
// is the pattern every serious Brazilian finance app uses (Nubank, iFood,
// Inter, MercadoPago) and it is dramatically faster than "type 1234,56 with
// a manual comma" for the entry volume a family has per month.
//
// INTERNAL MODEL
// --------------
// State is a single integer: `cents` (number | null). Null means "never
// touched / cleared", displayed as an empty input with the `R$ 0,00`
// placeholder. Any number (including 0) means the user has an explicit
// value and the formatted string is shown.
//
// Every keystroke path:
//
//   1. Browser fires `onChange` with the mutated `input.value`.
//   2. Strip ALL non-digits (we're treating the whole string as
//      digit-only; commas/periods/letters/spaces are ignored noise).
//   3. Parse the remaining digit string as an integer, that's the new
//      `cents` value. Empty string → `null`. Acima do `max`, a tecla e
//      ignorada e o valor fica como estava (`nextCents` em moneyMask.ts).
//   4. `setCents()` + `onChange?.(cents / 100)`.
//   5. Next render: `value` prop on the input is the re-formatted string.
//   6. `useLayoutEffect` forces the caret to the END of the input so
//      typing always continues at the rightmost cent slot.
//
// Caret-to-end is non-negotiable: it's what makes the whole mask feel
// natural. If the user moves the caret to the middle and types, the
// effect snaps it back to the end after re-render. The new digit is still
// parsed (we strip all digits regardless of position), so no information
// is lost; the caret just lands where the user needs it next.
//
// EXTERNAL API
// ------------
// - `value: number | null`, in REAIS (float), not cents. Null = empty.
//   Consumers use BRL floats everywhere (`formatBRL(1234.56)`), so the
//   public contract matches. Internal cents arithmetic is an implementation
//   detail: it avoids JS float precision bugs at the expense of one
//   divide/multiply at the boundary.
// - `onChange: (value: number | null) => void`, fires on every keystroke.
//   Null emitted on explicit clear. 0 emitted when the user has typed
//   enough to land on exact zero (e.g. backspacing from 0,01). This is
//   intentional: 0 is a real value, null is "not set".
//
// PASTE HANDLING: the one place we DO infer format
// -------------------------------------------------
// `Ctrl+V` expectations differ from typing. If the user pastes
// `R$ 1.234,56` from a spreadsheet they expect `1234.56` reais, NOT
// `12.345.600` cents. So `onPaste` is intercepted by a separate parser:
//
//   - Strip everything except digits, `,` and `.`.
//   - If there's a `,` or `.` followed by EXACTLY 1 or 2 digits at the
//     end → that's the decimal separator. Everything before is reais;
//     thousand separators (the other kind of `,`/`.`) are stripped.
//   - Otherwise (no trailing 1-2 digit group), the paste is integer reais.
//
// Test table:
//   "R$ 1.234,56" → 1234.56  (comma is decimal, dot is thousands)
//   "1234,56"     → 1234.56
//   "1234.56"     → 1234.56
//   "1234,5"      → 1234.50  (1 decimal digit is valid)
//   "1234"        → 1234.00  (no decimal → integer reais)
//   "1.234"       → 1234.00  (3 digits after dot → thousands separator)
//   "1.234.567"   → 1234567.00
//   "1.234.567,89"→ 1234567.89
//   "abc"         → null (no-op, current value preserved)
//
// SIGN
// ----
// v1 is UNSIGNED. Despesas are positive (the sign comes from category +
// tipo, not from the amount). Receitas are positive. Meta adjustments and
// transfers may eventually need signed input, at which point we add
// `allowNegative` prop: not before. YAGNI.
//
// NO ICON, NO SIGNATURE ANIMATION
// -------------------------------
// The `R$` is already visible in the mask; adding a `DollarSign` lucide
// icon on the left would be redundant chrome. And the typing flow itself
// (digits "rolling in" from the right as the user types) IS the signature
// gesture: adding scale bounces or color flashes on top would be noise.
// This follows the same restraint discipline as KpiCard and Card.
// ---------------------------------------------------------------------------

export interface MoneyInputProps {
  /** Current value in REAIS (float), or null for "not set". */
  value?: number | null;
  /**
   * Fires on every keystroke. `null` on explicit clear. `0` when the user
   * has typed themselves down to exactly zero (not the same as cleared).
   */
  onChange?: (value: number | null) => void;
  /**
   * Avisa que o foco saiu do campo. Com o `mode: "onTouched"` do
   * `useFalcaoForm` e ele quem manda o schema julgar o campo.
   *
   * Aqui o blur NATIVO ja e o momento certo, ao contrario do <Select> e do
   * <MultiSelect>: o controle e um <input> de verdade, o foco nunca passa por
   * painel flutuante nenhum, entao sair do input e sair do campo. Recebe o
   * evento, como no <Input>, que estende as props nativas.
   */
  onBlur?: FocusEventHandler<HTMLInputElement>;
  /** Placeholder shown when the input is empty. Default: `"R$ 0,00"`. */
  placeholder?: string;
  /**
   * String exibe a mensagem abaixo do campo, boolean so acende o cromo
   * vermelho. Entrar em erro dispara o shake.
   */
  error?: string | boolean;
  /** Re-dispara o shake com a MESMA mensagem. Ver `useShakeOnError`. */
  errorKey?: number | string;
  /** Optional label above the field, matches `<Input>`. */
  label?: ReactNode;
  /** Texto de apoio. Some enquanto houver erro. */
  hint?: ReactNode;
  required?: boolean;
  /** Preenchido e sem erro: o asterisco vira check. Ver <Field>. */
  valido?: boolean;
  /** Classes so na CAIXA do campo. */
  controlClassName?: string;
  /** Disable the whole control. */
  disabled?: boolean;
  /**
   * Maior valor aceito, em REAIS. O digito que passaria dele e ignorado, como
   * nos apps de banco, e a colagem acima dele tambem.
   */
  max?: number;
  className?: string;
  /** `aria-label` on the input. */
  "aria-label"?: string;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  {
    value,
    onChange,
    onBlur,
    placeholder = "R$ 0,00",
    error,
    errorKey,
    hint,
    required,
    valido,
    label,
    disabled,
    max,
    className,
    controlClassName,
    "aria-label": ariaLabel,
  },
  ref,
) {
  const [cents, setCents] = useState<number | null>(() =>
    value != null ? Math.round(value * 100) : null,
  );
  const innerRef = useRef<HTMLInputElement | null>(null);

  // Sync external value → internal cents when they actually diverge.
  // Reference equality check prevents clobbering user input mid-typing
  // in the controlled/uncontrolled hybrid flow.
  useEffect(() => {
    const expected = value != null ? Math.round(value * 100) : null;
    setCents((current) => (current === expected ? current : expected));
  }, [value]);

  // Force the caret to the END of the input after every cents change.
  // Only run when the input is actually focused: we don't want to
  // steal focus on initial mount or on external value resets.
  //
  // `cents` nao e lido dentro do efeito: quem o efeito le e o DOM ja
  // re-renderizado (`el.value`). Ele esta na lista SO como gatilho. O fix
  // automatico do Biome esvazia a lista, o efeito passa a rodar so na
  // montagem, e o cursor deixa de voltar pro fim a cada digito: sem isso a
  // mascara da direita pra esquerda para de funcionar no segundo caractere.
  // biome-ignore lint/correctness/useExhaustiveDependencies: gatilho intencional, ver acima
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (document.activeElement !== el) return;
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [cents]);

  const display = cents == null ? "" : formatCentsBRL(cents);

  const commitCents = (next: number | null) => {
    setCents(next);
    onChange?.(next == null ? null : next / 100);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = nextCents(e.target.value, cents, max);
    // Igual ao atual (digito alem do limite): nao muda nada, e o React devolve
    // ao campo o texto formatado que ja estava.
    if (next !== cents) commitCents(next);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    const reais = parsePasteToReais(pasted);
    if (reais == null) return; // fall through to default paste (then handleChange)
    e.preventDefault();
    const next = Math.round(reais * 100);
    if (withinMax(next, max)) commitCents(next);
  };

  const setRef = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as { current: HTMLInputElement | null }).current = node;
  };

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      errorKey={errorKey}
      required={required}
      valido={valido}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <div
          className={cn(
            "flex h-11 w-full items-center rounded-xl border px-4",
            "bg-bg-tertiary transition-colors duration-200",
            fieldShellState(invalid, disabled),
            controlClassName,
          )}
        >
          <input
            ref={setRef}
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={display}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={label ? undefined : (ariaLabel ?? "Valor")}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            onChange={handleChange}
            // Vai DIRETO pro consumidor, sem handler interno na frente: a
            // mascara roda a cada tecla (`handleChange` reformata e o
            // `useLayoutEffect` recoloca o cursor), entao nao sobra formatacao
            // pendente pro blur resolver. No dia em que sobrar, este ponto
            // compoe (interno primeiro, consumidor depois) em vez de trocar.
            onBlur={onBlur}
            onPaste={handlePaste}
            className={cn(
              "h-full w-full bg-transparent text-sm text-text-primary",
              "tabular-nums outline-none placeholder:text-text-muted",
              "disabled:cursor-not-allowed",
            )}
          />
        </div>
      )}
    </Field>
  );
});
