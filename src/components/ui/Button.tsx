import { CircleNotch } from "@phosphor-icons/react";
import { AnimatePresence, type HTMLMotionProps, motion } from "framer-motion";
import { forwardRef, type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";

// ---------------------------------------------------------------------------
// Button: canonical Falcao System Design primitive
// ---------------------------------------------------------------------------
// Single source of truth for every button in the app.
//
// Two behavior modes, picked automatically from props:
//
//   1. Plain button: no feedback state machine. Just variant + size + loading
//      prop for manual control. Backward compatible with the old API.
//
//   2. Async feedback button: activated by `onAsyncClick`. Runs the
//      state machine idle → loading → success/error → idle with the
//      Falcao-signature RADIAL REVEAL: a circle of the feedback color
//      (bg-success or bg-danger) expands via clip-path from a configurable
//      origin, matching the dark/light theme toggle behavior.
//
// The radial reveal is THE signature transition of the product. Never let
// success/error colors "pop" instantly: always via this reveal.
// ---------------------------------------------------------------------------

/** As cinco variantes de tinta do botao. Nome qualificado: um `Variant` solto
 *  colidiria com o do vizinho no autocompletar de quem consome a biblioteca. */
export type ButtonVariant = "default" | "outline" | "ghost" | "destructive" | "link";
/** Os quatro tamanhos. `icon` e o quadrado de 40px pra botao so de icone. */
export type ButtonSize = "sm" | "md" | "lg" | "icon";
type AsyncState = "idle" | "loading" | "success" | "error";

/**
 * Radial reveal origin for async feedback states.
 * - "click": DEFAULT. Reveal originates from the exact click coordinate
 *   (mirrors the theme toggle's signature motion). Falls back to center on
 *   keyboard activation (detail === 0). This is the canonical feel of the
 *   product: only switch to "center" when the trigger is programmatic or
 *   when the click point is visually meaningless (e.g. full-width CTAs).
 * - "center": symmetric reveal from the middle of the button. Predictable
 *   but less tactile; use sparingly.
 */
export type ButtonRevealOrigin = "center" | "click";

/** Os estados da maquina de feedback, exportados pra quem controla de fora. */
export type ButtonFeedbackState = AsyncState;

/**
 * O corpo das props, SEM a discriminacao de `type`. Exportado separado porque
 * `ButtonProps` e uma uniao, e uniao nao se estende com `interface ... extends`:
 * quem quiser um botao proprio com props a mais parte daqui e refaz a uniao, ou
 * intersecta `ButtonProps` direto.
 */
export interface ButtonBaseProps
  extends Omit<HTMLMotionProps<"button">, "children" | "onClick" | "type"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;

  /**
   * When provided, the button runs the async feedback state machine:
   * idle → loading → success/error → idle. The promise's resolve triggers
   * the success reveal; a rejection triggers the error reveal + shake.
   */
  onAsyncClick?: () => Promise<void>;

  /** Radial reveal origin for the feedback state transitions. Default: "click". */
  revealOrigin?: ButtonRevealOrigin;

  /** Labels shown during async states. Defaults to sensible Portuguese values. */
  loadingLabel?: ReactNode;
  successLabel?: ReactNode;
  errorLabel?: ReactNode;

  /** How long the button stays in success/error before returning to idle. */
  resetDelay?: { success?: number; error?: number };

  /**
   * Estado do feedback controlado de FORA. Tem precedencia sobre `loading` e
   * sobre a maquina interna. E o que permite a um botao de submit REFLETIR o
   * envio do formulario em vez de conduzi-lo.
   */
  feedbackState?: ButtonFeedbackState;
}

/**
 * `type="submit"` e `onAsyncClick` sao MUTUAMENTE EXCLUSIVOS, e a uniao
 * discriminada torna o par impossivel de escrever, e nao apenas
 * desaconselhado.
 *
 * O par era a causa raiz de dois bugs que se mascaravam. Um botao de submit
 * com `onAsyncClick` submetia o formulario por fora do <form>, deixando o
 * `onSubmit` como codigo morto, e ao mesmo tempo se marcava ocupado no meio do
 * proprio clique, o que matava a submissao nativa. Consertar so um dos dois
 * produz submissao DUPLA, entao o tipo passa a impedir a combinacao.
 *
 * Dentro de um <FalcaoForm>, o botao primario e o <SubmitButton>.
 */
export type ButtonProps = ButtonBaseProps &
  (
    | { type?: "button" | "reset"; onAsyncClick?: () => Promise<void> }
    | { type: "submit"; onAsyncClick?: never }
  );

const variantStyles: Record<ButtonVariant, string> = {
  // O preenchimento primario CARREGA TEXTO, entao ele nao pode ser o accent de
  // identidade. O `bg-accent text-white` que estava aqui reprovava nos sete
  // presets (4,47:1 no indigo, 2,15:1 no ambar), e como o accent e escrito em
  // style inline pelo ThemeProvider, dois cliques nas configuracoes derrubavam
  // a legibilidade do botao primario do produto inteiro, sem aviso. O par
  // derivado em runtime fecha a conta. O anel de foco fica no accent de
  // identidade de proposito: o piso dele e 3:1, e ele atende.
  default:
    "bg-accent-solid text-on-accent hover:brightness-110 active:brightness-95 focus-visible:ring-accent-text",
  outline:
    "border border-border bg-transparent text-text-secondary hover:bg-bg-glass hover:text-text-primary focus-visible:ring-accent-text",
  ghost:
    "bg-transparent text-text-secondary hover:bg-bg-glass hover:text-text-primary focus-visible:ring-accent-text",
  // O anel do destrutivo era `ring-danger/30`, e 30% de danger sobre o papel da
  // 1,51:1: metade do piso de 3:1 da 1.4.11. Foco invisivel no unico botao que
  // apaga dado e o pior lugar possivel pra economizar tinta. Opaco da 4,76:1
  // no claro e 6,01:1 no escuro.
  destructive:
    "bg-danger text-on-danger hover:brightness-110 active:brightness-95 focus-visible:ring-danger",
  // O `link` e accent como TEXTO sobre o fundo do tema, entao ele cai no piso
  // de 4,5:1 e nao nos 3:1 de componente. Com o accent de IDENTIDADE ele
  // reprovava nos sete presets do claro (3,57:1 no indigo default, 1,71:1 no
  // ambar) e em quatro dos sete do escuro. O custo era alto pro que ele e: esta
  // variante e a cor do unico link de cada tela pre-login, a linha que a pessoa
  // clica quando nao consegue entrar. Com `accent-text` fecha em 14 de 14 pares
  // (pior caso 4,50:1). O sublinhado no hover fica: cor sozinha nunca foi o
  // sinal de que aquilo e um link.
  link: "bg-transparent text-accent-text underline-offset-4 hover:underline p-0 h-auto",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10 p-0",
};

// ---------------------------------------------------------------------------
// Reduced motion detector: lives at the top so the state machine can skip
// the clip-path and shake animations for users who request less motion.
// ---------------------------------------------------------------------------
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      loading: manualLoading = false,
      className,
      children,
      disabled,
      onClick,
      onAsyncClick,
      revealOrigin = "click",
      loadingLabel,
      successLabel = "Pronto",
      errorLabel = "Erro",
      resetDelay,
      feedbackState,
      ...props
    },
    ref,
  ) => {
    const [asyncState, setAsyncState] = useState<AsyncState>("idle");
    const reducedMotion = usePrefersReducedMotion();

    // Origin coordinates (in percentage of the button box) for the clip-path.
    // Reset to center whenever the state machine returns to idle.
    const [origin, setOrigin] = useState<{ x: string; y: string }>({
      x: "50%",
      y: "50%",
    });

    // Track unmount to avoid setState after teardown on long async actions.
    const mountedRef = useRef(true);
    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
    }, []);

    // Link variant is pure text: overlay + shake look broken on it.
    // Async feedback is silently disabled on link buttons.
    const asyncEnabled = Boolean(onAsyncClick) && variant !== "link";

    // Tres fontes, nesta ordem de precedencia: o estado controlado de fora
    // (um <form> que conduz o envio), o `loading` manual, a maquina interna.
    const effectiveState: AsyncState = feedbackState ?? (manualLoading ? "loading" : asyncState);
    const isBusy =
      effectiveState === "loading" || effectiveState === "success" || effectiveState === "error";

    // -----------------------------------------------------------------------
    // Por que "ocupado" NAO e mais o atributo `disabled`.
    //
    // O passo 1 do activation behavior de um <button> e "se estiver disabled,
    // retorne", e o navegador avalia isso no FIM do dispatch, depois de todos
    // os listeners. Como `setAsyncState("loading")` roda sincrono dentro do
    // clique e o React 19 descarrega esse update no checkpoint de microtarefa
    // que acontece ANTES do activation behavior, o botao chegava desabilitado
    // no proprio clique que o desabilitou, e se auto-cancelava: um
    // <Button type="submit"> nunca submetia o formulario num clique real de
    // mouse. Com `.click()` programatico funcionava, porque ali a pilha de JS
    // continua ocupada e o checkpoint nao roda no meio do dispatch. Essa
    // assimetria foi o que denunciou o mecanismo.
    //
    // Agora `disabled` volta a significar so uma coisa, indisponivel por
    // decisao de quem chamou, que e estavel durante o dispatch inteiro. O
    // bloqueio do clique repetido passa a ser `preventDefault()` SINCRONO,
    // dentro do listener, que e o mecanismo que a especificacao oferece pra
    // impedir a ativacao sem tocar em `disabled`.
    //
    // O guarda mora num ref, e nao em estado, porque precisa valer AGORA,
    // dentro do dispatch, e nao na microtarefa seguinte: era exatamente essa
    // defasagem que matava o submit.
    // -----------------------------------------------------------------------
    const ocupadoRef = useRef(false);
    useEffect(() => {
      // O ciclo INTEIRO, e nao so `loading`. O `disabled` que este guarda
      // substitui cobria loading, success e error, e estreitar a janela faria
      // um clique 200ms depois do "Pronto" reexecutar a acao. No
      // <ConfirmDialog>, cuja razao de existir e rodar a acao exatamente uma
      // vez, isso seria grave.
      ocupadoRef.current = effectiveState !== "idle";
    }, [effectiveState]);

    const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled || ocupadoRef.current || isBusy) {
        // Cancelar e obrigatorio, e nao cosmetico: sem isso o navegador segue
        // pro activation behavior e submete o formulario mesmo com o handler
        // tendo desistido.
        e.preventDefault();
        return;
      }

      // Capture the radial reveal origin for this click.
      // detail === 0 means keyboard activation (Enter/Space), no click coord,
      // fall back to center regardless of the revealOrigin preference.
      if (asyncEnabled) {
        if (revealOrigin === "click" && e.detail > 0) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setOrigin({ x: `${x}%`, y: `${y}%` });
        } else {
          setOrigin({ x: "50%", y: "50%" });
        }
      }

      // Fire sync handler first (analytics, optimistic UI, close popovers…).
      onClick?.(e);

      if (!asyncEnabled || !onAsyncClick) return;

      // Sincrono, antes de qualquer await: o segundo clique de um duplo-clique
      // chega antes de o React repintar, e so o ref o alcanca a tempo.
      ocupadoRef.current = true;
      setAsyncState("loading");
      try {
        await onAsyncClick();
        if (!mountedRef.current) return;
        setAsyncState("success");
        const delay = resetDelay?.success ?? 1600;
        setTimeout(() => {
          if (mountedRef.current) setAsyncState("idle");
        }, delay);
      } catch {
        if (!mountedRef.current) return;
        setAsyncState("error");
        const delay = resetDelay?.error ?? 1800;
        setTimeout(() => {
          if (mountedRef.current) setAsyncState("idle");
        }, delay);
      }
    };

    const overlayBg =
      effectiveState === "success" ? "bg-success" : effectiveState === "error" ? "bg-danger" : "";

    // Force white text while the overlay covers the button surface.
    const contentColorOverride =
      effectiveState === "success"
        ? "text-on-success"
        : effectiveState === "error"
          ? "text-on-danger"
          : "";

    return (
      <motion.button
        ref={ref}
        type={props.type ?? "button"}
        onClick={handleClick}
        // `layout` lets Framer Motion tween the button's width whenever the
        // inner content swap (idle → loading + spinner → success ✓ → error ✗)
        // changes the natural size. Without it the width snaps instantly and
        // feels brutal. Spring is intentionally soft so the growth reads as
        // organic rather than mechanical.
        layout
        transition={{
          layout: { type: "spring", stiffness: 260, damping: 28, mass: 0.9 },
        }}
        whileHover={disabled || isBusy ? undefined : { scale: 1.02 }}
        whileTap={disabled || isBusy ? undefined : { scale: 0.98 }}
        aria-busy={effectiveState === "loading" || undefined}
        // Ocupado e anunciado por `aria-disabled` e bloqueado por
        // `preventDefault`. O atributo nativo fica so pro `disabled` de
        // verdade, pelo motivo explicado no bloco acima.
        aria-disabled={disabled || isBusy || undefined}
        disabled={disabled}
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden",
          "rounded-xl font-medium transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          // Ocupado nao pode usar `pointer-events: none`: o clique precisa
          // CHEGAR no handler pra ser cancelado. Sem evento nao ha
          // preventDefault, e a submissao nativa passaria por baixo.
          isBusy && "cursor-default",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {/* ---------- Layer 0: radial reveal overlay -------------------- */}
        <AnimatePresence>
          {(effectiveState === "success" || effectiveState === "error") && (
            <motion.span
              key={effectiveState}
              aria-hidden
              className={cn("absolute inset-0", overlayBg)}
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { clipPath: `circle(0% at ${origin.x} ${origin.y})` }
              }
              animate={
                reducedMotion
                  ? { opacity: 1 }
                  : { clipPath: `circle(150% at ${origin.x} ${origin.y})` }
              }
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { clipPath: `circle(0% at ${origin.x} ${origin.y})` }
              }
              transition={{
                duration: reducedMotion ? 0.12 : 0.45,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          )}
        </AnimatePresence>

        {/* ---------- Layer 1: shimmer sweep (loading only) ------------- */}
        {effectiveState === "loading" && !reducedMotion && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* ---------- Layer 2: content swap ----------------------------- */}
        <motion.span
          className={cn("relative z-10 inline-flex items-center gap-2", contentColorOverride)}
          animate={
            effectiveState === "error" && !reducedMotion ? { x: [0, -5, 4, -3, 2, 0] } : { x: 0 }
          }
          transition={{ duration: 0.42 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {effectiveState === "idle" && (
              <motion.span
                key="idle"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-2"
              >
                {children}
              </motion.span>
            )}

            {effectiveState === "loading" && (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-2"
              >
                <CircleNotch size={16} weight="bold" className="animate-spin" />
                {loadingLabel ?? (typeof children === "string" ? children : null)}
              </motion.span>
            )}

            {effectiveState === "success" && (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="inline-flex items-center gap-2"
              >
                {/* O check nao carrega informacao propria: o rotulo ao lado e a
                    regiao viva da camada 3 ja anunciam "Acao concluida". Com
                    title, o leitor de tela leria o estado duas vezes. */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" focusable="false">
                  <motion.path
                    d="M5 12l4 4L19 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 0.42,
                      ease: "easeOut",
                      delay: 0.12,
                    }}
                  />
                </svg>
                {successLabel}
              </motion.span>
            )}

            {effectiveState === "error" && (
              <motion.span
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="inline-flex items-center gap-2"
              >
                {/* Mesmo caso do check: o "Erro" ao lado e a regiao viva dizem
                    tudo, e o X e so o desenho do que ja foi dito. */}
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <motion.line
                    x1="6"
                    y1="6"
                    x2="18"
                    y2="18"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.2, delay: 0.12 }}
                  />
                  <motion.line
                    x1="18"
                    y1="6"
                    x2="6"
                    y2="18"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.2, delay: 0.26 }}
                  />
                </svg>
                {errorLabel}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>

        {/* ---------- Layer 3: screen-reader live region ---------------- */}
        <span className="sr-only" aria-live="polite" role="status">
          {effectiveState === "loading" && "Processando"}
          {effectiveState === "success" && "Ação concluída"}
          {effectiveState === "error" && "Erro ao executar ação"}
        </span>
      </motion.button>
    );
  },
);

Button.displayName = "Button";
