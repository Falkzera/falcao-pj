import { motion } from "framer-motion";
import { Link, Outlet, useLocation } from "react-router-dom";
import { pendentes } from "../dominio/estado.ts";
import { useConsultor } from "../estado/ConsultorContext";
import { cn } from "../lib/cn";
import { MOLA } from "../lib/movimento";
import { LogoMorph } from "./marca/logo-morph";
import { NavInferior } from "./NavInferior";
import { NAVEGACAO } from "./navegacao";

/**
 * A moldura do app. No celular, como no Falcão Questões: o logotipo no alto e a
 * navegação na barra de baixo. No computador a barra de baixo some e os destinos
 * vão para o topo, em pílulas, porque o painel usa a largura toda.
 */
export function Moldura() {
  const { pathname } = useLocation();
  const { estado } = useConsultor();
  const faltam = pendentes(estado).length;
  const atual = (para: string) => (para === "/" ? pathname === "/" : pathname.startsWith(para));

  return (
    <div className="min-h-screen">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-aviso focus:rounded-full focus:bg-bg-secondary focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-moldura border-border-subtle border-b bg-bg-glass backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Falcão PJ, início">
            <LogoMorph tamanho="h-9 w-9" className="shrink-0 text-text-primary" />
            <span className="display text-[1.5rem] text-text-primary">Falcão PJ</span>
          </Link>
          <nav
            aria-label="Navegação principal"
            className="ml-auto hidden items-center gap-1 rounded-full bg-bg-tertiary p-1 lg:flex"
          >
            {NAVEGACAO.map(({ para, rotulo, Icone }) => {
              const ativo = atual(para);
              return (
                <Link
                  key={para}
                  to={para}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "relative flex h-10 items-center gap-2 rounded-full px-4 font-semibold text-[0.9375rem] transition-colors",
                    ativo
                      ? "text-[var(--on-selecao)]"
                      : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  {ativo && (
                    <motion.span
                      layoutId="topo-ativo"
                      className="chip-ativo-fundo"
                      transition={MOLA}
                    />
                  )}
                  <Icone size={18} weight={ativo ? "fill" : "regular"} className="relative" />
                  <span className="relative">{rotulo}</span>
                  {para === "/contrato" && faltam > 0 && (
                    <span
                      className="tabular relative ml-0.5 rounded-full bg-[var(--cor-ouro)] px-1.5 font-bold text-[var(--marinho)] text-xs"
                      title={`${faltam} itens ainda são estimativa`}
                    >
                      {faltam}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main
        id="conteudo"
        tabIndex={-1}
        className="app-conteudo mx-auto max-w-[1400px] px-5 pt-6 outline-none lg:px-8 lg:pt-8"
      >
        <Outlet />
      </main>
      <NavInferior />
    </div>
  );
}
