# Segurança

## Reportar

Não abra issue pública para falha de segurança ou de privacidade. Use o botão **Report a vulnerability** na aba **Security** deste repositório: o relato chega só ao mantenedor.

Diga o que você viu e como reproduzir. Use dados inventados. Ninguém aqui vai pedir o seu contracheque, o seu contrato nem o seu arquivo de dados.

## O que conta

O sistema guarda salário e contrato e foi feito para que isso nunca saia do navegador de quem usa. Por isso importam mais:

- qualquer chamada de rede feita pelo sistema, que por desenho não faz nenhuma;
- dado pessoal que vá parar no build, no git ou num arquivo versionado;
- arquivo importado que execute código, quebre a página ou corrompa os dados guardados;
- dependência com falha conhecida que alcance o código que roda no navegador.

## Versões

Só a `main` é mantida.
