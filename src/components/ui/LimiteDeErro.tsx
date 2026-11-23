import { ArrowClockwise, HouseSimple, PlugsConnected } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./Button";

// ---------------------------------------------------------------------------
// LimiteDeErro: o quadrante que faltava.
//
// Toda superficie tem quatro faces: vazio, carregando, erro e sucesso. Este
// arquivo e a face de erro daquilo que nenhum `try/catch` alcanca: a excecao
// que sobe do RENDER de uma subarvore e derruba tudo que estiver acima dela.
//
// O CENARIO CONCRETO, e ele acontece em producao toda semana. Um deploy no meio
// da sessao invalida os hashes dos chunks. O proximo clique pede um arquivo que
// nao existe mais, o import dinamico do `lazy()` rejeita, o <Suspense> propaga a
// rejeicao, e sem nenhum limite acima dela o React desmonta a arvore INTEIRA. O
// que sobra e tela branca: sem barra lateral, sem mensagem, sem caminho de
// volta. Com 63 rotas atras de `lazy()`, esse era o desfecho padrao do repo.
//
// POR QUE ISTO E UMA CLASSE, E POR QUE VAI CONTINUAR SENDO
// -------------------------------------------------------
// Capturar erro de render depende de dois metodos de ciclo de vida que existem
// SO em componente de classe: `getDerivedStateFromError`, que troca o render
// pelo fallback, e `componentDidCatch`, que serve pro efeito colateral
// (telemetria). Nao ha hook equivalente, o React 19 nao mudou isso, e nao ha
// proposta aceita que mude.
//
// O risco de alguem "modernizar" este arquivo pra funcao e real, e o custo e
// silencioso: a versao em funcao COMPILA, renderiza igual e simplesmente para
// de capturar. O defeito nao aparece em teste nenhum, aparece no dia do deploy
// ruim, na forma de tela branca. Se a vontade bater, o unico caminho honesto e
// trocar por uma biblioteca de terceiro, que tambem e classe por dentro.
// ---------------------------------------------------------------------------

/**
 * O fallback como funcao, pra quem precisa do erro ou do botao de retentar.
 *
 * `recuperar` limpa o estado de falha e remonta os filhos. Ele conserta falha
 * que veio de ESTADO (um dado malformado que sumiu, um render que dependia de
 * algo que ja chegou), e NAO conserta chunk que nao carregou: o `lazy()` do
 * React guarda a promessa REJEITADA, e todo render seguinte relanca o mesmo
 * erro. Pra esse caso o unico conserto e recarregar a pagina, que e o que o
 * fallback padrao oferece.
 */
export type LimiteDeErroFallback = (falha: { erro: Error; recuperar: () => void }) => ReactNode;

export interface LimiteDeErroProps {
  children: ReactNode;
  /** Substitui a tela de falha padrao. Aceita um no de arvore ou uma funcao. */
  fallback?: ReactNode | LimiteDeErroFallback;
  /**
   * Chamado uma vez por captura, com o erro e a pilha de componentes. E o
   * gancho de telemetria: o limite nao decide pra onde o erro vai.
   */
  aoErrar?: (erro: Error, info: ErrorInfo) => void;
  /**
   * Quando este valor muda, a falha e esquecida. SEM ELE o limite fica preso:
   * o erro capturado numa rota continua desenhado na proxima, porque nada
   * dentro de um limite de erro se recupera sozinho.
   *
   * A chave natural e o `pathname`. Trocar de endereco e o gesto que declara,
   * sem ambiguidade, que a pessoa nao quer mais aquela tela.
   */
  chaveDeReset?: unknown;
}

interface EstadoDoLimite {
  erro: Error | null;
  /** A chave da ULTIMA renderizacao, pra saber quando ela mudou. */
  chave: unknown;
}

export class LimiteDeErro extends Component<LimiteDeErroProps, EstadoDoLimite> {
  state: EstadoDoLimite = { erro: null, chave: this.props.chaveDeReset };

  static getDerivedStateFromError(erro: Error): Partial<EstadoDoLimite> {
    return { erro };
  }

  /**
   * O reset roda AQUI, e nao no `componentDidUpdate`, e a diferenca aparece na
   * tela. `getDerivedStateFromProps` acontece ANTES do render; o
   * `componentDidUpdate` acontece depois, entao ele desenharia a falha da tela
   * anterior por um quadro inteiro na tela nova, e so entao a limparia. Um
   * pisca de erro em cima do conteudo certo e pior que o erro.
   */
  static getDerivedStateFromProps(
    props: LimiteDeErroProps,
    estado: EstadoDoLimite,
  ): Partial<EstadoDoLimite> | null {
    if (props.chaveDeReset === estado.chave) return null;
    return { erro: null, chave: props.chaveDeReset };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    // Sem `console.error` aqui: o React ja registra a captura com a pilha de
    // componentes, e um segundo registro so ensina o time a ignorar os dois.
    this.props.aoErrar?.(erro, info);
  }

  private readonly recuperar = () => this.setState({ erro: null });

  render() {
    const { erro } = this.state;
    if (erro === null) return this.props.children;

    const { fallback } = this.props;
    if (typeof fallback === "function") return fallback({ erro, recuperar: this.recuperar });
    if (fallback !== undefined) return fallback;
    return <FalhaPadrao erro={erro} />;
  }
}

// ---------------------------------------------------------------------------
// A tela de falha padrao.
//
// Ela oferece SAIDA, que e o item que quase todo sistema esquece: erro sem
// caminho de volta e uma tela branca com texto no meio. Sao duas saidas, e as
// duas por `window.location` de proposito. Este e um primitivo de
// `components/ui`, e um <Link> exigiria contexto de rota: um limite de erro que
// QUEBRA quando nao ha Router e a definicao de conserto que nao conserta.
//
// `window.location.reload()` e a saida que resolve o caso que motivou o
// arquivo. Recarregar busca o index.html novo, e com ele o mapa novo de chunks.
//
// Nao ha "tentar de novo" aqui: pro erro tipico deste limite ele seria um botao
// que nao funciona. O `lazy()` guarda a promessa rejeitada, entao remontar
// relanca o mesmo erro na hora. Quem tem uma falha retentavel passa um
// `fallback` de funcao e usa o `recuperar` que ele recebe.
//
// O icone e o mesmo `PlugsConnected` da tela de 500 (`screens/estados/`): as
// duas dizem "quebrou do nosso lado", e mudar de simbolo entre elas faria a
// pessoa achar que sao problemas de natureza diferente.
// ---------------------------------------------------------------------------
function FalhaPadrao({ erro }: { erro: Error }) {
  return (
    <motion.div
      // `alert` e nao `alertdialog`: o leitor de tela precisa anunciar a troca
      // de conteudo, mas nada aqui prende o foco nem exige decisao.
      role="alert"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center"
    >
      <PlugsConnected size={30} weight="duotone" className="text-danger" />
      <div className="space-y-1.5">
        <h2 className="font-display font-semibold text-lg text-text-primary tracking-tight">
          Esta tela não abriu
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          Alguma coisa quebrou ao montar esta parte do sistema. Na maioria das vezes é uma versão
          nova que subiu enquanto você trabalhava, e recarregar resolve. Se insistir, o início é o
          caminho seguro.
        </p>
      </div>

      {/* A mensagem tecnica aparece SO em desenvolvimento. Pra quem esta com o
          arquivo aberto, "algo deu errado" custa uma ida ao console a cada
          erro; pra quem esta usando o produto, a mesma linha e ruido e, em
          mensagem de servidor, vazamento. */}
      {import.meta.env.DEV && (
        <code className="block max-w-full break-words font-mono text-danger text-xs">
          {erro.message}
        </code>
      )}

      <div className="flex flex-wrap justify-center gap-2.5">
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <ArrowClockwise size={15} weight="bold" />
          Recarregar
        </Button>
        <Button size="sm" onClick={() => window.location.assign("/")}>
          <HouseSimple size={15} weight="bold" />
          Ir para o início
        </Button>
      </div>
    </motion.div>
  );
}
