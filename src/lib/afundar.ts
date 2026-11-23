import { movimentoReduzido } from "./movimento";

// ---------------------------------------------------------------------------
// O afundar do toque. A peça marcada com `data-afunda` encolhe um pouco enquanto o
// dedo a aperta, mas só num toque de verdade. O dedo que passa rolando a tela também
// começa com um `pointerdown`, e o navegador só manda o `pointercancel` quando assume
// a rolagem; afundar no primeiro contato faria a peça encolher e voltar a cada
// rolagem. Aqui o afundar espera ESPERA_MS, o tempo que o Android leva para separar
// toque de rolagem, e não acontece se a rolagem começou antes. O toque rápido, que
// solta antes disso, ganha um afundar e voltar curto. Com o mouse, afunda na hora.
//
// Um ouvinte só, no documento, para todas as peças. Anima a propriedade `scale` pela
// Web Animations API: soma ao transform que o Framer escreve na mesma peça (o ícone
// que sobe na barra) e não briga com as transições de cor, como uma transição de CSS
// brigaria. Com "reduzir movimento", nada afunda.
//
// A peça com traço e sombra dura (`data-afunda="adesivo"` ou uma das `PECAS_DO_ADESIVO`)
// não encolhe: afunda na própria sombra. O ouvinte só marca `data-afundada` no tempo do
// toque de verdade, e o CSS (styles/adesivo.css) leva a peça até a sombra.
// ---------------------------------------------------------------------------

/** As peças comuns tocáveis no jeito do adesivo (o cartão, o chip e os botões). */
const PECAS_DO_ADESIVO =
  "a.cartao, button.cartao, a.chip, button.chip, .botao-redondo, .botao-sec, .botao-adesivo";

const ESPERA_MS = 100;
/** Quanto a peça encolhe; `data-afunda="0.9"` pede mais, nos botões pequenos. */
const ESCALA = 0.97;
const ANDAMENTO = { duration: 140, easing: "cubic-bezier(0.22, 1, 0.36, 1)" } as const;

/** Quanto tempo o toque rápido deixa a peça do adesivo afundada antes de voltar. */
const TOQUE_RAPIDO_MS = 120;

function escalaDe(peca: HTMLElement) {
  const pedida = Number(peca.dataset.afunda);
  return pedida > 0 && pedida < 1 ? pedida : ESCALA;
}

/** A peça que o dedo apertou e se ela afunda na sombra (adesivo) ou pela escala. */
function pecaDoToque(alvo: Element) {
  const peca = alvo.closest<HTMLElement>(`[data-afunda], ${PECAS_DO_ADESIVO}`);
  if (!peca) return null;
  const adesivo = peca.dataset.afunda === "adesivo" || peca.matches(PECAS_DO_ADESIVO);
  return { peca, adesivo };
}

export function ouvirAfundar() {
  let peca: HTMLElement | null = null;
  let adesivo = false;
  let espera = 0;
  let afundada: Animation | null = null;

  const soltar = (tocou: boolean) => {
    window.clearTimeout(espera);
    if (peca && adesivo) {
      const solta = peca;
      if (solta.dataset.afundada !== undefined) delete solta.dataset.afundada;
      else if (tocou) {
        solta.dataset.afundada = "";
        window.setTimeout(() => delete solta.dataset.afundada, TOQUE_RAPIDO_MS);
      }
    } else if (peca && afundada) {
      // Volta de onde estiver; sem `fill`, a volta some ao terminar e a peça fica como era.
      peca.animate([{ scale: getComputedStyle(peca).scale }, { scale: "1" }], ANDAMENTO);
      afundada.cancel();
    } else if (peca && tocou) {
      const s = String(escalaDe(peca));
      peca.animate([{ scale: "1" }, { scale: s }, { scale: "1" }], { ...ANDAMENTO, duration: 180 });
    }
    peca = null;
    afundada = null;
  };

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!e.isPrimary || movimentoReduzido() || !(e.target instanceof Element)) return;
      const tocada = pecaDoToque(e.target);
      if (!tocada || tocada.peca.matches(":disabled")) return;
      soltar(false);
      const alvo = tocada.peca;
      peca = alvo;
      adesivo = tocada.adesivo;
      espera = window.setTimeout(
        () => {
          if (tocada.adesivo) {
            alvo.dataset.afundada = "";
            return;
          }
          afundada = alvo.animate([{ scale: "1" }, { scale: String(escalaDe(alvo)) }], {
            ...ANDAMENTO,
            fill: "forwards",
          });
        },
        e.pointerType === "mouse" ? 0 : ESPERA_MS,
      );
    },
    { passive: true },
  );
  document.addEventListener("pointerup", () => soltar(true), { passive: true });
  // A rolagem que o navegador assumiu: nada de afundar e voltar.
  document.addEventListener("pointercancel", () => soltar(false), { passive: true });
}
