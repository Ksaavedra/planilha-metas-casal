import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  ReceitasService,
  Receita,
  CreateReceitaRequest,
  UpdateReceitaRequest,
  Categoria,
  Mes,
} from './receitas.service';
import { ApiService } from '../api/api.service';

describe('ReceitasService', () => {
  let service: ReceitasService;
  let apiService: any;

  const mockCategoria: Categoria = {
    id: 1,
    nome: 'Salário',
    tipo: 'receita',
    descricao: 'Receita de salário',
    ativo: true,
  };

  const mockMes: Mes = {
    id: 1,
    nome: 'Janeiro',
    numero: 1,
  };

  const mockReceita: Receita = {
    id: 1,
    mes_id: 1,
    categoriaId: 1,
    descricao: 'Salário mensal',
    valor: 5000,
    status: 'Recebido',
    tipo: 'Ativa',
    data: '2024-01-05',
    observacao: 'Salário do mês',
    categoria: mockCategoria,
    mes: mockMes,
  };

  const mockCreateRequest: CreateReceitaRequest = {
    mes_id: 1,
    categoriaId: 1,
    descricao: 'Freelance',
    valor: 1000,
    status: 'Programado',
    tipo: 'Extra',
    data: '2024-01-15',
    observacao: 'Trabalho freelance',
  };

  const mockUpdateRequest: UpdateReceitaRequest = {
    descricao: 'Freelance Atualizado',
    valor: 1500,
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
        ReceitasService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(ReceitasService);
    apiService = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getReceitas', () => {
    it('should return observable of receitas array', () => {
      const mockReceitas = [mockReceita];
      apiService.get.mockReturnValue(of(mockReceitas));

      service.getReceitas().subscribe((result) => {
        expect(result).toEqual(mockReceitas);
      });

      expect(apiService.get).toHaveBeenCalledWith('/receitas', undefined);
    });

    it('should return observable of receitas array with params', () => {
      const mockReceitas = [mockReceita];
      const params = { mes_id: 1, categoriaId: 1, tipo: 'Ativa' };
      apiService.get.mockReturnValue(of(mockReceitas));

      service.getReceitas(params).subscribe((result) => {
        expect(result).toEqual(mockReceitas);
      });

      expect(apiService.get).toHaveBeenCalledWith('/receitas', params);
    });

    it('should handle error when getting receitas', () => {
      const error = new Error('Failed to fetch receitas');
      apiService.get.mockReturnValue(throwError(() => error));

      service.getReceitas().subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.get).toHaveBeenCalledWith('/receitas', undefined);
    });
  });

  describe('getReceita', () => {
    it('should return observable of single receita', () => {
      apiService.get.mockReturnValue(of(mockReceita));

      service.getReceita(1).subscribe((result) => {
        expect(result).toEqual(mockReceita);
      });

      expect(apiService.get).toHaveBeenCalledWith('/receitas/1');
    });

    it('should handle error when getting receita by id', () => {
      const error = new Error('Receita not found');
      apiService.get.mockReturnValue(throwError(() => error));

      service.getReceita(999).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.get).toHaveBeenCalledWith('/receitas/999');
    });
  });

  describe('createReceita', () => {
    it('should create new receita successfully', () => {
      const createdReceita = { ...mockReceita, ...mockCreateRequest };
      apiService.post.mockReturnValue(of(createdReceita));

      service.createReceita(mockCreateRequest).subscribe((result) => {
        expect(result).toEqual(createdReceita);
      });

      expect(apiService.post).toHaveBeenCalledWith(
        '/receitas',
        mockCreateRequest
      );
    });

    it('should handle error when creating receita', () => {
      const error = new Error('Failed to create receita');
      apiService.post.mockReturnValue(throwError(() => error));

      service.createReceita(mockCreateRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.post).toHaveBeenCalledWith(
        '/receitas',
        mockCreateRequest
      );
    });

    it('should create receita with minimal required fields', () => {
      const minimalRequest: CreateReceitaRequest = {
        mes_id: 1,
        categoriaId: 1,
        descricao: 'Minimal Receita',
        valor: 500,
      };
      const createdReceita = { ...mockReceita, ...minimalRequest };
      apiService.post.mockReturnValue(of(createdReceita));

      service.createReceita(minimalRequest).subscribe((result) => {
        expect(result).toEqual(createdReceita);
      });

      expect(apiService.post).toHaveBeenCalledWith('/receitas', minimalRequest);
    });
  });

  describe('updateReceita', () => {
    it('should update receita successfully', () => {
      const updatedReceita = { ...mockReceita, ...mockUpdateRequest };
      apiService.patch.mockReturnValue(of(updatedReceita));

      service.updateReceita(1, mockUpdateRequest).subscribe((result) => {
        expect(result).toEqual(updatedReceita);
      });

      expect(apiService.patch).toHaveBeenCalledWith(
        '/receitas/1',
        mockUpdateRequest
      );
    });

    it('should handle error when updating receita', () => {
      const error = new Error('Failed to update receita');
      apiService.patch.mockReturnValue(throwError(() => error));

      service.updateReceita(1, mockUpdateRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.patch).toHaveBeenCalledWith(
        '/receitas/1',
        mockUpdateRequest
      );
    });

    it('should update receita with partial data', () => {
      const partialUpdate: UpdateReceitaRequest = {
        valor: 2000,
      };
      const updatedReceita = { ...mockReceita, ...partialUpdate };
      apiService.patch.mockReturnValue(of(updatedReceita));

      service.updateReceita(1, partialUpdate).subscribe((result) => {
        expect(result).toEqual(updatedReceita);
      });

      expect(apiService.patch).toHaveBeenCalledWith(
        '/receitas/1',
        partialUpdate
      );
    });
  });

  describe('deleteReceita', () => {
    it('should delete receita successfully', () => {
      apiService.delete.mockReturnValue(of(undefined));

      service.deleteReceita(1).subscribe((result) => {
        expect(result).toBeUndefined();
      });

      expect(apiService.delete).toHaveBeenCalledWith('/receitas/1');
    });

    it('should handle error when deleting receita', () => {
      const error = new Error('Failed to delete receita');
      apiService.delete.mockReturnValue(throwError(() => error));

      service.deleteReceita(1).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.delete).toHaveBeenCalledWith('/receitas/1');
    });
  });

  describe('getReceitasPorMes', () => {
    it('should return receitas for specific month', () => {
      const mockReceitas = [mockReceita];
      apiService.get.mockReturnValue(of(mockReceitas));

      service.getReceitasPorMes(1).subscribe((result) => {
        expect(result).toEqual(mockReceitas);
      });

      expect(apiService.get).toHaveBeenCalledWith('/receitas', { mes_id: 1 });
    });
  });

  describe('getReceitasPorCategoria', () => {
    it('should return receitas for specific category', () => {
      const mockReceitas = [mockReceita];
      apiService.get.mockReturnValue(of(mockReceitas));

      service.getReceitasPorCategoria(1).subscribe((result) => {
        expect(result).toEqual(mockReceitas);
      });

      expect(apiService.get).toHaveBeenCalledWith('/receitas', {
        categoriaId: 1,
      });
    });
  });

  describe('getReceitasPorTipo', () => {
    it('should return receitas for Ativa type', () => {
      const mockReceitas = [mockReceita];
      apiService.get.mockReturnValue(of(mockReceitas));

      service.getReceitasPorTipo('Ativa').subscribe((result) => {
        expect(result).toEqual(mockReceitas);
      });

      expect(apiService.get).toHaveBeenCalledWith('/receitas', {
        tipo: 'Ativa',
      });
    });

    it('should return receitas for Passiva type', () => {
      const mockReceitas = [{ ...mockReceita, tipo: 'Passiva' as const }];
      apiService.get.mockReturnValue(of(mockReceitas));

      service.getReceitasPorTipo('Passiva').subscribe((result) => {
        expect(result).toEqual(mockReceitas);
      });

      expect(apiService.get).toHaveBeenCalledWith('/receitas', {
        tipo: 'Passiva',
      });
    });

    it('should return receitas for Extra type', () => {
      const mockReceitas = [{ ...mockReceita, tipo: 'Extra' as const }];
      apiService.get.mockReturnValue(of(mockReceitas));

      service.getReceitasPorTipo('Extra').subscribe((result) => {
        expect(result).toEqual(mockReceitas);
      });

      expect(apiService.get).toHaveBeenCalledWith('/receitas', {
        tipo: 'Extra',
      });
    });
  });

  describe('calcularTotalReceitas', () => {
    it('should calculate total correctly', () => {
      const receitas = [
        { ...mockReceita, valor: 1000 },
        { ...mockReceita, id: 2, valor: 2000 },
        { ...mockReceita, id: 3, valor: 3000 },
      ];

      const total = service.calcularTotalReceitas(receitas);
      expect(total).toBe(6000);
    });

    it('should return 0 for empty array', () => {
      const total = service.calcularTotalReceitas([]);
      expect(total).toBe(0);
    });

    it('should handle single receita', () => {
      const receitas = [{ ...mockReceita, valor: 1500 }];
      const total = service.calcularTotalReceitas(receitas);
      expect(total).toBe(1500);
    });

    it('should handle receitas with zero values', () => {
      const receitas = [
        { ...mockReceita, valor: 0 },
        { ...mockReceita, id: 2, valor: 1000 },
        { ...mockReceita, id: 3, valor: 0 },
      ];

      const total = service.calcularTotalReceitas(receitas);
      expect(total).toBe(1000);
    });
  });

  describe('agruparPorCategoria', () => {
    it('should group receitas by category correctly', () => {
      const receitas = [
        {
          ...mockReceita,
          categoria: { ...mockCategoria, nome: 'Salário' },
          valor: 1000,
        },
        {
          ...mockReceita,
          id: 2,
          categoria: { ...mockCategoria, nome: 'Freelance' },
          valor: 2000,
        },
        {
          ...mockReceita,
          id: 3,
          categoria: { ...mockCategoria, nome: 'Salário' },
          valor: 1500,
        },
      ];

      const grouped = service.agruparPorCategoria(receitas);
      expect(grouped).toEqual({
        Salário: 2500,
        Freelance: 2000,
      });
    });

    it('should return empty object for empty array', () => {
      const grouped = service.agruparPorCategoria([]);
      expect(grouped).toEqual({});
    });

    it('should handle single receita', () => {
      const receitas = [
        {
          ...mockReceita,
          categoria: { ...mockCategoria, nome: 'Salário' },
          valor: 1000,
        },
      ];
      const grouped = service.agruparPorCategoria(receitas);
      expect(grouped).toEqual({ Salário: 1000 });
    });

    it('should handle receitas with same category', () => {
      const receitas = [
        {
          ...mockReceita,
          categoria: { ...mockCategoria, nome: 'Salário' },
          valor: 1000,
        },
        {
          ...mockReceita,
          id: 2,
          categoria: { ...mockCategoria, nome: 'Salário' },
          valor: 2000,
        },
        {
          ...mockReceita,
          id: 3,
          categoria: { ...mockCategoria, nome: 'Salário' },
          valor: 3000,
        },
      ];

      const grouped = service.agruparPorCategoria(receitas);
      expect(grouped).toEqual({ Salário: 6000 });
    });
  });

  describe('agruparPorTipo', () => {
    it('should group receitas by type correctly', () => {
      const receitas = [
        { ...mockReceita, tipo: 'Ativa' as const, valor: 1000 },
        { ...mockReceita, id: 2, tipo: 'Passiva' as const, valor: 2000 },
        { ...mockReceita, id: 3, tipo: 'Ativa' as const, valor: 1500 },
      ];

      const grouped = service.agruparPorTipo(receitas);
      expect(grouped).toEqual({
        Ativa: 2500,
        Passiva: 2000,
      });
    });

    it('should return empty object for empty array', () => {
      const grouped = service.agruparPorTipo([]);
      expect(grouped).toEqual({});
    });

    it('should handle single receita', () => {
      const receitas = [
        { ...mockReceita, tipo: 'Ativa' as const, valor: 1000 },
      ];
      const grouped = service.agruparPorTipo(receitas);
      expect(grouped).toEqual({ Ativa: 1000 });
    });

    it('should handle receitas with same type', () => {
      const receitas = [
        { ...mockReceita, tipo: 'Ativa' as const, valor: 1000 },
        { ...mockReceita, id: 2, tipo: 'Ativa' as const, valor: 2000 },
        { ...mockReceita, id: 3, tipo: 'Ativa' as const, valor: 3000 },
      ];

      const grouped = service.agruparPorTipo(receitas);
      expect(grouped).toEqual({ Ativa: 6000 });
    });

    it('should handle all three types', () => {
      const receitas = [
        { ...mockReceita, tipo: 'Ativa' as const, valor: 1000 },
        { ...mockReceita, id: 2, tipo: 'Passiva' as const, valor: 2000 },
        { ...mockReceita, id: 3, tipo: 'Extra' as const, valor: 500 },
      ];

      const grouped = service.agruparPorTipo(receitas);
      expect(grouped).toEqual({
        Ativa: 1000,
        Passiva: 2000,
        Extra: 500,
      });
    });
  });
});
