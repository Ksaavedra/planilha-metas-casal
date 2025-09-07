import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
