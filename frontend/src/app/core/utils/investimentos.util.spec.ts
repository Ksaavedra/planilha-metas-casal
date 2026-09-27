import { Investimento } from '../interfaces/investimentos/investimentos';
import {
  calcularResumoInvestimentos,
  inferirStatusPorRentabilidade,
  statusInvestimentoClasse,
  statusInvestimentoLabel,
} from './investimentos.util';

describe('investimentos.util', () => {
  const base: Investimento = {
    id: 1,
    descricao: 'Reserva',
    tipoInvestimento: 'cdb',
    valorInvestido: 1000,
    valorAtual: 1200,
    aporteMensal: 100,
    rentabilidade: 200,
    rentabilidadePercentual: 20,
    statusInvestimento: 'crescendo',
    ano: 2026,
  };

  describe('calcularResumoInvestimentos', () => {
    it('calcula totais e rentabilidade', () => {
      const lista: Investimento[] = [
        base,
        {
          ...base,
          id: 2,
          valorInvestido: 500,
          valorAtual: 400,
          statusInvestimento: 'finalizado',
        },
      ];

      const resumo = calcularResumoInvestimentos(lista);

      expect(resumo.totalInvestido).toBe(1500);
      expect(resumo.patrimonioAtual).toBe(1600);
      expect(resumo.lucroAcumulado).toBe(100);
      expect(resumo.rentabilidadePercentual).toBeCloseTo(6.666, 2);
      expect(resumo.quantidadeAtivos).toBe(1);
    });

    it('retorna zeros quando lista vazia', () => {
      const resumo = calcularResumoInvestimentos([]);

      expect(resumo.totalInvestido).toBe(0);
      expect(resumo.patrimonioAtual).toBe(0);
      expect(resumo.lucroAcumulado).toBe(0);
      expect(resumo.rentabilidadePercentual).toBe(0);
      expect(resumo.quantidadeAtivos).toBe(0);
    });

    it('ignora valores nulos nos totais', () => {
      const resumo = calcularResumoInvestimentos([
        {
          ...base,
          valorInvestido: null as unknown as number,
          valorAtual: undefined as unknown as number,
        },
      ]);

      expect(resumo.totalInvestido).toBe(0);
      expect(resumo.patrimonioAtual).toBe(0);
    });
  });

  describe('statusInvestimentoLabel', () => {
    it('retorna labels conhecidos', () => {
      expect(statusInvestimentoLabel('crescendo')).toContain('Crescendo');
      expect(statusInvestimentoLabel('estavel')).toContain('Estável');
      expect(statusInvestimentoLabel('finalizado')).toContain('Finalizado');
    });

    it('retorna o próprio valor para status desconhecido', () => {
      expect(statusInvestimentoLabel('outro' as 'crescendo')).toBe('outro');
    });
  });

  describe('statusInvestimentoClasse', () => {
    it('retorna classes css', () => {
      expect(statusInvestimentoClasse('crescendo')).toBe('status--crescendo');
      expect(statusInvestimentoClasse('estavel')).toBe('status--estavel');
      expect(statusInvestimentoClasse('finalizado')).toBe('status--finalizado');
    });

    it('retorna string vazia para status desconhecido', () => {
      expect(statusInvestimentoClasse('outro' as 'crescendo')).toBe('');
    });
  });

  describe('inferirStatusPorRentabilidade', () => {
    it('mantém finalizado', () => {
      expect(inferirStatusPorRentabilidade(10, 'finalizado')).toBe('finalizado');
    });

    it('infere crescendo com pct positivo', () => {
      expect(inferirStatusPorRentabilidade(2)).toBe('crescendo');
    });

    it('infere estavel com pct neutro ou negativo', () => {
      expect(inferirStatusPorRentabilidade(0)).toBe('estavel');
      expect(inferirStatusPorRentabilidade(-2)).toBe('estavel');
    });
  });
});
