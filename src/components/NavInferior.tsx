import { motion, useReducedMotionConfig } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/cn";
import { MOLA, MOLA_VIVA } from "../lib/movimento";
import { NAVEGACAO } from "./navegacao";

// Adaptado do Falcão Questões: os destinos são os do Falcão PJ (navegacao.ts).
const ITENS = NAVEGACAO;

// O recorte: o círculo do destino atual, quanto o centro dele desce abaixo da
// borda da barra, a folga entre ele e a barra e o ombro, a curva que leva a
// borda reta para dentro do recorte.
const RAIO = 26;
const PROFUNDIDADE = 6;
const FOLGA = 7;
const OMBRO = 14;
/** O centro do ícone parado, na barra de 64 px (--nav-barra), acima do nome da aba. */
const CENTRO_DO_ICONE = 23;
/** O ícone sobe de onde fica até o centro do círculo. */
const SUBIDA = CENTRO_DO_ICONE - PROFUNDIDADE;
// A barra é bem mais larga que a tela, com o recorte no meio; quem anda é ela
// inteira, só por transform, e a moldura corta o que sobra dos lados.
const MEIO = 2000;

/**
 * A borda de cima da barra com o recorte, em px a partir do topo dela. O ombro
 * é um arco tangente à borda reta e ao arco do recorte, para a curva não ter
 * quina em ponto nenhum.
 */
function recorte(): string {
  const r = RAIO + FOLGA;
  const ombro = Math.sqrt((r + OMBRO) ** 2 - (OMBRO - PROFUNDIDADE) ** 2);
  const x = (r * ombro) / (r + OMBRO);
  const y = PROFUNDIDADE + (r * (OMBRO - PROFUNDIDADE)) / (r + OMBRO);
  // O arco de baixo passa de meia volta quando o ombro toca acima do centro.
  const grande = y < PROFUNDIDADE ? 1 : 0;
  return [
    `M0 0H${MEIO - ombro}`,
    `A${OMBRO} ${OMBRO} 0 0 1 ${MEIO - x} ${y}`,
    `A${r} ${r} 0 ${grande} 0 ${MEIO + x} ${y}`,
    `A${OMBRO} ${OMBRO} 0 0 1 ${MEIO + ombro} 0`,
    `H${2 * MEIO}V400H0Z`,
  ].join("");
}
const BORDA = recorte();

/**
 * A navegação, encaixada no rodapé. O destino atual sobe num círculo Ouro que
 * fica num recorte da barra; trocar de destino desliza o recorte e o círculo
 * juntos (um elemento só, por `layoutId`) e o ícone novo sobe para dentro dele.
 */
export function NavInferior() {
  const { pathname } = useLocation();
  // Com "reduzir movimento" a barra já nasce no lugar: o Framer pula a
  // animação, mas respeitaria o atraso, e ela passaria esse tempo fora da tela.
  const reduzir = useReducedMotionConfig();
  const dentro = (para: string) => pathname === para || pathname.startsWith(`${para}/`);
  const ativo = ITENS.find(
    ({ para, tambem }) =>
      pathname === para || (para !== "/" && dentro(para)) || tambem.some(dentro),
  );
  return (
    <motion.nav
      aria-label="Navegação principal"
      className="nav-barra"
      layoutRoot
      initial={reduzir ? false : { y: "100%" }}
      animate={{ y: 0 }}
      transition={{ ...MOLA, delay: 0.1 }}
    >
      {/* Numa tela sem destino na barra, ela fica lisa, sem recorte. */}
      {!ativo && <span className="nav-barra-lisa" aria-hidden />}
      {ITENS.map((item) => {
        const atual = item === ativo;
        const { Icone } = item;
        return (
          <Link
            key={item.para}
            to={item.para}
            aria-label={item.rotulo}
            // A aba atual é a da seção, também numa tela de dentro dela (as coleções são do
            // Praticar; as partes do desempenho, do Desempenho).
            aria-current={atual ? "page" : undefined}
            className="nav-item"
          >
            {atual && (
              <motion.span
                layoutId="nav-recorte"
                className="nav-recorte"
                style={{ width: 2 * MEIO, marginLeft: -MEIO }}
                transition={MOLA}
                aria-hidden
              >
                <svg className="h-full w-full overflow-visible" aria-hidden="true">
                  <path d={BORDA} />
                </svg>
                <span
                  className="nav-circulo"
                  style={{
                    width: 2 * RAIO,
                    height: 2 * RAIO,
                    top: PROFUNDIDADE - RAIO,
                    left: MEIO - RAIO,
                  }}
                />
              </motion.span>
            )}
            {/* O Framer lê o "reduzir movimento" só quando a peça monta, e a barra fica montada de
                uma tela para outra: a chave remonta o ícone quando a preferência do aparelho
                muda, e ele já nasce com ela, sem esperar o app recarregar. */}
            <motion.span
              key={reduzir ? "parado" : "com-mola"}
              className={cn("nav-icone", atual && "nav-icone-atual")}
              animate={{ y: atual ? -SUBIDA : 0 }}
              transition={atual ? { ...MOLA_VIVA, delay: 0.08 } : MOLA}
              data-afunda="0.88"
            >
              <Icone size={24} weight={atual ? "fill" : "regular"} />
            </motion.span>
            <span aria-hidden className={cn("nav-rotulo", atual && "nav-rotulo-atual")}>
              {item.rotulo}
            </span>
          </Link>
        );
      })}
    </motion.nav>
  );
}
