import { BaseEntity, Categoria, Status } from './common';

export interface MetaInvestimento extends BaseEntity {
  valorMeta: number;
  valorAtual: number;
  percentualConcluido: number;
  dataInicio: Date;
  dataLimite: Date;
  status: Status;
  tipoMeta: TipoMeta;
  prioridade: Prioridade;
  categoria: Categoria;
  investimentosRelacionados?: string[]; // IDs dos investimentos
  aporteMensal?: number;
  frequenciaAporte?: FrequenciaAporte;
  observacoes?: string;
}

export enum TipoMeta {
  APOSENTADORIA = 'aposentadoria',
  COMPRA_IMOVEL = 'compra_imovel',
  COMPRA_CARRO = 'compra_carro',
  VIAGEM = 'viagem',
  ESTUDOS = 'estudos',
  RESERVA_EMERGENCIA = 'reserva_emergencia',
  OUTROS = 'outros',
}

export enum Prioridade {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum FrequenciaAporte {
  SEMANAL = 'semanal',
  QUINZENAL = 'quinzenal',
  MENSAL = 'mensal',
  BIMESTRAL = 'bimestral',
  TRIMESTRAL = 'trimestral',
  SEMESTRAL = 'semestral',
  ANUAL = 'anual',
}

export interface MetaForm {
  descricao: string;
  valorMeta: number;
  valorAtual: number;
  dataInicio: Date;
  dataLimite: Date;
  categoria: Categoria;
  tipoMeta: TipoMeta;
  prioridade: Prioridade;
  investimentosRelacionados?: string[];
  aporteMensal?: number;
  frequenciaAporte?: FrequenciaAporte;
  observacoes?: string;
}

export const TIPOS_META = [
  { value: TipoMeta.APOSENTADORIA, label: 'Aposentadoria' },
  { value: TipoMeta.COMPRA_IMOVEL, label: 'Compra de Imóvel' },
  { value: TipoMeta.COMPRA_CARRO, label: 'Compra de Carro' },
  { value: TipoMeta.VIAGEM, label: 'Viagem' },
  { value: TipoMeta.ESTUDOS, label: 'Estudos' },
  { value: TipoMeta.RESERVA_EMERGENCIA, label: 'Reserva de Emergência' },
  { value: TipoMeta.OUTROS, label: 'Outros' },
];

export const PRIORIDADES = [
  { value: Prioridade.BAIXA, label: 'Baixa', cor: '#6c757d' },
  { value: Prioridade.MEDIA, label: 'Média', cor: '#ffc107' },
  { value: Prioridade.ALTA, label: 'Alta', cor: '#fd7e14' },
  { value: Prioridade.URGENTE, label: 'Urgente', cor: '#dc3545' },
];

export const FREQUENCIAS_APORTE = [
  { value: FrequenciaAporte.SEMANAL, label: 'Semanal' },
  { value: FrequenciaAporte.QUINZENAL, label: 'Quinzenal' },
  { value: FrequenciaAporte.MENSAL, label: 'Mensal' },
  { value: FrequenciaAporte.BIMESTRAL, label: 'Bimestral' },
  { value: FrequenciaAporte.TRIMESTRAL, label: 'Trimestral' },
  { value: FrequenciaAporte.SEMESTRAL, label: 'Semestral' },
  { value: FrequenciaAporte.ANUAL, label: 'Anual' },
];

export interface ResumoMetas {
  totalMetas: number;
  metasConcluidas: number;
  metasEmAndamento: number;
  metasAtrasadas: number;
  valorTotalMetas: number;
  valorTotalAtual: number;
  percentualGeral: number;
  proximaMeta?: MetaInvestimento;
}
