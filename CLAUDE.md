# Falcão PJ

Simulador que compara o que uma pessoa recebe hoje (carteira assinada ou cargo comissionado) com o que sobraria como PJ numa empresa do Simples Nacional, e guarda o que o contrato define, item a item. Roda só no navegador, sem servidor. Código aberto sob MIT: contribuição chega por fork e pull request.

## Como rodar

- `npm install` e depois `npm run dev`. Abre em `http://localhost:5188` (porta própria, para não dividir o localStorage com outro app).
- `npm test` roda os testes no executor do próprio Node, sem dependência.
- `npm run verify` roda o guarda de tokens, o typecheck, os testes e o build. O CI roda o mesmo comando em todo pull request, e ele precisa passar antes de qualquer commit.

## Dados pessoais

- Os números de quem usa ficam em `dados/meus-dados.json`, que o `.gitignore` deixa fora do git. O formato é o de `dados/exemplo.json`, que é o mesmo do arquivo exportado.
- O arquivo só é lido no `npm run dev` (`src/estado/ConsultorContext.tsx`). O build não o leva.
- Nenhum valor desse arquivo, do localStorage ou de um export (`falcao-pj-dados-*.json`) vai para teste, commit, issue, PR ou documento. Teste usa valor fictício (salário de R$ 6.000).

## Estrutura

| Pasta | O que tem |
|---|---|
| `src/dominio/` | Regras fiscais do ano, contas e formato dos dados. Sem React. Ver `src/dominio/agent.md` |
| `src/estado/` | O estado da aplicação (contexto React) e as contas do momento |
| `src/screens/` | As telas (Painel, Contrato, Regras). Ver `src/screens/agent.md` |
| `src/components/` | Peças de interface e a marca. Ver `src/components/agent.md` |
| `src/lib/`, `src/hooks/`, `src/styles/` | Formato de número, movimento, toque; o tremor de campo inválido; tokens e CSS |
| `scripts/` | O guarda de tokens do Tailwind |
| `dados/` | `exemplo.json` versionado; os dados pessoais ao lado dele, fora do git |
| `docs/` | Produto (visão e escopo) e mapa de histórias com as ondas |

## Regras do projeto

1. **Conta nova ou mudada começa pelo teste.** O valor esperado é calculado à mão a partir da tabela publicada, com a conta no comentário, e o teste é visto falhando antes do código.
2. **As contas são funções puras** em `src/dominio/`. A tela só lê o resultado, por `useResultado()`.
3. **Tabela fiscal mora no arquivo de regras do ano** (`src/dominio/regras-2026.ts`), e o resto do sistema importa de `src/dominio/regras.ts`. Nenhum número de lei fica espalhado pela interface. Ano novo é arquivo novo, com a fonte oficial de cada valor no PR.
4. **INSS e IR saem em centavos**, como na folha de pagamento.
5. **Dado pessoal não entra no git** (seção acima).
6. **Visual dos apps Falcão, só no tema claro.** Barlow e Barlow Condensed, tinta marinho, cartões com traço e sombra dura (`src/styles/adesivo.css`). Cor sempre por token de `src/styles/estilo.css`. A marca (símbolo e favicon) não se redesenha, não gira e não distorce.
7. **Nada acima do gráfico do painel muda de altura** enquanto os campos mudam. Aviso novo entra abaixo do gráfico.
8. Nenhum arquivo passa de 400 linhas, exceto as peças de `src/components/ui/`, que vieram de outro app Falcão.
9. O `csstype` está fixado em 3.2.3 por `overrides`: a 3.2.4 quebra os tipos de animação do framer-motion 11, usados pelos primitivos de `src/components/ui/`.

## Fluxo

Branch a partir da `main` (`feat/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`), commits no padrão Conventional Commits e pull request com squash. A `main` é protegida e só recebe PR com o CI verde.

## Pronto quer dizer

- cenários da história viraram testes, vistos falhando e depois verdes;
- `npm run verify` passa e a tela foi conferida no navegador, no computador e no celular (375 px);
- nenhum dado pessoal real no diff;
- `agent.md` da pasta mexida e o mapa de histórias atualizados.
