import { NaturezaReceita } from '@app/core/interfaces/receitas/receitas';

export const CATEGORIAS_FORM_FIXA: readonly string[] = [
  'Salário',
  'Pensão',
  'Aluguel',
  'Renda',
  'Outros',
];

export const CATEGORIAS_FORM_VARIAVEL: readonly string[] = [
  'Freela',
  'Bônus',
  'Comissões',
  'Renda extra',
  'Vendas',
  'Outros',
];

export const EXEMPLOS_DICA_CATEGORIAS_FIXA: readonly string[] = [
  'Salário',
  'Pensão',
  'Aluguel recebido',
  'Renda recorrente',
];

export const EXEMPLOS_DICA_CATEGORIAS_VARIAVEL: readonly string[] = [
  'Freela',
  'Bônus',
  'Comissões',
  'Renda extra',
  'Vendas',
];

export function listaCategoriasSugestao(
  natureza: NaturezaReceita,
): readonly string[] {
  return natureza === 'fixa' ? CATEGORIAS_FORM_FIXA : CATEGORIAS_FORM_VARIAVEL;
}
