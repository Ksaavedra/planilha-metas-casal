import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ReceitaMensal } from '../../../../core/interfaces/receitas/receitas';
import { ReceitasService } from '../../../../core/services/receitas/receitas.service';
import { ReceitasPageComponent } from './receitas-page.component';

describe('ReceitasPageComponent', () => {
  let component: ReceitasPageComponent;
  let fixture: ComponentFixture<ReceitasPageComponent>;
  let receitasService: jest.Mocked<
    Pick<ReceitasService, keyof ReceitasService>
  >;
  let cdr: { markForCheck: jest.Mock };
  let saveSubject: Subject<{
    nomeUsuario: string;
    valorSalario: number;
    tipo: string;
    categoria: string;
    meses: number[];
    ano: number;
    receitaId?: number;
  }>;
  let confirmDeleteSubject: Subject<number>;

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
    {
      id: 2,
      pessoa: 'kelly',
      tipo: 'Freela',
      categoria: 'Variável',
      valor: 500,
      ano: 2026,
      mes: 1,
    },
  ];

  beforeEach(async () => {
    saveSubject = new Subject();
    confirmDeleteSubject = new Subject();

    receitasService = {
      getPorMesAno: jest.fn().mockReturnValue({
        subscribe: (handlers: { next?: (lista: ReceitaMensal[]) => void }) => {
          handlers.next?.(mockReceitas);
        },
      }),
      save$: saveSubject.asObservable(),
      confirmDelete$: confirmDeleteSubject.asObservable(),
      open: jest.fn(),
      openForEdit: jest.fn(),
      openConfirm: jest.fn(),
      delete: jest.fn().mockReturnValue({
        subscribe: (handlers: {
          next?: () => void;
          error?: (e: unknown) => void;
        }) => {
          handlers.next?.();
        },
      }),
      createReceitasParaUsuario: jest.fn().mockReturnValue({
        subscribe: (handlers: {
          next?: () => void;
          error?: (e: unknown) => void;
        }) => {
          handlers.next?.();
        },
      }),
      update: jest.fn().mockReturnValue({
        subscribe: (handlers: {
          next?: () => void;
          error?: (e: unknown) => void;
        }) => {
          handlers.next?.();
        },
      }),
      addPessoaToCache: jest.fn(),
      loadPessoasDistintas: jest.fn().mockReturnValue({
        subscribe: (observerOrNext?: (() => void) | { next?: () => void }) => {
          if (typeof observerOrNext === 'function') observerOrNext();
          else observerOrNext?.next?.();
        },
      }),
      openSuccess: jest.fn(),
    } as unknown as jest.Mocked<ReceitasService>;

    cdr = { markForCheck: jest.fn() };

    await TestBed.configureTestingModule({
      declarations: [ReceitasPageComponent],
      imports: [CommonModule],
      providers: [
        { provide: ReceitasService, useValue: receitasService },
        { provide: ChangeDetectorRef, useValue: cdr },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceitasPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir nome do mês atual no getter nomeMesAtual', () => {
    const mes = component.mesAtual.getMonth();
    const ano = component.mesAtual.getFullYear();
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    expect(component.nomeMesAtual).toBe(`${meses[mes]} ${ano}`);
  });

  it('cardsPorPessoa deve agrupar por pessoa (case insensitive) e ordenar alfabeticamente', () => {
    component.receitasMensal = mockReceitas;
    const cards = component.cardsPorPessoa;
    expect(cards.length).toBe(1);
    expect(cards[0].nome).toBe('Kelly');
    expect(cards[0].receitas.length).toBe(2);
    expect(cards[0].total).toBe(2500);
  });

  it('cardsPorPessoa aplica toTitleCase no nome (cobre retorno de toTitleCase)', () => {
    component.receitasMensal = [
      {
        id: 1,
        pessoa: 'maria silva',
        tipo: 'Salário',
        categoria: 'Fixa',
        valor: 1000,
      } as ReceitaMensal,
    ];
    const cards = component.cardsPorPessoa;
    expect(cards.length).toBe(1);
    expect(cards[0].nome).toBe('Maria Silva');
  });

  it('toTitleCase deve retornar o próprio valor quando value é string vazia', () => {
    const result = (component as any).toTitleCase('');
    expect(result).toBe('');
  });

  it('toTitleCase deve retornar o próprio valor quando value é só espaços', () => {
    const result = (component as any).toTitleCase('   ');
    expect(result).toBe('   ');
  });

  it('toTitleCase deve retornar o próprio valor quando value é undefined', () => {
    const result = (component as any).toTitleCase(undefined);
    expect(result).toBeUndefined();
  });

  it('toTitleCase deve retornar o próprio valor quando value é null', () => {
    const result = (component as any).toTitleCase(null);
    expect(result).toBeNull();
  });

  it('toTitleCase deve normalizar espaços internos', () => {
    const result = (component as any).toTitleCase('  kElLy   sIlVa  ');
    expect(result).toBe('Kelly Silva');
  });

  it('cardsPorPessoa deve retornar array vazio quando receitasMensal está vazio', () => {
    component.receitasMensal = [];
    expect(component.cardsPorPessoa).toEqual([]);
  });

  it('cardsPorPessoa deve ignorar receitas com pessoa vazia ou só espaços (if (!pessoa) continue)', () => {
    component.receitasMensal = [
      {
        id: 1,
        pessoa: 'Kelly',
        tipo: 'Salário',
        categoria: 'Fixa',
        valor: 1000,
      },
      { id: 2, pessoa: '', tipo: 'Salário', categoria: 'Fixa', valor: 500 },
      {
        id: 3,
        pessoa: '   ',
        tipo: 'Freela',
        categoria: 'Variável',
        valor: 300,
      },
    ] as ReceitaMensal[];
    const cards = component.cardsPorPessoa;
    expect(cards.length).toBe(1);
    expect(cards[0].nome).toBe('Kelly');
    expect(cards[0].receitas.length).toBe(1);
    expect(cards[0].total).toBe(1000);
  });

  it('cardsPorPessoa deve ordenar nomes alfabeticamente (localeCompare)', () => {
    component.receitasMensal = [
      {
        id: 1,
        pessoa: 'Kelly',
        tipo: 'Salário',
        categoria: 'Fixa',
        valor: 1000,
      },
      { id: 2, pessoa: 'Ana', tipo: 'Salário', categoria: 'Fixa', valor: 500 },
      {
        id: 3,
        pessoa: 'Bruno',
        tipo: 'Freela',
        categoria: 'Variável',
        valor: 300,
      },
    ] as ReceitaMensal[];
    const cards = component.cardsPorPessoa;
    expect(cards.length).toBe(3);
    expect(cards[0].nome).toBe('Ana');
    expect(cards[1].nome).toBe('Bruno');
    expect(cards[2].nome).toBe('Kelly');
  });

  it('totalMensal deve somar valor de todas as receitas', () => {
    component.receitasMensal = mockReceitas;
    expect(component.totalMensal).toBe(2500);
  });

  it('totalMensal deve ser 0 quando não há receitas', () => {
    component.receitasMensal = [];
    expect(component.totalMensal).toBe(0);
  });

  it('abrirModalAdicionarUsuario deve chamar receitasService.open()', () => {
    component.abrirModalAdicionarUsuario();
    expect(receitasService.open).toHaveBeenCalled();
  });

  it('mesAnterior deve alterar mesAtual e chamar carregarReceitasDoMes', () => {
    const getPorMesAno = receitasService.getPorMesAno as jest.Mock;
    getPorMesAno.mockClear();
    component.mesAtual = new Date(2026, 5, 1); // junho 2026
    component.mesAnterior();
    expect(component.mesAtual.getMonth()).toBe(4);
    expect(component.mesAtual.getFullYear()).toBe(2026);
    expect(getPorMesAno).toHaveBeenCalledWith(2026, 5);
  });

  it('proximoMes deve alterar mesAtual e chamar carregarReceitasDoMes', () => {
    const getPorMesAno = receitasService.getPorMesAno as jest.Mock;
    getPorMesAno.mockClear();
    component.mesAtual = new Date(2026, 0, 1); // janeiro 2026
    component.proximoMes();
    expect(component.mesAtual.getMonth()).toBe(1);
    expect(component.mesAtual.getFullYear()).toBe(2026);
    expect(getPorMesAno).toHaveBeenCalledWith(2026, 2);
  });

  it('editarReceita deve chamar receitasService.openForEdit com a receita', () => {
    const receita: ReceitaMensal = {
      id: 10,
      pessoa: 'David',
      tipo: 'Salário',
      categoria: 'Fixa',
      valor: 3000,
      ano: 2026,
      mes: 2,
    };
    component.editarReceita(receita);
    expect(receitasService.openForEdit).toHaveBeenCalledWith({
      id: 10,
      pessoa: 'David',
      valor: 3000,
      tipo: 'Salário',
      categoria: 'Fixa',
      ano: 2026,
      mes: 2,
    });
  });

  it('editarReceita não deve chamar openForEdit quando receita.id é null', () => {
    component.editarReceita({
      pessoa: 'X',
      tipo: 'Salário',
      categoria: 'Fixa',
      valor: 100,
    } as ReceitaMensal);
    expect(receitasService.openForEdit).not.toHaveBeenCalled();
  });

  it('excluirReceita deve chamar receitasService.openConfirm', () => {
    const receita: ReceitaMensal = {
      id: 5,
      pessoa: 'Kelly',
      tipo: 'Salário',
      categoria: 'Fixa',
      valor: 1000,
    };
    component.excluirReceita(receita);
    expect(receitasService.openConfirm).toHaveBeenCalledWith(receita);
  });

  it('excluirReceita não deve chamar openConfirm quando receita.id não existe', () => {
    component.excluirReceita({
      pessoa: 'X',
      tipo: 'Salário',
      categoria: 'Fixa',
      valor: 100,
    } as ReceitaMensal);
    expect(receitasService.openConfirm).not.toHaveBeenCalled();
  });

  it('ao emitir save$ sem receitaId (salvarUsuario) deve chamar createReceitasParaUsuario, loading=false e carregarReceitasDoMes', fakeAsync(() => {
    const createReceitas =
      receitasService.createReceitasParaUsuario as jest.Mock;
    const getPorMesAno = receitasService.getPorMesAno as jest.Mock;
    createReceitas.mockClear();
    getPorMesAno.mockClear();
    getPorMesAno.mockReturnValue({
      subscribe: (handlers: { next?: (lista: ReceitaMensal[]) => void }) => {
        handlers.next?.(mockReceitas);
      },
    });
    saveSubject.next({
      nomeUsuario: 'Maria',
      valorSalario: 1500,
      tipo: 'Salário',
      categoria: 'Fixa',
      meses: [1, 2],
      ano: 2026,
    });
    tick();
    expect(createReceitas).toHaveBeenCalledWith(
      'Maria',
      1500,
      'Salário',
      'Fixa',
      [1, 2],
      2026,
    );
    expect(receitasService.addPessoaToCache).toHaveBeenCalledWith('Maria');
    expect(component.loading).toBe(false);
    expect(getPorMesAno).toHaveBeenCalled();
  }));

  it('ao emitir save$ sem receitaId quando createReceitasParaUsuario falha deve setar erroCarregar e markForCheck', () => {
    const createReceitas =
      receitasService.createReceitasParaUsuario as jest.Mock;
    createReceitas.mockReturnValue({
      subscribe: (handlers: {
        next?: () => void;
        error?: (e: unknown) => void;
      }) => {
        handlers.error?.({ error: { error: 'API indisponível' } });
      },
    });
    saveSubject.next({
      nomeUsuario: 'Maria',
      valorSalario: 1500,
      tipo: 'Salário',
      categoria: 'Fixa',
      meses: [1, 2],
      ano: 2026,
    });
    expect(component.loading).toBe(false);
    expect(component.erroCarregar).toBe('API indisponível');
  });

  it('ao falhar createReceitasParaUsuario sem error.error usa mensagem padrão', () => {
    const createReceitas =
      receitasService.createReceitasParaUsuario as jest.Mock;
    createReceitas.mockReturnValue({
      subscribe: (handlers: {
        next?: () => void;
        error?: (e: unknown) => void;
      }) => {
        handlers.error?.({});
      },
    });
    saveSubject.next({
      nomeUsuario: 'X',
      valorSalario: 100,
      tipo: 'Salário',
      categoria: 'Fixa',
      meses: [1],
      ano: 2026,
    });
    expect(component.erroCarregar).toBe('Erro ao salvar receitas.');
  });

  it('ao emitir save$ com receitaId (atualizarReceita) deve chamar update, carregarReceitasDoMes e loadPessoasDistintas', fakeAsync(() => {
    const update = receitasService.update as jest.Mock;
    const getPorMesAno = receitasService.getPorMesAno as jest.Mock;
    const loadPessoas = receitasService.loadPessoasDistintas as jest.Mock;
    update.mockClear();
    getPorMesAno.mockClear();
    loadPessoas.mockClear();
    getPorMesAno.mockReturnValue({
      subscribe: (handlers: { next?: (lista: ReceitaMensal[]) => void }) => {
        handlers.next?.(mockReceitas);
      },
    });
    loadPessoas.mockReturnValue({
      subscribe: (observerOrNext?: (() => void) | { next?: () => void }) => {
        if (typeof observerOrNext === 'function') observerOrNext();
        else observerOrNext?.next?.();
      },
    });
    saveSubject.next({
      nomeUsuario: 'Kelly',
      valorSalario: 2200,
      tipo: 'Salário',
      categoria: 'Fixa',
      meses: [],
      ano: 2026,
      receitaId: 7,
    });
    tick();
    expect(update).toHaveBeenCalledWith(7, {
      pessoa: 'Kelly',
      valor: 2200,
      tipo: 'Salário',
      categoria: 'Fixa',
    });
    expect(component.loading).toBe(false);
    expect(getPorMesAno).toHaveBeenCalled();
    expect(loadPessoas).toHaveBeenCalled();
  }));

  it('ao emitir save$ com receitaId quando update falha deve setar erroCarregar e markForCheck', () => {
    const update = receitasService.update as jest.Mock;
    update.mockReturnValue({
      subscribe: (handlers: {
        next?: () => void;
        error?: (e: unknown) => void;
      }) => {
        handlers.error?.({ error: { error: 'Conflito' } });
      },
    });
    saveSubject.next({
      nomeUsuario: 'Kelly',
      valorSalario: 2200,
      tipo: 'Salário',
      categoria: 'Fixa',
      meses: [],
      ano: 2026,
      receitaId: 7,
    });
    expect(component.loading).toBe(false);
    expect(component.erroCarregar).toBe('Conflito');
  });

  it('ao falhar update sem error.error usa mensagem padrão', () => {
    const update = receitasService.update as jest.Mock;
    update.mockReturnValue({
      subscribe: (handlers: {
        next?: () => void;
        error?: (e: unknown) => void;
      }) => {
        handlers.error?.({});
      },
    });
    saveSubject.next({
      nomeUsuario: 'K',
      valorSalario: 1,
      tipo: 'Salário',
      categoria: 'Fixa',
      meses: [],
      ano: 2026,
      receitaId: 1,
    });
    expect(component.erroCarregar).toBe('Erro ao atualizar.');
  });

  it('ao emitir confirmDelete$ deve chamar delete, openSuccess e carregarReceitasDoMes', () => {
    const deleteMeta = receitasService.delete as jest.Mock;
    deleteMeta.mockClear();
    (receitasService.loadPessoasDistintas as jest.Mock).mockClear();
    confirmDeleteSubject.next(3);
    expect(deleteMeta).toHaveBeenCalledWith(3);
    expect(receitasService.openSuccess).toHaveBeenCalled();
    expect(receitasService.loadPessoasDistintas).toHaveBeenCalled();
    expect(component.erroCarregar).toBeNull();
  });

  it('ao emitir confirmDelete$ quando delete falha deve setar erroCarregar e chamar markForCheck', () => {
    const deleteMeta = receitasService.delete as jest.Mock;
    deleteMeta.mockReturnValue({
      subscribe: (handlers: {
        next?: () => void;
        error?: (e: unknown) => void;
      }) => {
        handlers.error?.({ error: { error: 'Falha na rede' } });
      },
    });
    confirmDeleteSubject.next(1);
    expect(component.erroCarregar).toBe('Falha na rede');
  });

  it('ao emitir confirmDelete$ quando delete falha sem error.error usa mensagem padrão', () => {
    const deleteMeta = receitasService.delete as jest.Mock;
    deleteMeta.mockReturnValue({
      subscribe: (handlers: {
        next?: () => void;
        error?: (e: unknown) => void;
      }) => {
        handlers.error?.({ message: 'Unknown' });
      },
    });
    confirmDeleteSubject.next(1);
    expect(component.erroCarregar).toBe('Erro ao excluir.');
  });

  it('onDateChange deve atualizar mesAtual e carregar receitas quando value existe', () => {
    const getPorMesAno = receitasService.getPorMesAno as jest.Mock;
    getPorMesAno.mockClear();
    const novaData = new Date(2025, 11, 1);
    component.onDateChange({ value: novaData });
    expect(component.mesAtual).toBe(novaData);
    expect(getPorMesAno).toHaveBeenCalledWith(2025, 12);
  });

  it('onDateChange não deve alterar nada quando value é undefined', () => {
    const dataAnterior = component.mesAtual;
    component.onDateChange({});
    expect(component.mesAtual).toBe(dataAnterior);
  });

  it('ngOnInit deve chamar getPorMesAno e ao sucesso preencher receitasMensal (cobre carregarReceitasDoMes e markForCheck no init)', () => {
    const getPorMesAno = receitasService.getPorMesAno as jest.Mock;
    expect(getPorMesAno).toHaveBeenCalled();
    const [ano, mes] = getPorMesAno.mock.calls[0];
    expect(ano).toBe(new Date().getFullYear());
    expect(mes).toBe(new Date().getMonth() + 1);
    expect(component.receitasMensal).toEqual(mockReceitas);
    expect(component.loading).toBe(false);
    expect(component.erroCarregar).toBeNull();
  });

  it('carregarReceitasDoMes quando getPorMesAno falha deve setar receitasMensal=[], loading=false, erroCarregar e markForCheck', () => {
    const getPorMesAno = receitasService.getPorMesAno as jest.Mock;
    getPorMesAno.mockReturnValue({
      subscribe: (handlers: {
        next?: (lista: ReceitaMensal[]) => void;
        error?: (e: unknown) => void;
      }) => {
        handlers.error?.({ error: { error: 'Serviço indisponível' } });
      },
    });
    component.receitasMensal = mockReceitas;
    component.carregarReceitasDoMes();
    expect(component.receitasMensal).toEqual([]);
    expect(component.loading).toBe(false);
    expect(component.erroCarregar).toBe('Serviço indisponível');
  });

  it('carregarReceitasDoMes quando getPorMesAno falha sem error.error usa mensagem padrão', () => {
    const getPorMesAno = receitasService.getPorMesAno as jest.Mock;
    getPorMesAno.mockReturnValue({
      subscribe: (handlers: {
        next?: (lista: ReceitaMensal[]) => void;
        error?: (e: unknown) => void;
      }) => {
        handlers.error?.({});
      },
    });
    component.carregarReceitasDoMes();
    expect(component.erroCarregar).toBe('Erro ao carregar receitas.');
  });

  it('carregarReceitasDoMes em sucesso deve atualizar receitasMensal e loading', () => {
    const getPorMesAno = receitasService.getPorMesAno as jest.Mock;
    getPorMesAno.mockReturnValue({
      subscribe: (handlers: { next?: (lista: ReceitaMensal[]) => void }) => {
        handlers.next?.(mockReceitas);
      },
    });
    component.carregarReceitasDoMes();
    expect(component.receitasMensal).toEqual(mockReceitas);
    expect(component.loading).toBe(false);
    expect(component.erroCarregar).toBeNull();
  });
});
