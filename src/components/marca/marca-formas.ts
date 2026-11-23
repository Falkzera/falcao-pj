// As FORMAS da marca em caminhos SVG, num módulo sem "use client": o palco (server
// component) e o logo-morph (client) leem daqui. Exportar dado de um módulo
// client para um server component devolve referência, não o array (foi assim
// que `GLIFOS.map is not a function` apareceu em 18/10/2026).
//
// Símbolo oficial Falcão (viewBox 62 10 202 197 → caixa de 512) e os glifos
// "l", "f" e "/" da JetBrains Mono, na caixa de 512 do favicon antigo. Nada
// desenhado à mão, só reposicionado.

const S = 400 / 202;

export const SIMBOLO = [
  "M66 14C88 42 122 54 150 64C163 71 170 84 170 100C170 114 167 126 162 136C150 150 134 158 112 166C128 154 144 142 143 128C141 116 118 113 90 94C108 101 128 104 142 106C120 96 88 82 68 52C90 68 124 78 143 90C112 72 78 50 66 14Z",
  "M166 72C196 66 228 63 260 62C248 77 232 88 211.6 92C207.6 83.2 199.4 78.6 189.6 78.6C182.8 78.6 177.4 80 173.6 81.6C171.6 78 169 74.6 166 72Z",
  "M152 156C149 172 142 188 131 203C149 189 161 169 177 155C194 141 213 129 236 118C216 122 202 125 190 128C176 133 163 144 152 156Z",
];
export const SIMBOLO_TRANSFORM = `translate(${56 - 62 * S} ${56 - 10 * S}) scale(${S})`;

export const GLIFOS = [
  { d: "M382 0Q307 0 262.0 44.0Q217 88 217 161V640H29V730H316V162Q316 129 334.5 109.5Q353 90 385 90H552V0Z", tx: 31 },
  { d: "M211 0V385H53V475H211V586Q211 652 254.0 691.0Q297 730 371 730H532V641H371Q310 641 310 585V475H532V385H310V0Z", tx: 181 },
  { d: "M71 -110 425 830H529L175 -110Z", tx: 331 },
];
export const glifoTransform = (tx: number) => `translate(${tx} 339) scale(0.25 -0.25)`;
