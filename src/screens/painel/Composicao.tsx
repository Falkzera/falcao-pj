import { Cartao } from "../../components/Tela";
import { useResultado } from "../../estado/ConsultorContext";
import { brl, numero } from "../../lib/formato";

/**
 * Para onde vai o faturamento. O que fica com a pessoa leva a tinta (marinho);
 * o que sai leva as cores da família do Questões, sempre a mesma cor para a mesma
 * parte. O nome e o valor estão na tabela ao lado de cada amostra: a cor nunca é
 * a única pista.
 */
export function Composicao() {
  const { pj } = useResultado();
  const partes = [
    { nome: "Líquido para você", valor: pj.liquido, cor: "var(--tinta)" },
    { nome: "Simples Nacional (DAS)", valor: pj.das, cor: "var(--cor-ouro)" },
    { nome: "INSS do sócio", valor: pj.inssAno, cor: "var(--cor-menta)" },
    { nome: "IR do pró-labore", valor: pj.irAno, cor: "var(--cor-lilas)" },
    { nome: "Contador, taxas, assinatura e outros", valor: pj.fixosAno, cor: "var(--cor-ceu)" },
  ];
  const visiveis = partes.filter((x) => x.valor > 0.5);

  return (
    <Cartao
      titulo="Para onde vai o faturamento"
      descricao={`Faturamento anual de ${brl(pj.receita, 0)}: ${brl(pj.bruto, 0)} × ${numero(pj.meses)} meses pagos. Por mês é a média dos 12 meses.`}
    >
      <div
        className="flex h-8 gap-[3px] overflow-hidden rounded-full border-2 border-[var(--marinho)]"
        role="img"
        aria-label="Divisão do faturamento anual, detalhada na tabela abaixo"
      >
        {visiveis.map((x) => (
          <div
            key={x.nome}
            title={`${x.nome}: ${brl(x.valor, 0)}`}
            style={{ flex: `${x.valor} 0 0`, background: x.cor }}
            className="min-w-[4px]"
          />
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[0.9375rem]">
          <thead>
            <tr className="rotulo border-border border-b text-left text-text-muted">
              <th scope="col" className="py-2 font-bold">
                Parte
              </th>
              <th scope="col" className="whitespace-nowrap py-2 pl-3 text-right font-bold">
                Por mês
              </th>
              <th scope="col" className="whitespace-nowrap py-2 pl-3 text-right font-bold">
                Por ano
              </th>
              <th scope="col" className="whitespace-nowrap py-2 pl-3 text-right font-bold">
                Do total
              </th>
            </tr>
          </thead>
          <tbody>
            {partes.map((x) => (
              <tr key={x.nome} className="border-border-subtle border-b last:border-b-0">
                <td className="py-2.5">
                  <span
                    className="mr-2.5 inline-block h-3 w-3 rounded-[4px] border border-[var(--marinho)] align-[-1px]"
                    style={{ background: x.cor }}
                    aria-hidden
                  />
                  {x.nome}
                </td>
                <td className="tabular whitespace-nowrap py-2.5 pl-3 text-right font-semibold">
                  {brl(x.valor / 12, 0)}
                </td>
                <td className="tabular whitespace-nowrap py-2.5 pl-3 text-right">
                  {brl(x.valor, 0)}
                </td>
                <td className="tabular whitespace-nowrap py-2.5 pl-3 text-right">
                  {pj.receita > 0 ? numero((x.valor / pj.receita) * 100, 1) : "0,0"}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Cartao>
  );
}
