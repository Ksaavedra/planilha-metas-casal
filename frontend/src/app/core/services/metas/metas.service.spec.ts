import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  MetasService,
  CreateMetaRequest,
  UpdateMetaRequest,
} from './metas.service';
import { ApiService } from '../api/api.service';
import { Meta } from '../../interfaces/mes-meta';

describe('MetasService', () => {
  let service: MetasService;
  let apiService: any;

  const mockMeta: Meta = {
    id: 1,
    nome: 'Meta Teste',
    valorMeta: 10000,
    valorAtual: 5000,
    valorPorMes: 1000,
    mesesNecessarios: 10,
    meses: [
      { id: 1, nome: 'Janeiro', valor: 1000, status: 'Pago' },
      { id: 2, nome: 'Fevereiro', valor: 1000, status: 'Pago' },
    ],
  };

  const mockCreateRequest: CreateMetaRequest = {
    nome: 'Nova Meta',
    valorMeta: 5000,
    valorPorMes: 500,
    mesesNecessarios: 10,
    valorAtual: 0,
    meses: [
      { id: 1, nome: 'Janeiro', valor: 500, status: 'Vazio' },
      { id: 2, nome: 'Fevereiro', valor: 500, status: 'Vazio' },
    ],
  };

  const mockUpdateRequest: UpdateMetaRequest = {
    nome: 'Meta Atualizada',
    valorMeta: 8000,
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
        MetasService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(MetasService);
    apiService = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMetas', () => {
    it('should return observable of metas array', () => {
      const mockMetas = [mockMeta];
      apiService.get.mockReturnValue(of(mockMetas));

      service.getMetas().subscribe((result) => {
        expect(result).toEqual(mockMetas);
      });

      expect(apiService.get).toHaveBeenCalledWith('/metas');
    });

    it('should handle error when getting metas', () => {
      const error = new Error('Failed to fetch metas');
      apiService.get.mockReturnValue(throwError(() => error));

      service.getMetas().subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.get).toHaveBeenCalledWith('/metas');
    });
  });

  describe('getMeta', () => {
    it('should return observable of single meta', () => {
      apiService.get.mockReturnValue(of(mockMeta));

      service.getMeta(1).subscribe((result) => {
        expect(result).toEqual(mockMeta);
      });

      expect(apiService.get).toHaveBeenCalledWith('/metas/1');
    });

    it('should handle error when getting meta by id', () => {
      const error = new Error('Meta not found');
      apiService.get.mockReturnValue(throwError(() => error));

      service.getMeta(999).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.get).toHaveBeenCalledWith('/metas/999');
    });
  });

  describe('createMeta', () => {
    it('should create new meta successfully', () => {
      const createdMeta = { ...mockMeta, ...mockCreateRequest, meses: [] };
      apiService.post.mockReturnValue(of(createdMeta));

      service.createMeta(mockCreateRequest).subscribe((result) => {
        expect(result).toEqual(createdMeta);
      });

      expect(apiService.post).toHaveBeenCalledWith('/metas', mockCreateRequest);
    });

    it('should handle error when creating meta', () => {
      const error = new Error('Failed to create meta');
      apiService.post.mockReturnValue(throwError(() => error));

      service.createMeta(mockCreateRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.post).toHaveBeenCalledWith('/metas', mockCreateRequest);
    });

    it('should create meta with minimal required fields', () => {
      const minimalRequest: CreateMetaRequest = {
        nome: 'Minimal Meta',
        valorMeta: 1000,
        valorPorMes: 100,
        meses: [],
      };
      const createdMeta = { ...mockMeta, ...minimalRequest, meses: [] };
      apiService.post.mockReturnValue(of(createdMeta));

      service.createMeta(minimalRequest).subscribe((result) => {
        expect(result).toEqual(createdMeta);
      });

      expect(apiService.post).toHaveBeenCalledWith('/metas', minimalRequest);
    });
  });

  describe('updateMeta', () => {
    it('should update meta successfully', () => {
      const updatedMeta = { ...mockMeta, ...mockUpdateRequest, meses: [] };
      apiService.patch.mockReturnValue(of(updatedMeta));

      service.updateMeta(1, mockUpdateRequest).subscribe((result) => {
        expect(result).toEqual(updatedMeta);
      });

      expect(apiService.patch).toHaveBeenCalledWith(
        '/metas/1',
        mockUpdateRequest
      );
    });

    it('should handle error when updating meta', () => {
      const error = new Error('Failed to update meta');
      apiService.patch.mockReturnValue(throwError(() => error));

      service.updateMeta(1, mockUpdateRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.patch).toHaveBeenCalledWith(
        '/metas/1',
        mockUpdateRequest
      );
    });

    it('should update meta with partial data', () => {
      const partialUpdate: UpdateMetaRequest = {
        valorAtual: 3000,
      };
      const updatedMeta = { ...mockMeta, ...partialUpdate, meses: [] };
      apiService.patch.mockReturnValue(of(updatedMeta));

      service.updateMeta(1, partialUpdate).subscribe((result) => {
        expect(result).toEqual(updatedMeta);
      });

      expect(apiService.patch).toHaveBeenCalledWith('/metas/1', partialUpdate);
    });
  });

  describe('deleteMeta', () => {
    it('should delete meta successfully', () => {
      apiService.delete.mockReturnValue(of(undefined));

      service.deleteMeta(1).subscribe((result) => {
        expect(result).toBeUndefined();
      });

      expect(apiService.delete).toHaveBeenCalledWith('/metas/1');
    });

    it('should handle error when deleting meta', () => {
      const error = new Error('Failed to delete meta');
      apiService.delete.mockReturnValue(throwError(() => error));

      service.deleteMeta(1).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.delete).toHaveBeenCalledWith('/metas/1');
    });
  });

  describe('calcularProgresso', () => {
    it('should calculate progress correctly', () => {
      const meta: Meta = {
        id: 1,
        nome: 'Test Meta',
        valorMeta: 1000,
        valorAtual: 500,
        valorPorMes: 100,
        mesesNecessarios: 10,
        meses: [],
      };

      const progress = service.calcularProgresso(meta);
      expect(progress).toBe(50);
    });

    it('should return 0 when valorMeta is 0 or negative', () => {
      const meta: Meta = {
        id: 1,
        nome: 'Test Meta',
        valorMeta: 0,
        valorAtual: 500,
        valorPorMes: 100,
        mesesNecessarios: 10,
        meses: [],
      };

      const progress = service.calcularProgresso(meta);
      expect(progress).toBe(0);
    });

    it('should return 0 when valorMeta is negative', () => {
      const meta: Meta = {
        id: 1,
        nome: 'Test Meta',
        valorMeta: -100,
        valorAtual: 500,
        valorPorMes: 100,
        mesesNecessarios: 10,
        meses: [],
      };

      const progress = service.calcularProgresso(meta);
      expect(progress).toBe(0);
    });

    it('should cap progress at 100%', () => {
      const meta: Meta = {
        id: 1,
        nome: 'Test Meta',
        valorMeta: 1000,
        valorAtual: 1500, // More than target
        valorPorMes: 100,
        mesesNecessarios: 10,
        meses: [],
      };

      const progress = service.calcularProgresso(meta);
      expect(progress).toBe(100);
    });

    it('should handle exact completion', () => {
      const meta: Meta = {
        id: 1,
        nome: 'Test Meta',
        valorMeta: 1000,
        valorAtual: 1000,
        valorPorMes: 100,
        mesesNecessarios: 10,
        meses: [],
      };

      const progress = service.calcularProgresso(meta);
      expect(progress).toBe(100);
    });
  });

  describe('calcularMesesRestantes', () => {
    it('should calculate remaining months correctly', () => {
      const meta: Meta = {
        id: 1,
        nome: 'Test Meta',
        valorMeta: 1000,
        valorAtual: 300,
        valorPorMes: 100,
        mesesNecessarios: 10,
        meses: [],
      };

      const remaining = service.calcularMesesRestantes(meta);
      expect(remaining).toBe(7); // (1000 - 300) / 100 = 7
    });

    it('should return 0 when valorPorMes is 0 or negative', () => {
      const meta: Meta = {
        id: 1,
        nome: 'Test Meta',
        valorMeta: 1000,
        valorAtual: 300,
        valorPorMes: 0,
        mesesNecessarios: 10,
        meses: [],
      };

      const remaining = service.calcularMesesRestantes(meta);
      expect(remaining).toBe(0);
    });

    it('should return 0 when valorPorMes is negative', () => {
      const meta: Meta = {
        id: 1,
        nome: 'Test Meta',
        valorMeta: 1000,
        valorAtual: 300,
        valorPorMes: -50,
        mesesNecessarios: 10,
        meses: [],
      };

      const remaining = service.calcularMesesRestantes(meta);
      expect(remaining).toBe(0);
    });

    it('should return 0 when meta is already completed', () => {
      const meta: Meta = {
        id: 1,
        nome: 'Test Meta',
        valorMeta: 1000,
        valorAtual: 1000,
        valorPorMes: 100,
        mesesNecessarios: 10,
        meses: [],
      };

      const remaining = service.calcularMesesRestantes(meta);
      expect(remaining).toBe(0);
    });

    it('should handle meta with more value than target', () => {
      const meta: Meta = {
        id: 1,
        nome: 'Test Meta',
        valorMeta: 1000,
        valorAtual: 1500,
        valorPorMes: 100,
        mesesNecessarios: 10,
        meses: [],
      };

      const remaining = service.calcularMesesRestantes(meta);
      expect(remaining).toBe(-5); // (1000 - 1500) / 100 = -5
    });

    it('should round up fractional months', () => {
      const meta: Meta = {
        id: 1,
        nome: 'Test Meta',
        valorMeta: 1000,
        valorAtual: 250,
        valorPorMes: 100,
        mesesNecessarios: 10,
        meses: [],
      };

      const remaining = service.calcularMesesRestantes(meta);
      expect(remaining).toBe(8); // (1000 - 250) / 100 = 7.5, rounded up to 8
    });
  });
});
