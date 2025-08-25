export interface Id {
  id: string;
}

export interface Categoria {
  id: string;
  nome: string;
  cor?: string;
  icone?: string;
}

export interface Periodo {
  mes: number;
  ano: number;
}

export interface BaseEntity extends Id {
  descricao: string;
  valor: number;
  data: Date;
  categoria: Categoria;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FiltroPeriodo {
  dataInicio: Date;
  dataFim: Date;
  periodo?: Periodo;
}

export interface ResumoFinanceiro {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  periodo: Periodo;
}

export interface Status {
  id: string;
  nome: string;
  cor: string;
}

export const STATUS_ATIVO: Status = {
  id: 'ativo',
  nome: 'Ativo',
  cor: '#28a745',
};

export const STATUS_INATIVO: Status = {
  id: 'inativo',
  nome: 'Inativo',
  cor: '#dc3545',
};

export const STATUS_PENDENTE: Status = {
  id: 'pendente',
  nome: 'Pendente',
  cor: '#ffc107',
};

export const STATUS_CONCLUIDO: Status = {
  id: 'concluido',
  nome: 'Concluído',
  cor: '#17a2b8',
};
