import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  CreateMetaRequest,
  Meta,
  MetaExtended,
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

  // ========== Modal Adicionar Meta ==========
  describe('getState / open / close / reset', () => {
    it('getState retorna estado inicial com isOpen false', () => {
      expect(service.getState().isOpen).toBe(false);
      expect(service.getState().nome).toBe('');
    });

    it('open seta isOpen true no state$', () => {
      service.open();
      expect(service.getState().isOpen).toBe(true);
    });

    it('close seta isOpen false', () => {
      service.open();
      service.close();
      expect(service.getState().isOpen).toBe(false);
    });

    it('reset volta ao estado inicial', () => {
      service.open();
      service.updateNome('X');
      service.reset();
      expect(service.getState()).toEqual({
        isOpen: false,
        nome: '',
        valorMetaRaw: '',
        valorPorMesRaw: '',
        valorAtualRaw: '',
        temValorAtual: false,
        icon: 'bi-bullseye',
      });
    });
  });

  describe('updateNome / updateValorMetaRaw / updateValorPorMesRaw / updateValorAtualRaw / updateTemValorAtual / updateIcon', () => {
    it('updateNome atualiza nome no state', () => {
      service.updateNome('Minha Meta');
      expect(service.getState().nome).toBe('Minha Meta');
    });

    it('updateValorMetaRaw atualiza valorMetaRaw', () => {
      service.updateValorMetaRaw('5000');
      expect(service.getState().valorMetaRaw).toBe('5000');
    });

    it('updateValorPorMesRaw atualiza valorPorMesRaw', () => {
      service.updateValorPorMesRaw('500');
      expect(service.getState().valorPorMesRaw).toBe('500');
    });

    it('updateValorAtualRaw atualiza valorAtualRaw', () => {
      service.updateValorAtualRaw('1000');
      expect(service.getState().valorAtualRaw).toBe('1000');
    });

    it('updateTemValorAtual(true) mantém valorAtualRaw, updateTemValorAtual(false) limpa valorAtualRaw', () => {
      service.updateValorAtualRaw('2000');
      service.updateTemValorAtual(true);
      expect(service.getState().temValorAtual).toBe(true);
      expect(service.getState().valorAtualRaw).toBe('2000');
      service.updateTemValorAtual(false);
      expect(service.getState().temValorAtual).toBe(false);
      expect(service.getState().valorAtualRaw).toBe('');
    });

    it('updateIcon atualiza icon', () => {
      service.updateIcon('bi-star');
      expect(service.getState().icon).toBe('bi-star');
    });
  });

  describe('triggerSave', () => {
    it('emite no save$', (done) => {
      service.save$.subscribe(() => {
        expect(true).toBe(true);
        done();
      });
      service.triggerSave();
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

    it('closeSucesso fecha sucesso, close e reset do modal adicionar', () => {
      service.open();
      service.showSucesso('A', 'B');
      service.closeSucesso();
      expect(service.getSucessoState().isOpen).toBe(false);
      expect(service.getState().isOpen).toBe(false);
      expect(service.getState().nome).toBe('');
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

  // ========== Modal Editar Valor ==========
  describe('getEditarValorState / openEditarValor / closeEditarValor / updateValorEditarValor / triggerSaveEditarValor / resetEditarValor', () => {
    const metaExtended: MetaExtended = {
      id: 1,
      nome: 'Meta',
      valorMeta: 1000,
      valorPorMes: 100,
      mesesNecessarios: 10,
      valorAtual: 0,
      meses: [
        { id: 1, nome: 'Jan', valor: 100, status: 'Vazio' },
        { id: 2, nome: 'Fev', valor: 100, status: 'Vazio' },
      ],
    } as MetaExtended;

    it('getEditarValorState retorna estado inicial', () => {
      expect(service.getEditarValorState().isOpen).toBe(false);
      expect(service.getEditarValorState().mesId).toBe(-1);
    });

    it('openEditarValor com mesId existente abre modal com valor do mês', () => {
      service.openEditarValor(metaExtended, 1, ['Jan', 'Fev']);
      const state = service.getEditarValorState();
      expect(state.isOpen).toBe(true);
      expect(state.meta).toBe(metaExtended);
      expect(state.mesId).toBe(1);
      expect(state.valor).toBe(100);
      expect(state.meses).toEqual(['Jan', 'Fev']);
    });

    it('openEditarValor com mesId inexistente não altera state', () => {
      const antes = service.getEditarValorState();
      service.openEditarValor(metaExtended, 99, []);
      expect(service.getEditarValorState()).toEqual(antes);
    });

    it('closeEditarValor seta isOpen false', () => {
      service.openEditarValor(metaExtended, 1, []);
      service.closeEditarValor();
      expect(service.getEditarValorState().isOpen).toBe(false);
    });

    it('updateValorEditarValor atualiza valor no state', () => {
      service.openEditarValor(metaExtended, 1, []);
      service.updateValorEditarValor(250);
      expect(service.getEditarValorState().valor).toBe(250);
    });

    it('triggerSaveEditarValor emite no editarValorSave$ e fecha modal', (done) => {
      service.openEditarValor(metaExtended, 1, []);
      service.updateValorEditarValor(300);
      service.editarValorSave$.subscribe((payload) => {
        expect(payload).toEqual({ metaId: 1, mesId: 1, valor: 300 });
        done();
      });
      service.triggerSaveEditarValor();
      expect(service.getEditarValorState().isOpen).toBe(false);
    });

    it('triggerSaveEditarValor sem meta ou mesId -1 não emite mas fecha', () => {
      const spy = jest.fn();
      service.editarValorSave$.subscribe(spy);
      service.triggerSaveEditarValor();
      expect(spy).not.toHaveBeenCalled();
      expect(service.getEditarValorState().isOpen).toBe(false);
    });

    it('resetEditarValor volta ao estado inicial', () => {
      service.openEditarValor(metaExtended, 1, []);
      service.resetEditarValor();
      expect(service.getEditarValorState().isOpen).toBe(false);
      expect(service.getEditarValorState().meta).toBeNull();
      expect(service.getEditarValorState().mesId).toBe(-1);
    });
  });
});
