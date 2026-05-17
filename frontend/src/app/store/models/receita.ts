import { BaseEntity, Categoria } from './common';

export interface Receita extends BaseEntity {
  tipoReceita: TipoReceita;
  recorrente: boolean;
  frequencia?: FrequenciaRecorrencia;
  dataFimRecorrencia?: Date;
}

export enum TipoReceita {
  SALARIO = 'salario',
  FREELANCE = 'freelance',
  INVESTIMENTO = 'investimento',
  OUTROS = 'outros',
}

export enum FrequenciaRecorrencia {
  SEMANAL = 'semanal',
  QUINZENAL = 'quinzenal',
  MENSAL = 'mensal',
  BIMESTRAL = 'bimestral',
  TRIMESTRAL = 'trimestral',
  SEMESTRAL = 'semestral',
  ANUAL = 'anual',
}

export interface ReceitaForm {
  descricao: string;
  valor: number;
  data: Date;
  categoria: Categoria;
  tipoReceita: TipoReceita;
  recorrente: boolean;
  frequencia?: FrequenciaRecorrencia;
  dataFimRecorrencia?: Date;
  observacoes?: string;
}

export const TIPOS_RECEITA = [
  { value: TipoReceita.SALARIO, label: 'Salário' },
  { value: TipoReceita.FREELANCE, label: 'Freelance' },
  { value: TipoReceita.INVESTIMENTO, label: 'Investimento' },
  { value: TipoReceita.OUTROS, label: 'Outros' },
];

export const RECEITA_FREQUENCIAS_RECORRENCIA = [
  { value: FrequenciaRecorrencia.SEMANAL, label: 'Semanal' },
  { value: FrequenciaRecorrencia.QUINZENAL, label: 'Quinzenal' },
  { value: FrequenciaRecorrencia.MENSAL, label: 'Mensal' },
  { value: FrequenciaRecorrencia.BIMESTRAL, label: 'Bimestral' },
  { value: FrequenciaRecorrencia.TRIMESTRAL, label: 'Trimestral' },
  { value: FrequenciaRecorrencia.SEMESTRAL, label: 'Semestral' },
  { value: FrequenciaRecorrencia.ANUAL, label: 'Anual' },
];
