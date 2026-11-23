import { ChartLineUp, FileText, type Icon, Scales } from "@phosphor-icons/react";

export interface Destino {
  para: string;
  rotulo: string;
  Icone: Icon;
  /** Outros caminhos que contam como esta aba. */
  tambem: string[];
}

/** Os destinos do app, na barra de baixo (celular) e no topo (computador). */
export const NAVEGACAO: Destino[] = [
  { para: "/", rotulo: "Painel", Icone: ChartLineUp, tambem: [] },
  { para: "/contrato", rotulo: "Contrato", Icone: FileText, tambem: [] },
  { para: "/regras", rotulo: "Regras", Icone: Scales, tambem: [] },
];
