import { BaseEntity, Categoria } from './common';

export interface Despesa extends BaseEntity {
  tipoDespesa: TipoDespesa;
  recorrente: boolean;
  frequencia?: DespesaFrequenciaRecorrencia;
  dataFimRecorrencia?: Date;
  parcelada: boolean;
  numeroParcelas?: number;
  parcelaAtual?: number;
}

export enum TipoDespesa {
  ALIMENTACAO = 'alimentacao',
  TRANSPORTE = 'transporte',
  MORADIA = 'moradia',
  SAUDE = 'saude',
  EDUCACAO = 'educacao',
  LAZER = 'lazer',
  VESTUARIO = 'vestuario',
  SERVICOS = 'servicos',
  OUTROS = 'outros',
}

export enum DespesaFrequenciaRecorrencia {
  SEMANAL = 'semanal',
  QUINZENAL = 'quinzenal',
  MENSAL = 'mensal',
  BIMESTRAL = 'bimestral',
  TRIMESTRAL = 'trimestral',
  SEMESTRAL = 'semestral',
  ANUAL = 'anual',
}

export interface DespesaForm {
  descricao: string;
  valor: number;
  data: Date;
  categoria: Categoria;
  tipoDespesa: TipoDespesa;
  recorrente: boolean;
  frequencia?: DespesaFrequenciaRecorrencia;
  dataFimRecorrencia?: Date;
  parcelada: boolean;
  numeroParcelas?: number;
  parcelaAtual?: number;
  observacoes?: string;
}

export const TIPOS_DESPESA = [
  { value: TipoDespesa.ALIMENTACAO, label: 'Alimentação' },
  { value: TipoDespesa.TRANSPORTE, label: 'Transporte' },
  { value: TipoDespesa.MORADIA, label: 'Moradia' },
  { value: TipoDespesa.SAUDE, label: 'Saúde' },
  { value: TipoDespesa.EDUCACAO, label: 'Educação' },
  { value: TipoDespesa.LAZER, label: 'Lazer' },
  { value: TipoDespesa.VESTUARIO, label: 'Vestuário' },
  { value: TipoDespesa.SERVICOS, label: 'Serviços' },
  { value: TipoDespesa.OUTROS, label: 'Outros' },
];

export const DESPESA_FREQUENCIAS_RECORRENCIA = [
  { value: DespesaFrequenciaRecorrencia.SEMANAL, label: 'Semanal' },
  { value: DespesaFrequenciaRecorrencia.QUINZENAL, label: 'Quinzenal' },
  { value: DespesaFrequenciaRecorrencia.MENSAL, label: 'Mensal' },
  { value: DespesaFrequenciaRecorrencia.BIMESTRAL, label: 'Bimestral' },
  { value: DespesaFrequenciaRecorrencia.TRIMESTRAL, label: 'Trimestral' },
  { value: DespesaFrequenciaRecorrencia.SEMESTRAL, label: 'Semestral' },
  { value: DespesaFrequenciaRecorrencia.ANUAL, label: 'Anual' },
];
