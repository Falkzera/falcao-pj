# Falcão PJ

Compara o que você recebe hoje, com carteira assinada ou em cargo comissionado, com o que sobraria trabalhando como PJ numa empresa do Simples Nacional.

Por enquanto, as contas e o formato dos dados: INSS e IR de hoje com as tabelas de 2026, a empresa no Simples pelo Fator R e o bruto mensal que empata com o que você recebe hoje. Cada conta tem teste com o valor esperado calculado à mão a partir da tabela publicada.

## Rodar os testes

Precisa do Node 22.18 ou mais novo.

```
npm install
npm test
```

## Seus dados ficam na sua máquina

Os seus números ficam em `dados/meus-dados.json`, no formato de `dados/exemplo.json`. O arquivo está no `.gitignore`: ele não entra em commit, nem no seu fork, nem num pull request.

```
cp dados/exemplo.json dados/meus-dados.json
```

## Licença

O código está sob a [licença MIT](LICENSE).
