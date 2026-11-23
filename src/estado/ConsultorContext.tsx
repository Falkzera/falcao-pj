import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as C from "../dominio/calculo.ts";
import * as E from "../dominio/estado.ts";

// Dados pessoais de partida, fora do git (dados/meus-dados.json). Só no `npm run dev`:
// no build o arquivo não entra, para que um site publicado nunca leve os dados de quem
// gerou. Sem o arquivo, o glob volta vazio e o sistema abre com o exemplo.
const locais = import.meta.env.DEV
  ? import.meta.glob("/dados/meus-dados.json", { eager: true, import: "default" })
  : {};
const dadosIniciais: unknown = Object.values(locais)[0];

function armazenamento(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

interface ConsultorValor {
  estado: E.Estado;
  /** Muda o estado a partir de uma cópia, sem tocar no original. */
  alterar: (mudanca: (rascunho: E.Estado) => void) => void;
  substituir: (novo: E.Estado) => void;
  restaurar: () => void;
  /** Falso quando o navegador não deixou guardar. */
  salvo: boolean;
}

const Contexto = createContext<ConsultorValor | null>(null);

export function ConsultorProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState(() => E.carregar(armazenamento(), dadosIniciais));
  const [salvo, setSalvo] = useState(true);

  useEffect(() => {
    setSalvo(E.salvar(estado, armazenamento()));
  }, [estado]);

  const alterar = useCallback((mudanca: (rascunho: E.Estado) => void) => {
    setEstado((atual) => {
      const rascunho = structuredClone(atual);
      mudanca(rascunho);
      return rascunho;
    });
  }, []);

  const substituir = useCallback((novo: E.Estado) => setEstado(novo), []);

  const restaurar = useCallback(() => {
    E.apagar(armazenamento());
    setEstado(E.padrao(dadosIniciais));
  }, []);

  const valor = useMemo(
    () => ({ estado, alterar, substituir, restaurar, salvo }),
    [estado, alterar, substituir, restaurar, salvo],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useConsultor(): ConsultorValor {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useConsultor precisa estar dentro do ConsultorProvider.");
  return valor;
}

/** As contas do momento, refeitas só quando o estado muda. */
export function useResultado() {
  const { estado } = useConsultor();
  return useMemo(() => {
    const p = E.parametros(estado);
    const hoje = C.hoje(p);
    const pj = C.pj(p, p.brutoMensal);
    const empate = C.empate(p, hoje.total);
    const diferenca = hoje.total > 0 ? pj.liquido / hoje.total - 1 : 0;
    return { p, hoje, pj, empate, diferenca };
  }, [estado]);
}
