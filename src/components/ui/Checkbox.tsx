import { AnimatePresence, motion } from "framer-motion";
import {
  type ChangeEvent,
  type FocusEvent,
  forwardRef,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { useShakeOnError } from "../../hooks/useShakeOnError";
import { cn } from "../../lib/cn";
import { Field } from "./Field";

// ---------------------------------------------------------------------------
// Checkbox: Falcao System Design primitive
// ---------------------------------------------------------------------------
// Single-choice boolean control with label, optional description,
// indeterminate state, and error styling. Replaces every raw
// `<input type="checkbox">` in DespesaFilters, form modals, and the
// Widgets studio stubs.
//
// VISUAL LANGUAGE: MATCHES MULTISELECT INDICATOR
// -----------------------------------------------
// The checkbox square is intentionally IDENTICAL to the row indicator
// inside `<MultiSelect>`: same `rounded` corner, same `border-border
// bg-bg-tertiary` unchecked state, same `border-accent bg-accent` checked
// state, same white `Check` icon. A user who learned the shape in a
// MultiSelect popover recognizes it instantly in a form field. One
// visual, two contexts.
//
// SIZE
// ----
// Standalone Checkbox is `h-5 w-5` (20px): LARGER than the MultiSelect
// internal `h-4 w-4` (16px). A checkbox sitting in dense row inside a
// popover can get away with 16px; a standalone form field needs more
// mass to land reliably on mobile touch targets. The extra pixels also
// match the visual weight of `<Input>` and `<Select>` at `h-11`.
//
// INDETERMINATE
// -------------
// `indeterminate` is a real DOM property (not a React prop), so it's
// synced via `useEffect` on an inner ref. Visual: accent background
// (same as checked) + `Minus` icon instead of `Check`. Used for
// "parent of partial selection" patterns (e.g. "Select all" when some
// children are selected).
//
// API SHAPE: controlled first
// ----------------------------
// `checked` + `onChange` is the canonical form. No defaultChecked
// uncontrolled mode (same restraint as DatePicker/MoneyInput/Select,
// the simpler the contract, the fewer the surprises). `onChange`
// receives the NEW boolean (not the synthetic event), matching Switch.
//
// O ESTADO MORA EM `checked`, E `value` E O ID DA OPCAO
// -----------------------------------------------------
// Exatamente como no `<input type="checkbox">` nativo, e a distincao decide
// como este controle se liga ao formulario. Espalhar o pacote do <FormField>
// cru aqui, `<Checkbox {...campo} />`, joga o BOOLEANO em `value` e deixa
// `checked` undefined: a caixa nasce vazia e fica vazia enquanto o formulario
// guarda `true`. A forma certa tira o valor do pacote e devolve o resto:
//
//   <FormField name="termos" label="Politica interna">
//     {({ value, ...campo }) => (
//       <Checkbox {...campo} checked={value} label="Li e aceito" />
//     )}
//   </FormField>
//
// Uma linha, e nada se perde: `ref`, `onBlur`, `name`, `error`, `errorKey` e
// `disabled` continuam chegando pelo spread. Escrever campo por campo e o que
// custa caro, porque `ref` e `onBlur` sao os dois que ninguem lembra, e sao
// justamente os que levam o foco ao erro e ligam a validacao no blur.
//
// Por que a traducao NAO mora na ponte: renomear prop conforme o tipo do valor
// obrigaria o <FormField> a conhecer o vocabulario de cada primitivo, e o teste
// seria `typeof valor === "boolean"`, um teste de RUNTIME no lugar de um tipo.
// Um campo booleano sem valor inicial e `undefined` no primeiro render e `true`
// depois do primeiro clique, entao o pacote mudaria de forma junto com o dado.
// Hoje o compilador ja barra o spread cru aqui, porque `value` do pacote e
// booleano e `value` daqui e string: o erro aparece na linha exata da ligacao,
// que e melhor lugar do que qualquer comentario.
//
// E aqui NAO existe apelido `value?: boolean`: o <CheckboxGroup> usa `value`
// pro id da opcao, e dois significados pro mesmo nome na mesma familia custa
// mais caro que o problema que resolveria.
//
// LABEL + DESCRIPTION
// -------------------
// Both optional. `label` is the main click target next to the box;
// `description` is a smaller muted line below. The whole `<label>`
// wraps input + text so clicking anywhere toggles, native browser
// behavior, zero JS needed. Required marker is a red asterisk after
// the label text.
//
// ERROR
// -----
// `error` adds `border-danger` + `ring-2 ring-danger/20` to the box.
// Matches the danger chrome of Input/Select/DatePicker exactly.
//
// SIGNATURE ANIMATION: mirrors Switch iconic
// -------------------------------------------
// The Check glyph is a `motion.svg` whose path DRAWS ITSELF on enter:
// `pathLength` tweens 0 → 1 over 0.25s after an 80ms delay, while the
// svg itself fades + scales from (opacity 0, scale 0.5) to (1, 1) over
// 0.18s. Indeterminate uses the same choreography with a shorter
// horizontal stroke. `AnimatePresence mode="wait" initial={false}`
// gates the swap between check / minus / empty so the outgoing glyph
// finishes before the next one starts: no overlap, no flicker. The
// outer box also carries `whileTap={{ scale: 0.88 }}` for tactile
// feedback on click (disabled when `disabled`). Color transition on
// the box is 200ms so the border+bg shift syncs with the glyph fade.
//
// This is deliberately the SAME choreography as `<Switch iconic>`. The
// two controls should feel like siblings: a user who clicks one and
// sees a drawn stroke recognizes the language when they click the
// other. Details matter. Falcao is an artistic system, not a spec.
// ---------------------------------------------------------------------------

export interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  /**
   * O foco saiu da caixa. Opcional, e o que faz o `mode: "onTouched"` do
   * `useFalcaoForm` existir aqui: o <FormField> entrega um `onBlur` no pacote,
   * e uma lista FECHADA de props o descartava em silencio. Sem ele o campo
   * nunca ficava "tocado", a validacao no blur nao disparava e o check verde do
   * <Field> acendia sobre valor que o schema rejeita.
   */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  label?: ReactNode;
  description?: ReactNode;
  /**
   * String exibe a mensagem abaixo da linha, boolean so acende o cromo
   * vermelho. Entrar em erro treme a CAIXA, nao a linha inteira: sacudir uma
   * descricao de duas linhas junto vira ruido, e o alvo do olhar e o quadrado.
   */
  error?: string | boolean;
  /** Re-dispara o shake com a MESMA mensagem. Ver `useShakeOnError`. */
  errorKey?: number | string;
  /** Texto de apoio, abaixo da linha. Some enquanto houver erro. */
  hint?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  /**
   * Visual size preset.
   *
   * - `"md"` (default): `h-5 w-5` (20px). Matches the visual mass of
   *   `<Input h-11>` / `<Select h-11>` so form fields read as siblings.
   *   Use this inside form stacks: the description slot only looks right
   *   next to the larger box.
   * - `"sm"`: `h-4 w-4` (16px). For inline/compact contexts next to body
   *   text (e.g. "Lembrar-me" row on the Login card, table header
   *   "Select all" cells, dense filter chips). Box is re-calibrated to
   *   cap-align with `text-sm` (shifts `mt` to match the smaller box).
   */
  size?: "sm" | "md";
  name?: string;
  /** Id da OPCAO, como no input nativo. O estado marcado e `checked`. */
  value?: string;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

// Size-specific geometry. Kept as a const map: same shape as the rest of
// the system: so adding an `xs` or `lg` in the future is a one-line add.
// `mt` compensates for the box being visually off-cap when stacked to the
// top of a single-line `text-sm` label: `md` needs `mt-0.5` (2px) to bring
// its 20px box down onto the 14px cap-height line, `sm` needs `mt-[3px]`
// because its 16px box has its center 2px higher.
const SIZE_MAP: Record<
  NonNullable<CheckboxProps["size"]>,
  { box: string; svg: number; mt: string }
> = {
  md: { box: "h-5 w-5", svg: 12, mt: "mt-0.5" },
  sm: { box: "h-4 w-4", svg: 10, mt: "mt-[3px]" },
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    checked,
    indeterminate,
    onChange,
    onBlur,
    label,
    description,
    error,
    errorKey,
    hint,
    disabled,
    required,
    size = "md",
    name,
    value,
    id,
    className,
    "aria-label": ariaLabel,
  },
  ref,
) {
  const sizeCfg = SIZE_MAP[size];
  const innerRef = useRef<HTMLInputElement | null>(null);

  // `indeterminate` is a DOM property, not an HTML attribute, sync it
  // imperatively. Clearing it when the flag goes false is important or
  // the box stays visually half-checked after a toggle.
  useEffect(() => {
    if (innerRef.current) {
      innerRef.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  const setRef = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as { current: HTMLInputElement | null }).current = node;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  const showCheck = !!checked && !indeterminate;
  const showMinus = !!indeterminate;
  const isActive = showCheck || showMinus;

  const invalid = Boolean(error);
  const errorMessage = typeof error === "string" ? error : null;
  // O shake e da CAIXA, entao ele nasce aqui e nao no <Field>. Ver o comentario
  // na prop `error`.
  const shake = useShakeOnError(invalid, errorKey);

  const row = (
    <label
      className={cn(
        "inline-flex select-none items-start gap-2.5",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <motion.span
        animate={shake}
        className={cn(
          "relative flex shrink-0 items-center justify-center",
          sizeCfg.box,
          sizeCfg.mt,
        )}
        whileTap={disabled ? undefined : { scale: 0.88 }}
        transition={{ duration: 0.1 }}
      >
        <input
          ref={setRef}
          type="checkbox"
          checked={!!checked}
          disabled={disabled}
          required={required}
          name={name}
          value={value}
          id={id}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          onChange={handleChange}
          onBlur={onBlur}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "flex items-center justify-center rounded border transition-colors duration-200",
            sizeCfg.box,
            "border-border bg-bg-tertiary text-on-accent",
            isActive && "border-accent bg-accent-solid",
            // O anel PRECISA da cor: `ring-2` sozinho herda o
            // `--tw-ring-color` do preflight, que e azul, e o campo em erro
            // acendia halo AZUL exatamente onde a regra manda danger.
            invalid && "border-danger ring-2 ring-danger/20",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-accent-text",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {showMinus ? (
              <motion.svg
                key="minus"
                width={sizeCfg.svg}
                height={sizeCfg.svg}
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.18 }}
                aria-hidden
              >
                <motion.path
                  d="M5 12 L19 12"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={{ pathLength: 0 }}
                  transition={{ duration: 0.18, delay: 0.08 }}
                />
              </motion.svg>
            ) : showCheck ? (
              <motion.svg
                key="check"
                width={sizeCfg.svg}
                height={sizeCfg.svg}
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.18 }}
                aria-hidden
              >
                <motion.path
                  d="M5 12l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={{ pathLength: 0 }}
                  transition={{ duration: 0.25, delay: 0.08 }}
                />
              </motion.svg>
            ) : null}
          </AnimatePresence>
        </span>
      </motion.span>
      {(label || description) && (
        <span className="flex flex-col gap-0.5 leading-tight">
          {label && (
            <span className="text-sm text-text-primary">
              {label}
              {required && (
                <span className="ml-0.5 text-danger" aria-hidden>
                  *
                </span>
              )}
            </span>
          )}
          {description && <span className="text-text-muted text-xs">{description}</span>}
        </span>
      )}
    </label>
  );

  // Sem mensagem nem dica, o checkbox continua sendo exatamente o que era: um
  // `inline-flex` que cabe no meio de uma frase, sem bloco em volta. O <Field>
  // so entra quando ha texto pra pendurar embaixo, e entra com `shake={false}`
  // porque quem treme aqui e a caixa.
  if (!errorMessage && !hint) return row;

  return (
    <Field error={error} errorKey={errorKey} hint={hint} shake={false}>
      {row}
    </Field>
  );
});
