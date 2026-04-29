import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Despesa, DespesasService } from './despesas.service';
import { ApiService } from '../api/api.service';

describe('DespesasService', () => {
  let service: DespesasService;
  let apiService: jest.Mocked<
    Pick<ApiService, 'get' | 'post' | 'patch' | 'delete'>
  >;

  const mockDespesa: Despesa = {
    id: 1,
    pessoa: 'Kelly',
    natureza: 'fixa',
    categoria: 'Casa',
    descricao: 'Aluguel',
    valor: 1500,
    data: '2025-01-10',
    ano: 2025,
    mes: 1,
  };

  const mockCreate = {
    pessoa: 'Casal',
    natureza: 'fixa' as const,
    categoria: 'Casa',
    descricao: 'Condomínio',
    valor: 400,
    data: null as string | null,
    ano: 2025,
    mes: 1,
  };

  beforeEach(() => {
    apiService = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        DespesasService,
        { provide: ApiService, useValue: apiService },
      ],
    });
    service = TestBed.inject(DespesasService);
  });

  it('deve instanciar', () => {
    expect(service).toBeTruthy();
  });

  describe('getDespesas', () => {
    it('chama API com ano e mês', () => {
      const rows = [mockDespesa];
      apiService.get.mockReturnValue(of(rows));
      service.getDespesas({ ano: 2025, mes: 3 }).subscribe((r) => {
        expect(r).toEqual(rows);
      });
      expect(apiService.get).toHaveBeenCalledWith('/despesas', {
        ano: 2025,
        mes: 3,
      });
    });

    it('propaga erro', () => {
      apiService.get.mockReturnValue(throwError(() => new Error('falha')));
      service.getDespesas({ ano: 2025, mes: 1 }).subscribe({
        error: (e) => {
          expect(e).toBeTruthy();
        },
      });
    });
  });

  describe('getDespesa', () => {
    it('chama /despesas/:id', () => {
      apiService.get.mockReturnValue(of(mockDespesa));
      service.getDespesa(1).subscribe((r) => expect(r).toEqual(mockDespesa));
      expect(apiService.get).toHaveBeenCalledWith('/despesas/1');
    });
  });

  describe('createDespesa', () => {
    it('faz POST', () => {
      const created = { ...mockDespesa, id: 2, descricao: 'Novo' };
      apiService.post.mockReturnValue(of(created));
      service
        .createDespesa(mockCreate)
        .subscribe((r) => expect(r).toEqual(created));
      expect(apiService.post).toHaveBeenCalledWith('/despesas', mockCreate);
    });
  });

  describe('updateDespesa', () => {
    it('faz PATCH', () => {
      const up = { valor: 100 };
      apiService.patch.mockReturnValue(of({ ...mockDespesa, ...up }));
      service.updateDespesa(1, up).subscribe();
      expect(apiService.patch).toHaveBeenCalledWith('/despesas/1', up);
    });
  });

  describe('deleteDespesa', () => {
    it('faz DELETE', () => {
      apiService.delete.mockReturnValue(of(void 0 as never));
      service.deleteDespesa(1).subscribe();
      expect(apiService.delete).toHaveBeenCalledWith('/despesas/1');
    });
  });

  describe('calcularTotalDespesas', () => {
    it('soma valores', () => {
      const total = service.calcularTotalDespesas([
        mockDespesa,
        { ...mockDespesa, id: 2, valor: 200 },
      ]);
      expect(total).toBe(1700);
    });

    it('retorna 0 para array vazio', () => {
      expect(service.calcularTotalDespesas([])).toBe(0);
    });

    it('deve considerar valor null como 0', () => {
      const total = service.calcularTotalDespesas([
        { ...mockDespesa, valor: null as any },
      ]);

      expect(total).toBe(0);
    });

    it('deve considerar valor undefined como 0', () => {
      const total = service.calcularTotalDespesas([
        { ...mockDespesa, valor: undefined as any },
      ]);

      expect(total).toBe(0);
    });

    it('deve considerar valor inválido como 0', () => {
      const total = service.calcularTotalDespesas([
        { ...mockDespesa, valor: 'abc' as any },
      ]);

      expect(total).toBe(0);
    });

    it('deve somar ignorando valores inválidos', () => {
      const total = service.calcularTotalDespesas([
        mockDespesa,
        { ...mockDespesa, id: 2, valor: 'abc' as any },
        { ...mockDespesa, id: 3, valor: 100 },
      ]);

      expect(total).toBe(100);
    });
  });
});
