import { MesMeta } from './mes-meta';

export interface CreateMetaRequest {
  ano?: number;
  nome: string;
  valorMeta: number;
  valorPorMes: number;
  mesesNecessarios?: number;
  valorAtual?: number;
  icon?: string;
  meses?: Partial<MesMeta>[];
}

export interface UpdateMetaRequest extends Partial<CreateMetaRequest> {
  meses?: Partial<MesMeta>[];
}

export interface ModalAdicionarMetaState {
  isOpen: boolean;
  nome: string;
  valorMetaRaw: string;
  valorPorMesRaw: string;
  valorAtualRaw: string;
  temValorAtual: boolean;
  icon: string;
}

export interface ModalSucessoState {
  isOpen: boolean;
  title: string;
  message: string;
}

export interface ModalConfirmarDeleteState {
  isOpen: boolean;
  message: string;
  metaId: number | null;
  metaNome: string;
}

export interface ModalSucessoDeleteState {
  isOpen: boolean;
}

export interface ModalStateSalvar {
  nome: string;
  valorMetaRaw: string;
  valorPorMesRaw: string;
  valorAtualRaw: string;
  temValorAtual: boolean;
  icon?: string;
}

export type ValoresSalvarMetaModal = {
  nome: string;
  valorMeta: number;
  valorPorMes: number;
  valorAtual: number;
};
