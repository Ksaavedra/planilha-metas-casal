export type StatusInvestimento = 'crescendo' | 'estavel' | 'finalizado';

export interface Investimento {
  id: number;
  descricao: string;
  tipoInvestimento: string;
  valorInvestido: number;
  valorAtual: number;
  aporteMensal: number;
  rentabilidade: number;
  rentabilidadePercentual: number;
  statusInvestimento: StatusInvestimento;
  instituicao?: string | null;
  pessoa?: string | null;
  ano: number;
  dataInicio?: string | null;
  observacoes?: string | null;
}

export interface CreateInvestimentoRequest {
  descricao: string;
  tipoInvestimento: string;
  valorInvestido: number;
  valorAtual: number;
  aporteMensal?: number;
  statusInvestimento?: StatusInvestimento;
  instituicao?: string;
  pessoa?: string;
  ano: number;
  dataInicio?: string;
  observacoes?: string;
}

export type UpdateInvestimentoRequest = Partial<CreateInvestimentoRequest>;

export interface ResumoInvestimentosView {
  totalInvestido: number;
  patrimonioAtual: number;
  lucroAcumulado: number;
  rentabilidadePercentual: number;
  quantidadeAtivos: number;
}
