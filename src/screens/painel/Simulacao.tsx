import type { ReactNode } from "react";
import { CampoNumero } from "../../components/campos/CampoNumero";
import { SeloSituacao } from "../../components/campos/SeloSituacao";
import { Segmentos } from "../../components/Segmentos";
import { Checkbox } from "../../components/ui/Checkbox";
import { MoneyInput } from "../../components/ui/MoneyInput";
import type { RegraProLabore } from "../../dominio/calculo.ts";
import { useConsultor, useResultado } from "../../estado/ConsultorContext";
import { brl, numero } from "../../lib/formato";
import { faixaDoBruto } from "./escala.ts";

const REGRAS_PRO_LABORE = [
  {
    value: "fatorR",
    label: "Fator R",
    explica: "28% do faturamento, o mínimo para ficar no Anexo III",
  },
  { value: "isento", label: "R$ 5 mil", explica: "o maior valor que não paga IR" },
  { value: "minimo", label: "Mínimo", explica: "um salário mínimo; a empresa cai no Anexo V" },
  { value: "outro", label: "Outro", explica: "o valor que você escolher" },
] as const;

const PESSOAS = [
  { value: "1", label: "1", nome: "1 pessoa, cada um com o seu CNPJ" },
  { value: "2", label: "2", nome: "2 pessoas" },
  { value: "3", label: "3", nome: "3 pessoas" },
  { value: "4", label: "4", nome: "4 pessoas na mesma empresa" },
] as const;

/** Atalhos de como o pagamento cai no ano: dias de folga e feriados sem receber. */
const ATALHOS = [
  { value: "sem-folga", label: "Sem folga", folga: 0, feriados: 0 },
  { value: "folga", label: "Com folga", folga: 21, feriados: 0 },
  { value: "folga-feriados", label: "+ feriados", folga: 21, feriados: 12 },
] as const;

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 border-border-subtle border-b pb-6 last:border-b-0 last:pb-0">
      <legend className="titulo-secao mb-4 text-[1.375rem]">{titulo}</legend>
      {children}
    </fieldset>
  );
}

function Leitura({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl bg-bg-primary px-4 py-3 text-sm text-text-secondary">{children}</p>
  );
}

function Rotulo({ texto, campo }: { texto: string; campo: string }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {texto} <SeloSituacao campo={campo} />
    </span>
  );
}

function Pergunta({ children }: { children: ReactNode }) {
  return <p className="font-semibold text-sm text-text-secondary">{children}</p>;
}

export function Simulacao() {
  const { estado, alterar } = useConsultor();
  const { p, hoje, pj } = useResultado();
  const faixa = faixaDoBruto(p.salario, p.teto);
  const atalho =
    ATALHOS.find((a) => a.folga === p.folgaDias && a.feriados === p.feriadosDias)?.value ?? "";
  const regra =
    REGRAS_PRO_LABORE.find((r) => r.value === estado.empresa.proLaboreRegra) ??
    REGRAS_PRO_LABORE[0];
  const valorContrato = (id: string) => (n: number | null) =>
    alterar((r) => {
      r.contrato[id].valor = n ?? 0;
    });

  return (
    <section className="cartao space-y-6 p-5 sm:p-6" aria-label="Simulação">
      <Grupo titulo="Hoje, no emprego">
        <MoneyInput
          label="Salário bruto mensal"
          value={estado.hoje.salario}
          onChange={(n) =>
            alterar((r) => {
              r.hoje.salario = n ?? 0;
            })
          }
        />
        <CampoNumero
          label="Dependentes no IR"
          min={0}
          step={1}
          valor={estado.hoje.dependentes}
          aoMudar={(n) =>
            alterar((r) => {
              r.hoje.dependentes = Math.max(0, Math.round(n));
            })
          }
        />
        <div className="flex flex-col gap-3">
          <Checkbox
            label="Recebe 13º e 1/3 de férias"
            checked={estado.hoje.recebe13Ferias}
            onChange={(c) =>
              alterar((r) => {
                r.hoje.recebe13Ferias = c;
              })
            }
          />
          <Checkbox
            label="Tem FGTS (8% ao mês)"
            checked={estado.hoje.temFgts}
            onChange={(c) =>
              alterar((r) => {
                r.hoje.temFgts = c;
              })
            }
          />
        </div>
        <Leitura>
          INSS {brl(hoje.inss)} · IR {brl(hoje.ir.ir)} ·{" "}
          <strong className="text-text-primary">líquido {brl(hoje.liquido)}</strong> por mês
        </Leitura>
      </Grupo>

      <Grupo titulo="Proposta PJ">
        <div className="space-y-2">
          <MoneyInput
            label={<Rotulo texto="Valor bruto mensal" campo="brutoMensal" />}
            value={p.brutoMensal}
            onChange={valorContrato("brutoMensal")}
          />
          <input
            type="range"
            min={faixa.de}
            max={faixa.ate}
            step={50}
            value={p.brutoMensal}
            aria-label="Valor bruto mensal"
            onChange={(e) => valorContrato("brutoMensal")(Number(e.target.value))}
            className="w-full cursor-pointer"
            style={{ accentColor: "var(--tinta)" }}
          />
          <div className="tabular flex justify-between text-text-muted text-xs">
            <span>{numero(faixa.de / 1000, 0)} mil</span>
            {p.teto > 0 && <span>teto {numero(p.teto / 1000, 1)} mil</span>}
            <span>{numero(faixa.ate / 1000, 0)} mil</span>
          </div>
        </div>
        <CampoNumero
          label={<Rotulo texto="Horas por mês" campo="horasMes" />}
          min={1}
          step={1}
          valor={p.horasMes}
          aoMudar={(n) => valorContrato("horasMes")(n)}
        />
        <div className="space-y-2">
          <Pergunta>Como o pagamento cai no ano</Pergunta>
          <Segmentos
            aria-label="Como o pagamento cai no ano"
            opcoes={ATALHOS.map(({ value, label }) => ({ value, label }))}
            value={atalho}
            onChange={(v) => {
              const a = ATALHOS.find((x) => x.value === v);
              if (!a) return;
              alterar((r) => {
                r.contrato.folgaDias.valor = a.folga;
                r.contrato.feriadosDias.valor = a.feriados;
              });
            }}
          />
          <p className="text-text-muted text-xs">
            Com folga: um mês por ano sem receber. Mais feriados: também os feriados em dia útil.
          </p>
        </div>
        <div className="grid grid-cols-2 items-end gap-3">
          <CampoNumero
            label={<Rotulo texto="Folga (dias)" campo="folgaDias" />}
            min={0}
            step={1}
            valor={p.folgaDias}
            aoMudar={(n) => valorContrato("folgaDias")(Math.max(0, n))}
          />
          <CampoNumero
            label={<Rotulo texto="Feriados" campo="feriadosDias" />}
            min={0}
            step={1}
            valor={p.feriadosDias}
            aoMudar={(n) => valorContrato("feriadosDias")(Math.max(0, n))}
          />
        </div>
        <Leitura>
          <strong className="text-text-primary">{numero(pj.meses)} meses pagos</strong> no ano
        </Leitura>
      </Grupo>

      <Grupo titulo="Empresa no Simples">
        <div className="space-y-2">
          <Pergunta>Pró-labore</Pergunta>
          <Segmentos
            aria-label="Regra do pró-labore"
            opcoes={REGRAS_PRO_LABORE.map(({ value, label }) => ({ value, label }))}
            value={estado.empresa.proLaboreRegra}
            onChange={(v) =>
              alterar((r) => {
                r.empresa.proLaboreRegra = v as RegraProLabore;
              })
            }
          />
          <p className="text-text-muted text-xs">{regra.explica}.</p>
        </div>
        {estado.empresa.proLaboreRegra === "outro" && (
          <MoneyInput
            label="Pró-labore mensal"
            value={estado.empresa.proLaboreValor}
            onChange={(n) =>
              alterar((r) => {
                r.empresa.proLaboreValor = n ?? 0;
              })
            }
          />
        )}
        <div className="space-y-2">
          <Pergunta>Pessoas faturando no mesmo CNPJ</Pergunta>
          <Segmentos
            aria-label="Pessoas faturando no mesmo CNPJ"
            opcoes={PESSOAS.map(({ value, label, nome }) => ({ value, label, nome }))}
            value={String(estado.empresa.pessoasNoCnpj)}
            onChange={(v) =>
              alterar((r) => {
                r.empresa.pessoasNoCnpj = Number(v);
              })
            }
          />
        </div>
        <Leitura>
          Pró-labore <strong className="text-text-primary">{brl(pj.proLabore)}</strong> por mês ·
          Fator R {numero(pj.fatorR * 100, 1)}% ·{" "}
          <strong className="text-text-primary">Anexo {pj.anexo}</strong>, alíquota{" "}
          {numero(pj.aliquota * 100)}%
        </Leitura>
      </Grupo>

      <Grupo titulo="Custos por mês">
        <div className="grid grid-cols-2 items-end gap-3">
          <MoneyInput
            label="Contador"
            value={estado.custos.contador}
            onChange={(n) =>
              alterar((r) => {
                r.custos.contador = n ?? 0;
              })
            }
          />
          <MoneyInput
            label="Certificado e taxas"
            value={estado.custos.taxas}
            onChange={(n) =>
              alterar((r) => {
                r.custos.taxas = n ?? 0;
              })
            }
          />
        </div>
        <div className="grid grid-cols-2 items-end gap-3">
          <MoneyInput
            label="Assinatura dividida (total)"
            value={estado.custos.assinaturaTotal}
            onChange={(n) =>
              alterar((r) => {
                r.custos.assinaturaTotal = n ?? 0;
              })
            }
          />
          <CampoNumero
            label="Dividido entre"
            min={1}
            step={1}
            valor={estado.custos.assinaturaPessoas}
            aoMudar={(n) =>
              alterar((r) => {
                r.custos.assinaturaPessoas = Math.max(1, Math.round(n));
              })
            }
          />
        </div>
        <MoneyInput
          label="Outros (notebook, plano de saúde)"
          value={estado.custos.outros}
          onChange={(n) =>
            alterar((r) => {
              r.custos.outros = n ?? 0;
            })
          }
        />
        <Leitura>
          Total <strong className="text-text-primary">{brl(pj.fixosMes)}</strong> por mês, com{" "}
          {brl(pj.assinaturaMes)} de assinatura por pessoa
        </Leitura>
      </Grupo>
    </section>
  );
}
