import { Eye, EyeSlash } from "@phosphor-icons/react";
import {
  type ComponentType,
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useState,
} from "react";
import { cn } from "../../lib/cn";
import { Field } from "./Field";
import { FIELD_CONTROL, FIELD_SHELL, fieldShellState } from "./fieldChrome";

// Structural icon type that any Phosphor icon (or an equivalent SVG
// component accepting className + size) satisfies. We don't narrow to
// Phosphor's `Icon` type directly so downstream projects can pass a
// locally-authored SVG without adopting the whole Phosphor type surface.
export type InputIconComponent = ComponentType<{
  className?: string;
  size?: number | string;
}>;

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: InputIconComponent;
  /**
   * String exibe a mensagem abaixo do campo, boolean so acende o cromo
   * vermelho. `false`/`undefined` = sem erro. Entrar em erro dispara o shake.
   */
  error?: string | boolean;
  /**
   * Re-dispara o shake com a MESMA mensagem, pro segundo submit de um
   * formulario que continua invalido. Ver `useShakeOnError`.
   */
  errorKey?: number | string;
  label?: ReactNode;
  /** Texto de apoio. Some enquanto houver erro. */
  hint?: ReactNode;
  /** Marca o rotulo com asterisco e liga `aria-required`. */
  required?: boolean;
  /** Preenchido e sem erro: o asterisco vira check. Ver <Field>. */
  valido?: boolean;
  /** Classes no bloco inteiro: rotulo, caixa e mensagem. */
  className?: string;
  /** Classes so na CAIXA do campo. */
  controlClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    icon: Icon,
    error,
    errorKey,
    label,
    hint,
    required,
    valido,
    type,
    className,
    controlClassName,
    ...props
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

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
          className={cn(FIELD_SHELL, fieldShellState(invalid, props.disabled), controlClassName)}
        >
          {Icon && (
            <Icon
              size={16}
              className={cn("shrink-0", invalid ? "text-danger" : "text-text-muted")}
            />
          )}
          <input
            ref={ref}
            type={inputType}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            className={FIELD_CONTROL}
            {...props}
            id={id}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                "relative shrink-0 rounded-full p-1",
                "text-text-muted transition-colors hover:text-text-secondary",
                // O olho tem 24px de tinta (icone de 16 mais o `p-1`) e o dedo
                // pede 44. Em vez de inchar o botao, um `::after` transparente
                // e centrado leva o ALVO aos 44 sob apontador grosso.
                //
                // A conta fecha dentro da propria casca: a expansao sobra 10px
                // pra cada lado, e a casca ja tem `gap-3` (12px) a esquerda e
                // `px-4` (16px) a direita. Ou seja, o alvo maior nao rouba o
                // toque que ia posicionar o cursor no fim do texto, nem vaza
                // pra fora do campo. Na vertical os 44 empatam com o `h-11` do
                // FIELD_SHELL, que e de onde o piso de 44 saiu.
                "after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
                "[@media(pointer:coarse)]:after:h-11 [@media(pointer:coarse)]:after:w-11",
              )}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              tabIndex={-1}
            >
              {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      )}
    </Field>
  );
});
