import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  CreateMetaRequest,
  Meta,
  UpdateMetaRequest,
} from '../../interfaces/metas';
import { ApiService } from '../api/api.service';
import { MetasService } from './metas.service';

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
    localStorage.removeItem('metas_ano_selecionado');

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

      expect(apiService.get).toHaveBeenCalledWith(
        `/metas?ano=${service.getAnoSelecionado()}`,
      );
    });

    it('should request metas for a specific year', () => {
      service.setAnoSelecionado(2024);
      apiService.get.mockReturnValue(of([]));

      service.getMetas(2024).subscribe();

      expect(apiService.get).toHaveBeenCalledWith('/metas?ano=2024');
    });

    it('should handle error when getting metas', () => {
      const error = new Error('Failed to fetch metas');
      apiService.get.mockReturnValue(throwError(() => error));

      service.getMetas().subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err).toBe(error),
      });

      expect(apiService.get).toHaveBeenCalledWith(
        `/metas?ano=${service.getAnoSelecionado()}`,
      );
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
        mockUpdateRequest,
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
        mockUpdateRequest,
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

  // ========== Sucesso ==========
  describe('getSucessoState / showSucesso / closeSucesso', () => {
    it('getSucessoState retorna estado inicial', () => {
      expect(service.getSucessoState().isOpen).toBe(false);
    });

    it('showSucesso seta isOpen, title e message', () => {
      service.showSucesso('Título', 'Mensagem');
      expect(service.getSucessoState()).toEqual({
        isOpen: true,
        title: 'Título',
        message: 'Mensagem',
      });
    });

    it('closeSucesso fecha o modal de sucesso', () => {
      service.showSucesso('A', 'B');
      service.closeSucesso();
      expect(service.getSucessoState().isOpen).toBe(false);
    });
  });

  // ========== Confirmar Delete ==========
  describe('getConfirmarDeleteState / openConfirmarDelete / closeConfirmarDelete / confirmDelete', () => {
    it('getConfirmarDeleteState retorna estado inicial', () => {
      expect(service.getConfirmarDeleteState().isOpen).toBe(false);
      expect(service.getConfirmarDeleteState().metaId).toBeNull();
    });

    it('openConfirmarDelete seta isOpen, message, metaId e metaNome', () => {
      service.openConfirmarDelete(10, 'Viagem');
      const state = service.getConfirmarDeleteState();
      expect(state.isOpen).toBe(true);
      expect(state.metaId).toBe(10);
      expect(state.metaNome).toBe('Viagem');
      expect(state.message).toContain('Viagem');
    });

    it('closeConfirmarDelete fecha e limpa metaId/metaNome', () => {
      service.openConfirmarDelete(5, 'Carro');
      service.closeConfirmarDelete();
      expect(service.getConfirmarDeleteState().isOpen).toBe(false);
      expect(service.getConfirmarDeleteState().metaId).toBeNull();
      expect(service.getConfirmarDeleteState().metaNome).toBe('');
    });

    it('confirmDelete emite metaId no confirmDelete$ e chama closeConfirmarDelete', (done) => {
      service.openConfirmarDelete(7, 'Casa');
      service.confirmDelete$.subscribe((id) => {
        expect(id).toBe(7);
        done();
      });
      service.confirmDelete();
      expect(service.getConfirmarDeleteState().isOpen).toBe(false);
    });

    it('confirmDelete com metaId null não emite e chama closeConfirmarDelete', () => {
      const spy = jest.fn();
      service.confirmDelete$.subscribe(spy);
      service.closeConfirmarDelete();
      service.confirmDelete();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ========== Sucesso Delete ==========
  describe('getSucessoDeleteState / showSucessoDelete / closeSucessoDelete', () => {
    it('getSucessoDeleteState retorna isOpen false inicial', () => {
      expect(service.getSucessoDeleteState().isOpen).toBe(false);
    });

    it('showSucessoDelete fecha confirmar e abre sucesso delete', () => {
      service.openConfirmarDelete(1, 'X');
      service.showSucessoDelete();
      expect(service.getConfirmarDeleteState().isOpen).toBe(false);
      expect(service.getSucessoDeleteState().isOpen).toBe(true);
    });

    it('closeSucessoDelete seta isOpen false', () => {
      service.showSucessoDelete();
      service.closeSucessoDelete();
      expect(service.getSucessoDeleteState().isOpen).toBe(false);
    });
  });

});
