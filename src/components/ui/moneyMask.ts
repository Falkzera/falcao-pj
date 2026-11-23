// Regras puras da mascara do <MoneyInput>, fora do componente para o teste
// rodar no Node sem navegador. O porque de cada uma esta no topo do MoneyInput.

/**
 * "R$ 1.234,56" com espaco comum depois do R$. O `Intl.NumberFormat` poe um
 * espaco que nao quebra, e a mascara precisa que cada tecla conte como a
 * pessoa espera.
 */
export function formatCentsBRL(cents: number): string {
  // Clamp negative to zero (v1 is unsigned).
  const safe = Math.max(0, Math.floor(cents));
  const reais = Math.floor(safe / 100);
  const centavos = safe % 100;
  const reaisStr = reais.toLocaleString("pt-BR");
  return `R$ ${reaisStr},${centavos.toString().padStart(2, "0")}`;
}

/** Cabe no limite em reais? Sem limite, tudo cabe. */
export function withinMax(cents: number, maxReais: number | undefined): boolean {
  return maxReais === undefined || cents <= Math.round(maxReais * 100);
}

/**
 * Centavos depois de uma tecla: so os digitos contam, e o ultimo e o centavo
 * mais a direita. Texto sem digito vira null (campo limpo). Digito que passa
 * do limite devolve o valor atual, e a tecla nao tem efeito.
 */
export function nextCents(raw: string, current: number | null, maxReais?: number): number | null {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return null;
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed) || !withinMax(parsed, maxReais)) return current;
  return parsed;
}

/**
 * Paste parser: returns the pasted value as REAIS (float), or null if
 * the clipboard content has no parseable numeric content at all. See the
 * test table in the MoneyInput header for the expected behavior.
 */
export function parsePasteToReais(raw: string): number | null {
  // Keep only digits, commas, and periods. Drop everything else
  // (currency symbols, letters, spaces, thin spaces, etc.).
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;

  // Does the string end with a separator followed by 1-2 digits?
  // That trailing group is the decimal part.
  const decimalMatch = cleaned.match(/[.,](\d{1,2})$/);
  if (decimalMatch) {
    const decPart = decimalMatch[1].padEnd(2, "0");
    const intPart = cleaned.slice(0, cleaned.length - decimalMatch[0].length).replace(/[.,]/g, "");
    const n = Number.parseFloat(`${intPart || "0"}.${decPart}`);
    return Number.isFinite(n) ? n : null;
  }

  // No decimal separator: everything is integer reais. Strip any
  // thousand separators that may still be lying around.
  const intOnly = cleaned.replace(/[.,]/g, "");
  const n = Number.parseInt(intOnly, 10);
  return Number.isFinite(n) ? n : null;
}
