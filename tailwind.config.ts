import type { Config } from "tailwindcss";

// Token de cor que aceita o modificador de opacidade do Tailwind. Um token
// declarado como a string "var(--x)" faz `bg-accent/10` ser descartado em
// silêncio; como função, devolve `color-mix` e a utility existe.
type OpcoesDeCor = { opacityValue?: string };
const token = (nome: string): string =>
  (({ opacityValue }: OpcoesDeCor = {}): string => {
    const alfa = Number(opacityValue);
    if (!Number.isFinite(alfa)) return `var(${nome})`;
    return `color-mix(in srgb, var(${nome}) ${alfa * 100}%, transparent)`;
  }) as unknown as string;

const config: Config = {
  // `hover:` só onde existe hover de verdade: no toque o estado não fica preso aceso.
  future: { hoverOnlyWhenSupported: true },
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      // Variantes de celular: `baixa` para telas de pouca altura (iPhone SE,
      // Android pequeno, teclado aberto); `estreita` abaixo de 360 px de largura.
      screens: {
        baixa: { raw: "(max-height: 700px)" },
        estreita: { max: "359px" },
      },
      // As fontes da marca, servidas pelo próprio app (pacotes @fontsource): Barlow
      // no corpo, Barlow Condensed nos títulos, rótulos e números grandes.
      fontFamily: {
        sans: ['"Barlow"', "system-ui", "-apple-system", "sans-serif"],
        display: ['"Barlow Condensed"', '"Barlow"', "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        bg: {
          primary: token("--bg-primary"),
          secondary: token("--bg-secondary"),
          tertiary: token("--bg-tertiary"),
          glass: token("--bg-glass"),
        },
        text: {
          primary: token("--text-primary"),
          secondary: token("--text-secondary"),
          muted: token("--text-muted"),
        },
        accent: {
          DEFAULT: token("--accent-primary"),
          solid: token("--accent-solid"),
          text: token("--accent-text"),
        },
        "on-accent": token("--on-accent"),
        success: token("--success"),
        warning: token("--warning"),
        danger: token("--danger"),
        info: token("--info"),
        "on-success": token("--on-success"),
        "on-danger": token("--on-danger"),
        border: {
          subtle: token("--border-subtle"),
          DEFAULT: token("--border-default"),
        },
      },
      opacity: { 12: "0.12" },
      zIndex: {
        moldura: "var(--z-moldura)",
        gaveta: "var(--z-gaveta)",
        dialogo: "var(--z-dialogo)",
        flutuante: "var(--z-flutuante)",
        aviso: "var(--z-aviso)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
      },
    },
  },
  plugins: [],
};

export default config;
