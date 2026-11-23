import type { ReactNode } from "react";
import { Cartao, Tela } from "../../components/Tela";
import { REGRAS as R } from "../../dominio/regras.ts";
import { brl, numero } from "../../lib/formato";

const pctNum = (v: number) => `${numero(v * 100, (v * 100) % 1 ? 1 : 0)}%`;

function intervalo(de: number, ate: number): string {
  if (ate === Number.POSITIVE_INFINITY) return `acima de ${brl(de)}`;
  if (de === 0) return `até ${brl(ate)}`;
  return `de ${brl(de + 0.01)} a ${brl(ate)}`;
}

function Quadro({
  titulo,
  cabecalho,
  linhas,
  nota,
}: {
  titulo: string;
  cabecalho: string[];
  linhas: ReactNode[][];
  nota: ReactNode;
}) {
  return (
    <Cartao titulo={titulo}>
      <div className="overflow-x-auto">
        <table className="w-full text-[0.9375rem]">
          <thead>
            <tr className="rotulo border-border border-b text-text-muted">
              {cabecalho.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={i ? "py-2 text-right font-bold" : "py-2 text-left font-bold"}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, i) => (
              <tr key={i} className="border-border-subtle border-b last:border-b-0">
                {linha.map((celula, j) => (
                  <td key={j} className={j ? "tabular py-2.5 text-right font-semibold" : "py-2.5"}>
                    {celula}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-text-secondary">{nota}</p>
    </Cartao>
  );
}

function comInicio<T extends readonly number[]>(faixas: readonly T[]): { de: number; faixa: T }[] {
  return faixas.map((faixa, i) => ({ de: i ? faixas[i - 1][0] : 0, faixa }));
}

export default function RegrasScreen() {
  const lei = R.ir.reducao;
  return (
    <Tela
      titulo="Regras de 2026"
      descricao="As tabelas que a conta usa. Quando a lei mudar ou o ano virar, o arquivo de regras é atualizado e os testes rodam de novo."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <Quadro
          titulo="INSS do empregado"
          cabecalho={["Faixa de salário", "Alíquota"]}
          linhas={comInicio(R.inss.faixas).map(({ de, faixa }) => [
            intervalo(de, faixa[0]),
            pctNum(faixa[1]),
          ])}
          nota={`Progressivo, faixa a faixa, até o teto de ${brl(R.inss.teto)}. Sócio de empresa no Simples paga ${pctNum(R.inss.aliquotaSocio)} sobre o pró-labore.`}
        />
        <Quadro
          titulo="IR mensal"
          cabecalho={["Base de cálculo", "Alíquota", "Parcela a deduzir"]}
          linhas={comInicio(R.ir.faixas).map(({ de, faixa }) => [
            intervalo(de, faixa[0]),
            pctNum(faixa[1]),
            brl(faixa[2]),
          ])}
          nota={`Base = renda − INSS − ${brl(R.ir.deducaoDependente)} por dependente, ou renda − ${brl(R.ir.descontoSimplificado)}, o que for melhor. Lei 15.270: até ${brl(lei.isencaoAte)} não paga; até ${brl(lei.parcialAte)} o imposto cai ${numero(lei.constante)} − ${numero(lei.fator, 6)} × renda.`}
        />
        <Quadro
          titulo="Simples Nacional"
          cabecalho={["Faturamento em 12 meses", "Anexo III", "Anexo V"]}
          linhas={comInicio(R.simples.anexos.III).map(({ de, faixa }, i) => {
            const v = R.simples.anexos.V[i];
            return [
              intervalo(de, faixa[0]),
              `${pctNum(faixa[1])} − ${brl(faixa[2], 0)}`,
              `${pctNum(v[1])} − ${brl(v[2], 0)}`,
            ];
          })}
          nota={`Alíquota efetiva = (faturamento × alíquota − parcela a deduzir) ÷ faturamento. Desenvolvimento de software fica no Anexo V e vai para o Anexo III quando a folha, com o pró-labore, chega a ${pctNum(R.simples.fatorR)} do faturamento (Fator R).`}
        />
        <Cartao titulo="Premissas e fontes">
          <ul className="list-disc space-y-2 pl-5 text-[0.9375rem] text-text-secondary">
            <li>
              Tabelas de INSS e IR de 2026, com o desconto da{" "}
              <a
                className="font-semibold text-accent-text underline underline-offset-4"
                href="https://planalto.gov.br/ccivil_03/_Ato2023-2026/2025/Lei/L15270.htm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Lei 15.270/2025
              </a>
              . A conta de INSS e IR foi conferida com um contracheque real.
            </li>
            <li>
              A situação de hoje usa o INSS do regime geral, como na carteira assinada e no cargo
              comissionado. Quem contribui para regime próprio (servidor efetivo) tem outro
              desconto.
            </li>
            <li>
              No 13º, a conta considera que o desconto da lei nova também vale. Se não valer, o 13º
              fica uns R$ 150 menor.
            </li>
            <li>
              MEI não serve: programação e consultoria são atividades vedadas e o limite é{" "}
              {brl(R.mei.limiteAnual, 0)} por ano.
            </li>
            <li>
              Fator R: LC 123/2006, art. 18, §5º-J. O pró-labore precisa ser informado no eSocial
              todo mês para contar.
            </li>
            <li>
              Lucro distribuído não paga IR. A retenção de 10% só vale acima de{" "}
              {brl(R.dividendos.limiteMensalSemRetencao, 0)} por mês da mesma empresa para a mesma
              pessoa.
            </li>
            <li>
              Reforma tributária: no Simples, a CBS e o IBS ficam dentro da guia única em 2027 se a
              empresa não escolher outro regime.
            </li>
            <li>
              Meses pagos = 12 menos (dias de folga + feriados) ÷ {R.diasUteisPorMes} dias úteis por
              mês. Os custos do mês e o pró-labore continuam nos 12 meses.
            </li>
            <li>
              Fora da conta: abertura da empresa, atraso do primeiro pagamento, dias doente sem
              receber e a aposentadoria menor.
            </li>
          </ul>
        </Cartao>
      </div>
    </Tela>
  );
}
