import { Check } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { type ReactNode, useId } from "react";
import { useShakeOnError } from "../../hooks/useShakeOnError";
import { cn } from "../../lib/cn";

// ---------------------------------------------------------------------------
// Field: o cromo de campo, num lugar so.
//
// Antes deste arquivo cada primitivo reimplementava rotulo, dica, mensagem de
// erro e fiacao de aria do seu jeito, e o resultado era desigual: <Input>
// aceitava `error` como string e exibia a mensagem, enquanto <Select>,
// <MoneyInput> e <DatePicker> so aceitavam boolean e nao tinham onde escrever
// o MOTIVO do erro. Um design system que serve de default pra todo sistema
// nao pode ter tres respostas diferentes pra "campo obrigatorio nao
// preenchido".
//
// Field concentra o que e igual em qualquer campo:
//   - o rotulo, com marcador de obrigatorio
//   - a dica, que da lugar ao erro quando ele aparece (nunca as duas juntas:
//     a dica ensina antes, o erro corrige depois, e empilhar as duas empurra
//     o campo seguinte pra baixo no pior momento possivel)
//   - a mensagem de erro em `role="alert"`
//   - a fiacao de id, htmlFor/aria-labelledby e aria-describedby
//   - o shake, porque a resposta ao erro e TATIL, nao so cromatica
//
// O que Field NAO faz: desenhar o controle. Ele entrega `invalid` pro filho e
// o controle pinta a propria borda. Assim um <Select> continua parecendo um
// Select, e nao um Input com uma seta colada.
//
// REGRA DE COMPOSICAO: os primitivos deste repo ja usam Field por dentro.
// NUNCA envolva um <Input> num <Field>, isso aninha dois rotulos e duas
// mensagens. Field cru serve pra controle NOVO, de fora do design system, que
// precisa entrar na mesma pauta visual.
// ---------------------------------------------------------------------------

export interface FieldRenderProps {
  /** Ligue no controle. O rotulo ja aponta pra ele. */
  id: string;
  /** Ligue em `aria-describedby`: aponta pra dica OU pra mensagem de erro. */
  describedBy: string | undefined;
  /**
   * Ligue em `aria-labelledby` quando `labelAs="group"`. Em modo "field" vem
   * `undefined`, porque ali o `<label htmlFor>` ja resolve.
   */
  labelledBy: string | undefined;
  /** Pinte a borda e o anel em danger quando `true`. */
  invalid: boolean;
  required: boolean;
}

export interface FieldProps {
  label?: ReactNode;
  /** Texto de apoio. Some enquanto houver erro. */
  hint?: ReactNode;
  /**
   * String exibe a mensagem abaixo do campo. Boolean so acende o cromo de
   * erro, sem texto. `false`/`undefined` = sem erro.
   */
  error?: string | boolean;
  /**
   * Re-dispara o shake com a MESMA mensagem de erro, pro caso do segundo
   * submit de um formulario que continua invalido. Ver `useShakeOnError`.
   */
  errorKey?: number | string;
  required?: boolean;
  /**
   * O campo ja foi preenchido de forma valida.
   *
   * Quando `true` e o campo e obrigatorio, o asterisco da lugar a um CHECK. O
   * asterisco sozinho e uma promessa que nunca se resolve: ele diz "isto e
   * exigido" e continua dizendo a mesma coisa depois que a pessoa atendeu a
   * exigencia. Trocar por check fecha o ciclo, e num formulario longo e o que
   * permite varrer a coluna e ver o que ainda falta sem ler campo por campo.
   *
   * Quem calcula isso e o <FormField>, que enxerga valor e erro.
   */
  valido?: boolean;
  /**
   * Como o rotulo se liga ao controle.
   *
   * - `"field"` (padrao): `<label htmlFor>`, pra um controle unico e focavel,
   *   input, textarea, botao de combobox.
   * - `"group"`: `<div id>` mais `aria-labelledby`, pra CONJUNTO de controles
   *   (RadioGroup, grupo de checkbox). `<label htmlFor>` apontando pra um
   *   container nao e clicavel nem e anunciado direito pelo leitor de tela.
   */
  labelAs?: "field" | "group";
  /** Id explicito do controle. Sem ele, um id estavel e gerado. */
  htmlFor?: string;
  /** Desliga o gesto tatil. Caso raro: campo dentro de grid denso. */
  shake?: boolean;
  className?: string;
  children: ReactNode | ((field: FieldRenderProps) => ReactNode);
}

export function Field({
  label,
  hint,
  error,
  errorKey,
  required = false,
  valido = false,
  labelAs = "field",
  htmlFor,
  shake = true,
  className,
  children,
}: FieldProps) {
  const autoId = useId();
  const controlId = htmlFor ?? `${autoId}-control`;
  const labelId = `${autoId}-label`;
  const messageId = `${autoId}-message`;

  const invalid = Boolean(error);
  const errorMessage = typeof error === "string" ? error : null;
  const showsMessage = Boolean(errorMessage || hint);

  const shakeControls = useShakeOnError(invalid, errorKey, shake);

  const renderProps: FieldRenderProps = {
    id: controlId,
    describedBy: showsMessage ? messageId : undefined,
    labelledBy: labelAs === "group" && label ? labelId : undefined,
    invalid,
    required,
  };

  // O check e `aria-hidden` igual ao asterisco: quem usa leitor de tela ja
  // recebe a obrigatoriedade por `aria-required` e o erro por `role="alert"`.
  // Duplicar isso em texto seria ruido, nao acessibilidade.
  const marker = required ? (
    valido && !invalid ? (
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 26 }}
        className="ml-1 inline-flex align-middle text-success"
        aria-hidden
      >
        <Check size={12} weight="bold" />
      </motion.span>
    ) : (
      <span className="ml-0.5 text-danger" aria-hidden>
        *
      </span>
    )
  ) : null;

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {label &&
        (labelAs === "group" ? (
          <div id={labelId} className="block font-medium text-sm text-text-secondary">
            {label}
            {marker}
          </div>
        ) : (
          <label htmlFor={controlId} className="block font-medium text-sm text-text-secondary">
            {label}
            {marker}
          </label>
        ))}

      {/* O shake mora aqui, envolvendo SO o controle. Se envolvesse o bloco
          inteiro, o rotulo e a mensagem tremeriam junto e o gesto viraria um
          solavanco de layout em vez de um aviso sobre o campo. */}
      <motion.div animate={shakeControls}>
        {typeof children === "function" ? children(renderProps) : children}
      </motion.div>

      {errorMessage ? (
        <p id={messageId} className="text-danger text-xs" role="alert">
          {errorMessage}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-text-muted text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
