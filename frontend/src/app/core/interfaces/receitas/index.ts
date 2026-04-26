// --- Tipos da API ---
export type PessoaReceita = string;

export type TipoReceita =
  | 'Salário'
  | 'Bônus'
  | 'Freela'
  | 'Renda extra'
  | 'Aluguel'
  | 'Outras rendas compartilhadas';

export type CategoriaReceita = 'Fixa' | 'Variável';

/** Opções para select de Tipo de receita (ordem do dropdown). */
export const TIPOS_RECEITA: TipoReceita[] = [
  'Salário',
  'Bônus',
  'Freela',
  'Renda extra',
  'Aluguel',
  'Outras rendas compartilhadas',
];

/** Opções para select de Categoria (Fixa / Variável). */
export const CATEGORIAS_RECEITA: CategoriaReceita[] = ['Fixa', 'Variável'];

export interface ReceitaMensal {
  id?: number;
  pessoa: PessoaReceita;
  tipo: TipoReceita;
  categoria: CategoriaReceita;
  valor: number;
  ano?: number;
  mes?: number;
}

// --- Estado do modal Adicionar/Editar ---
export interface ModalAdicionarUsuarioState {
  isOpen: boolean;
  isEditMode: boolean;
  receitaId?: number;
  nomeUsuario: string;
  valorSalarioRaw: string;
  tipo: TipoReceita;
  categoria: CategoriaReceita;
  mesesSelecionados: number[];
  ano: number;
}

// --- Estado do modal Confirmar/Sucesso Excluir ---
export interface ModalConfirmarExcluirReceitaState {
  isOpen: boolean;
  message: string;
  receitaId: number | null;
}

export interface ModalSucessoExcluirReceitaState {
  isOpen: boolean;
}
