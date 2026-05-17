import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { MetasService } from './core/services/metas/metas.service';
import { ReceitasService } from './core/services/receitas/receitas.service';

type ModalState = {
  isOpen: boolean;
  nome: string;
  valorMetaRaw: string;
  valorPorMesRaw: string;
  valorAtualRaw: string;
  temValorAtual: boolean;
  icon: string;
};
type SucessoState = { isOpen: boolean; title: string; message: string };
type ConfirmarDeleteState = {
  isOpen: boolean;
  message: string;
  metaId: number | null;
  metaNome: string;
};
type EditarValorState = {
  isOpen: boolean;
  meta: any;
  mesId: number;
  valor: number;
  meses: string[];
};
type ConfirmReceitaState = { isOpen: boolean; message: string };

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let metasService: jest.Mocked<Pick<MetasService, keyof MetasService>>;
  let receitasService: jest.Mocked<
    Pick<ReceitasService, keyof ReceitasService>
  >;

  let stateSubject: BehaviorSubject<ModalState>;
  let sucessoStateSubject: BehaviorSubject<SucessoState>;
  let confirmarDeleteStateSubject: BehaviorSubject<ConfirmarDeleteState>;
  let sucessoDeleteStateSubject: BehaviorSubject<{ isOpen: boolean }>;
  let editarValorStateSubject: BehaviorSubject<EditarValorState>;
  let confirmStateSubject: BehaviorSubject<ConfirmReceitaState>;
  let successStateSubject: BehaviorSubject<{ isOpen: boolean }>;

  beforeEach(async () => {
    stateSubject = new BehaviorSubject<ModalState>({
      isOpen: false,
      nome: '',
      valorMetaRaw: '',
      valorPorMesRaw: '',
      valorAtualRaw: '',
      temValorAtual: false,
      icon: 'bi-bullseye',
    });
    sucessoStateSubject = new BehaviorSubject<SucessoState>({
      isOpen: false,
      title: '',
      message: '',
    });
    confirmarDeleteStateSubject = new BehaviorSubject<ConfirmarDeleteState>({
      isOpen: false,
      message: '',
      metaId: null,
      metaNome: '',
    });
    sucessoDeleteStateSubject = new BehaviorSubject<{ isOpen: boolean }>({
      isOpen: false,
    });
    editarValorStateSubject = new BehaviorSubject<EditarValorState>({
      isOpen: false,
      meta: null,
      mesId: -1,
      valor: 0,
      meses: [],
    });
    confirmStateSubject = new BehaviorSubject<ConfirmReceitaState>({
      isOpen: false,
      message: '',
    });
    successStateSubject = new BehaviorSubject<{ isOpen: boolean }>({
      isOpen: false,
    });

    metasService = {
      state$: stateSubject.asObservable(),
      sucessoState$: sucessoStateSubject.asObservable(),
      confirmarDeleteState$: confirmarDeleteStateSubject.asObservable(),
      sucessoDeleteState$: sucessoDeleteStateSubject.asObservable(),
      editarValorState$: editarValorStateSubject.asObservable(),
      updateNome: jest.fn(),
      updateValorMetaRaw: jest.fn(),
      updateValorPorMesRaw: jest.fn(),
      updateValorAtualRaw: jest.fn(),
      updateTemValorAtual: jest.fn(),
      updateIcon: jest.fn(),
      triggerSave: jest.fn(),
      close: jest.fn(),
      reset: jest.fn(),
      closeSucesso: jest.fn(),
      confirmDelete: jest.fn(),
      closeConfirmarDelete: jest.fn(),
      closeSucessoDelete: jest.fn(),
      updateValorEditarValor: jest.fn(),
      triggerSaveEditarValor: jest.fn(),
      closeEditarValor: jest.fn(),
      resetEditarValor: jest.fn(),
    } as unknown as jest.Mocked<MetasService>;

    receitasService = {
      confirmState$: confirmStateSubject.asObservable(),
      successState$: successStateSubject.asObservable(),
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
      closeSuccess: jest.fn(),
    } as unknown as jest.Mocked<ReceitasService>;

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MetasService, useValue: metasService },
        { provide: ReceitasService, useValue: receitasService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit – subscriptions', () => {
    it('deve atualizar modalState quando state$ emite', () => {
      stateSubject.next({
        isOpen: true,
        nome: 'Meta X',
        valorMetaRaw: '1000',
        valorPorMesRaw: '100',
        valorAtualRaw: '500',
        temValorAtual: true,
        icon: 'bi-star',
      });
      expect(component.modalState).toEqual({
        isOpen: true,
        nome: 'Meta X',
        valorMetaRaw: '1000',
        valorPorMesRaw: '100',
        valorAtualRaw: '500',
        temValorAtual: true,
        icon: 'bi-star',
      });
    });

    it('deve atualizar sucessoState quando sucessoState$ emite', () => {
      sucessoStateSubject.next({
        isOpen: true,
        title: 'Sucesso',
        message: 'Meta criada.',
      });
      expect(component.sucessoState).toEqual({
        isOpen: true,
        title: 'Sucesso',
        message: 'Meta criada.',
      });
    });

    it('deve atualizar confirmarDeleteState quando confirmarDeleteState$ emite', () => {
      confirmarDeleteStateSubject.next({
        isOpen: true,
        message: 'Excluir meta?',
        metaId: 5,
        metaNome: 'Viagem',
      });
      expect(component.confirmarDeleteState).toEqual({
        isOpen: true,
        message: 'Excluir meta?',
        metaId: 5,
        metaNome: 'Viagem',
      });
    });

    it('deve atualizar sucessoDeleteState quando sucessoDeleteState$ emite', () => {
      sucessoDeleteStateSubject.next({ isOpen: true });
      expect(component.sucessoDeleteState).toEqual({ isOpen: true });
    });

    it('deve atualizar editarValorState quando editarValorState$ emite', () => {
      const meta = { id: 1, nome: 'Carro' };
      editarValorStateSubject.next({
        isOpen: true,
        meta,
        mesId: 3,
        valor: 200,
        meses: ['Jan', 'Fev', 'Mar'],
      });
      expect(component.editarValorState).toEqual({
        isOpen: true,
        meta,
        mesId: 3,
        valor: 200,
        meses: ['Jan', 'Fev', 'Mar'],
      });
    });

    it('deve atualizar confirmarExcluirReceitaState quando confirmState$ emite', () => {
      confirmStateSubject.next({
        isOpen: true,
        message: 'Excluir receita?',
      });
      expect(component.confirmarExcluirReceitaState).toEqual({
        isOpen: false,
        message: '',
      });
    });

    it('deve atualizar sucessoExcluirReceitaState quando successState$ emite', () => {
      successStateSubject.next({ isOpen: true });
      expect(component.sucessoExcluirReceitaState).toEqual({ isOpen: false });
    });
  });

  describe('ngOnDestroy', () => {
    it('deve executar sem erros e deixar de reagir a state$ após destroy', () => {
      stateSubject.next({
        isOpen: true,
        nome: 'Antes',
        valorMetaRaw: '',
        valorPorMesRaw: '',
        valorAtualRaw: '',
        temValorAtual: false,
        icon: 'bi-bullseye',
      });
      expect(component.modalState.nome).toBe('Antes');
      component.ngOnDestroy();
      stateSubject.next({
        isOpen: true,
        nome: 'Depois',
        valorMetaRaw: '',
        valorPorMesRaw: '',
        valorAtualRaw: '',
        temValorAtual: false,
        icon: 'bi-bullseye',
      });
      expect(component.modalState.nome).toBe('Antes');
    });
  });

  describe('handlers MetasService', () => {
    it('onNomeChange chama metasService.updateNome', () => {
      component.onNomeChange('Nova Meta');
      expect(metasService.updateNome).toHaveBeenCalledWith('Nova Meta');
    });

    it('onValorMetaChange chama metasService.updateValorMetaRaw', () => {
      component.onValorMetaChange('2000');
      expect(metasService.updateValorMetaRaw).toHaveBeenCalledWith('2000');
    });

    it('onValorPorMesChange chama metasService.updateValorPorMesRaw', () => {
      component.onValorPorMesChange('150');
      expect(metasService.updateValorPorMesRaw).toHaveBeenCalledWith('150');
    });

    it('onValorAtualChange chama metasService.updateValorAtualRaw', () => {
      component.onValorAtualChange('300');
      expect(metasService.updateValorAtualRaw).toHaveBeenCalledWith('300');
    });

    it('onTemValorAtualChange chama metasService.updateTemValorAtual', () => {
      component.onTemValorAtualChange(true);
      expect(metasService.updateTemValorAtual).toHaveBeenCalledWith(true);
    });

    it('onIconChange chama metasService.updateIcon', () => {
      component.onIconChange('bi-heart');
      expect(metasService.updateIcon).toHaveBeenCalledWith('bi-heart');
    });

    it('onSave chama metasService.triggerSave', () => {
      component.onSave();
      expect(metasService.triggerSave).toHaveBeenCalled();
    });

    it('onCancel chama metasService.close e reset', () => {
      component.onCancel();
      expect(metasService.close).toHaveBeenCalled();
      expect(metasService.reset).toHaveBeenCalled();
    });

    it('onCloseSucesso chama metasService.closeSucesso', () => {
      component.onCloseSucesso();
      expect(metasService.closeSucesso).toHaveBeenCalled();
    });

    it('onConfirmDelete chama metasService.confirmDelete', () => {
      component.onConfirmDelete();
      expect(metasService.confirmDelete).toHaveBeenCalled();
    });

    it('onCancelDelete chama metasService.closeConfirmarDelete', () => {
      component.onCancelDelete();
      expect(metasService.closeConfirmarDelete).toHaveBeenCalled();
    });

    it('onCloseSucessoDelete chama metasService.closeSucessoDelete', () => {
      component.onCloseSucessoDelete();
      expect(metasService.closeSucessoDelete).toHaveBeenCalled();
    });

    it('onValorChange chama metasService.updateValorEditarValor', () => {
      component.onValorChange(350);
      expect(metasService.updateValorEditarValor).toHaveBeenCalledWith(350);
    });

    it('onSaveEditarValor chama metasService.triggerSaveEditarValor', () => {
      component.onSaveEditarValor();
      expect(metasService.triggerSaveEditarValor).toHaveBeenCalled();
    });

    it('onCancelEditarValor chama metasService.closeEditarValor e resetEditarValor', () => {
      component.onCancelEditarValor();
      expect(metasService.closeEditarValor).toHaveBeenCalled();
      expect(metasService.resetEditarValor).toHaveBeenCalled();
    });
  });

  describe('event handlers vazios', () => {
    it('onValorMetaChangeEvent não quebra (pode ser usado para formatação)', () => {
      expect(() =>
        component.onValorMetaChangeEvent(new Event('change')),
      ).not.toThrow();
    });

    it('onValorPorMesChangeEvent não quebra', () => {
      expect(() =>
        component.onValorPorMesChangeEvent(new Event('change')),
      ).not.toThrow();
    });

    it('onValorAtualChangeEvent não quebra', () => {
      expect(() =>
        component.onValorAtualChangeEvent(new Event('change')),
      ).not.toThrow();
    });
  });
});
