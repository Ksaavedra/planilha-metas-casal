import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  CategoriaReceita,
  ReceitaMensal,
  TipoReceita,
} from '../../interfaces/receitas/receitas';
import { ApiService } from '../api/api.service';
import { ReceitasService } from './receitas.service';

describe('ReceitasService', () => {
  let service: ReceitasService;
  let api: jest.Mocked<Pick<ApiService, 'get' | 'post' | 'patch' | 'delete'>>;

  const mockReceitas: ReceitaMensal[] = [
    {
      id: 1,
      pessoa: 'Kelly',
      tipo: 'Salário',
      categoria: 'Fixa',
      valor: 2000,
      ano: 2026,
      mes: 1,
    },
  ];

  beforeEach(() => {
    api = {
      get: jest.fn().mockReturnValue(of([])),
      post: jest.fn().mockReturnValue(of({})),
      patch: jest.fn().mockReturnValue(of({})),
      delete: jest.fn().mockReturnValue(of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [ReceitasService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(ReceitasService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  // ========== API e cache ==========
  describe('getPorMesAno', () => {
    it('deve chamar api.get com /receitas e params ano, mes', () => {
      (api.get as jest.Mock).mockReturnValue(of(mockReceitas));
      service.getPorMesAno(2026, 1).subscribe();
      expect(api.get).toHaveBeenCalledWith('/receitas', { ano: 2026, mes: 1 });
    });

    it('deve retornar o array de receitas', (done) => {
      (api.get as jest.Mock).mockReturnValue(of(mockReceitas));
      service.getPorMesAno(2026, 1).subscribe((lista) => {
        expect(lista).toEqual(mockReceitas);
        done();
      });
    });
  });

  describe('getPessoasCache', () => {
    it('deve retornar array vazio inicialmente', () => {
      expect(service.getPessoasCache()).toEqual([]);
    });

    it('deve retornar pessoas após addPessoaToCache ou loadPessoasDistintas', () => {
      service.addPessoaToCache('Maria');
      expect(service.getPessoasCache()).toContain('Maria');
    });
  });

  describe('addPessoaToCache', () => {
    it('deve adicionar nome ao cache e normalizar (ordenar)', () => {
      service.addPessoaToCache('Kelly');
      service.addPessoaToCache('Ana');
      expect(service.getPessoasCache()).toEqual(['Ana', 'Kelly']);
    });

    it('não deve adicionar se nome vazio ou só espaços', () => {
      service.addPessoaToCache('  ');
      service.addPessoaToCache('');
      expect(service.getPessoasCache()).toEqual([]);
    });

    it('não deve duplicar por case insensitive', () => {
      service.addPessoaToCache('Maria');
      service.addPessoaToCache('maria');
      expect(service.getPessoasCache()).toEqual(['Maria']);
    });
  });

  describe('loadPessoasDistintas', () => {
    it('deve chamar api.get /receitas/pessoas e atualizar cache', (done) => {
      (api.get as jest.Mock).mockReturnValue(of(['Ana', 'Kelly']));
      service.loadPessoasDistintas().subscribe((pessoas) => {
        expect(pessoas).toEqual(['Ana', 'Kelly']);
        expect(service.getPessoasCache()).toEqual(['Ana', 'Kelly']);
        done();
      });
    });

    it('em erro deve retornar [] e não quebrar', (done) => {
      (api.get as jest.Mock).mockReturnValue(
        throwError(() => new Error('API')),
      );
      service.loadPessoasDistintas().subscribe((pessoas) => {
        expect(pessoas).toEqual([]);
        done();
      });
    });
  });

  describe('refreshPessoas', () => {
    it('deve chamar loadPessoasDistintas (api.get /receitas/pessoas)', () => {
      (api.get as jest.Mock).mockReturnValue(of([]));
      service.refreshPessoas();
      expect(api.get).toHaveBeenCalledWith('/receitas/pessoas');
    });
  });

  describe('create', () => {
    it('deve chamar api.post com /receitas e body', () => {
      const body = {
        pessoa: 'X',
        tipo: 'Salário' as TipoReceita,
        categoria: 'Fixa' as CategoriaReceita,
        valor: 1000,
        ano: 2026,
        mes: 1,
      };
      (api.post as jest.Mock).mockReturnValue(of({ ...body, id: 1 }));
      service.create(body).subscribe();
      expect(api.post).toHaveBeenCalledWith('/receitas', body);
    });
  });

  describe('update', () => {
    it('deve chamar api.patch com /receitas/:id e body', () => {
      const body = { valor: 2500 };
      (api.patch as jest.Mock).mockReturnValue(of({ id: 1, ...body }));
      service.update(1, body).subscribe();
      expect(api.patch).toHaveBeenCalledWith('/receitas/1', body);
    });
  });

  describe('delete', () => {
    it('deve chamar api.delete com /receitas/:id', () => {
      service.delete(5).subscribe();
      expect(api.delete).toHaveBeenCalledWith('/receitas/5');
    });
  });

  describe('createReceitasParaUsuario', () => {
    it('deve fazer post para cada mês e retornar forkJoin', (done) => {
      const created1 = {
        id: 1,
        pessoa: 'Maria',
        tipo: 'Salário',
        categoria: 'Fixa',
        valor: 1500,
        ano: 2026,
        mes: 1,
      };
      const created2 = {
        id: 2,
        pessoa: 'Maria',
        tipo: 'Salário',
        categoria: 'Fixa',
        valor: 1500,
        ano: 2026,
        mes: 2,
      };
      (api.post as jest.Mock)
        .mockReturnValueOnce(of(created1))
        .mockReturnValueOnce(of(created2));
      service
        .createReceitasParaUsuario(
          'Maria',
          1500,
          'Salário',
          'Fixa',
          [1, 2],
          2026,
        )
        .subscribe((result) => {
          expect(api.post).toHaveBeenCalledTimes(2);
          expect(api.post).toHaveBeenNthCalledWith(1, '/receitas', {
            pessoa: 'Maria',
            tipo: 'Salário',
            categoria: 'Fixa',
            valor: 1500,
            ano: 2026,
            mes: 1,
          });
          expect(result).toEqual([created1, created2]);
          done();
        });
    });

    it('com meses vazios não chama api.post', () => {
      service
        .createReceitasParaUsuario('X', 100, 'Salário', 'Fixa', [], 2026)
        .subscribe();
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  // ========== Modal Adicionar/Editar ==========
  describe('getState / open / close / reset', () => {
    it('getState retorna estado inicial', () => {
      expect(service.getState().isOpen).toBe(false);
      expect(service.getState().nomeUsuario).toBe('');
      expect(service.getState().tipo).toBe('Salário');
      expect(service.getState().categoria).toBe('Fixa');
    });

    it('open seta isOpen true e isEditMode false', () => {
      service.open();
      expect(service.getState().isOpen).toBe(true);
      expect(service.getState().isEditMode).toBe(false);
    });

    it('close seta isOpen false', () => {
      service.open();
      service.close();
      expect(service.getState().isOpen).toBe(false);
    });

    it('reset volta ao estado inicial', () => {
      service.open();
      service.updateNomeUsuario('X');
      service.reset();
      expect(service.getState().nomeUsuario).toBe('');
      expect(service.getState().isOpen).toBe(false);
    });
  });

  describe('openForEdit', () => {
    it('com id null não altera state', () => {
      const antes = service.getState();
      service.openForEdit({
        id: undefined,
        pessoa: 'Kelly',
        valor: 1000,
      });
      expect(service.getState()).toEqual(antes);
    });

    it('com id válido abre em modo edição com dados normalizados', () => {
      service.openForEdit({
        id: 7,
        pessoa: 'Kelly',
        valor: 1500.5,
        tipo: 'Freela',
        categoria: 'Variável',
        ano: 2026,
        mes: 3,
      });
      const state = service.getState();
      expect(state.isOpen).toBe(true);
      expect(state.isEditMode).toBe(true);
      expect(state.receitaId).toBe(7);
      expect(state.nomeUsuario).toBe('Kelly');
      expect(state.valorSalarioRaw).toBe('1500,50');
      expect(state.tipo).toBe('Freela');
      expect(state.categoria).toBe('Variável');
      expect(state.mesesSelecionados).toEqual([3]);
      expect(state.ano).toBe(2026);
    });

    it('normaliza tipo inválido para Salário', () => {
      service.openForEdit({
        id: 1,
        pessoa: 'X',
        valor: 100,
        tipo: 'TipoInvalido' as TipoReceita,
      });
      expect(service.getState().tipo).toBe('Salário');
    });

    it('normaliza categoria variavel/Variável para Variável', () => {
      service.openForEdit({
        id: 1,
        pessoa: 'X',
        valor: 100,
        categoria: 'variavel' as CategoriaReceita,
      });
      expect(service.getState().categoria).toBe('Variável');
    });
  });

  describe('updateNomeUsuario / updateValorSalarioRaw / updateTipo / updateCategoria / updateAno', () => {
    it('updateNomeUsuario atualiza nome', () => {
      service.open();
      service.updateNomeUsuario('Maria');
      expect(service.getState().nomeUsuario).toBe('Maria');
    });

    it('updateNomeUsuario com mesmo valor não altera', () => {
      service.open();
      service.updateNomeUsuario('Maria');
      service.updateNomeUsuario('Maria');
      expect(service.getState().nomeUsuario).toBe('Maria');
    });

    it('updateValorSalarioRaw atualiza valorRaw', () => {
      service.open();
      service.updateValorSalarioRaw('2000,00');
      expect(service.getState().valorSalarioRaw).toBe('2000,00');
    });

    it('updateTipo e updateCategoria atualizam', () => {
      service.open();
      service.updateTipo('Freela');
      service.updateCategoria('Variável');
      expect(service.getState().tipo).toBe('Freela');
      expect(service.getState().categoria).toBe('Variável');
    });

    it('updateAno atualiza ano', () => {
      service.open();
      service.updateAno(2025);
      expect(service.getState().ano).toBe(2025);
    });
  });

  describe('toggleMes / selecionarTodosMeses / desmarcarTodosMeses', () => {
    it('toggleMes adiciona e remove mês', () => {
      service.open();
      service.toggleMes(3);
      expect(service.getState().mesesSelecionados).toEqual([3]);
      service.toggleMes(1);
      expect(service.getState().mesesSelecionados).toEqual([1, 3]);
      service.toggleMes(3);
      expect(service.getState().mesesSelecionados).toEqual([1]);
    });

    it('selecionarTodosMeses seta 1-12', () => {
      service.open();
      service.selecionarTodosMeses();
      expect(service.getState().mesesSelecionados).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
      ]);
    });

    it('desmarcarTodosMeses limpa meses', () => {
      service.open();
      service.selecionarTodosMeses();
      service.desmarcarTodosMeses();
      expect(service.getState().mesesSelecionados).toEqual([]);
    });
  });

  describe('triggerSave', () => {
    it('emite no save$ com payload', (done) => {
      service.save$.subscribe((data) => {
        expect(data).toEqual({
          nomeUsuario: 'Maria',
          valorSalario: 1500,
          tipo: 'Salário',
          categoria: 'Fixa',
          meses: [1, 2],
          ano: 2026,
          receitaId: undefined,
        });
        done();
      });
      service.triggerSave('Maria', 1500, 'Salário', 'Fixa', [1, 2], 2026);
    });

    it('emite com receitaId quando passado', (done) => {
      service.save$.subscribe((data) => {
        expect(data.receitaId).toBe(7);
        done();
      });
      service.triggerSave('K', 100, 'Salário', 'Fixa', [1], 2026, 7);
    });
  });

  // ========== Modal Excluir ==========
  describe('openConfirm', () => {
    it('com id null não abre (state permanece fechado)', () => {
      let lastState: { isOpen: boolean; receitaId: number | null } = {
        isOpen: false,
        receitaId: null,
      };
      service.confirmState$.subscribe((s) => {
        lastState = { isOpen: s.isOpen, receitaId: s.receitaId };
      });
      service.openConfirm({ id: undefined, pessoa: 'X', valor: 100 });
      expect(lastState.isOpen).toBe(false);
    });

    it('com id válido abre com message e receitaId', (done) => {
      service.openConfirm({ id: 5, pessoa: 'Kelly', valor: 2000 });
      service.confirmState$.subscribe((state) => {
        if (state.isOpen) {
          expect(state.receitaId).toBe(5);
          expect(state.message).toContain('Kelly');
          expect(state.message).toMatch(/2000,00/);
          done();
        }
      });
    });

    it('message sem nome usa apenas valor', (done) => {
      service.openConfirm({ id: 1, valor: 500.5 });
      service.confirmState$.subscribe((state) => {
        if (state.isOpen) {
          expect(state.message).toContain('500,50');
          done();
        }
      });
    });
  });

  describe('onConfirm / onCancel', () => {
    it('onConfirm emite receitaId no confirmDelete$ e fecha', (done) => {
      service.openConfirm({ id: 10, pessoa: 'X', valor: 100 });
      service.confirmDelete$.subscribe((id) => {
        expect(id).toBe(10);
        done();
      });
      service.onConfirm();
    });

    it('onConfirm fecha o modal (confirmState isOpen false)', () => {
      service.openConfirm({ id: 10, pessoa: 'X', valor: 100 });
      service.onConfirm();
      let state: { isOpen: boolean; receitaId: number | null } = {
        isOpen: true,
        receitaId: 10,
      };
      service.confirmState$.subscribe((s) => {
        state = { isOpen: s.isOpen, receitaId: s.receitaId };
      });
      expect(state.isOpen).toBe(false);
      expect(state.receitaId).toBeNull();
    });

    it('onCancel fecha sem emitir em confirmDelete$', () => {
      service.openConfirm({ id: 3, pessoa: 'Y', valor: 50 });
      const spy = jest.fn();
      service.confirmDelete$.subscribe(spy);
      service.onCancel();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('openSuccess / closeSuccess', () => {
    it('openSuccess seta successState isOpen true', (done) => {
      service.openSuccess();
      service.successState$.subscribe((state) => {
        if (state.isOpen) {
          expect(state.isOpen).toBe(true);
          done();
        }
      });
    });

    it('closeSuccess seta isOpen false', (done) => {
      service.openSuccess();
      service.closeSuccess();
      service.successState$.subscribe((state) => {
        if (!state.isOpen) done();
      });
    });
  });
});
