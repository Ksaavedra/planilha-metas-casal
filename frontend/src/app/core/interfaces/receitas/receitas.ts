export type NaturezaReceita = 'fixa' | 'variavel';

export interface Receita {
  id: number;
  pessoa?: string;
  natureza: NaturezaReceita;
  categoria: string;
  valor: number;
  data: string | null;
  ano: number;
  mes: number;
}

export interface CreateReceitaRequest {
  pessoa: string;
  natureza: NaturezaReceita;
  categoria: string;
  valor: number;
  data?: string | null;
  ano: number;
  mes: number;
}

export type UpdateReceitaRequest = Partial<CreateReceitaRequest>;
