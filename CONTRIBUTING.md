# Contribuir

Obrigado por olhar. O Falcão PJ é pequeno e tem as regras escritas no [`CLAUDE.md`](CLAUDE.md). Se alguma parecer arbitrária, abra uma issue e discuta: é para isso que elas servem.

## Preparar

Precisa do Node 22.18 ou mais novo.

```
git clone https://github.com/<seu-usuario>/falcao-pj.git
cd falcao-pj
npm install
cp dados/exemplo.json dados/meus-dados.json   # opcional, para abrir com os seus números
npm run dev
```

`dados/meus-dados.json` fica fora do git (veja o [README](README.md#seus-dados-ficam-na-sua-máquina)). Antes de cada commit, `git status` não deve mostrar nada dentro de `dados/` além do `exemplo.json`.

## Como o código se organiza

| Pasta | O que tem |
|---|---|
| `src/dominio/` | As regras do ano e as contas, em funções puras e testadas. Nada fora daqui decide valor de imposto |
| `src/estado/` | O estado da tela e as contas do momento |
| `src/screens/` | Painel, Contrato e Regras |
| `src/components/` | Peças de interface e a marca |

Cada pasta tem um `agent.md` com o propósito, os arquivos, os padrões e as decisões recentes. Leia o da pasta antes de mexer nela e atualize depois, se a mudança for grande.

## O fluxo

1. Faça o fork e crie uma branch a partir da `main`: `feat/coluna-nova`, `fix/ir-do-13`, `docs/limites`.
2. Conta nova ou mudada começa pelo teste, com o valor esperado calculado à mão a partir da tabela publicada e a conta escrita no comentário. Rode e veja o teste falhar antes de mexer no código.
3. Bug corrigido ganha um teste que falha antes do conserto e passa depois.
4. Mudança de tela se confere no navegador, no computador e no celular (375 px de largura).
5. Rode `npm run verify` até ficar verde.
6. Escreva os commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/), como `feat(painel): coluna por mês` ou `fix(dominio): IR do 13º`.
7. Abra o pull request para a `main` contando o que muda e como você conferiu. O CI roda o `npm run verify`, e o merge é por squash.

## O que reprova um pull request

- `npm run verify` vermelho: utility do Tailwind que não gera CSS, erro de tipo, teste falhando ou build quebrado.
- Dado pessoal real no diff, em código, teste, print ou texto.
- Número de lei solto fora do arquivo de regras do ano.
- Arquivo acima de 400 linhas, fora de `src/components/ui/`.
- Algo acima do gráfico do painel que muda de altura enquanto os campos mudam.

## Regras de um ano novo

É a contribuição que mais ajuda. Quando saem as tabelas de um ano:

1. Copie `src/dominio/regras-2026.ts` para `regras-AAAA.ts` e troque os valores.
2. Troque o export de `src/dominio/regras.ts` para o arquivo novo.
3. Refaça à mão os valores esperados de `src/dominio/calculo.test.ts` que mudaram, com a conta no comentário.
4. No pull request, ponha o link da fonte oficial de cada tabela (portaria do INSS, tabela da Receita Federal, Lei Complementar 123).

## Conta errada

Abra uma issue com a entrada, o que o sistema mostrou, o valor que você esperava e a fonte (a tabela ou a lei). Use valores redondos ou inventados que reproduzam o problema, nunca o seu contracheque.

## Visual

O visual é o dos apps Falcão no tema claro. Conserto nas peças de interface é bem-vindo. Mudança de visual (cor, fonte, forma) se discute numa issue antes do pull request. A marca não se altera.

## Segurança

Falha de segurança ou de privacidade não vai em issue pública. Veja o [SECURITY.md](SECURITY.md).

## Licença

Ao contribuir, você concorda que a sua contribuição fica sob a [licença MIT](LICENSE) do projeto.
