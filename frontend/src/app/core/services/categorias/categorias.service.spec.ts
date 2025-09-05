import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  CategoriasService,
  Categoria,
  CreateCategoriaRequest,
} from './categorias.service';
import { ApiService } from '../api/api.service';

describe('CategoriasService', () => {
  let service: CategoriasService;
  let apiService: any;

  const mockCategoria: Categoria = {
    id: 1,
    nome: 'Alimentação',
    tipo: 'despesa',
    descricao: 'Gastos com alimentação',
    ativo: true,
  };

  const mockCreateRequest: CreateCategoriaRequest = {
    nome: 'Transporte',
    tipo: 'despesa',
    descricao: 'Gastos com transporte',
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
        CategoriasService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(CategoriasService);
    apiService = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCategorias', () => {
    it('should return observable of categorias array', () => {
      const mockCategorias = [mockCategoria];
      apiService.get.mockReturnValue(of(mockCategorias));

      service.getCategorias().subscribe((result) => {
        expect(result).toEqual(mockCategorias);
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias', undefined);
    });

    it('should return observable of categorias array with params', () => {
      const mockCategorias = [mockCategoria];
      const params = { tipo: 'despesa' };
      apiService.get.mockReturnValue(of(mockCategorias));

      service.getCategorias(params).subscribe((result) => {
        expect(result).toEqual(mockCategorias);
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias', params);
    });

    it('should handle error when getting categorias', () => {
      const error = new Error('Failed to fetch categorias');
      apiService.get.mockReturnValue(throwError(() => error));

      service.getCategorias().subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias', undefined);
    });
  });

  describe('getCategoria', () => {
    it('should return observable of single categoria', () => {
      apiService.get.mockReturnValue(of(mockCategoria));

      service.getCategoria(1).subscribe((result) => {
        expect(result).toEqual(mockCategoria);
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias/1');
    });

    it('should handle error when getting categoria by id', () => {
      const error = new Error('Categoria not found');
      apiService.get.mockReturnValue(throwError(() => error));

      service.getCategoria(999).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias/999');
    });
  });

  describe('createCategoria', () => {
    it('should create new categoria successfully', () => {
      const createdCategoria = { ...mockCategoria, ...mockCreateRequest };
      apiService.post.mockReturnValue(of(createdCategoria));

      service.createCategoria(mockCreateRequest).subscribe((result) => {
        expect(result).toEqual(createdCategoria);
      });

      expect(apiService.post).toHaveBeenCalledWith(
        '/categorias',
        mockCreateRequest
      );
    });

    it('should handle error when creating categoria', () => {
      const error = new Error('Failed to create categoria');
      apiService.post.mockReturnValue(throwError(() => error));

      service.createCategoria(mockCreateRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.post).toHaveBeenCalledWith(
        '/categorias',
        mockCreateRequest
      );
    });

    it('should create categoria with minimal required fields', () => {
      const minimalRequest: CreateCategoriaRequest = {
        nome: 'Minimal Categoria',
        tipo: 'receita',
      };
      const createdCategoria = { ...mockCategoria, ...minimalRequest };
      apiService.post.mockReturnValue(of(createdCategoria));

      service.createCategoria(minimalRequest).subscribe((result) => {
        expect(result).toEqual(createdCategoria);
      });

      expect(apiService.post).toHaveBeenCalledWith(
        '/categorias',
        minimalRequest
      );
    });
  });

  describe('getCategoriasPorTipo', () => {
    it('should return categorias for despesa type', () => {
      const mockCategorias = [mockCategoria];
      apiService.get.mockReturnValue(of(mockCategorias));

      service.getCategoriasPorTipo('despesa').subscribe((result) => {
        expect(result).toEqual(mockCategorias);
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias', {
        tipo: 'despesa',
      });
    });

    it('should return categorias for receita type', () => {
      const mockCategorias = [{ ...mockCategoria, tipo: 'receita' }];
      apiService.get.mockReturnValue(of(mockCategorias));

      service.getCategoriasPorTipo('receita').subscribe((result) => {
        expect(result).toEqual(mockCategorias);
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias', {
        tipo: 'receita',
      });
    });
  });

  describe('getCategoriasDespesas', () => {
    it('should return despesa categorias', () => {
      const mockCategorias = [mockCategoria];
      apiService.get.mockReturnValue(of(mockCategorias));

      service.getCategoriasDespesas().subscribe((result) => {
        expect(result).toEqual(mockCategorias);
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias', {
        tipo: 'despesa',
      });
    });
  });

  describe('getCategoriasReceitas', () => {
    it('should return receita categorias', () => {
      const mockCategorias = [{ ...mockCategoria, tipo: 'receita' }];
      apiService.get.mockReturnValue(of(mockCategorias));

      service.getCategoriasReceitas().subscribe((result) => {
        expect(result).toEqual(mockCategorias);
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias', {
        tipo: 'receita',
      });
    });
  });

  describe('categoriaExiste', () => {
    it('should return true when categoria exists', () => {
      const mockCategorias = [mockCategoria];
      apiService.get.mockReturnValue(of(mockCategorias));

      service.categoriaExiste('Alimentação', 'despesa').subscribe((result) => {
        expect(result).toBe(true);
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias', {
        tipo: 'despesa',
      });
    });

    it('should return false when categoria does not exist', () => {
      const mockCategorias = [mockCategoria];
      apiService.get.mockReturnValue(of(mockCategorias));

      service.categoriaExiste('Inexistente', 'despesa').subscribe((result) => {
        expect(result).toBe(false);
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias', {
        tipo: 'despesa',
      });
    });

    it('should be case insensitive', () => {
      const mockCategorias = [mockCategoria];
      apiService.get.mockReturnValue(of(mockCategorias));

      service.categoriaExiste('ALIMENTAÇÃO', 'despesa').subscribe((result) => {
        expect(result).toBe(true);
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias', {
        tipo: 'despesa',
      });
    });

    it('should handle error when checking categoria existence', () => {
      const error = new Error('Failed to fetch categorias');
      apiService.get.mockReturnValue(throwError(() => error));

      service.categoriaExiste('Alimentação', 'despesa').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias', {
        tipo: 'despesa',
      });
    });

    it('should return false for empty categorias array', () => {
      apiService.get.mockReturnValue(of([]));

      service.categoriaExiste('Alimentação', 'despesa').subscribe((result) => {
        expect(result).toBe(false);
      });

      expect(apiService.get).toHaveBeenCalledWith('/categorias', {
        tipo: 'despesa',
      });
    });
  });
});
