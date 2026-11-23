import {
  type AnimationControls,
  useAnimationControls,
  useReducedMotionConfig,
} from "framer-motion";
import { useEffect } from "react";

// O tremor do campo invalido mora aqui, no unico modulo que o dispara, e os
// valores ficam sem `export`: quem levar o gesto leva o hook inteiro, com o
// respeito a `prefers-reduced-motion` junto.
//
// 0.42s fica acima dos 350ms do retorno de toque de proposito: o tremor e
// correcao tatil, e com menos quadros o gesto le como espasmo, e nao como
// negativa.
const SHAKE_KEYFRAMES = [0, -6, 5, -4, 3, 0];
const SHAKE_TRANSITION = { duration: 0.42 } as const;

/**
 * Devolve controles de animacao que TREMEM sempre que o campo entra em erro.
 *
 * O gesto existe porque erro de formulario precisa de resposta tatil, e nao
 * so cromatica: quem clica em "Entrar" com a senha vazia olha pro botao, nao
 * pro campo, e uma borda que muda de cor longe do ponto de atencao passa
 * despercebida. O movimento traz o olho de volta.
 *
 * `errorKey` e o que faz a SEGUNDA tentativa tremer de novo. A mensagem
 * continua "Campo obrigatorio", entao sem esse gatilho o React nao veria
 * mudanca nenhuma e o campo ficaria parado, dando a impressao de que o botao
 * quebrou. A convencao e o formulario guardar um contador de tentativas e
 * passar o mesmo numero pra todos os campos.
 *
 * Disparo imperativo, e nao `key` + remount: no submit por Enter o campo esta
 * focado, e remontar arrancaria o foco no meio do gesto.
 */
export function useShakeOnError(
  invalid: boolean,
  errorKey?: number | string,
  enabled = true,
): AnimationControls {
  const controls = useAnimationControls();
  const prefersReducedMotion = useReducedMotionConfig();

  // `errorKey` nao e lido dentro do efeito de proposito. Ele esta na lista SO
  // como gatilho, pelo motivo explicado acima. O fix automatico do Biome quer
  // remove-lo, e isso mata a repeticao do shake.
  // biome-ignore lint/correctness/useExhaustiveDependencies: gatilho intencional, ver acima
  useEffect(() => {
    if (!invalid || !enabled) return;
    if (prefersReducedMotion) return;
    controls.start({ x: SHAKE_KEYFRAMES, transition: SHAKE_TRANSITION });
  }, [invalid, errorKey, enabled, prefersReducedMotion, controls]);

  return controls;
}
