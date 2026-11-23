import { Toaster } from "react-hot-toast";

/**
 * O provedor nao recebe prop nenhuma, e isso e a decisao: posicao, duracao e
 * cromo do toast sao do SISTEMA, nao da tela que monta o provedor. Um
 * `position` aberto aqui deixaria cada projeto escolher um canto, e a pilha
 * deixaria de ser reconhecivel de um produto pro outro.
 *
 * O tipo existe mesmo assim pra que um wrapper do consumidor consiga se
 * declarar (`function MeuToast(_: ToastProviderProps)`) sem inventar um tipo
 * vazio local, e pra que o dia em que uma prop aparecer seja uma edicao neste
 * alias, e nao a criacao de uma superficie nova.
 */
export type ToastProviderProps = Record<string, never>;

/**
 * O provedor do toast. Monte UMA vez, na raiz (`main.tsx`).
 *
 * Toast sem provedor nao lanca erro, so nao acontece, entao ele tem de estar
 * montado antes de qualquer `toast()`.
 *
 * Canto INFERIOR direito: o superior cai sob a navegacao do topo.
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      // A pilha encosta na borda de BAIXO, que e onde mora a barra de gestos do
      // iPhone. Com `viewport-fit=cover` no index.html a pagina desenha sob ela,
      // entao o toast nasceria por baixo do indicador de home. O `16px` e o
      // respiro que a biblioteca ja usava; a soma e a faixa do aparelho.
      containerStyle={{
        bottom: "calc(16px + var(--safe-bottom))",
        right: "calc(16px + var(--safe-right))",
        left: "calc(16px + var(--safe-left))",
        // A biblioteca crava `zIndex: 9999` no proprio container. Sem esta
        // linha a escala de empilhamento do sistema documentaria um degrau
        // (`--z-aviso`) que o componente real ignora por tres ordens de
        // grandeza, e uma escala que mente sobre um dos degraus nao serve de
        // referencia pra nenhum dos outros.
        zIndex: "var(--z-aviso)",
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--bg-secondary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          fontSize: "14px",
        },
        success: {
          iconTheme: { primary: "var(--success)", secondary: "white" },
        },
        error: {
          iconTheme: { primary: "var(--danger)", secondary: "white" },
        },
      }}
    />
  );
}
