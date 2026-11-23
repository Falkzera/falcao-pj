/* Contas do consultor. Funções puras: recebem os parâmetros e devolvem números,
   sem tocar na tela. Os parâmetros saem de `parametros()` em estado.ts. */
import { type Anexo, REGRAS as R } from "./regras.ts";

export type RegraProLabore = "fatorR" | "isento" | "minimo" | "outro";

export interface Parametros {
  salario: number;
  dependentes: number;
  recebe13Ferias: boolean;
  temFgts: boolean;
  brutoMensal: number;
  horasMes: number;
  folgaDias: number;
  feriadosDias: number;
  /** Teto do contratante por mês; zero quando não há. Não entra na conta, só nos avisos. */
  teto: number;
  proLaboreRegra: RegraProLabore;
  proLaboreValor: number;
  pessoasNoCnpj: number;
  contador: number;
  taxas: number;
  assinaturaTotal: number;
  assinaturaPessoas: number;
  outros: number;
}

export interface ResultadoIr {
  imposto: number;
  reducao: number;
  ir: number;
}

/** INSS e IR saem em centavos, como na folha de pagamento. */
const centavos = (v: number) => Math.round(v * 100) / 100;
/** Corta nos centavos. A folha faz assim em cada faixa do INSS; a folga absorve o
    resíduo de ponto flutuante (1.000 × 14% pode chegar como 139,99999999999994). */
const cortaCentavos = (v: number) => Math.floor(v * 100 + 1e-6) / 100;

/** INSS progressivo: cada faixa cortada nos centavos e somada, como num contracheque real. */
export function inss(salario: number): number {
  let total = 0;
  let anterior = 0;
  for (const [limite, aliquota] of R.inss.faixas) {
    if (salario > anterior)
      total += cortaCentavos((Math.min(salario, limite) - anterior) * aliquota);
    anterior = limite;
  }
  return centavos(total);
}

function irTabela(base: number): number {
  for (const [limite, aliquota, deducao] of R.ir.faixas) {
    if (base <= limite) return Math.max(0, base * aliquota - deducao);
  }
  return 0;
}

/** IR do mês pela opção mais barata (deduções legais ou desconto simplificado),
    menos o desconto da Lei 15.270/2025. */
export function irMensal(bruto: number, inssValor: number, dependentes: number): ResultadoIr {
  const legal = irTabela(bruto - inssValor - dependentes * R.ir.deducaoDependente);
  const simplificado = irTabela(bruto - R.ir.descontoSimplificado);
  const imposto = centavos(Math.min(legal, simplificado));
  const lei = R.ir.reducao;
  let reducao = 0;
  if (bruto <= lei.isencaoAte)
    reducao = imposto; // a lei zera o imposto nessa faixa
  else if (bruto <= lei.parcialAte)
    reducao = Math.max(0, centavos(lei.constante - lei.fator * bruto));
  reducao = Math.min(reducao, imposto);
  return { imposto, reducao, ir: centavos(imposto - reducao) };
}

function aliquotaEfetiva(rbt12: number, anexo: Anexo): number {
  const faixas = R.simples.anexos[anexo];
  if (rbt12 <= 0) return faixas[0][1];
  for (const [limite, nominal, deducao] of faixas) {
    if (rbt12 <= limite) return (rbt12 * nominal - deducao) / rbt12;
  }
  const [, nominal, deducao] = faixas[faixas.length - 1];
  return (rbt12 * nominal - deducao) / rbt12;
}

export interface SituacaoHoje {
  salario: number;
  inss: number;
  ir: ResultadoIr;
  liquido: number;
  decimoTerceiro: number;
  terco: { bruto: number; inss: number; ir: number; liquido: number };
  fgts: number;
  total: number;
}

/** Situação de hoje no cargo: 12 salários, 13º, 1/3 de férias e FGTS, tudo líquido. */
export function hoje(p: Parametros): SituacaoHoje {
  const s = p.salario;
  const i = inss(s);
  const ir = irMensal(s, i, p.dependentes);
  const liquido = s - i - ir.ir;
  const decimoTerceiro = p.recebe13Ferias ? liquido : 0;
  let terco = { bruto: 0, inss: 0, ir: 0, liquido: 0 };
  if (p.recebe13Ferias) {
    const mesFerias = s + s / 3;
    const i2 = inss(mesFerias);
    const ir2 = irMensal(mesFerias, i2, p.dependentes);
    terco = {
      bruto: s / 3,
      inss: i2 - i,
      ir: ir2.ir - ir.ir,
      liquido: mesFerias - i2 - ir2.ir - liquido,
    };
  }
  const fgts = p.temFgts ? 0.08 * (12 * s + (p.recebe13Ferias ? s + s / 3 : 0)) : 0;
  const total = 12 * liquido + decimoTerceiro + terco.liquido + fgts;
  return { salario: s, inss: i, ir, liquido, decimoTerceiro, terco, fgts, total };
}

export function mesesPagos(p: Pick<Parametros, "folgaDias" | "feriadosDias">): number {
  return Math.max(0, 12 - (p.folgaDias + p.feriadosDias) / R.diasUteisPorMes);
}

export function proLabore(
  p: Pick<Parametros, "proLaboreRegra" | "proLaboreValor">,
  receitaAnual: number,
): number {
  if (p.proLaboreRegra === "fatorR") {
    // arredonda para cima no centavo; o 1e-6 evita que resíduo de ponto flutuante suba um centavo
    return Math.max(
      Math.ceil(((R.simples.fatorR * receitaAnual) / 12) * 100 - 1e-6) / 100,
      R.salarioMinimo,
    );
  }
  if (p.proLaboreRegra === "isento") return R.ir.reducao.isencaoAte;
  if (p.proLaboreRegra === "minimo") return R.salarioMinimo;
  return Math.max(0, p.proLaboreValor);
}

export interface ResultadoPj {
  bruto: number;
  meses: number;
  receita: number;
  rbt12: number;
  proLabore: number;
  fatorR: number;
  anexo: Anexo;
  aliquota: number;
  das: number;
  inssMes: number;
  inssAno: number;
  irMes: number;
  irAno: number;
  assinaturaMes: number;
  fixosMes: number;
  fixosAno: number;
  lucro: number;
  liquido: number;
}

/** Empresa de um sócio no Simples. O anexo sai do Fator R; a faixa, do faturamento do CNPJ. */
export function pj(p: Parametros, bruto: number): ResultadoPj {
  const meses = mesesPagos(p);
  const receita = bruto * meses;
  const rbt12 = receita * p.pessoasNoCnpj;
  const pl = proLabore(p, receita);
  const fatorR = receita > 0 ? (pl * 12) / receita : 0;
  const anexo: Anexo = fatorR >= R.simples.fatorR - 1e-9 ? "III" : "V";
  const aliquota = aliquotaEfetiva(rbt12, anexo);
  const das = aliquota * receita;
  const inssMes = centavos(R.inss.aliquotaSocio * Math.min(pl, R.inss.teto));
  const irMes = irMensal(pl, inssMes, p.dependentes).ir;
  const assinaturaMes = p.assinaturaTotal / Math.max(1, p.assinaturaPessoas);
  const fixosMes = p.contador + p.taxas + assinaturaMes + p.outros;
  const inssAno = inssMes * 12;
  const irAno = irMes * 12;
  const fixosAno = fixosMes * 12;
  const lucro = receita - das - pl * 12 - fixosAno;
  const liquido = receita - das - inssAno - irAno - fixosAno;
  return {
    bruto,
    meses,
    receita,
    rbt12,
    proLabore: pl,
    fatorR,
    anexo,
    aliquota,
    das,
    inssMes,
    inssAno,
    irMes,
    irAno,
    assinaturaMes,
    fixosMes,
    fixosAno,
    lucro,
    liquido,
  };
}

/** Bruto mensal que deixa o líquido PJ igual ao alvo. Null se nem o teto da busca alcança. */
export function empate(p: Parametros, alvo: number, tetoBusca = 60000): number | null {
  const diferenca = (g: number) => pj(p, g).liquido - alvo;
  let baixo = 0;
  let alto = tetoBusca;
  if (diferenca(alto) < 0) return null;
  if (diferenca(baixo) >= 0) return 0;
  for (let k = 0; k < 60; k++) {
    const meio = (baixo + alto) / 2;
    if (diferenca(meio) < 0) baixo = meio;
    else alto = meio;
  }
  return alto;
}
