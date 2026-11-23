// ---------------------------------------------------------------------------
// A CAIXA do campo, definida uma vez.
//
// Input, Select, MultiSelect, DatePicker, DateRangePicker e MoneyInput
// desenhavam a mesma caixa com strings copiadas, e elas ja tinham divergido:
// uns com `transition-all`, outros com `transition-colors`, uns com
// `bg-danger/5` e outros sem. Divergencia de string e como um design system
// apodrece.
//
// Nota historica: ate a correcao do `tailwind.config.ts`, `ring-danger/20` nao
// gerava CSS nenhum e o anel de erro caia no azul padrao do Tailwind. Os
// tokens agora sao declarados como funcao e aceitam o modificador, entao aqui
// voltou a ser Tailwind puro, sem style inline.
// ---------------------------------------------------------------------------

/**
 * Casca do campo: altura, raio, respiro e fundo.
 *
 * `transition-colors`, nunca `transition-all`: com `all` a transicao do CSS
 * pegaria tambem o `transform` e brigaria com os keyframes do shake no Framer,
 * amassando o gesto ate virar um arrasto.
 */
export const FIELD_SHELL =
  "flex h-12 w-full items-center gap-3 rounded-xl border px-4 bg-bg-tertiary transition-colors duration-200";

/**
 * Estado da casca.
 *
 * `focus` diz QUEM recebe o foco: `"within"` pra casca que embrulha um
 * `<input>` (o foco cai no filho), `"self"` pra casca que E o proprio elemento
 * focavel, caso do botao-gatilho do Select e do MultiSelect.
 *
 * O ANEL DE FOCO E OPACO, e isso nao e escolha de gosto.
 *
 * Ele era `ring-accent/20`, e anel a 20% se dissolve no papel. Medido com
 * `lib/contraste.ts` contra os tres fundos de cada tema, nos sete presets de
 * accent, ele ficava entre 1,12:1 (ambar sobre o bg-tertiary claro) e 1,49:1,
 * contra os 3:1 que a norma pede pra indicador de foco. O custo era o pior
 * possivel: quem navega por Tab nao sabia em que campo estava, em tela nenhuma
 * do sistema.
 *
 * O accent OPACO nao resolve, porque a cor e escolha do usuario: quatro dos
 * sete presets reprovam no tema claro (ambar 1,71:1, cyan 1,94:1, esmeralda
 * 2,03:1 e rosa 2,82:1 contra o bg-tertiary). Quem passa e `accent-text`, o
 * derivado que o `ThemeProvider` calcula em runtime justamente pra ter
 * contraste: pior caso 4,51:1, melhor 7,63:1, nos dois temas e nos sete
 * presets. Sobra folga ate pro piso de texto, que e mais alto que o de foco.
 *
 * `border-accent` fica onde estava, no accent de IDENTIDADE: a borda de 1px
 * acompanha a cor escolhida e o anel de 2px carrega a conta, ja espesso o
 * bastante pra ser o indicador sozinho.
 *
 * Campo em erro entrou na mesma correcao por um motivo proprio: o ramo
 * invalido descartava o ramo de foco inteiro, entao campo com erro ficava
 * IGUAL focado e desfocado, sem indicador nenhum. Agora o `ring-danger/20` de
 * repouso (1,29:1) vira `ring-danger` opaco no foco (4,36:1 no pior fundo,
 * 6,01:1 no melhor) e o vermelho que sinaliza o erro continua no lugar.
 */
export function fieldShellState(
  invalid: boolean,
  disabled?: boolean,
  focus: "within" | "self" = "within",
): string {
  // A borda de repouso e a do campo (`--borda-do-campo`, deste app): no escuro, 3:1 contra o
  // fundo do campo, o cartao e a pagina, porque ali ela e o unico sinal de que ha um campo; no
  // claro, a `--border-default` de sempre.
  const idle =
    focus === "self"
      ? "border-[color:var(--borda-do-campo)] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-text"
      : "border-[color:var(--borda-do-campo)] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-text";
  const erro =
    focus === "self"
      ? "border-danger ring-2 ring-danger/20 focus:outline-none focus:ring-danger"
      : "border-danger ring-2 ring-danger/20 focus-within:ring-danger";
  return [invalid ? erro : idle, disabled ? "cursor-not-allowed opacity-50" : ""]
    .filter(Boolean)
    .join(" ");
}

/**
 * O <input> nu por dentro da casca: sem borda, sem anel, sem fundo.
 *
 * O `outline-none` aqui NAO deixa ninguem sem indicador de foco: o foco cai
 * neste campo e quem acende e a casca, pelo `focus-within` do
 * `fieldShellState`, com o anel opaco que fecha a conta de 3:1. Suprimir o
 * contorno no filho e o que evita dois indicadores concentricos e desalinhados
 * (o do navegador, retangular, dentro do nosso, arredondado).
 */
export const FIELD_CONTROL =
  "h-full w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none";
