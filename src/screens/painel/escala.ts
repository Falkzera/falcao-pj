/* Faixa do bruto mensal, que o controle deslizante e o gráfico dividem, e os brutos
   da tabela de cenários. Funções puras. */

export interface Faixa {
  de: number;
  ate: number;
  /** Valores com rótulo no eixo do gráfico. */
  marcas: number[];
  /** Distância entre os pontos da curva, uns cem pontos na faixa. */
  passo: number;
}

/** Acima de R$ 1 milhão por mês a escala para de crescer: o gráfico não serve para mais que isso. */
const LIMITE_DA_ESCALA = 1_000_000;

/** Intervalo redondo (1, 2 ou 5 vezes uma potência de 10) que divide a largura em até `partes`. */
function intervaloRedondo(largura: number, partes: number): number {
  const minimo = largura / partes;
  const potencia = 10 ** Math.floor(Math.log10(minimo));
  return [1, 2, 5, 10].map((m) => m * potencia).find((m) => m >= minimo) ?? 10 * potencia;
}

/** Marcas redondas entre `de` e `ate`, no máximo `partes` + 1. Faixa que não é finita não tem marca. */
export function marcasEntre(de: number, ate: number, partes = 10): number[] {
  if (!Number.isFinite(de) || !Number.isFinite(ate) || ate <= de) return [];
  const intervalo = intervaloRedondo(ate - de, partes);
  const marcas: number[] = [];
  for (let v = Math.ceil(de / intervalo) * intervalo; v <= ate; v += intervalo) marcas.push(v);
  return marcas;
}

/**
 * De 80% do salário de hoje até o dobro dele, esticada para mostrar o teto quando há.
 * Não depende do bruto escolhido: se dependesse, a escala andaria enquanto o controle desliza.
 */
export function faixaDoBruto(salario: number, teto: number): Faixa {
  const base = salario > 0 ? Math.min(salario, LIMITE_DA_ESCALA) : 5000;
  const alcance = Math.max(base * 2, Math.min(teto, LIMITE_DA_ESCALA) * 1.15);
  const de = Math.max(1000, Math.floor((base * 0.8) / 1000) * 1000);
  const ate = Math.max(de + 2000, Math.ceil(alcance / 1000) * 1000);
  const largura = ate - de;
  return {
    de,
    ate,
    marcas: marcasEntre(de, ate),
    passo: Math.max(50, Math.round(largura / 5000) * 50),
  };
}

/** Décimos de um valor, arredondados a R$ 100 em conta inteira (0,9 não é exato em ponto flutuante). */
const decimos = (valor: number, quantos: number) => Math.round((valor * quantos) / 1000) * 100;

/** O teto (ou a proposta, sem teto), 90% e 80% dele e a proposta atual, sem repetição. */
export function brutosDosCenarios(atual: number, teto: number): number[] {
  const referencia = teto > 0 ? teto : atual;
  const brutos = [
    decimos(referencia, 8),
    decimos(referencia, 9),
    decimos(referencia, 10),
    Math.round(atual),
  ];
  return [...new Set(brutos)].filter((g) => g > 0).sort((a, b) => a - b);
}
