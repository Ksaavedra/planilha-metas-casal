import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
   console.log('🌱 Iniciando seed do banco de dados...');

   // Criar meses
   const meses = [
      { numero: 1, nome: 'Janeiro' },
      { numero: 2, nome: 'Fevereiro' },
      { numero: 3, nome: 'Março' },
      { numero: 4, nome: 'Abril' },
      { numero: 5, nome: 'Maio' },
      { numero: 6, nome: 'Junho' },
      { numero: 7, nome: 'Julho' },
      { numero: 8, nome: 'Agosto' },
      { numero: 9, nome: 'Setembro' },
      { numero: 10, nome: 'Outubro' },
      { numero: 11, nome: 'Novembro' },
      { numero: 12, nome: 'Dezembro' },
   ];

   for (const mes of meses) {
      await prisma.meses.upsert({
         where: { numero: mes.numero },
         update: {},
         create: mes,
      });
   }
   console.log('✅ Meses criados/atualizados');

   // Criar categorias de despesas
   const categoriasDespesas = [
      {
         nome: 'Alimentação',
         tipo: 'despesa',
         descricao: 'Gastos com comida e refeições',
      },
      {
         nome: 'Transporte',
         tipo: 'despesa',
         descricao: 'Combustível, passagens, Uber',
      },
      {
         nome: 'Moradia',
         tipo: 'despesa',
         descricao: 'Aluguel, condomínio, IPTU',
      },
      {
         nome: 'Saúde',
         tipo: 'despesa',
         descricao: 'Médicos, medicamentos, plano de saúde',
      },
      {
         nome: 'Educação',
         tipo: 'despesa',
         descricao: 'Escola, cursos, material escolar',
      },
      {
         nome: 'Lazer',
         tipo: 'despesa',
         descricao: 'Cinema, restaurantes, viagens',
      },
      {
         nome: 'Vestuário',
         tipo: 'despesa',
         descricao: 'Roupas, calçados, acessórios',
      },
      {
         nome: 'Serviços',
         tipo: 'despesa',
         descricao: 'Internet, telefone, energia',
      },
   ];

   for (const categoria of categoriasDespesas) {
      await prisma.categoria.upsert({
         where: { nome: categoria.nome },
         update: {},
         create: categoria,
      });
   }
   console.log('✅ Categorias de despesas criadas/atualizadas');

   // Criar categorias de receitas
   const categoriasReceitas = [
      {
         nome: 'Salário',
         tipo: 'receita',
         descricao: 'Rendimento do trabalho principal',
      },
      {
         nome: 'Freelance',
         tipo: 'receita',
         descricao: 'Trabalhos extras e projetos',
      },
      {
         nome: 'Investimentos',
         tipo: 'receita',
         descricao: 'Rendimentos de aplicações',
      },
      {
         nome: 'Aluguel',
         tipo: 'receita',
         descricao: 'Receita de imóveis alugados',
      },
      {
         nome: 'Vendas',
         tipo: 'receita',
         descricao: 'Venda de produtos ou serviços',
      },
      {
         nome: 'Presentes',
         tipo: 'receita',
         descricao: 'Dinheiro recebido como presente',
      },
   ];

   for (const categoria of categoriasReceitas) {
      await prisma.categoria.upsert({
         where: { nome: categoria.nome },
         update: {},
         create: categoria,
      });
   }
   console.log('✅ Categorias de receitas criadas/atualizadas');

   console.log('🎉 Seed concluído com sucesso!');
}

main()
   .catch((e) => {
      console.error('❌ Erro durante o seed:', e);
      process.exit(1);
   })
   .finally(async () => {
      await prisma.$disconnect();
   });
