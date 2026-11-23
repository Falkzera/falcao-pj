"use client";

import { useEffect, useRef, useState } from "react";

// PADRÃO FALCÃO (decretado em 17/10/2026): o símbolo que vira `lf/`.
//
// Em repouso é o símbolo oficial; no hover (header) ou por relógio (abertura),
// as três formas se transformam nas três do `lf/`: asa e corpo viram o "l", a
// barra da cabeça vira o "f", a haste vira a barra "/", que acende na cor de
// acento do app. Volta ao símbolo no mouse-out.
//
// É morph VETORIAL procedural, sem modelo generativo: cada contorno é amostrado
// em N pontos no espaço do <svg>, os anéis são alinhados por sentido e ponto
// inicial, e os pontos são interpolados quadro a quadro. Nítido em qualquer
// tamanho, segue o tema por `currentColor`, pesa zero bytes de mídia.
//
// Os caminhos são os OFICIAIS: o símbolo é o de logo/falcao-simbolo-*.svg
// (nunca redesenhado) e os glifos "l", "f" e "/" são da JetBrains Mono. Nada
// aqui é desenhado à mão, só reposicionado para a mesma caixa de 512.
//
// Cores: tudo por `currentColor`; só a barra "/" lê `--abertura-acento`
// (abertura.css). Reduced-motion: troca seca, sem quadros intermediários.
//
// Uso:
//   <LogoMorph />                         // hover (header)
//   <LogoMorph alvo={lf ? 1 : 0} />       // controlado (abertura)
//   <LogoMorph tamanho="h-10 w-10" />     // classes de tamanho do <svg>

import { GLIFOS, SIMBOLO, SIMBOLO_TRANSFORM, glifoTransform } from "./marca-formas";
// Reexportados para quem só conhece este módulo (o pouso do nome, no site).
export { GLIFOS, SIMBOLO, SIMBOLO_TRANSFORM, glifoTransform };

const N = 96;
const DUR_MS = 800;
// Curva simétrica, não a "ease-out" da casa: a dianteira chegava quase no lf/
// aos 120 ms e a transformação não era vista. Com a cúbica de entrada e saída o
// meio do caminho fica na tela.
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export type Pt = [number, number];

// Amostra um <path> em N pontos no espaço do usuário do <svg> (a caixa de 512),
// e não da tela: `getCTM()` sozinho devolve pixels de CSS.
function amostra(path: SVGPathElement, n: number): Pt[] {
  const total = path.getTotalLength();
  const svg = path.ownerSVGElement;
  const paraTela = path.getScreenCTM();
  const telaParaSvg = svg?.getScreenCTM()?.inverse();
  const m = paraTela && telaParaSvg ? telaParaSvg.multiply(paraTela) : null;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = path.getPointAtLength((total * i) / n);
    pts.push(m ? [m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f] : [p.x, p.y]);
  }
  return pts;
}

const areaAssinada = (pts: Pt[]) =>
  pts.reduce((acc, [x, y], i) => {
    const [x2, y2] = pts[(i + 1) % pts.length];
    return acc + x * y2 - x2 * y;
  }, 0);

// Mesmo sentido e ponto inicial mais próximo: sem isso o morph cruza a si mesmo.
export function alinha(origem: Pt[], destino: Pt[]): Pt[] {
  let d = destino;
  if (Math.sign(areaAssinada(origem)) !== Math.sign(areaAssinada(d))) d = [...d].reverse();
  let melhor = 0;
  let menor = Infinity;
  for (let k = 0; k < d.length; k++) {
    let soma = 0;
    for (let i = 0; i < origem.length; i++) {
      const a = origem[i];
      const b = d[(i + k) % d.length];
      soma += (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    }
    if (soma < menor) {
      menor = soma;
      melhor = k;
    }
  }
  return d.map((_, i) => d[(i + melhor) % d.length]);
}

export const interpola = (a: Pt[], b: Pt[], t: number) =>
  "M" + a.map(([x, y], i) => `${(x + (b[i][0] - x) * t).toFixed(1)} ${(y + (b[i][1] - y) * t).toFixed(1)}`).join("L") + "Z";

// Amostra um caminho `d` (sem transformação) em N pontos e passa cada ponto por
// `mapa`, que leva do espaço do caminho para o espaço de quem desenha. Usa um
// <svg> descartável fora da tela, porque `getPointAtLength` precisa do DOM.
// É o que o "pouso" da abertura usa para levar o lf/ até o nome do hero.
export function amostraCaminho(d: string, n: number, mapa: (x: number, y: number) => Pt): Pt[] {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", d);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const total = path.getTotalLength();
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = path.getPointAtLength((total * i) / n);
    pts.push(mapa(p.x, p.y));
  }
  svg.remove();
  return pts;
}

export function LogoMorph({
  className = "",
  tamanho = "h-7 w-7",
  alvo,
}: {
  className?: string;
  /** classes de tamanho do <svg> */
  tamanho?: string;
  /** 0 símbolo, 1 lf/. Definido, o hover é ignorado e quem manda é o pai (abertura). */
  alvo?: 0 | 1;
}) {
  const refs = useRef<(SVGPathElement | null)[]>([]);
  const medidaRef = useRef<SVGSVGElement>(null);
  const aneis = useRef<{ de: Pt[]; para: Pt[] }[] | null>(null);
  const t = useRef(0);
  const alvoRef = useRef(0);
  const raf = useRef(0);
  const [pronto, setPronto] = useState(false);
  const [emLf, setEmLf] = useState(false);

  useEffect(() => {
    const svg = medidaRef.current;
    if (!svg) return;
    const paths = Array.from(svg.querySelectorAll("path"));
    const de = paths.slice(0, 3).map((p) => amostra(p, N));
    const para = paths.slice(3, 6).map((p) => amostra(p, N));
    aneis.current = de.map((o, i) => ({ de: o, para: alinha(o, para[i]) }));
    setPronto(true);
  }, []);

  const desenha = (v: number) => {
    const a = aneis.current;
    if (!a) return;
    for (let i = 0; i < 3; i++) {
      const el = refs.current[i];
      if (!el) continue;
      if (v <= 0) {
        el.setAttribute("d", SIMBOLO[i]);
        el.setAttribute("transform", SIMBOLO_TRANSFORM);
      } else if (v >= 1) {
        el.setAttribute("d", GLIFOS[i].d);
        el.setAttribute("transform", glifoTransform(GLIFOS[i].tx));
      } else {
        el.setAttribute("d", interpola(a[i].de, a[i].para, v));
        el.removeAttribute("transform");
      }
    }
  };

  const vaiPara = (destino: number) => {
    alvoRef.current = destino;
    setEmLf(destino >= 1);
    if (!pronto) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      t.current = destino;
      desenha(destino);
      return;
    }
    cancelAnimationFrame(raf.current);
    const inicio = performance.now();
    const de = t.current;
    const passo = (agora: number) => {
      const k = Math.min(1, (agora - inicio) / DUR_MS);
      t.current = de + (destino - de) * easeInOutCubic(k);
      desenha(t.current);
      if (k < 1) raf.current = requestAnimationFrame(passo);
    };
    raf.current = requestAnimationFrame(passo);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const controlado = alvo !== undefined;
  useEffect(() => {
    if (!controlado) return;
    const id = requestAnimationFrame(() => vaiPara(alvo));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alvo, pronto]);

  return (
    <span
      className={`logo-morph relative inline-block ${className}`}
      onPointerEnter={controlado ? undefined : () => vaiPara(1)}
      onPointerLeave={controlado ? undefined : () => vaiPara(0)}
      onFocus={controlado ? undefined : () => vaiPara(1)}
      onBlur={controlado ? undefined : () => vaiPara(0)}
    >
      <svg viewBox="0 0 512 512" className={`block ${tamanho}`} aria-hidden focusable="false">
        {SIMBOLO.map((d, i) => (
          <path
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            d={d}
            transform={SIMBOLO_TRANSFORM}
            className={i === 2 ? `logo-morph__barra${emLf ? " is-lf" : ""}` : undefined}
            fill="currentColor"
          />
        ))}
      </svg>
      {/* Régua de medida: as seis formas nas posições finais, para o
          `getPointAtLength`. Invisível e sem interação. */}
      <svg
        ref={medidaRef}
        viewBox="0 0 512 512"
        className={`pointer-events-none absolute left-0 top-0 opacity-0 ${tamanho}`}
        aria-hidden
        focusable="false"
      >
        {SIMBOLO.map((d, i) => (
          <path key={`s${i}`} d={d} transform={SIMBOLO_TRANSFORM} />
        ))}
        {GLIFOS.map((g, i) => (
          <path key={`g${i}`} d={g.d} transform={glifoTransform(g.tx)} />
        ))}
      </svg>
    </span>
  );
}
