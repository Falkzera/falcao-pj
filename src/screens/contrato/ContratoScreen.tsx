import { ClipboardText } from "@phosphor-icons/react";
import { useState } from "react";
import { BotaoAdesivo } from "../../components/BotaoAdesivo";
import { CampoNumero } from "../../components/campos/CampoNumero";
import { Segmentos } from "../../components/Segmentos";
import { Selo } from "../../components/Selo";
import { Tela } from "../../components/Tela";
import { Input } from "../../components/ui/Input";
import { MoneyInput } from "../../components/ui/MoneyInput";
import { Textarea } from "../../components/ui/Textarea";
import {
  CAMPOS,
  type CampoContrato,
  pendentes,
  type Situacao,
  textoPerguntas,
} from "../../dominio/estado.ts";
import { useConsultor } from "../../estado/ConsultorContext";

const OPCOES_SITUACAO = [
  { value: "estimado", label: "Estimado" },
  { value: "confirmado", label: "Confirmado", nome: "Confirmado na reunião" },
  { value: "contrato", label: "No contrato" },
] as const;

function Controle({ campo }: { campo: CampoContrato }) {
  const { estado, alterar } = useConsultor();
  const valor = estado.contrato[campo.id].valor;
  const definir = (v: number | string) =>
    alterar((r) => {
      r.contrato[campo.id].valor = v;
    });
  const rotulo = `Valor: ${campo.rotulo}`;

  if (campo.tipo === "dinheiro") {
    return (
      <MoneyInput aria-label={rotulo} value={Number(valor)} onChange={(n) => definir(n ?? 0)} />
    );
  }
  if (campo.tipo === "numero") {
    return (
      <CampoNumero aria-label={rotulo} min={0} step={1} valor={Number(valor)} aoMudar={definir} />
    );
  }
  if (campo.tipo === "opcao") {
    return (
      <Segmentos
        compacto
        aria-label={rotulo}
        opcoes={(campo.opcoes ?? []).map((o) => ({ value: o, label: o }))}
        value={String(valor)}
        onChange={definir}
        className="flex-wrap rounded-3xl"
      />
    );
  }
  return (
    <Input
      aria-label={rotulo}
      type={campo.tipo === "data" ? "date" : "text"}
      placeholder={campo.tipo === "texto" ? "O que foi dito" : undefined}
      value={String(valor)}
      onChange={(e) => definir(e.target.value)}
    />
  );
}

function Item({ campo }: { campo: CampoContrato }) {
  const { estado, alterar } = useConsultor();
  const item = estado.contrato[campo.id];
  return (
    <section className="cartao p-5" aria-label={campo.rotulo}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] lg:items-start">
        <div className="min-w-0 space-y-1.5">
          <p className="font-display font-extrabold text-[1.25rem] text-text-primary leading-tight">
            {campo.rotulo}
          </p>
          <p className="text-sm text-text-secondary">{campo.pergunta}</p>
          {campo.conta && <Selo tom="info">muda a conta do painel</Selo>}
        </div>
        <div className="space-y-3">
          <Controle campo={campo} />
          <Input
            aria-label={`Anotação: ${campo.rotulo}`}
            placeholder="Anotação"
            value={item.nota}
            onChange={(e) =>
              alterar((r) => {
                r.contrato[campo.id].nota = e.target.value;
              })
            }
          />
        </div>
        <Segmentos
          compacto
          aria-label={`Situação: ${campo.rotulo}`}
          opcoes={OPCOES_SITUACAO}
          value={item.situacao}
          onChange={(v) =>
            alterar((r) => {
              r.contrato[campo.id].situacao = v as Situacao;
            })
          }
          className="flex-wrap rounded-3xl lg:justify-self-end"
        />
      </div>
    </section>
  );
}

export default function ContratoScreen() {
  const { estado } = useConsultor();
  const [filtro, setFiltro] = useState<"todos" | "pendentes">("todos");
  const [textoManual, setTextoManual] = useState<string | null>(null);
  const todos = pendentes(estado).length;
  const daConta = pendentes(estado, true).length;
  const visiveis =
    filtro === "pendentes"
      ? CAMPOS.filter((c) => estado.contrato[c.id].situacao === "estimado")
      : CAMPOS;

  async function copiarPerguntas() {
    const texto = textoPerguntas(estado);
    try {
      await navigator.clipboard.writeText(texto);
      setTextoManual(null);
    } catch (erro) {
      // Sem permissão de copiar: o texto aparece abaixo, pronto para selecionar.
      setTextoManual(texto);
      throw erro;
    }
  }

  return (
    <Tela
      titulo="O que o contrato define"
      descricao="Cada item começa como estimativa. Depois da reunião, marque como confirmado; com o contrato assinado, como no contrato."
      acoes={
        <BotaoAdesivo
          onAsyncClick={copiarPerguntas}
          successLabel="Copiadas"
          errorLabel="Copie abaixo"
        >
          <ClipboardText size={18} /> Copiar perguntas pendentes
        </BotaoAdesivo>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.9375rem] text-text-secondary">
          {todos ? (
            <>
              <strong className="text-text-primary">
                {todos} de {CAMPOS.length} itens
              </strong>{" "}
              ainda são estimativa
              {daConta ? `, e ${daConta} deles mudam a conta do painel` : ""}.
            </>
          ) : (
            <strong className="text-text-primary">Todos os itens estão confirmados.</strong>
          )}
        </p>
        <Segmentos
          compacto
          aria-label="Filtro dos itens"
          value={filtro}
          onChange={setFiltro}
          opcoes={[
            { value: "todos", label: "Todos" },
            { value: "pendentes", label: "Falta confirmar" },
          ]}
        />
      </div>

      {textoManual && (
        <Textarea
          label="Perguntas pendentes"
          readOnly
          rows={8}
          value={textoManual}
          onFocus={(e) => e.target.select()}
        />
      )}

      <div className="space-y-4">
        {visiveis.map((c) => (
          <Item key={c.id} campo={c} />
        ))}
        {visiveis.length === 0 && (
          <p className="rounded-[28px] border-2 border-[var(--traco)] border-dashed px-6 py-10 text-center text-text-secondary">
            Nada falta confirmar. Todos os itens estão confirmados ou no contrato.
          </p>
        )}
      </div>
    </Tela>
  );
}
