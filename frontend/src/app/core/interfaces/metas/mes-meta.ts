export type StatusMeta = 'Programado' | 'Pago' | 'Vazio' | 'Finalizado';

export interface Meta {
  id: number;
  ano?: number;
  nome: string;
  valorMeta: number;
  valorPorMes: number;
  mesesNecessarios: number;
  valorAtual: number;
  icon?: string;
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
