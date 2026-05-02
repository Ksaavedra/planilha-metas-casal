import { NaturezaDespesa } from '@app/core/interfaces/despesas/despesas';

export const CATEGORIAS_FORM_FIXA: readonly string[] = [
  'Aluguel',
  'Internet / celular',
  'Condomínio',
  'Plano de saúde',
  'Educação',
  'Assinaturas',
  'Seguros',
  'Carro',
  'Pets (plano)',
  'Academia',
  'Diarista',
  'Outros',
];

export const CATEGORIAS_FORM_VARIAVEL: readonly string[] = [
  'Mercado',
  'Transporte',
  'Lazer',
  'Água',
  'Gás',
  'Luz',
  'Pets (gastos)',
  'Cuidados pessoais',
  'Manutenção',
  'Farmácia',
  'Presentes',
  'Viagem',
  'Restaurante',
  'Roupas',
  'Educação extra',
  'Outros',
];

export const EXEMPLOS_DICA_CATEGORIAS_FIXA: readonly string[] = [
  'Aluguel / financiamento',
  'Internet / celular (plano mensal)',
  'Condomínio / IPTU',
  'Plano de saúde / dentista (convênio)',
  'Escola / cursos / idiomas',
  'Assinaturas (Netflix, streaming, apps, jornal, etc.)',
  'Seguros (vida, residência, carro, etc.)',
  'Carro (parcela, seguro, IPVA parcelado, licenciamento)',
  'Pets (convênio / plano de saúde animal)',
  'Academia / esporte / clube',
  'Empregada / diarista (valor fixo mensal)',
];

export const EXEMPLOS_DICA_CATEGORIAS_VARIAVEL: readonly string[] = [
  'Mercado',
  'Transporte (combustível, Uber, estacionamento, pedágio)',
  'Lazer / compras / bares e shows',
  'Energia, água e gás',
  'Pets (ração, tosa, pet shop, emergências, fora do convênio)',
  'Cuidados pessoais (cabeleireiro, estética, barbearia, etc.)',
  'Manutenção da casa, do carro e eletro (oficina, consertos)',
  'Farmácia e suplementos',
  'Presentes e datas comemorativas',
  'Viagem / hotel / Airbnb',
  'Restaurante / delivery / iFood',
  'Roupas, calçados e acessórios',
  'Educação avulsa (livros, material escolar, workshop pontual)',
];

export function listaCategoriasSugestao(
  natureza: NaturezaDespesa,
): readonly string[] {
  return natureza === 'fixa' ? CATEGORIAS_FORM_FIXA : CATEGORIAS_FORM_VARIAVEL;
}
