import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  RelatoriosService,
  ResumoFinanceiro,
  ResumoDetalhado,
} from './relatorios.service';
import { ApiService } from '../api/api.service';
import { DespesasService } from '../despesas/despesas.service';
import { ReceitasService } from '../relatorios/receitas.service';

describe('RelatoriosService', () => {
  let service: RelatoriosService;
  let apiService: any;
  let despesasService: any;
  let receitasService: any;

  const mockResumoFinanceiro: ResumoFinanceiro = {
    receitas: 5000,
    despesas: 3000,
    saldo: 2000,
    mes_id: 1,
  };

  const mockReceitas = [
    {
      id: 1,
      mes_id: 1,
      categoriaId: 1,
      descricao: 'Salário',
      valor: 5000,
      status: 'Recebido' as const,
      tipo: 'Ativa' as const,
      categoria: { id: 1, nome: 'Salário', tipo: 'receita', ativo: true },
      mes: { id: 1, nome: 'Janeiro', numero: 1 },
    },
  ];

  const mockDespesas = [
    {
      id: 1,
      mes_id: 1,
      categoriaId: 1,
      descricao: 'Alimentação',
      valor: 3000,
      status: 'Pago' as const,
      categoria: { id: 1, nome: 'Alimentação', tipo: 'despesa', ativo: true },
      mes: { id: 1, nome: 'Janeiro', numero: 1 },
    },
  ];

  beforeEach(() => {
    const apiServiceSpy = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };

    const despesasServiceSpy = {
      getDespesas: jest.fn(),
      agruparPorCategoria: jest.fn(),
      calcularTotalDespesas: jest.fn(),
    };

    const receitasServiceSpy = {
      getReceitas: jest.fn(),
      agruparPorCategoria: jest.fn(),
      agruparPorTipo: jest.fn(),
      calcularTotalReceitas: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        RelatoriosService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: DespesasService, useValue: despesasServiceSpy },
        { provide: ReceitasService, useValue: receitasServiceSpy },
      ],
    });

    service = TestBed.inject(RelatoriosService);
    apiService = TestBed.inject(ApiService);
    despesasService = TestBed.inject(DespesasService);
    receitasService = TestBed.inject(ReceitasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getResumo', () => {
    it('should return observable of resumo financeiro', () => {
      apiService.get.mockReturnValue(of(mockResumoFinanceiro));

      service.getResumo().subscribe((result) => {
        expect(result).toEqual(mockResumoFinanceiro);
      });

      expect(apiService.get).toHaveBeenCalledWith(
        '/relatorios/resumo',
        undefined
      );
    });

    it('should return observable of resumo financeiro with params', () => {
      const params = { mes_id: 1 };
      apiService.get.mockReturnValue(of(mockResumoFinanceiro));

      service.getResumo(params).subscribe((result) => {
        expect(result).toEqual(mockResumoFinanceiro);
      });

      expect(apiService.get).toHaveBeenCalledWith('/relatorios/resumo', params);
    });

    it('should handle error when getting resumo', () => {
      const error = new Error('Failed to fetch resumo');
      apiService.get.mockReturnValue(throwError(() => error));

      service.getResumo().subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.get).toHaveBeenCalledWith(
        '/relatorios/resumo',
        undefined
      );
    });
  });

  describe('getResumoDetalhado', () => {
    it('should return detailed resumo with all calculations', () => {
      apiService.get.mockReturnValue(of(mockResumoFinanceiro));
      receitasService.getReceitas.mockReturnValue(of(mockReceitas));
      despesasService.getDespesas.mockReturnValue(of(mockDespesas));
      receitasService.agruparPorCategoria.mockReturnValue({ Salário: 5000 });
      despesasService.agruparPorCategoria.mockReturnValue({
        Alimentação: 3000,
      });
      receitasService.agruparPorTipo.mockReturnValue({ Ativa: 5000 });
      receitasService.calcularTotalReceitas.mockReturnValue(5000);
      despesasService.calcularTotalDespesas.mockReturnValue(3000);

      service.getResumoDetalhado().subscribe((result) => {
        expect(result).toEqual({
          ...mockResumoFinanceiro,
          receitasPorCategoria: { Salário: 5000 },
          despesasPorCategoria: { Alimentação: 3000 },
          receitasPorTipo: { Ativa: 5000 },
          totalReceitas: 5000,
          totalDespesas: 3000,
          saldo: 2000,
          saldoPositivo: true,
          percentualReceitas: 62.5,
          percentualDespesas: 37.5,
        });
      });

      expect(apiService.get).toHaveBeenCalledWith(
        '/relatorios/resumo',
        undefined
      );
      expect(receitasService.getReceitas).toHaveBeenCalledWith(undefined);
      expect(despesasService.getDespesas).toHaveBeenCalledWith(undefined);
    });

    it('should handle error when getting detailed resumo', () => {
      const error = new Error('Failed to fetch resumo');
      apiService.get.mockReturnValue(throwError(() => error));

      service.getResumoDetalhado().subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.get).toHaveBeenCalledWith(
        '/relatorios/resumo',
        undefined
      );
    });

    it('should calculate percentages correctly when totals are zero', () => {
      const resumoZero = {
        ...mockResumoFinanceiro,
        receitas: 0,
        despesas: 0,
        saldo: 0,
      };
      apiService.get.mockReturnValue(of(resumoZero));
      receitasService.getReceitas.mockReturnValue(of([]));
      despesasService.getDespesas.mockReturnValue(of([]));
      receitasService.agruparPorCategoria.mockReturnValue({});
      despesasService.agruparPorCategoria.mockReturnValue({});
      receitasService.agruparPorTipo.mockReturnValue({});
      receitasService.calcularTotalReceitas.mockReturnValue(0);
      despesasService.calcularTotalDespesas.mockReturnValue(0);

      service.getResumoDetalhado().subscribe((result) => {
        expect(result.percentualReceitas).toBe(0);
        expect(result.percentualDespesas).toBe(0);
        expect(result.saldoPositivo).toBe(true);
      });
    });
  });

  describe('getResumoPorMes', () => {
    it('should return detailed resumo for specific month', () => {
      const mesId = 1;
      apiService.get.mockReturnValue(of(mockResumoFinanceiro));
      receitasService.getReceitas.mockReturnValue(of(mockReceitas));
      despesasService.getDespesas.mockReturnValue(of(mockDespesas));
      receitasService.agruparPorCategoria.mockReturnValue({ Salário: 5000 });
      despesasService.agruparPorCategoria.mockReturnValue({
        Alimentação: 3000,
      });
      receitasService.agruparPorTipo.mockReturnValue({ Ativa: 5000 });
      receitasService.calcularTotalReceitas.mockReturnValue(5000);
      despesasService.calcularTotalDespesas.mockReturnValue(3000);

      service.getResumoPorMes(mesId).subscribe((result) => {
        expect(result).toBeDefined();
      });

      expect(apiService.get).toHaveBeenCalledWith('/relatorios/resumo', {
        mes_id: mesId,
      });
    });
  });

  describe('calcularIndicadores', () => {
    it('should calculate indicators correctly', () => {
      const resumoDetalhado: ResumoDetalhado = {
        ...mockResumoFinanceiro,
        receitasPorCategoria: { Salário: 5000 },
        despesasPorCategoria: { Alimentação: 3000 },
        receitasPorTipo: { Ativa: 5000 },
        totalReceitas: 5000,
        totalDespesas: 3000,
        saldo: 2000,
        saldoPositivo: true,
        percentualReceitas: 62.5,
        percentualDespesas: 37.5,
      };

      const indicadores = service.calcularIndicadores(resumoDetalhado);

      expect(indicadores).toEqual({
        saldo: 2000,
        saldoPositivo: true,
        percentualReceitas: 62.5,
        percentualDespesas: 37.5,
        razaoReceitaDespesa: 1.6666666666666667,
        margemLucro: 40,
      });
    });

    it('should handle zero values in indicators', () => {
      const resumoZero: ResumoDetalhado = {
        ...mockResumoFinanceiro,
        receitasPorCategoria: {},
        despesasPorCategoria: {},
        receitasPorTipo: {},
        totalReceitas: 0,
        totalDespesas: 0,
        saldo: 0,
        saldoPositivo: true,
        percentualReceitas: 0,
        percentualDespesas: 0,
      };

      const indicadores = service.calcularIndicadores(resumoZero);

      expect(indicadores).toEqual({
        saldo: 0,
        saldoPositivo: true,
        percentualReceitas: 0,
        percentualDespesas: 0,
        razaoReceitaDespesa: 0,
        margemLucro: 0,
      });
    });

    it('should handle negative saldo', () => {
      const resumoNegativo: ResumoDetalhado = {
        ...mockResumoFinanceiro,
        receitasPorCategoria: { Salário: 2000 },
        despesasPorCategoria: { Alimentação: 3000 },
        receitasPorTipo: { Ativa: 2000 },
        totalReceitas: 2000,
        totalDespesas: 3000,
        saldo: -1000,
        saldoPositivo: false,
        percentualReceitas: 40,
        percentualDespesas: 60,
      };

      const indicadores = service.calcularIndicadores(resumoNegativo);

      expect(indicadores.saldoPositivo).toBe(false);
      expect(indicadores.margemLucro).toBe(-50);
    });
  });

  describe('gerarRelatorioMensal', () => {
    it('should generate monthly report', () => {
      const mesId = 1;
      const resumoDetalhado: ResumoDetalhado = {
        ...mockResumoFinanceiro,
        receitasPorCategoria: { Salário: 5000 },
        despesasPorCategoria: { Alimentação: 3000 },
        receitasPorTipo: { Ativa: 5000 },
        totalReceitas: 5000,
        totalDespesas: 3000,
        saldo: 2000,
        saldoPositivo: true,
        percentualReceitas: 62.5,
        percentualDespesas: 37.5,
      };

      apiService.get.mockReturnValue(of(mockResumoFinanceiro));
      receitasService.getReceitas.mockReturnValue(of(mockReceitas));
      despesasService.getDespesas.mockReturnValue(of(mockDespesas));
      receitasService.agruparPorCategoria.mockReturnValue({ Salário: 5000 });
      despesasService.agruparPorCategoria.mockReturnValue({
        Alimentação: 3000,
      });
      receitasService.agruparPorTipo.mockReturnValue({ Ativa: 5000 });
      receitasService.calcularTotalReceitas.mockReturnValue(5000);
      despesasService.calcularTotalDespesas.mockReturnValue(3000);

      service.gerarRelatorioMensal(mesId).subscribe((result) => {
        expect(result.mes).toBe(mesId);
        expect(result.periodo).toBe('Janeiro');
        expect(result.resumo).toEqual(resumoDetalhado);
        expect(result.indicadores).toBeDefined();
        expect(result.timestamp).toBeDefined();
      });
    });

    it('should handle unknown month', () => {
      const mesId = 13;
      apiService.get.mockReturnValue(of(mockResumoFinanceiro));
      receitasService.getReceitas.mockReturnValue(of(mockReceitas));
      despesasService.getDespesas.mockReturnValue(of(mockDespesas));
      receitasService.agruparPorCategoria.mockReturnValue({});
      despesasService.agruparPorCategoria.mockReturnValue({});
      receitasService.agruparPorTipo.mockReturnValue({});
      receitasService.calcularTotalReceitas.mockReturnValue(0);
      despesasService.calcularTotalDespesas.mockReturnValue(0);

      service.gerarRelatorioMensal(mesId).subscribe((result) => {
        expect(result.periodo).toBe('Mês desconhecido');
      });
    });
  });

  describe('getNomeMes', () => {
    it('should return correct month names', () => {
      expect(service['getNomeMes'](1)).toBe('Janeiro');
      expect(service['getNomeMes'](6)).toBe('Junho');
      expect(service['getNomeMes'](12)).toBe('Dezembro');
    });

    it('should return unknown for invalid month', () => {
      expect(service['getNomeMes'](0)).toBe('Mês desconhecido');
      expect(service['getNomeMes'](13)).toBe('Mês desconhecido');
      expect(service['getNomeMes'](-1)).toBe('Mês desconhecido');
    });
  });
});
