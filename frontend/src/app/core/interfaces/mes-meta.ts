export type StatusMeta = 'Programado' | 'Pago' | 'Vazio' | 'Finalizado';

export interface Meta {
  id: number;
  nome: string;
  valorMeta: number;
  valorPorMes: number;
  mesesNecessarios: number;
  valorAtual: number;
  meses: MesMeta[];
}

export interface MesMeta {
  id: number;
  nome: string;
  valor: number;
  status: StatusMeta;
}

export interface MetaExtended extends Meta {
  id: number;
  editandoIndex?: number;
  dropdownOpen?: number;

  valorMetaTemp?: number | string;
  valorPorMesTemp?: number | string;

  valorAtualTemp?: number | string;

  editandoNome?: boolean;
  nomeTemp?: string;
  savingNome?: boolean;
  savedTick?: boolean;
  editandoValorMeta?: boolean;
  editandoValorPorMes?: boolean;
  editandoValorAtual?: boolean;
  savedTickCampo?: boolean | null;

  _draft?: boolean;
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
