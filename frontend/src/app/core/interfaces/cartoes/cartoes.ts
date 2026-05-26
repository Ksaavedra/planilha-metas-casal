export type StatusCartao =
  | 'em_dia'
  | 'proximo_limite'
  | 'fatura_fechada'
  | 'atrasado'
  | 'fatura_paga';

export interface Cartao {
  id: number;
  nome: string;
  banco: string;
  limite: number;
  valorUtilizado: number;
  valorDisponivel: number;
  faturaPaga?: boolean;
  valorFaturaPaga?: number;
  diaFechamento?: number | null;
  diaVencimento?: number | null;
  diaMelhorCompra?: number | null;
  observacoes?: string | null;
  observacaoAtraso?: string | null;
  previsaoPagamento?: string | null;
}

export interface CreateCartaoRequest {
  nome: string;
  banco: string;
  limite: number;
  valorUtilizado?: number;
  faturaPaga?: boolean;
  valorFaturaPaga?: number;
  diaFechamento?: number;
  diaVencimento?: number;
  diaMelhorCompra?: number;
  observacoes?: string;
  observacaoAtraso?: string | null;
  previsaoPagamento?: string | null;
}

export type UpdateCartaoRequest = Partial<CreateCartaoRequest>;

export interface ResumoCartoesView {
  limiteTotal: number;
  utilizado: number;
  disponivel: number;
  percentualUtilizado: number;
  proximoVencimentoLabel: string;
}
