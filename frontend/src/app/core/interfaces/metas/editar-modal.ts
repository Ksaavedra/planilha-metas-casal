import { MetaExtended } from './mes-meta';

export interface EditarValorDialogData {
  meta: MetaExtended;
  mesId: number;
  meses: string[];
}

export interface EditarValorDialogResult {
  metaId: number | string;
  mesId: number;
  valor: number;
}

export interface ModalEdicao {
  meta: MetaExtended;
  mesId: number;
  valor: number;
  isOpen: boolean;
}

export interface ModalEdicaoNome {
  meta: MetaExtended;
  nome: string;
  isOpen: boolean;
}

export interface ModalAdicionarMeta {
  nome: string;
  valorMeta: number;
  valorPorMes: number;
  valorAtual: number;
  isOpen: boolean;
}
