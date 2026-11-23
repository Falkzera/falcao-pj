import { ArrowCounterClockwise, DownloadSimple, UploadSimple } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { BotaoAdesivo } from "../../components/BotaoAdesivo";
import { normalizar } from "../../dominio/estado.ts";
import { useConsultor } from "../../estado/ConsultorContext";

/** Exportar, importar e voltar ao padrão. Os dados só existem neste navegador,
    então o arquivo exportado é a cópia de segurança. */
export function AcoesDosDados() {
  const { estado, substituir, restaurar } = useConsultor();
  const arquivo = useRef<HTMLInputElement>(null);
  const [confirmando, setConfirmando] = useState(false);

  function exportar() {
    const blob = new Blob([JSON.stringify(estado, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `falcao-pj-dados-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Dados exportados para a pasta de downloads.");
  }

  async function importar(escolhido: File | undefined) {
    if (!escolhido) return;
    try {
      substituir(normalizar(JSON.parse(await escolhido.text())));
      toast.success(`Dados importados de ${escolhido.name}.`);
    } catch (erro) {
      const motivo =
        erro instanceof SyntaxError ? "o arquivo não é um JSON válido." : (erro as Error).message;
      toast.error(`Não deu para importar ${escolhido.name}: ${motivo}`);
    } finally {
      if (arquivo.current) arquivo.current.value = "";
    }
  }

  // Voltar ao padrão troca os dados guardados: pede um segundo toque, no próprio lugar.
  if (confirmando) {
    return (
      <fieldset
        className="flex flex-wrap items-center gap-2"
        aria-label="Confirmar volta ao padrão"
      >
        <span className="font-semibold text-sm text-text-secondary">
          Trocar tudo pelos valores iniciais?
        </span>
        <BotaoAdesivo
          variant="destructive"
          size="sm"
          onClick={() => {
            restaurar();
            setConfirmando(false);
            toast.success("Campos de volta ao padrão.");
          }}
        >
          Sim, voltar
        </BotaoAdesivo>
        <BotaoAdesivo variant="outline" size="sm" onClick={() => setConfirmando(false)}>
          Cancelar
        </BotaoAdesivo>
      </fieldset>
    );
  }

  return (
    <>
      <BotaoAdesivo variant="outline" size="sm" onClick={exportar}>
        <DownloadSimple size={16} /> Exportar
      </BotaoAdesivo>
      <BotaoAdesivo variant="outline" size="sm" onClick={() => arquivo.current?.click()}>
        <UploadSimple size={16} /> Importar
      </BotaoAdesivo>
      <input
        ref={arquivo}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => importar(e.target.files?.[0])}
      />
      <BotaoAdesivo variant="ghost" size="sm" onClick={() => setConfirmando(true)}>
        <ArrowCounterClockwise size={16} /> Voltar ao padrão
      </BotaoAdesivo>
    </>
  );
}
