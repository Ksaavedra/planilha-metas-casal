import {
  Categoria,
  Receita,
  Despesa,
  Divida,
  Investimento,
  MetaInvestimento,
  STATUS_ATIVO,
  STATUS_PENDENTE,
  TipoInvestimento,
} from './models';

// Categorias de exemplo
export const CATEGORIAS_EXEMPLO: Categoria[] = [
  { id: '1', nome: 'Salário', cor: '#10b981', icone: 'work' },
  { id: '2', nome: 'Freelance', cor: '#3b82f6', icone: 'computer' },
  { id: '3', nome: 'Investimentos', cor: '#8b5cf6', icone: 'trending_up' },
  { id: '4', nome: 'Alimentação', cor: '#f59e0b', icone: 'restaurant' },
  { id: '5', nome: 'Transporte', cor: '#ef4444', icone: 'directions_car' },
  { id: '6', nome: 'Moradia', cor: '#06b6d4', icone: 'home' },
  { id: '7', nome: 'Saúde', cor: '#84cc16', icone: 'health_and_safety' },
  { id: '8', nome: 'Lazer', cor: '#ec4899', icone: 'sports_esports' },
];

// Receitas de exemplo
export const RECEITAS_EXEMPLO: Receita[] = [
  {
    id: '1',
    descricao: 'Salário Mensal',
    valor: 5000,
    data: new Date(2024, 7, 15),
    categoria: CATEGORIAS_EXEMPLO[0],
    tipoReceita: 'salario' as any,
    recorrente: true,
    frequencia: 'mensal' as any,
    observacoes: 'Salário fixo da empresa',
    createdAt: new Date(2024, 7, 15),
    updatedAt: new Date(2024, 7, 15),
  },
  {
    id: '2',
    descricao: 'Projeto Freelance',
    valor: 1500,
    data: new Date(2024, 7, 20),
    categoria: CATEGORIAS_EXEMPLO[1],
    tipoReceita: 'freelance' as any,
    recorrente: false,
    observacoes: 'Desenvolvimento de website',
    createdAt: new Date(2024, 7, 20),
    updatedAt: new Date(2024, 7, 20),
  },
];

// Despesas de exemplo
export const DESPESAS_EXEMPLO: Despesa[] = [
  {
    id: '1',
    descricao: 'Supermercado',
    valor: 800,
    data: new Date(2024, 7, 10),
    categoria: CATEGORIAS_EXEMPLO[3],
    tipoDespesa: 'alimentacao' as any,
    recorrente: true,
    frequencia: 'mensal' as any,
    parcelada: false,
    observacoes: 'Compras do mês',
    createdAt: new Date(2024, 7, 10),
    updatedAt: new Date(2024, 7, 10),
  },
  {
    id: '2',
    descricao: 'Combustível',
    valor: 200,
    data: new Date(2024, 7, 12),
    categoria: CATEGORIAS_EXEMPLO[4],
    tipoDespesa: 'transporte' as any,
    recorrente: true,
    frequencia: 'quinzenal' as any,
    parcelada: false,
    observacoes: 'Abastecimento',
    createdAt: new Date(2024, 7, 12),
    updatedAt: new Date(2024, 7, 12),
  },
];

// Dívidas de exemplo
export const DIVIDAS_EXEMPLO: Divida[] = [
  {
    id: '1',
    descricao: 'Cartão de Crédito',
    credor: 'Banco XYZ',
    valorOriginal: 3000,
    valorAtual: 2500,
    dataVencimento: new Date(2024, 8, 15),
    status: STATUS_PENDENTE,
    tipoDivida: 'cartao_credito' as any,
    jurosMensal: 2.5,
    parcelada: true,
    numeroParcelas: 12,
    parcelaAtual: 3,
    valorParcela: 250,
    categoria: CATEGORIAS_EXEMPLO[5],
    data: new Date(2024, 6, 15),
    observacoes: 'Compra de eletrônicos',
    createdAt: new Date(2024, 6, 15),
    updatedAt: new Date(2024, 7, 15),
    valor: 0,
  },
];

// Investimentos de exemplo
export const INVESTIMENTOS_EXEMPLO: Investimento[] = [
  {
    id: '1',
    descricao: 'CDB Banco ABC',
    valorInvestido: 10000,
    valorAtual: 10250,
    rentabilidade: 250,
    rentabilidadePercentual: 2.5,
    dataInicio: new Date(2024, 6, 1),
    status: STATUS_ATIVO,
    instituicao: 'Banco ABC',
    conta: 'Conta Corrente',
    risco: 'baixo' as any,
    liquidez: 'diaria' as any,
    categoria: CATEGORIAS_EXEMPLO[2],
    data: new Date(2024, 6, 1),
    observacoes: 'CDB com liquidez diária',
    createdAt: new Date(2024, 6, 1),
    updatedAt: new Date(2024, 7, 1),
    tipoInvestimento: TipoInvestimento.POUPANCA,
    valor: 0,
  },
];

// Metas de exemplo
export const METAS_EXEMPLO: MetaInvestimento[] = [
  {
    id: '1',
    descricao: 'Reserva de Emergência',
    valorMeta: 15000,
    valorAtual: 8000,
    percentualConcluido: 53.33,
    dataInicio: new Date(2024, 0, 1),
    dataLimite: new Date(2024, 11, 31),
    status: STATUS_ATIVO,
    tipoMeta: 'reserva_emergencia' as any,
    prioridade: 'alta' as any,
    categoria: CATEGORIAS_EXEMPLO[2],
    investimentosRelacionados: ['1'],
    aporteMensal: 1000,
    frequenciaAporte: 'mensal' as any,
    observacoes: 'Reserva para emergências',
    data: new Date(2024, 0, 1),
    createdAt: new Date(2024, 0, 1),
    updatedAt: new Date(2024, 7, 1),
    valor: 0,
  },
];
