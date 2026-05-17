export type NaturezaDespesa = 'fixa' | 'variavel';

export interface Despesa {
  id: number;
  pessoa?: string;
  natureza: NaturezaDespesa;
  categoria: string;
  descricao: string;
  valor: number;
  data: string | null;
  ano: number;
  mes: number;
}

export interface CreateDespesaRequest {
  pessoa: string;
  natureza: NaturezaDespesa;
  categoria: string;
  descricao: string;
  valor: number;
  data?: string | null;
  ano: number;
  mes: number;
}

export type UpdateDespesaRequest = Partial<CreateDespesaRequest>;
