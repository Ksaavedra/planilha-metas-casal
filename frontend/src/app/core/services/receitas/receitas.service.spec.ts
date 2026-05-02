import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReceitasService } from './receitas.service';
import { Receita } from '@app/core/interfaces/receitas/receitas';
import { ApiService } from '../api/api.service';

describe('ReceitasService', () => {
  let service: ReceitasService;
  let apiService: jest.Mocked<
    Pick<ApiService, 'get' | 'post' | 'patch' | 'delete'>
  >;

  const mockReceitas: Receita = {
    id: 1,
    pessoa: 'Kelly',
    natureza: 'fixa',
    categoria: 'Fixa',
    valor: 2000,
    data: '2026-01-01',
    ano: 2026,
    mes: 1,
  };

  const mockCreate = {
    pessoa: 'Casal',
    natureza: 'fixa' as const,
    categoria: 'Salário',
    valor: 2000,
    data: null as string | null,
    ano: 2026,
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
        ReceitasService,
        { provide: ApiService, useValue: apiService },
      ],
    });
    service = TestBed.inject(ReceitasService);
  });

  describe('Inicialização', () => {
    it('deve instanciar', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('getReceitas', () => {
    it('chama API com ano e mês', () => {
      const rows = [mockReceitas];
      apiService.get.mockReturnValue(of(rows));
      service.getReceitas({ ano: 2026, mes: 1 }).subscribe((r) => {
        expect(r).toEqual(rows);
      });
      expect(apiService.get).toHaveBeenCalledWith('/receitas', {
        ano: 2026,
        mes: 1,
      });
    });

    it('propaga erro', () => {
      apiService.get.mockReturnValue(throwError(() => new Error('falha')));
      service.getReceitas({ ano: 2026, mes: 1 }).subscribe({
        error: (e) => {
          expect(e).toBeTruthy();
        },
      });
    });
  });

  describe('getReceita', () => {
    it('chama /receitas/:id', () => {
      apiService.get.mockReturnValue(of(mockReceitas));
      service.getReceita(1).subscribe((r) => {
        expect(r).toEqual(mockReceitas);
      });
      expect(apiService.get).toHaveBeenCalledWith('/receitas/1');
    });
  });

  describe('createReceita', () => {
    it('faz POST', () => {
      const created = { ...mockReceitas, id: 2, descricao: 'Novo' };
      apiService.post.mockReturnValue(of(created));
      service.createReceita(mockCreate).subscribe((r) => {
        expect(r).toEqual(created);
      });
      expect(apiService.post).toHaveBeenCalledWith('/receitas', mockCreate);
    });
  });

  describe('updateReceita', () => {
    it('faz PATCH', () => {
      const up = { valor: 100 };
      apiService.patch.mockReturnValue(of({ ...mockReceitas, ...up }));
      service.updateReceita(1, up).subscribe();
      expect(apiService.patch).toHaveBeenCalledWith('/receitas/1', up);
    });
  });

  describe('deleteReceita', () => {
    it('faz DELETE', () => {
      apiService.delete.mockReturnValue(of(void 0 as never));
      service.deleteReceita(1).subscribe();
      expect(apiService.delete).toHaveBeenCalledWith('/receitas/1');
    });
  });

  describe('calcularTotalReceitas', () => {
    it('soma valores', () => {
      const total = service.calcularTotalReceitas([
        mockReceitas,
        { ...mockReceitas, id: 2, valor: 200 },
      ]);
      expect(total).toBe(2200);
    });

    it('retorna 0 para array vazio', () => {
      expect(service.calcularTotalReceitas([])).toBe(0);
    });

    it('deve considerar valor null como 0', () => {
      const total = service.calcularTotalReceitas([
        { ...mockReceitas, valor: null as any },
      ]);
      expect(total).toBe(0);
    });

    it('deve considerar valor undefined como 0', () => {
      const total = service.calcularTotalReceitas([
        { ...mockReceitas, valor: undefined as any },
      ]);
      expect(total).toBe(0);
    });

    it('deve considerar valor inválido como 0', () => {
      const total = service.calcularTotalReceitas([
        { ...mockReceitas, valor: 'abc' as any },
      ]);
      expect(total).toBe(0);
    });

    it('deve somar ignorando valores inválidos', () => {
      const total = service.calcularTotalReceitas([
        mockReceitas,
        { ...mockReceitas, id: 2, valor: 'abc' as any },
        { ...mockReceitas, id: 3, valor: 100 },
      ]);
      expect(total).toBe(2100);
    });
  });
});
