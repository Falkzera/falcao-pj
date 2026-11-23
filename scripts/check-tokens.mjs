#!/usr/bin/env node
/**
 * check-tokens: falha se alguma utility do Tailwind nao vai gerar CSS nenhum.
 *
 * Utility com valor invalido nao e erro de build: o Tailwind simplesmente nao
 * emite a regra, em silencio, e a classe some do elemento. Nao ha aviso no
 * terminal nem erro de tipo, e a peca renderiza sem o estilo. Um caso tipico e
 * `bg-success/12` com a escala de opacidade de 5 em 5: o 12 nao existe e o
 * fundo nao aparece, enquanto o `ring-success/25` ao lado funciona.
 *
 * Este verificador resolve a config REAL do projeto (com o `extend`, entao o
 * `12` passa a valer quando e declarado no tailwind.config.ts) e reprova todo
 * modificador que nao exista na escala.
 *
 * Uso: node scripts/check-tokens.mjs [dir...]
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { extname, join } from "node:path";

const require = createRequire(import.meta.url);
const resolveConfig = require("tailwindcss/resolveConfig");

// A config e .ts e este script roda em Node cru, entao a leitura e textual:
// pegamos as chaves declaradas no bloco `opacity` do `extend`. Um `require`
// exigiria transpilar, e um passo de build so pra ler cinco numeros seria pior.
const configTexto = readFileSync("tailwind.config.ts", "utf8");
const blocoOpacidade = configTexto.match(/opacity:\s*\{([^}]*)\}/);
const extras = blocoOpacidade ? [...blocoOpacidade[1].matchAll(/(\d+)\s*:/g)].map((m) => m[1]) : [];

const escala = new Set([...Object.keys(resolveConfig({ content: [] }).theme.opacity), ...extras]);

// Prefixos de utility que aceitam o modificador `/NN`. A lista e fechada de
// proposito: um prefixo desconhecido provavelmente e uma fracao em texto
// (`w-1/2`, `top-1/3`), e o `w-1/2` E valido.
const PREFIXOS =
  "bg|text|border|ring|ring-offset|divide|outline|from|via|to|fill|stroke|placeholder|caret|accent|decoration|shadow";
const PADRAO = new RegExp(`\\b(?:${PREFIXOS})-[a-z][a-z0-9-]*\\/(\\d{1,3})\\b`, "g");

const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".html"]);
const PULAR = new Set(["node_modules", "dist", "build", ".git", "coverage"]);

function* varrer(dir) {
  for (const nome of readdirSync(dir)) {
    if (PULAR.has(nome)) continue;
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) yield* varrer(caminho);
    else if (EXTS.has(extname(nome))) yield caminho;
  }
}

const raizes = process.argv.slice(2);
const alvos = raizes.length > 0 ? raizes : ["src", "index.html"];

const achados = [];
for (const raiz of alvos) {
  let st;
  try {
    st = statSync(raiz);
  } catch {
    continue;
  }
  for (const arquivo of st.isDirectory() ? varrer(raiz) : [raiz]) {
    readFileSync(arquivo, "utf8")
      .split("\n")
      .forEach((linha, i) => {
        for (const m of linha.matchAll(PADRAO)) {
          if (!escala.has(m[1])) {
            achados.push({ arquivo, linha: i + 1, classe: m[0], valor: m[1] });
          }
        }
      });
  }
}

if (achados.length === 0) {
  console.log("check-tokens: toda utility com opacidade esta na escala.");
  process.exit(0);
}

console.error(`\ncheck-tokens: ${achados.length} utility(ies) que nao geram CSS nenhum.\n`);
for (const a of achados) {
  console.error(`  ${a.arquivo}:${a.linha}  ${a.classe}`);
}
console.error(`
A escala de opacidade e: ${[...escala].sort((a, b) => Number(a) - Number(b)).join(", ")}.
Um valor fora dela faz o Tailwind DESCARTAR a utility inteira, sem aviso: o
elemento renderiza sem o estilo e nada acusa.

Escolha um valor da escala, ou declare o novo em theme.extend.opacity do
tailwind.config.ts, se ele for mesmo uma densidade do sistema.
`);
process.exit(1);
