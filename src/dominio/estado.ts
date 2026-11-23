/* Os dados do usuário: situação de hoje, itens do contrato, empresa e custos.
   Ficam no navegador (localStorage), saem e entram por arquivo JSON e podem partir
   de um arquivo local fora do git (dados/meus-dados.json). Sem React aqui. */
import type { Parametros, RegraProLabore } from "./calculo.ts";
import { REGRAS } from "./regras.ts";

const CHAVE = "falcao-pj-v1";
const VERSAO = 1;

export type Situacao = "estimado" | "confirmado" | "contrato";

export const SITUACOES: Record<Situacao, string> = {
  estimado: "Estimado",
  confirmado: "Confirmado na reunião",
  contrato: "No contrato",
};

type TipoCampo = "dinheiro" | "numero" | "opcao" | "data" | "texto";

/**
 * O maior valor de cada tipo de campo. Acima disso o número é engano ou foi digitado
 * para quebrar a tela, e a tela digitada e o arquivo importado respeitam os mesmos.
 */
export const LIMITES = {
  /** Qualquer valor em dinheiro, por mês. */
  dinheiro: 1_000_000,
  /** Letras de um texto ou de uma anotação do contrato. */
  texto: 300,
  dependentes: 20,
} as const;

/** Dias úteis de um ano, o máximo de folga ou de feriados sem receber. */
const DIAS_UTEIS_NO_ANO = REGRAS.diasUteisPorMes * 12;

export interface CampoContrato {
  id: string;
  rotulo: string;
  tipo: TipoCampo;
  padrao: number | string;
  pergunta: string;
  /** Muda o resultado do painel. */
  conta?: boolean;
  opcoes?: string[];
  /** Maior valor de um item de número. Item de dinheiro usa `LIMITES.dinheiro`. */
  max?: number;
}

/** Cada item que o contrato define. */
export const CAMPOS: CampoContrato[] = [
  {
    id: "brutoMensal",
    rotulo: "Valor bruto mensal",
    tipo: "dinheiro",
    padrao: 9000,
    conta: true,
    pergunta: "Qual é o valor mensal ou o valor da hora, e quantas horas ele cobre?",
  },
  {
    id: "teto",
    rotulo: "Teto do contratante (0 se não houver)",
    tipo: "dinheiro",
    padrao: 0,
    pergunta: "Existe um valor máximo que o contratante pode pagar por mês?",
  },
  {
    id: "horasMes",
    rotulo: "Horas por mês",
    tipo: "numero",
    padrao: 160,
    max: 744, // as horas de um mês de 31 dias
    conta: true,
    pergunta: "Quantas horas por mês o contrato prevê?",
  },
  {
    id: "folgaDias",
    rotulo: "Dias úteis de descanso sem receber",
    tipo: "numero",
    padrao: 21,
    max: DIAS_UTEIS_NO_ANO,
    conta: true,
    pergunta: "Existe descanso remunerado no ano? Se não, quantos dias posso tirar sem receber?",
  },
  {
    id: "feriadosDias",
    rotulo: "Feriados em dia útil sem receber",
    tipo: "numero",
    padrao: 12,
    max: DIAS_UTEIS_NO_ANO,
    conta: true,
    pergunta: "Feriados, pontos facultativos e recesso são pagos?",
  },
  {
    id: "formaPagamento",
    rotulo: "Forma de pagamento",
    tipo: "opcao",
    padrao: "Por hora trabalhada",
    opcoes: ["Por hora trabalhada", "Mensal fixo", "Por produto entregue"],
    pergunta: "O pagamento é por hora registrada, mensal fixo ou por produto aprovado?",
  },
  {
    id: "prazoPagamento",
    rotulo: "Dias até o pagamento depois da entrega",
    tipo: "numero",
    padrao: 30,
    max: 365,
    pergunta: "Quantos dias depois da entrega do relatório ou produto o dinheiro cai?",
  },
  {
    id: "inicio",
    rotulo: "Início do contrato",
    tipo: "data",
    padrao: "",
    pergunta: "Qual é a data prevista de início?",
  },
  {
    id: "fim",
    rotulo: "Fim do contrato",
    tipo: "data",
    padrao: "",
    pergunta: "Qual é a duração do contrato e se ele pode ser renovado?",
  },
  {
    id: "reajuste",
    rotulo: "Reajuste",
    tipo: "texto",
    padrao: "",
    pergunta: "Há reajuste durante o contrato? Por qual índice?",
  },
  {
    id: "cnpjIndividual",
    rotulo: "Cada consultor com o próprio CNPJ",
    tipo: "opcao",
    padrao: "Sim",
    opcoes: ["Sim", "Não", "Tanto faz"],
    pergunta:
      "Cada consultor precisa ter o próprio CNPJ, ou uma empresa com vários sócios é aceita?",
  },
  {
    id: "vinculoAtual",
    rotulo: "Saída do vínculo atual",
    tipo: "texto",
    padrao: "",
    pergunta:
      "Preciso encerrar o vínculo atual antes de assinar? Existe regra de impedimento ou de quarentena para o meu caso?",
  },
  {
    id: "local",
    rotulo: "Local de trabalho",
    tipo: "opcao",
    padrao: "Presencial",
    opcoes: ["Presencial", "Remoto", "Híbrido"],
    pergunta: "O trabalho é presencial, remoto ou híbrido?",
  },
  {
    id: "equipamento",
    rotulo: "Equipamento",
    tipo: "opcao",
    padrao: "Próprio",
    opcoes: ["Próprio", "Do contratante"],
    pergunta: "O notebook e os acessos são meus ou do contratante?",
  },
  {
    id: "rescisao",
    rotulo: "Rescisão e aviso prévio",
    tipo: "texto",
    padrao: "",
    pergunta: "Como funciona a rescisão? Há aviso prévio dos dois lados?",
  },
];

/** O maior valor que um item de dinheiro ou de número aceita. */
export function limiteDe(c: CampoContrato): number {
  return c.max ?? LIMITES.dinheiro;
}

export interface ItemContrato {
  valor: number | string;
  situacao: Situacao;
  nota: string;
}

export interface Estado {
  versao: number;
  hoje: { salario: number; dependentes: number; recebe13Ferias: boolean; temFgts: boolean };
  contrato: Record<string, ItemContrato>;
  empresa: { proLaboreRegra: RegraProLabore; proLaboreValor: number; pessoasNoCnpj: number };
  custos: {
    contador: number;
    taxas: number;
    assinaturaTotal: number;
    assinaturaPessoas: number;
    outros: number;
  };
}

const REGRAS_PRO_LABORE: RegraProLabore[] = ["fatorR", "isento", "minimo", "outro"];

/** Valores de exemplo. Os dados reais de cada pessoa ficam fora do código. */
function base(): Estado {
  const contrato: Record<string, ItemContrato> = {};
  for (const c of CAMPOS) contrato[c.id] = { valor: c.padrao, situacao: "estimado", nota: "" };
  return {
    versao: VERSAO,
    hoje: { salario: 6000, dependentes: 0, recebe13Ferias: true, temFgts: false },
    contrato,
    empresa: { proLaboreRegra: "fatorR", proLaboreValor: 5000, pessoasNoCnpj: 1 },
    custos: { contador: 300, taxas: 40, assinaturaTotal: 0, assinaturaPessoas: 1, outros: 0 },
  };
}

const ehObjeto = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
/** Número de arquivo fora de 0 a `maximo` volta para o padrão: o arquivo está errado ou foi feito para travar a tela. */
const numeroOu = (v: unknown, padrao: number, maximo: number = LIMITES.dinheiro) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= maximo ? v : padrao;
const textoOu = (v: unknown, padrao: string) =>
  typeof v === "string" ? v.slice(0, LIMITES.texto) : padrao;

/**
 * Copia de `entrada` só o que existe no modelo e tem o tipo certo; o resto fica como está.
 * Número vai até `LIMITES.dinheiro`, ou até o limite dado para aquela chave.
 */
function mesclar<T extends object>(
  modelo: T,
  entrada: unknown,
  limites: Partial<Record<keyof T, number>> = {},
): void {
  if (!ehObjeto(entrada)) return;
  const alvo = modelo as Record<string, unknown>;
  const maximos = limites as Record<string, number | undefined>;
  for (const [chave, padrao] of Object.entries(alvo)) {
    const v = entrada[chave];
    if (typeof padrao === "number") alvo[chave] = numeroOu(v, padrao, maximos[chave]);
    else if (typeof padrao === "boolean") alvo[chave] = typeof v === "boolean" ? v : padrao;
    else if (typeof padrao === "string") alvo[chave] = typeof v === "string" ? v : padrao;
  }
}

export function normalizar(entrada: unknown, modelo: Estado = base()): Estado {
  if (!ehObjeto(entrada)) throw new Error("O arquivo não tem os dados do consultor.");
  mesclar(modelo.hoje, entrada.hoje, { dependentes: LIMITES.dependentes });
  mesclar(modelo.empresa, entrada.empresa);
  mesclar(modelo.custos, entrada.custos);
  if (!REGRAS_PRO_LABORE.includes(modelo.empresa.proLaboreRegra))
    modelo.empresa.proLaboreRegra = "fatorR";
  modelo.empresa.pessoasNoCnpj = Math.min(4, Math.max(1, Math.round(modelo.empresa.pessoasNoCnpj)));
  const contrato = ehObjeto(entrada.contrato) ? entrada.contrato : {};
  for (const c of CAMPOS) {
    const item = contrato[c.id];
    if (!ehObjeto(item)) continue;
    const alvo = modelo.contrato[c.id];
    if (c.tipo === "dinheiro" || c.tipo === "numero")
      alvo.valor = numeroOu(item.valor, c.padrao as number, limiteDe(c));
    else if (c.tipo === "opcao")
      alvo.valor = c.opcoes?.includes(item.valor as string) ? (item.valor as string) : c.padrao;
    else alvo.valor = textoOu(item.valor, c.padrao as string);
    alvo.situacao =
      typeof item.situacao === "string" && Object.hasOwn(SITUACOES, item.situacao)
        ? (item.situacao as Situacao)
        : "estimado";
    alvo.nota = textoOu(item.nota, "");
  }
  return modelo;
}

/** Estado inicial: exemplo, ou os dados locais da pessoa quando existem. */
export function padrao(dadosIniciais?: unknown): Estado {
  return ehObjeto(dadosIniciais) ? normalizar(dadosIniciais) : base();
}

interface Armazenamento {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
  removeItem(chave: string): void;
}

export function carregar(armazenamento: Armazenamento | null, dadosIniciais?: unknown): Estado {
  try {
    const texto = armazenamento?.getItem(CHAVE);
    if (texto) return normalizar(JSON.parse(texto));
  } catch {
    // armazenamento indisponível ou corrompido: começa do padrão
  }
  return padrao(dadosIniciais);
}

export function salvar(estado: Estado, armazenamento: Armazenamento | null): boolean {
  try {
    armazenamento?.setItem(CHAVE, JSON.stringify(estado));
    return armazenamento !== null;
  } catch {
    return false;
  }
}

export function apagar(armazenamento: Armazenamento | null): void {
  try {
    armazenamento?.removeItem(CHAVE);
  } catch {
    // nada a apagar
  }
}

/** Objeto plano que o cálculo recebe. */
export function parametros(e: Estado): Parametros {
  const numero = (id: string) => Number(e.contrato[id].valor) || 0;
  return {
    ...e.hoje,
    ...e.empresa,
    ...e.custos,
    brutoMensal: numero("brutoMensal"),
    horasMes: numero("horasMes"),
    folgaDias: numero("folgaDias"),
    feriadosDias: numero("feriadosDias"),
    teto: numero("teto"),
  };
}

export function pendentes(e: Estado, soOsDaConta = false): CampoContrato[] {
  return CAMPOS.filter(
    (c) => e.contrato[c.id].situacao === "estimado" && (!soOsDaConta || c.conta),
  );
}

export function textoPerguntas(e: Estado): string {
  const lista = pendentes(e);
  if (!lista.length) return "Nenhuma pergunta pendente: todos os itens estão confirmados.";
  return `Perguntas para a reunião\n\n${lista.map((c, i) => `${i + 1}. ${c.pergunta}`).join("\n")}`;
}
