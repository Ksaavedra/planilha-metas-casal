import { BaseEntity, Categoria, Status } from './common';

export interface Investimento extends BaseEntity {
  tipoInvestimento: TipoInvestimento;
  valorInvestido: number;
  valorAtual: number;
  rentabilidade: number;
  rentabilidadePercentual: number;
  dataInicio: Date;
  dataFim?: Date;
  status: Status;
  instituicao: string;
  conta?: string;
  aporteMensal?: number;
  frequenciaAporte?: FrequenciaAporte;
  risco: NivelRisco;
  liquidez: NivelLiquidez;
}

export enum TipoInvestimento {
  POUPANCA = 'poupanca',
  CDB = 'cdb',
  LCI = 'lci',
  LCA = 'lca',
  ACAO = 'acao',
  FII = 'fii',
  TESOURO_DIRETO = 'tesouro_direto',
  PREVIDENCIA = 'previdencia',
  CRYPTO = 'crypto',
  OUTROS = 'outros',
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

export enum NivelRisco {
  BAIXO = 'baixo',
  MEDIO = 'medio',
  ALTO = 'alto',
  ALTISSIMO = 'altissimo',
}

export enum NivelLiquidez {
  IMEDIATA = 'imediata',
  DIARIA = 'diaria',
  SEMANAL = 'semanal',
  MENSAL = 'mensal',
  ANUAL = 'anual',
}

export interface InvestimentoForm {
  descricao: string;
  tipoInvestimento: TipoInvestimento;
  valorInvestido: number;
  valorAtual: number;
  dataInicio: Date;
  dataFim?: Date;
  categoria: Categoria;
  instituicao: string;
  conta?: string;
  aporteMensal?: number;
  frequenciaAporte?: FrequenciaAporte;
  risco: NivelRisco;
  liquidez: NivelLiquidez;
  observacoes?: string;
}

export const TIPOS_INVESTIMENTO = [
  { value: TipoInvestimento.POUPANCA, label: 'Poupança' },
  { value: TipoInvestimento.CDB, label: 'CDB' },
  { value: TipoInvestimento.LCI, label: 'LCI' },
  { value: TipoInvestimento.LCA, label: 'LCA' },
  { value: TipoInvestimento.ACAO, label: 'Ação' },
  { value: TipoInvestimento.FII, label: 'FII' },
  { value: TipoInvestimento.TESOURO_DIRETO, label: 'Tesouro Direto' },
  { value: TipoInvestimento.PREVIDENCIA, label: 'Previdência' },
  { value: TipoInvestimento.CRYPTO, label: 'Criptomoeda' },
  { value: TipoInvestimento.OUTROS, label: 'Outros' },
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

export const NIVEIS_RISCO = [
  { value: NivelRisco.BAIXO, label: 'Baixo', cor: '#28a745' },
  { value: NivelRisco.MEDIO, label: 'Médio', cor: '#ffc107' },
  { value: NivelRisco.ALTO, label: 'Alto', cor: '#fd7e14' },
  { value: NivelRisco.ALTISSIMO, label: 'Altíssimo', cor: '#dc3545' },
];

export const NIVEIS_LIQUIDEZ = [
  { value: NivelLiquidez.IMEDIATA, label: 'Imediata' },
  { value: NivelLiquidez.DIARIA, label: 'Diária' },
  { value: NivelLiquidez.SEMANAL, label: 'Semanal' },
  { value: NivelLiquidez.MENSAL, label: 'Mensal' },
  { value: NivelLiquidez.ANUAL, label: 'Anual' },
];

export interface ResumoInvestimentos {
  totalInvestido: number;
  totalAtual: number;
  rentabilidadeTotal: number;
  rentabilidadePercentual: number;
  quantidadeInvestimentos: number;
  proximoAporte?: Date;
}
