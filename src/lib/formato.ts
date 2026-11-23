/* Formatação em português do Brasil. Dinheiro sempre como R$ 1.234,56. */

const formatadores = new Map<number, Intl.NumberFormat>();

export function numero(v: number, casas = 2): string {
  let f = formatadores.get(casas);
  if (!f) {
    f = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    });
    formatadores.set(casas, f);
  }
  return f.format(v);
}

export const brl = (v: number, casas = 2) =>
  `${v < -0.005 ? "−" : ""}R$ ${numero(Math.abs(v), casas)}`;
export const negativo = (v: number, casas = 2) => `− ${brl(v, casas)}`;
export const mil = (v: number) => `${v < 0 ? "−" : ""}R$ ${numero(Math.abs(v) / 1000, 1)} mil`;
export const pct = (v: number, casas = 0) =>
  `${v > 0.0005 ? "+" : v < -0.0005 ? "−" : ""}${numero(Math.abs(v * 100), casas)}%`;
/** Diferença em reais com o sinal na frente: "+R$ 2.084", "−R$ 310". Zero vai sem sinal. */
export function comSinal(v: number, casas = 0): string {
  const arredondado = Number(v.toFixed(casas));
  if (arredondado === 0) return brl(0, casas);
  return `${arredondado > 0 ? "+" : ""}${brl(arredondado, casas)}`;
}
