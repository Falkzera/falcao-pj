import { Link } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { pendentes } from "../../dominio/estado.ts";
import { useConsultor, useResultado } from "../../estado/ConsultorContext";
import { avisosDoPainel } from "./regrasDeAviso";

/** Fica ABAIXO do gráfico: avisos aparecem e somem enquanto o controle desliza,
    e aqui isso não move nada que a pessoa esteja olhando. */
export function Avisos() {
  const { estado } = useConsultor();
  const { p, pj, diferenca } = useResultado();
  const avisos = avisosDoPainel(p, pj, diferenca, pendentes(estado, true).length);
  if (!avisos.length) return null;
  return (
    <section aria-label="Avisos" className="space-y-3">
      {avisos.map((a) => (
        <Alert key={a.titulo} tone={a.tom} title={a.titulo}>
          {a.texto}
          {a.titulo === "Ainda é estimativa" && (
            <>
              {" "}
              <Link
                to="/contrato"
                className="font-semibold text-accent-text underline underline-offset-4"
              >
                Confirmar no contrato
              </Link>
            </>
          )}
        </Alert>
      ))}
    </section>
  );
}
