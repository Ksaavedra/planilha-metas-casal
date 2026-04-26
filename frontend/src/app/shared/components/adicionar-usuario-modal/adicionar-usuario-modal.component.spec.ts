import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { AdicionarUsuarioModalComponent } from './adicionar-usuario-modal.component';
import { ReceitasService } from '../../../core/services/receitas/receitas.service';
import { ModalAdicionarUsuarioState } from '../../../core/interfaces/receitas';

function initialState(over: Partial<ModalAdicionarUsuarioState> = {}): ModalAdicionarUsuarioState {
  return {
    isOpen: false,
    isEditMode: false,
    receitaId: undefined,
    nomeUsuario: '',
    valorSalarioRaw: '',
    tipo: 'Salário',
    categoria: 'Fixa',
    mesesSelecionados: [],
    ano: 2026,
    ...over,
  };
}

describe('AdicionarUsuarioModalComponent', () => {
  let fixture: ComponentFixture<AdicionarUsuarioModalComponent>;
  let component: AdicionarUsuarioModalComponent;
  let state: BehaviorSubject<ModalAdicionarUsuarioState>;
  let receitas: {
    state$: ReturnType<BehaviorSubject<ModalAdicionarUsuarioState>['asObservable']>;
    getPessoasCache: jest.Mock;
    loadPessoasDistintas: jest.Mock;
    updateNomeUsuario: jest.Mock;
    updateTipo: jest.Mock;
    updateCategoria: jest.Mock;
    updateValorSalarioRaw: jest.Mock;
    updateAno: jest.Mock;
    toggleMes: jest.Mock;
    selecionarTodosMeses: jest.Mock;
    desmarcarTodosMeses: jest.Mock;
    triggerSave: jest.Mock;
    close: jest.Mock;
    reset: jest.Mock;
  };

  beforeEach(async () => {
    state = new BehaviorSubject<ModalAdicionarUsuarioState>(initialState());
    const next = (patch: Partial<ModalAdicionarUsuarioState>) =>
      state.next({ ...state.getValue(), ...patch });

    receitas = {
      state$: state.asObservable(),
      getPessoasCache: jest.fn(() => []),
      loadPessoasDistintas: jest.fn(() => of<string[]>([])),
      updateNomeUsuario: jest.fn((n: string) => next({ nomeUsuario: n })),
      updateTipo: jest.fn((t) => next({ tipo: t })),
      updateCategoria: jest.fn((c) => next({ categoria: c })),
      updateValorSalarioRaw: jest.fn((v: string) => next({ valorSalarioRaw: v })),
      updateAno: jest.fn((a: number) => next({ ano: a })),
      toggleMes: jest.fn((mes: number) => {
        const s = state.getValue();
        const meses = [...s.mesesSelecionados];
        const i = meses.indexOf(mes);
        if (i > -1) {
          meses.splice(i, 1);
        } else {
          meses.push(mes);
          meses.sort((a, b) => a - b);
        }
        next({ mesesSelecionados: meses });
      }),
      selecionarTodosMeses: jest.fn(() =>
        next({ mesesSelecionados: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }),
      ),
      desmarcarTodosMeses: jest.fn(() => next({ mesesSelecionados: [] })),
      triggerSave: jest.fn(),
      close: jest.fn(() => next({ isOpen: false })),
      reset: jest.fn(() => state.next(initialState())),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [AdicionarUsuarioModalComponent],
      providers: [
        { provide: ReceitasService, useValue: receitas },
        { provide: ChangeDetectorRef, useValue: { markForCheck: jest.fn() } },
      ],
    })
      .overrideComponent(AdicionarUsuarioModalComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AdicionarUsuarioModalComponent);
    component = fixture.componentInstance;
  });

  it('deve criar o componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('parseNumeroBR interpreta centenas com vírgula', () => {
    fixture.detectChanges();
    expect(component.parseNumeroBR('1.234,56')).toBeCloseTo(1234.56, 2);
  });

  it('parseNumeroBR retorna 0 para string vazia', () => {
    fixture.detectChanges();
    expect(component.parseNumeroBR('')).toBe(0);
  });

  it('valorGreaterThanZero rejeita zero ou inválido', () => {
    fixture.detectChanges();
    const c0 = new FormControl('0');
    const c1 = new FormControl('1');
    expect(component.valorGreaterThanZero(c0 as never)).toEqual(
      expect.objectContaining({ mustBeGreaterThanZero: true }),
    );
    expect(component.valorGreaterThanZero(c1 as never)).toBeNull();
  });

  it('onSave dispara serviço e fecha o modal (modo adicionar com meses)', () => {
    state.next(
      initialState({
        isOpen: true,
        isEditMode: false,
        nomeUsuario: 'Foo',
        valorSalarioRaw: '12,00',
        mesesSelecionados: [1, 2],
        ano: 2026,
      }),
    );
    fixture.detectChanges();

    component.nomeFormControl.setValue('Maria Silva');
    component.valorSalarioFormControl.setValue('12,00');

    component.onSave();
    expect(receitas.triggerSave).toHaveBeenCalled();
    expect(receitas.close).toHaveBeenCalled();
    expect(receitas.reset).toHaveBeenCalled();
  });

  it('onSave bloqueia sem meses selecionados (modo adicionar) e chama alert', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
    state.next(
      initialState({
        isOpen: true,
        isEditMode: false,
        mesesSelecionados: [],
        nomeUsuario: 'A',
        valorSalarioRaw: '10',
      }),
    );
    fixture.detectChanges();
    component.nomeFormControl.setValue('Ab');
    component.valorSalarioFormControl.setValue('10');

    component.onSave();
    expect(alertSpy).toHaveBeenCalled();
    expect(receitas.triggerSave).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('onCancel chama close e reset fora do modo editar', () => {
    state.next(
      initialState({ isOpen: true, isEditMode: false, mesesSelecionados: [1] }),
    );
    fixture.detectChanges();
    receitas.close.mockClear();
    receitas.reset.mockClear();
    component.onCancel();
    expect(receitas.close).toHaveBeenCalled();
    expect(receitas.reset).toHaveBeenCalled();
  });

  it('onTipoChange e onCategoriaChange atualizam o serviço', () => {
    fixture.detectChanges();
    component.onTipoChange('Freela');
    component.onCategoriaChange('Variável');
    expect(receitas.updateTipo).toHaveBeenCalled();
    expect(receitas.updateCategoria).toHaveBeenCalled();
  });

  it('podeSalvar: modo adicionar exige meses e formulário válido', () => {
    state.next(
      initialState({
        isOpen: true,
        isEditMode: false,
        mesesSelecionados: [1],
        nomeUsuario: 'Jo',
        valorSalarioRaw: '10',
      }),
    );
    fixture.detectChanges();
    component.nomeFormControl.setValue('Jo');
    component.valorSalarioFormControl.setValue('10');
    expect(component.podeSalvar).toBe(true);
  });

  it('getTodosMesesSelecionados verifica 12 meses', () => {
    state.next(initialState({ mesesSelecionados: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }));
    fixture.detectChanges();
    expect(component.getTodosMesesSelecionados()).toBe(true);
  });

  it('onNomeBlur aplica title case', () => {
    state.next(
      initialState({ isOpen: true, nomeUsuario: 'kelly teste', mesesSelecionados: [1] }),
    );
    fixture.detectChanges();
    component.nomeFormControl.setValue('kelly teste');
    component.onNomeBlur();
    expect(component.nomeFormControl.value).toBe('Kelly Teste');
  });

  it('onValorSalarioChange filtra e atualiza o serviço', () => {
    fixture.detectChanges();
    receitas.updateValorSalarioRaw.mockClear();
    component.onValorSalarioChange('R$ 10,50a');
    expect(receitas.updateValorSalarioRaw).toHaveBeenCalledWith('10,50');
  });

  it('ngOnInit preenche anosDisponiveis (7 anos) e chama loadPessoasDistintas', () => {
    fixture.detectChanges();
    expect(component.anosDisponiveis.length).toBe(7);
    const y = new Date().getFullYear();
    expect(component.anosDisponiveis[0]).toBe(y - 3);
    expect(component.anosDisponiveis[6]).toBe(y + 3);
    expect(receitas.loadPessoasDistintas).toHaveBeenCalled();
  });

  it('após a API, options fica com nomes em Title Case e ordenados', (done) => {
    receitas.loadPessoasDistintas.mockReturnValue(
      of<string[]>(['zé', 'Ana', 'ana']),
    );
    fixture = TestBed.createComponent(AdicionarUsuarioModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    setTimeout(() => {
      expect(component.options).toEqual(['Ana', 'Zé']);
      done();
    }, 0);
  });

  it('valorGreaterThanZero com valor vazio devolve null', () => {
    fixture.detectChanges();
    expect(
      component.valorGreaterThanZero(new FormControl('') as never),
    ).toBeNull();
  });

  it('ngOnDestroy cancela a subscrição do componente', () => {
    fixture.detectChanges();
    const sub = (component as unknown as { subscriptions: { unsubscribe: jest.Mock } })
      .subscriptions;
    const spy = jest.spyOn(sub, 'unsubscribe');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });

  it('parseNumeroBR: só ponto (milhar decimal) e número simples', () => {
    fixture.detectChanges();
    expect(component.parseNumeroBR('1.234,56')).toBeCloseTo(1234.56, 2);
    expect(component.parseNumeroBR('42')).toBe(42);
  });

  it('validarApenasNumeros: teclas de controlo e Numpad não preventDefault; letra sim', () => {
    fixture.detectChanges();
    const tecla = (key: string, code?: string) => {
      const e = new KeyboardEvent('keydown', { key, code: code || key });
      jest.spyOn(e, 'preventDefault');
      component.validarApenasNumeros(e);
      return e;
    };
    expect(tecla('Backspace').preventDefault).not.toHaveBeenCalled();
    expect(tecla('5', 'Numpad5').preventDefault).not.toHaveBeenCalled();
    const bad = tecla('a', 'KeyA');
    expect(bad.preventDefault).toHaveBeenCalled();
  });

  it('stop chama stopPropagation', () => {
    const e = new Event('click');
    jest.spyOn(e, 'stopPropagation');
    component.stop(e);
    expect(e.stopPropagation).toHaveBeenCalled();
  });

  it('toggleMes, selecionarTodosMeses, desmarcarTodosMeses e onAnoChange delegam ao serviço', () => {
    fixture.detectChanges();
    receitas.toggleMes.mockClear();
    receitas.selecionarTodosMeses.mockClear();
    receitas.desmarcarTodosMeses.mockClear();
    receitas.updateAno.mockClear();
    component.toggleMes(3);
    component.selecionarTodosMeses();
    component.desmarcarTodosMeses();
    component.onAnoChange(2025);
    expect(receitas.toggleMes).toHaveBeenCalledWith(3);
    expect(receitas.selecionarTodosMeses).toHaveBeenCalled();
    expect(receitas.desmarcarTodosMeses).toHaveBeenCalled();
    expect(receitas.updateAno).toHaveBeenCalledWith(2025);
  });

  it('isMesSelecionado reflete state.mesesSelecionados', () => {
    state.next(initialState({ mesesSelecionados: [2, 4] }));
    fixture.detectChanges();
    expect(component.isMesSelecionado(2)).toBe(true);
    expect(component.isMesSelecionado(1)).toBe(false);
  });

  it('getTodosMesesSelecionados é false com menos de 12 meses', () => {
    state.next(
      initialState({ mesesSelecionados: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),
    );
    fixture.detectChanges();
    expect(component.getTodosMesesSelecionados()).toBe(false);
  });

  it('podeSalvar: modo editar exige alteração (valor, tipo ou categoria)', () => {
    state.next(
      initialState({
        isOpen: true,
        isEditMode: true,
        receitaId: 9,
        nomeUsuario: 'N',
        valorSalarioRaw: '100,00',
        tipo: 'Salário',
        categoria: 'Fixa',
        mesesSelecionados: [1],
      }),
    );
    fixture.detectChanges();
    component.nomeFormControl.setValue('No');
    component.valorSalarioFormControl.setValue('100,00');
    expect(component.podeSalvar).toBe(false);
    component.tipoReceita = 'Bônus';
    expect(component.podeSalvar).toBe(true);
  });

  it('onSave no modo editar chama triggerSave com receitaId e não chama reset', () => {
    state.next(
      initialState({
        isOpen: true,
        isEditMode: true,
        receitaId: 7,
        nomeUsuario: 'Ed',
        valorSalarioRaw: '50,00',
        tipo: 'Salário',
        categoria: 'Fixa',
        mesesSelecionados: [1],
        ano: 2026,
      }),
    );
    fixture.detectChanges();
    receitas.reset.mockClear();
    receitas.triggerSave.mockClear();
    component.tipoReceita = 'Freela';
    component.nomeFormControl.setValue('Ed');
    component.valorSalarioFormControl.setValue('50,00');
    component.onSave();
    expect(receitas.triggerSave).toHaveBeenCalled();
    const args = (receitas.triggerSave as jest.Mock).mock.calls[0];
    expect(args[5]).toBe(2026);
    expect(args[6]).toBe(7);
    expect(receitas.reset).not.toHaveBeenCalled();
  });

  it('onCancel no modo editar chama close mas não reset', () => {
    state.next(
      initialState({
        isOpen: true,
        isEditMode: true,
        receitaId: 1,
        mesesSelecionados: [1],
        nomeUsuario: 'E',
        valorSalarioRaw: '1,00',
      }),
    );
    fixture.detectChanges();
    receitas.close.mockClear();
    receitas.reset.mockClear();
    component.onCancel();
    expect(receitas.close).toHaveBeenCalled();
    expect(receitas.reset).not.toHaveBeenCalled();
  });

  it('onSave inválido não chama triggerSave (nome curto demais)', () => {
    state.next(
      initialState({
        isOpen: true,
        isEditMode: false,
        mesesSelecionados: [1],
        nomeUsuario: 'OK',
        valorSalarioRaw: '10,00',
      }),
    );
    fixture.detectChanges();
    receitas.triggerSave.mockClear();
    component.nomeFormControl.setValue('K');
    component.valorSalarioFormControl.setValue('10,00');
    component.onSave();
    expect(receitas.triggerSave).not.toHaveBeenCalled();
  });
});
