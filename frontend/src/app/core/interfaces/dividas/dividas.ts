export type StatusDivida = 'pagando' | 'atrasada' | 'quitada';

/** Situação da parcela no mês de referência selecionado. */
export type StatusParcelaMes =
  | 'paga'
  | 'pendente'
  | 'atrasada'
  | 'futura'
  | 'quitada';

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
  limiteCartao?: number | null;
  diaVencimento?: number | null;
  diaMelhorCompra?: number | null;
  cartaoId?: number | null;
  cartaoNome?: string | null;
  cartaoBanco?: string | null;
  ano: number;
  dataInicio?: string | null;
  observacoes?: string | null;
  cartao?: string | null;
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
  limiteCartao?: number;
  diaVencimento?: number;
  diaMelhorCompra?: number;
  cartaoId?: number | null;
  ano: number;
  dataInicio?: string;
  observacoes?: string;
  cartao?: string;
}

export type UpdateDividaRequest = Partial<CreateDividaRequest>;

export interface ResumoDividasView {
  totalDividas: number;
  totalPago: number;
  valorRestante: number;
  parcelasAtivas: number;
  percentualQuitado: number;
}

export interface ResumoLimiteCartoesView {
  limiteTotal: number;
  utilizado: number;
  disponivel: number;
  proximoVencimentoLabel: string;
}

export interface ResumoCartaoView {
  instituicao: string;
  limite: number;
  utilizado: number;
  disponivel: number;
  diaVencimento: number | null;
  diaMelhorCompra: number | null;
  percentualUtilizado: number;
}
