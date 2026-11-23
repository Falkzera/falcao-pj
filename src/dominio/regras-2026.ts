/* Regras fiscais vigentes em 2026. Para outro ano, crie regras-AAAA.ts com o mesmo
   formato e troque o export de regras.ts. */

/** [limite da faixa, alíquota] */
type FaixaInss = readonly [number, number];
/** [limite, alíquota, parcela a deduzir] */
type FaixaComDeducao = readonly [number, number, number];

export const REGRAS = {
  ano: 2026,
  salarioMinimo: 1621.0,
  diasUteisPorMes: 21,

  inss: {
    // progressivo, faixa a faixa
    faixas: [
      [1621.0, 0.075],
      [2902.84, 0.09],
      [4354.27, 0.12],
      [8475.55, 0.14],
    ] as readonly FaixaInss[],
    teto: 8475.55,
    aliquotaSocio: 0.11,
  },

  ir: {
    // tabela mensal sobre a base de cálculo
    faixas: [
      [2428.8, 0, 0],
      [2826.65, 0.075, 182.16],
      [3751.05, 0.15, 394.16],
      [4664.68, 0.225, 675.49],
      [Number.POSITIVE_INFINITY, 0.275, 908.73],
    ] as readonly FaixaComDeducao[],
    deducaoDependente: 189.59,
    descontoSimplificado: 607.2,
    // Lei 15.270/2025: zera o imposto até R$ 5 mil e reduz até R$ 7.350
    reducao: {
      isencaoAte: 5000,
      reducaoMaxima: 312.89,
      parcialAte: 7350,
      constante: 978.62,
      fator: 0.133145,
    },
  },

  simples: {
    fatorR: 0.28,
    limite: 4_800_000,
    // faixas pela receita bruta dos últimos 12 meses
    anexos: {
      III: [
        [180_000, 0.06, 0],
        [360_000, 0.112, 9360],
        [720_000, 0.135, 17640],
        [1_800_000, 0.16, 35640],
        [3_600_000, 0.21, 125640],
        [4_800_000, 0.33, 648000],
      ] as readonly FaixaComDeducao[],
      V: [
        [180_000, 0.155, 0],
        [360_000, 0.18, 4500],
        [720_000, 0.195, 9900],
        [1_800_000, 0.205, 17100],
        [3_600_000, 0.23, 62100],
        [4_800_000, 0.305, 540000],
      ] as readonly FaixaComDeducao[],
    },
  },

  mei: { limiteAnual: 81_000 },
  dividendos: { limiteMensalSemRetencao: 50_000, retencao: 0.1 },
} as const;

export type Anexo = keyof typeof REGRAS.simples.anexos;
