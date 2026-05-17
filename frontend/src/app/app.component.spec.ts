import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { MetasService } from './core/services/metas/metas.service';
import { ReceitasService } from './core/services/receitas/receitas.service';

type SucessoState = { isOpen: boolean; title: string; message: string };
type ConfirmarDeleteState = {
  isOpen: boolean;
  message: string;
  metaId: number | null;
  metaNome: string;
};
type ConfirmReceitaState = { isOpen: boolean; message: string };

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let metasService: jest.Mocked<Pick<MetasService, keyof MetasService>>;
  let receitasService: jest.Mocked<
    Pick<ReceitasService, keyof ReceitasService>
  >;

  let sucessoStateSubject: BehaviorSubject<SucessoState>;
  let confirmarDeleteStateSubject: BehaviorSubject<ConfirmarDeleteState>;
  let sucessoDeleteStateSubject: BehaviorSubject<{ isOpen: boolean }>;
  let confirmStateSubject: BehaviorSubject<ConfirmReceitaState>;
  let successStateSubject: BehaviorSubject<{ isOpen: boolean }>;

  beforeEach(async () => {
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
    confirmStateSubject = new BehaviorSubject<ConfirmReceitaState>({
      isOpen: false,
      message: '',
    });
    successStateSubject = new BehaviorSubject<{ isOpen: boolean }>({
      isOpen: false,
    });

    metasService = {
      sucessoState$: sucessoStateSubject.asObservable(),
      confirmarDeleteState$: confirmarDeleteStateSubject.asObservable(),
      sucessoDeleteState$: sucessoDeleteStateSubject.asObservable(),
      closeSucesso: jest.fn(),
      confirmDelete: jest.fn(),
      closeConfirmarDelete: jest.fn(),
      closeSucessoDelete: jest.fn(),
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
    it('deve executar sem erros', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('handlers MetasService', () => {
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

  });

});
