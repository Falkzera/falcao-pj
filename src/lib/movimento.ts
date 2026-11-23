// ---------------------------------------------------------------------------
// O vocabulário de movimento do app, num lugar só. Toda animação usa uma destas
// constantes; tempo novo só quando o gesto é novo.
//
// - Retorno de toque (marcar, chip, segmento) fica abaixo de 200 ms: é a resposta
//   que a pessoa está esperando.
// - Entrada de conteúdo (trocar de tela) fica entre 250 e 400 ms.
// - "Reduzir movimento" do aparelho: o MotionConfig de main.tsx desliga transform e
//   layout no que o Framer anima, e `movimentoReduzido` vale para o que roda fora do React.
// ---------------------------------------------------------------------------

/** Se o aparelho pede para reduzir o movimento agora. */
export function movimentoReduzido() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const EASE_SAIDA = [0.22, 1, 0.36, 1] as const;

/** Mola de objeto que assenta: cartão que sobe, pílula ativa. */
export const MOLA = { type: "spring", stiffness: 380, damping: 32 } as const;
/** Mola com um leve passar do ponto: ícone que aparece, selo. */
export const MOLA_VIVA = { type: "spring", stiffness: 520, damping: 22 } as const;

/** Entrada de bloco de conteúdo. */
export const ENTRADA = { duration: 0.32, ease: EASE_SAIDA } as const;
