import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  DespesasService,
  Despesa,
  CreateDespesaRequest,
  UpdateDespesaRequest,
  Categoria,
  Mes,
} from './despesas.service';
import { ApiService } from '../api/api.service';

describe('DespesasService', () => {
  let service: DespesasService;
  let apiService: any;

  const mockCategoria: Categoria = {
    id: 1,
    nome: 'Alimentação',
    tipo: 'despesa',
    descricao: 'Gastos com alimentação',
    ativo: true,
  };

  const mockMes: Mes = {
    id: 1,
    nome: 'Janeiro',
    numero: 1,
  };

  const mockDespesa: Despesa = {
    id: 1,
    mes_id: 1,
    categoriaId: 1,
    descricao: 'Supermercado',
    valor: 500,
    status: 'Pago',
    data: '2024-01-15',
    observacao: 'Compras do mês',
    categoria: mockCategoria,
    mes: mockMes,
  };

  const mockCreateRequest: CreateDespesaRequest = {
    mes_id: 1,
    categoriaId: 1,
    descricao: 'Farmácia',
    valor: 100,
    status: 'Programado',
    data: '2024-01-20',
    observacao: 'Medicamentos',
  };

  const mockUpdateRequest: UpdateDespesaRequest = {
    descricao: 'Farmácia Atualizada',
    valor: 150,
  };

  beforeEach(() => {
    const apiServiceSpy = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        DespesasService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(DespesasService);
    apiService = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDespesas', () => {
    it('should return observable of despesas array', () => {
      const mockDespesas = [mockDespesa];
      apiService.get.mockReturnValue(of(mockDespesas));

      service.getDespesas().subscribe((result) => {
        expect(result).toEqual(mockDespesas);
      });

      expect(apiService.get).toHaveBeenCalledWith('/despesas', undefined);
    });

    it('should return observable of despesas array with params', () => {
      const mockDespesas = [mockDespesa];
      const params = { mes_id: 1, categoriaId: 1 };
      apiService.get.mockReturnValue(of(mockDespesas));

      service.getDespesas(params).subscribe((result) => {
        expect(result).toEqual(mockDespesas);
      });

      expect(apiService.get).toHaveBeenCalledWith('/despesas', params);
    });

    it('should handle error when getting despesas', () => {
      const error = new Error('Failed to fetch despesas');
      apiService.get.mockReturnValue(throwError(() => error));

      service.getDespesas().subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.get).toHaveBeenCalledWith('/despesas', undefined);
    });
  });

  describe('getDespesa', () => {
    it('should return observable of single despesa', () => {
      apiService.get.mockReturnValue(of(mockDespesa));

      service.getDespesa(1).subscribe((result) => {
        expect(result).toEqual(mockDespesa);
      });

      expect(apiService.get).toHaveBeenCalledWith('/despesas/1');
    });

    it('should handle error when getting despesa by id', () => {
      const error = new Error('Despesa not found');
      apiService.get.mockReturnValue(throwError(() => error));

      service.getDespesa(999).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.get).toHaveBeenCalledWith('/despesas/999');
    });
  });

  describe('createDespesa', () => {
    it('should create new despesa successfully', () => {
      const createdDespesa = { ...mockDespesa, ...mockCreateRequest };
      apiService.post.mockReturnValue(of(createdDespesa));

      service.createDespesa(mockCreateRequest).subscribe((result) => {
        expect(result).toEqual(createdDespesa);
      });

      expect(apiService.post).toHaveBeenCalledWith(
        '/despesas',
        mockCreateRequest
      );
    });

    it('should handle error when creating despesa', () => {
      const error = new Error('Failed to create despesa');
      apiService.post.mockReturnValue(throwError(() => error));

      service.createDespesa(mockCreateRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.post).toHaveBeenCalledWith(
        '/despesas',
        mockCreateRequest
      );
    });

    it('should create despesa with minimal required fields', () => {
      const minimalRequest: CreateDespesaRequest = {
        mes_id: 1,
        categoriaId: 1,
        descricao: 'Minimal Despesa',
        valor: 50,
      };
      const createdDespesa = { ...mockDespesa, ...minimalRequest };
      apiService.post.mockReturnValue(of(createdDespesa));

      service.createDespesa(minimalRequest).subscribe((result) => {
        expect(result).toEqual(createdDespesa);
      });

      expect(apiService.post).toHaveBeenCalledWith('/despesas', minimalRequest);
    });
  });

  describe('updateDespesa', () => {
    it('should update despesa successfully', () => {
      const updatedDespesa = { ...mockDespesa, ...mockUpdateRequest };
      apiService.patch.mockReturnValue(of(updatedDespesa));

      service.updateDespesa(1, mockUpdateRequest).subscribe((result) => {
        expect(result).toEqual(updatedDespesa);
      });

      expect(apiService.patch).toHaveBeenCalledWith(
        '/despesas/1',
        mockUpdateRequest
      );
    });

    it('should handle error when updating despesa', () => {
      const error = new Error('Failed to update despesa');
      apiService.patch.mockReturnValue(throwError(() => error));

      service.updateDespesa(1, mockUpdateRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.patch).toHaveBeenCalledWith(
        '/despesas/1',
        mockUpdateRequest
      );
    });

    it('should update despesa with partial data', () => {
      const partialUpdate: UpdateDespesaRequest = {
        valor: 200,
      };
      const updatedDespesa = { ...mockDespesa, ...partialUpdate };
      apiService.patch.mockReturnValue(of(updatedDespesa));

      service.updateDespesa(1, partialUpdate).subscribe((result) => {
        expect(result).toEqual(updatedDespesa);
      });

      expect(apiService.patch).toHaveBeenCalledWith(
        '/despesas/1',
        partialUpdate
      );
    });
  });

  describe('deleteDespesa', () => {
    it('should delete despesa successfully', () => {
      apiService.delete.mockReturnValue(of(undefined));

      service.deleteDespesa(1).subscribe((result) => {
        expect(result).toBeUndefined();
      });

      expect(apiService.delete).toHaveBeenCalledWith('/despesas/1');
    });

    it('should handle error when deleting despesa', () => {
      const error = new Error('Failed to delete despesa');
      apiService.delete.mockReturnValue(throwError(() => error));

      service.deleteDespesa(1).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.delete).toHaveBeenCalledWith('/despesas/1');
    });
  });

  describe('getDespesasPorMes', () => {
    it('should return despesas for specific month', () => {
      const mockDespesas = [mockDespesa];
      apiService.get.mockReturnValue(of(mockDespesas));

      service.getDespesasPorMes(1).subscribe((result) => {
        expect(result).toEqual(mockDespesas);
      });

      expect(apiService.get).toHaveBeenCalledWith('/despesas', { mes_id: 1 });
    });
  });

  describe('getDespesasPorCategoria', () => {
    it('should return despesas for specific category', () => {
      const mockDespesas = [mockDespesa];
      apiService.get.mockReturnValue(of(mockDespesas));

      service.getDespesasPorCategoria(1).subscribe((result) => {
        expect(result).toEqual(mockDespesas);
      });

      expect(apiService.get).toHaveBeenCalledWith('/despesas', {
        categoriaId: 1,
      });
    });
  });

  describe('calcularTotalDespesas', () => {
    it('should calculate total correctly', () => {
      const despesas = [
        { ...mockDespesa, valor: 100 },
        { ...mockDespesa, id: 2, valor: 200 },
        { ...mockDespesa, id: 3, valor: 300 },
      ];

      const total = service.calcularTotalDespesas(despesas);
      expect(total).toBe(600);
    });

    it('should return 0 for empty array', () => {
      const total = service.calcularTotalDespesas([]);
      expect(total).toBe(0);
    });

    it('should handle single despesa', () => {
      const despesas = [{ ...mockDespesa, valor: 150 }];
      const total = service.calcularTotalDespesas(despesas);
      expect(total).toBe(150);
    });

    it('should handle despesas with zero values', () => {
      const despesas = [
        { ...mockDespesa, valor: 0 },
        { ...mockDespesa, id: 2, valor: 100 },
        { ...mockDespesa, id: 3, valor: 0 },
      ];

      const total = service.calcularTotalDespesas(despesas);
      expect(total).toBe(100);
    });
  });

  describe('agruparPorCategoria', () => {
    it('should group despesas by category correctly', () => {
      const despesas = [
        {
          ...mockDespesa,
          categoria: { ...mockCategoria, nome: 'Alimentação' },
          valor: 100,
        },
        {
          ...mockDespesa,
          id: 2,
          categoria: { ...mockCategoria, nome: 'Transporte' },
          valor: 200,
        },
        {
          ...mockDespesa,
          id: 3,
          categoria: { ...mockCategoria, nome: 'Alimentação' },
          valor: 150,
        },
      ];

      const grouped = service.agruparPorCategoria(despesas);
      expect(grouped).toEqual({
        Alimentação: 250,
        Transporte: 200,
      });
    });

    it('should return empty object for empty array', () => {
      const grouped = service.agruparPorCategoria([]);
      expect(grouped).toEqual({});
    });

    it('should handle single despesa', () => {
      const despesas = [
        {
          ...mockDespesa,
          categoria: { ...mockCategoria, nome: 'Alimentação' },
          valor: 100,
        },
      ];
      const grouped = service.agruparPorCategoria(despesas);
      expect(grouped).toEqual({ Alimentação: 100 });
    });

    it('should handle despesas with same category', () => {
      const despesas = [
        {
          ...mockDespesa,
          categoria: { ...mockCategoria, nome: 'Alimentação' },
          valor: 100,
        },
        {
          ...mockDespesa,
          id: 2,
          categoria: { ...mockCategoria, nome: 'Alimentação' },
          valor: 200,
        },
        {
          ...mockDespesa,
          id: 3,
          categoria: { ...mockCategoria, nome: 'Alimentação' },
          valor: 300,
        },
      ];

      const grouped = service.agruparPorCategoria(despesas);
      expect(grouped).toEqual({ Alimentação: 600 });
    });

    it('should handle despesas with zero values', () => {
      const despesas = [
        {
          ...mockDespesa,
          categoria: { ...mockCategoria, nome: 'Alimentação' },
          valor: 0,
        },
        {
          ...mockDespesa,
          id: 2,
          categoria: { ...mockCategoria, nome: 'Transporte' },
          valor: 100,
        },
      ];

      const grouped = service.agruparPorCategoria(despesas);
      expect(grouped).toEqual({
        Alimentação: 0,
        Transporte: 100,
      });
    });
  });
});
