export type StatusDivida = 'pagando' | 'atrasada' | 'quitada';

/** Situação da parcela no mês de referência selecionado. */
export type StatusParcelaMes = 'paga' | 'pendente' | 'atrasada' | 'futura';

export interface Divida {
  id: number;
  objetivo: string;
  tipoDivida: string;
  valorTotal: number;
  valorPago: number;
  valorRestante: number;
  parcelaMensal: number;
  quantidadeParcelas: number;
  parcelasRestantes: number;
  percentualQuitado: number;
  statusDivida: StatusDivida;
  instituicao?: string | null;
  ano: number;
  dataInicio?: string | null;
  observacoes?: string | null;
}

export interface DividaNoMes extends Divida {
  indiceParcelaMes: number;
  valorPagoNoMes: number;
  parcelaMesPaga: boolean;
  statusParcelaMes: StatusParcelaMes;
}

export interface CreateDividaRequest {
  objetivo: string;
  tipoDivida: string;
  valorTotal: number;
  valorPago?: number;
  parcelaMensal?: number;
  quantidadeParcelas?: number;
  statusDivida?: StatusDivida;
  instituicao?: string;
  ano: number;
  dataInicio?: string;
  observacoes?: string;
}

export type UpdateDividaRequest = Partial<CreateDividaRequest>;

export interface ResumoDividasView {
  totalDividas: number;
  totalPago: number;
  valorRestante: number;
  parcelasAtivas: number;
  percentualQuitado: number;
}
