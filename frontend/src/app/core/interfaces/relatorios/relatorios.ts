export interface NaturezaReportLinha {
  id: 'fixa' | 'variavel';
  label: string;
  valores: number[];
  total: number;
}

export interface ReceitaTipoReportLinha {
  tipo: string;
  valores: number[];
  total: number;
}

export interface DespesaCategoriaReportLinha {
  categoria: string;
  valores: number[];
  total: number;
}
