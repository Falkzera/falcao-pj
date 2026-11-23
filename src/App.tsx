import { lazy, type ReactNode, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Moldura } from "./components/Moldura";
import { LimiteDeErro } from "./components/ui/LimiteDeErro";

const PainelScreen = lazy(() => import("./screens/painel/PainelScreen"));
const ContratoScreen = lazy(() => import("./screens/contrato/ContratoScreen"));
const RegrasScreen = lazy(() => import("./screens/regras/RegrasScreen"));

/** Enquanto a tela chega: um cartão vazio do tamanho de um bloco, sem girar nada. */
function Esqueleto() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="h-10 w-72 animate-pulse rounded-full bg-bg-tertiary" />
      <div className="h-64 animate-pulse rounded-[28px] bg-bg-tertiary" />
    </div>
  );
}

function comEsqueleto(tela: ReactNode) {
  return <Suspense fallback={<Esqueleto />}>{tela}</Suspense>;
}

/** O limite de erro fica entre a moldura e a tela: o topo e a barra continuam de pé. */
function AreaProtegida() {
  const { pathname } = useLocation();
  return (
    <LimiteDeErro chaveDeReset={pathname}>
      <Outlet />
    </LimiteDeErro>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Moldura />}>
          <Route element={<AreaProtegida />}>
            <Route path="/" element={comEsqueleto(<PainelScreen />)} />
            <Route path="/contrato" element={comEsqueleto(<ContratoScreen />)} />
            <Route path="/regras" element={comEsqueleto(<RegrasScreen />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
