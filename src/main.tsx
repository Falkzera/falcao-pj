import { IconContext } from "@phosphor-icons/react";
import { MotionConfig } from "framer-motion";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ToastProvider } from "./components/ui/Toast";
import { ConsultorProvider } from "./estado/ConsultorContext";
import { ouvirAfundar } from "./lib/afundar";
// As fontes da marca vão no bundle, só o subconjunto latino, como no Falcão Questões.
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow/latin-700.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "./styles/estilo.css";
// Depois do estilo.css e fora das camadas: o adesivo ganha dos utilitários no empate.
import "./styles/adesivo.css";

// O afundar das peças no toque (cartões, chips e botões no jeito do adesivo).
ouvirAfundar();

const ICONES = { weight: "regular" as const, size: 18, color: "currentColor", mirrored: false };

const raiz = document.getElementById("root");
if (!raiz)
  throw new Error(
    "Ponto de montagem #root ausente: o index.html precisa declarar a div com id root.",
  );

createRoot(raiz).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <IconContext.Provider value={ICONES}>
        <ConsultorProvider>
          <App />
        </ConsultorProvider>
        <ToastProvider />
      </IconContext.Provider>
    </MotionConfig>
  </StrictMode>,
);
