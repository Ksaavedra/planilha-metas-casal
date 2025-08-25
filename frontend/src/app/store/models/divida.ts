import { BaseEntity, Categoria, Status } from './common';

export interface Divida extends BaseEntity {
  credor: string;
  valorOriginal: number;
  valorAtual: number;
  dataVencimento: Date;
  dataPagamento?: Date;
  status: Status;
  tipoDivida: TipoDivida;
  jurosMensal?: number;
  multa?: number;
  parcelada: boolean;
  numeroParcelas?: number;
  parcelaAtual?: number;
  valorParcela?: number;
}

export enum TipoDivida {
  CARTAO_CREDITO = 'cartao_credito',
  EMPRESTIMO = 'emprestimo',
  FINANCIAMENTO = 'financiamento',
  BOLETO = 'boleto',
  OUTROS = 'outros',
}

export interface DividaForm {
  descricao: string;
  credor: string;
  valorOriginal: number;
  valorAtual: number;
  dataVencimento: Date;
  dataPagamento?: Date;
  categoria: Categoria;
  tipoDivida: TipoDivida;
  jurosMensal?: number;
  multa?: number;
  parcelada: boolean;
  numeroParcelas?: number;
  parcelaAtual?: number;
  valorParcela?: number;
  observacoes?: string;
}

export const TIPOS_DIVIDA = [
  { value: TipoDivida.CARTAO_CREDITO, label: 'Cartão de Crédito' },
  { value: TipoDivida.EMPRESTIMO, label: 'Empréstimo' },
  { value: TipoDivida.FINANCIAMENTO, label: 'Financiamento' },
  { value: TipoDivida.BOLETO, label: 'Boleto' },
  { value: TipoDivida.OUTROS, label: 'Outros' },
];

export interface ResumoDividas {
  totalDividas: number;
  totalPago: number;
  totalPendente: number;
  quantidadeDividas: number;
  quantidadeVencidas: number;
  proximoVencimento?: Date;
}
