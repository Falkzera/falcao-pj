import { SITUACOES, type Situacao } from "../../dominio/estado.ts";
import { useConsultor } from "../../estado/ConsultorContext";
import { Selo, type TomDoSelo } from "../Selo";

const VISUAL: Record<Situacao, { tom: TomDoSelo; texto: string }> = {
  estimado: { tom: "atencao", texto: "estimado" },
  confirmado: { tom: "info", texto: "confirmado" },
  contrato: { tom: "sucesso", texto: "no contrato" },
};

/** Mostra se um item do contrato ainda é estimativa, foi confirmado ou está assinado. */
export function SeloSituacao({ campo }: { campo: string }) {
  const { estado } = useConsultor();
  const situacao = estado.contrato[campo].situacao;
  const { tom, texto } = VISUAL[situacao];
  return (
    <Selo tom={tom} title={SITUACOES[situacao]}>
      {texto}
    </Selo>
  );
}
