import { CheckCircle, Info, Warning, WarningCircle, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useState } from "react";
import { cn } from "../../lib/cn";

// ---------------------------------------------------------------------------
// Alert: canonical Falcao System Design primitive
// ---------------------------------------------------------------------------
// In-page persistent feedback. Single primitive, TWO variants, FIVE tones.
// NOT the same as Toast (transient, bottom-right) or Button async feedback
// (ephemeral, inline). Alerts stick around until the user or the system
// resolves them.
//
// Variants (picked via `variant`):
//
//   "inline" (default): a block that lives inside page content, `rounded-xl`
//     with the semantic tone carried by the border and the tinted background
//     color. Use for: form-level errors, in-card hints, contextual warnings
//     inside a drawer, sticky status cards ("Pierre desconectado" near the
//     Pierre section). Width = parent width.
//
//   "banner": edge-to-edge band, `rounded-none`, no side borders, only
//     top + bottom hairlines in the tone color. Sits at the top of a page
//     or section and spans full width. Use for: "Sua conta Pierre expirou
//: reconectar", "Modo read-only ativo", "Manutenção agendada". Denser
//     padding than inline.
//
// REJECTED: two separate primitives (`<Alert>` + `<Banner>`). They share
// 80% of the code (tone → color map, icon resolution, dismiss logic,
// motion signature, pulse logic). Same consolidation reasoning as Tabs
// (underline/segmented), Accordion (card/inline), the overlay trifecta
// sharing motion constants. Proliferation is the enemy.
//
// Tones (5, exhaustive):
//
//   info: neutral informative, "saiba mais"                (accent)
//   success: persistent confirmation, "Sync concluído"        (success)
//   warning: non-blocking heads-up, "Fatura fecha em 3 dias"  (warning)
//   danger: error or blocker, "Falha na sync, reconectar"    (danger)
//   neutral: informative without emotional charge, "Beta"     (bg-tertiary)
//
// `neutral` is DELIBERATELY the quietest tone, it has
// no semantic signal, so painting one would be a lie. Neutral also has no
// default icon (consumer passes one via `icon` prop or it renders without).
//
// ---------------------------------------------------------------------------
// THE SIGNATURE GESTURES (non-negotiable)
// ---------------------------------------------------------------------------
//
// 1. ENTRY (all tones, all variants):
//      opacity 0 → 1 + scale 0.98 → 1
//      duration 220ms, ease [0.16, 1, 0.3, 1]  (out-expo, same family as the
//      overlay trifecta, 40ms slower because alerts ask the user to READ).
//      Exported as `ALERT_TRANSITION`.
//
// 2. PULSE on urgent inline alerts (tone === "warning" || "danger"):
//      The ICON pulses ONCE on mount: opacity keyframes
//      [1, 0.5, 1, 0.75, 1] over 800ms. Fires once, never loops. This is
//      the ONLY tone hierarchy the product uses for alerts, calm tones
//      enter discreetly, urgent tones pulse once to earn a glance.
//
//      Rejected: continuous pulse. Ambient pulsing is hostile, users
//      learn to tune it out, and it creates visual anxiety on pages with
//      a sticky warning. One pulse lands the message and then the alert
//      behaves like any other.
//
//      Rejected: radial clip-path reveal (the Button success/error family).
//      The Button's radial is the product's most expensive visual gesture
//      and is reserved for "THIS JUST HAPPENED" ephemeral feedback.
//      Reusing it on an Alert that might have been on screen for 10
//      minutes would dilute the gesture's meaning. The pulse respects the
//      hierarchy: radial = ephemeral, pulse = persistent-but-urgent.
//
// 3. EXIT (via internal dismiss button):
//      opacity 1 → 0 + scale 1 → 0.96, same ease, same duration.
//      Wrapped in AnimatePresence with `onExitComplete` that forwards to
//      the consumer's `onDismiss` callback: consumers get the unmount
//      AFTER the animation finishes, so they can remove the alert from
//      state without stale-render flashes.
//
// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
//
//   - `role="alert"` + `aria-live="assertive"` for `warning` / `danger`
//     (interrupts screen reader mid-sentence: correct for urgent).
//   - `role="status"` + `aria-live="polite"` for `info` / `success` /
//     `neutral` (waits for the current utterance to finish).
//   - Dismiss button: `aria-label="Dispensar alerta"`, focus-visible ring.
//   - Default icons are `aria-hidden` (tone already comes through text).
// ---------------------------------------------------------------------------

export type AlertTone = "info" | "success" | "warning" | "danger" | "neutral";
export type AlertVariant = "inline" | "banner";

export interface AlertProps {
  /** Semantic tone. Default `"info"`. */
  tone?: AlertTone;
  /** `"inline"` (default) or `"banner"` (edge-to-edge band). */
  variant?: AlertVariant;
  /** Bold title line. Optional: an alert can be description-only. */
  title?: ReactNode;
  /** Description body. Accepts any ReactNode (paragraphs, links, inline code). */
  children?: ReactNode;
  /** Override the default icon. Pass `false` to hide the icon entirely. */
  icon?: ReactNode | false;
  /** Optional action row (typically 1 a 2 small Buttons). */
  actions?: ReactNode;
  /** If set, a dismiss X appears; callback fires AFTER the exit animation. */
  onDismiss?: () => void;
  className?: string;
}

// Motion constants: exported for domain components that need a matching
// alert-shaped appearance (e.g. inline validation errors in custom forms).
// Same pattern as OVERLAY_TRANSITION, TABS_INDICATOR_SPRING, etc.
export const ALERT_TRANSITION = {
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
} as const;

export const ALERT_PULSE_TRANSITION = {
  duration: 0.8,
  times: [0, 0.25, 0.5, 0.75, 1],
} as const;

// ---------------------------------------------------------------------------
// Tone → visual tokens. Kept as a data table at module scope so it's one
// grep away when a designer asks "what color is the warning alert bg".
// ---------------------------------------------------------------------------

const TONE_STYLES: Record<AlertTone, { container: string; icon: string }> = {
  info: {
    // O icone fica no accent de IDENTIDADE, e nao no `accent-text`, de proposito.
    // Ele e componente de interface e nunca aparece sozinho: o titulo e o corpo
    // dizem a mesma coisa ao lado, e ele vai `aria-hidden` no leitor de tela.
    // O piso ali e 3:1, e o accent entrega 3,68:1 sobre este fundo de 5% na
    // superficie mais dificil do tema. Trocar so escureceria o tom do alerta.
    container: "border-accent/30 bg-accent/5",
    icon: "text-accent",
  },
  success: {
    container: "border-success/30 bg-success/5",
    icon: "text-success",
  },
  warning: {
    container: "border-warning/30 bg-warning/5",
    icon: "text-warning",
  },
  danger: {
    container: "border-danger/30 bg-danger/5",
    icon: "text-danger",
  },
  neutral: {
    container: "border-border bg-bg-tertiary",
    icon: "text-text-muted",
  },
};

const DEFAULT_ICONS: Record<AlertTone, ReactNode | null> = {
  info: <Info size={16} />,
  success: <CheckCircle size={16} />,
  warning: <Warning size={16} />,
  danger: <WarningCircle size={16} />,
  // Neutral has no default icon: consumers pass one or render without.
  neutral: null,
};

const URGENT_TONES = new Set<AlertTone>(["warning", "danger"]);

export function Alert({
  tone = "info",
  variant = "inline",
  title,
  children,
  icon,
  actions,
  onDismiss,
  className,
}: AlertProps) {
  const [visible, setVisible] = useState(true);

  const toneStyle = TONE_STYLES[tone];
  const resolvedIcon = icon === false ? null : icon !== undefined ? icon : DEFAULT_ICONS[tone];
  // O pulso mudou de casa. Ele morava na faixa vertical a esquerda, que saiu do
  // sistema: barra colorida na lateral e o tique visual mais reconhecivel de
  // interface feita em serie, e o alerta ja carrega o tom na borda e no fundo,
  // entao a faixa era uma terceira vez dizendo a mesma coisa.
  //
  // O gesto em si continua, porque ele nao era decoracao: e o que separa
  // "estava aqui" de "acabou de chegar". Agora pulsa o ICONE, que e o elemento
  // que ja concentra a cor do tom.
  const shouldPulse = URGENT_TONES.has(tone);

  const role = URGENT_TONES.has(tone) ? "alert" : "status";
  const ariaLive = URGENT_TONES.has(tone) ? "assertive" : "polite";

  return (
    <AnimatePresence onExitComplete={onDismiss}>
      {visible && (
        <motion.div
          role={role}
          aria-live={ariaLive}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={ALERT_TRANSITION}
          className={cn(
            "relative w-full overflow-hidden border",
            variant === "inline" && "rounded-xl",
            variant === "banner" && "rounded-none border-x-0",
            toneStyle.container,
            className,
          )}
        >
          <div
            className={cn(
              "flex items-start gap-3",
              variant === "inline" && "px-4 py-3.5",
              variant === "banner" && "px-6 py-3",
            )}
          >
            {resolvedIcon && (
              <motion.div
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center pt-px",
                  toneStyle.icon,
                )}
                initial={{ opacity: 1 }}
                animate={shouldPulse ? { opacity: [1, 0.45, 1, 0.7, 1] } : { opacity: 1 }}
                transition={shouldPulse ? ALERT_PULSE_TRANSITION : { duration: 0 }}
                aria-hidden
              >
                {resolvedIcon}
              </motion.div>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <p className="font-semibold text-sm text-text-primary leading-snug">{title}</p>
              )}
              {children && (
                <div
                  className={cn("text-sm text-text-secondary leading-relaxed", title && "mt-0.5")}
                >
                  {children}
                </div>
              )}
              {actions && <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
            {onDismiss && (
              <button
                type="button"
                onClick={() => setVisible(false)}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                  "text-text-muted transition-colors duration-150",
                  "hover:bg-bg-glass hover:text-text-primary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text",
                )}
                aria-label="Dispensar alerta"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
