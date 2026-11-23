# Falcão PJ

Simulador que compara o que uma pessoa recebe hoje (carteira assinada ou cargo comissionado) com o que sobraria como PJ numa empresa do Simples Nacional, e guarda o que o contrato define. Por enquanto, as contas, o formato dos dados e os testes. Código aberto sob MIT: contribuição chega por fork e pull request.

## Como rodar

- `npm install`, depois `npm test`, que roda os testes no executor do próprio Node, sem dependência.
- `npm run verify` roda o lint, o typecheck e os testes. O CI roda o mesmo comando em todo pull request, e ele precisa passar antes de qualquer commit.

## Dados pessoais

- Os números de quem usa ficam em `dados/meus-dados.json`, que o `.gitignore` deixa fora do git. O formato é o de `dados/exemplo.json`.
- Nenhum valor desse arquivo vai para teste, commit, issue, PR ou documento. Teste usa valor fictício (salário de R$ 6.000).

## Estrutura

| Pasta | O que tem |
|---|---|
| `src/dominio/` | Regras fiscais do ano, contas e formato dos dados. Sem React. Ver `src/dominio/agent.md` |
| `dados/` | `exemplo.json` versionado; os dados pessoais ao lado dele, fora do git |

## Regras do projeto

1. **Conta nova ou mudada começa pelo teste.** O valor esperado é calculado à mão a partir da tabela publicada, com a conta no comentário, e o teste é visto falhando antes do código.
2. **As contas são funções puras** em `src/dominio/`.
3. **Tabela fiscal mora no arquivo de regras do ano** (`src/dominio/regras-2026.ts`), e o resto do sistema importa de `src/dominio/regras.ts`. Ano novo é arquivo novo, com a fonte oficial de cada valor no PR.
4. **INSS e IR saem em centavos**, como na folha de pagamento.
5. **Dado pessoal não entra no git** (seção acima).
6. Nenhum arquivo passa de 400 linhas.

## Fluxo

Branch a partir da `main` (`feat/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`), commits no padrão Conventional Commits e pull request com squash. A `main` é protegida e só recebe PR com o CI verde.

## Pronto quer dizer

- cenários da história viraram testes, vistos falhando e depois verdes;
- `npm run verify` passa;
- nenhum dado pessoal real no diff;
- `agent.md` da pasta mexida atualizado.
