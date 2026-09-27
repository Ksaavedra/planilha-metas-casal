import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { FEEDBACK_ATRASO_MS, LoggedComponent } from './logged.component';
import { SidebarService } from '../../services/sidebar/sidebar.service';
import { AuthService } from '../../services/auth/auth.service';
import { FeedbackService } from '../../services/feedback/feedback.service';
import { FeedbackModalComponent } from 'shared/components/feedback-modal/feedback-modal.component';
import { SuccessModalComponent } from 'shared/components/success-modal/success-modal.component';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

describe('LoggedComponent', () => {
  let component: LoggedComponent;
  let fixture: ComponentFixture<LoggedComponent>;
  let sidebarService: {
    getStatus: jest.Mock;
    isMobile: jest.Mock;
    changeStatus: jest.Mock;
    close: jest.Mock;
  };
  let authService: { getCurrentUser: jest.Mock };
  let feedbackService: { deveExibir: jest.Mock; adiar: jest.Mock };
  let dialog: { open: jest.Mock; openDialogs: unknown[] };

  beforeEach(async () => {
    jest.useFakeTimers();

    sidebarService = {
      getStatus: jest.fn().mockReturnValue(of(false)),
      isMobile: jest.fn().mockReturnValue(of(false)),
      changeStatus: jest.fn(),
      close: jest.fn(),
    };
    authService = {
      getCurrentUser: jest.fn().mockReturnValue({ id: 7, nomeCompleto: 'Ana', email: 'ana@x.com' }),
    };
    feedbackService = {
      deveExibir: jest.fn().mockReturnValue(false),
      adiar: jest.fn(),
    };
    dialog = {
      open: jest.fn().mockReturnValue({ afterClosed: () => of('adiado') }),
      openDialogs: [],
    };

    await TestBed.configureTestingModule({
      declarations: [LoggedComponent],
      imports: [RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        { provide: SidebarService, useValue: sidebarService },
        { provide: AuthService, useValue: authService },
        { provide: FeedbackService, useValue: feedbackService },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoggedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render header and sidebar components', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('app-sidebar')).toBeTruthy();
  });

  it('should have main content area', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const mainContent = compiled.querySelector('.main-content');
    expect(mainContent).toBeTruthy();
  });

  it('should have router outlet in main content', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const routerOutlet = compiled.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });

  it('onShowOverlay(show) deve setar showOverlay com o valor passado', () => {
    expect(component.showOverlay).toBe(false);
    component.onShowOverlay(true);
    expect(component.showOverlay).toBe(true);
    component.onShowOverlay(false);
    expect(component.showOverlay).toBe(false);
  });

  it('deve fechar sidebar pelo backdrop apenas no mobile', () => {
    component.isMobile = true;
    component.sidebarStatus = true;

    component.fecharSidebarMobile();

    expect(sidebarService.changeStatus).toHaveBeenCalledTimes(1);
  });

  it('não deve fechar sidebar pelo backdrop no desktop', () => {
    component.isMobile = false;
    component.sidebarStatus = true;

    component.fecharSidebarMobile();

    expect(sidebarService.changeStatus).not.toHaveBeenCalled();
  });

  it('deve fechar sidebar ao clicar no conteúdo da tela', () => {
    component.sidebarStatus = true;

    component.fecharSidebarAoClicarConteudo();

    expect(sidebarService.close).toHaveBeenCalledTimes(1);
  });

  it('não deve fechar sidebar ao clicar no conteúdo quando menu já está fechado', () => {
    component.sidebarStatus = false;

    component.fecharSidebarAoClicarConteudo();

    expect(sidebarService.close).not.toHaveBeenCalled();
  });

  describe('feedback', () => {
    it('verifica o feedback só depois do atraso inicial', () => {
      expect(feedbackService.deveExibir).not.toHaveBeenCalled();

      jest.advanceTimersByTime(FEEDBACK_ATRASO_MS);

      expect(feedbackService.deveExibir).toHaveBeenCalledWith(7);
    });

    it('não verifica o feedback se o componente for destruído antes do atraso', () => {
      fixture.destroy();
      jest.advanceTimersByTime(FEEDBACK_ATRASO_MS);

      expect(feedbackService.deveExibir).not.toHaveBeenCalled();
    });

    it('não abre o modal sem usuário logado', () => {
      authService.getCurrentUser.mockReturnValue(null);

      component.pedirFeedbackSeNecessario();

      expect(feedbackService.deveExibir).not.toHaveBeenCalled();
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('não abre o modal antes de completar o intervalo', () => {
      component.pedirFeedbackSeNecessario();

      expect(dialog.open).not.toHaveBeenCalled();
      expect(feedbackService.adiar).not.toHaveBeenCalled();
    });

    it('abre o modal, reagenda e não agradece quando o usuário adia', () => {
      feedbackService.deveExibir.mockReturnValue(true);

      component.pedirFeedbackSeNecessario();

      expect(feedbackService.adiar).toHaveBeenCalledWith(7);
      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(dialog.open).toHaveBeenCalledWith(
        FeedbackModalComponent,
        expect.objectContaining({ data: { pagina: expect.any(String) } }),
      );
    });

    it('não abre o modal automático por cima de outro modal', () => {
      feedbackService.deveExibir.mockReturnValue(true);
      dialog.openDialogs = [{}];

      component.pedirFeedbackSeNecessario();

      expect(dialog.open).not.toHaveBeenCalled();
      expect(feedbackService.adiar).not.toHaveBeenCalled();
    });

    it('a bolinha de feedback abre o modal a qualquer momento e reagenda', () => {
      const fab = fixture.nativeElement.querySelector('.feedback-fab') as HTMLButtonElement;

      fab.click();

      expect(feedbackService.deveExibir).not.toHaveBeenCalled();
      expect(feedbackService.adiar).toHaveBeenCalledWith(7);
      expect(dialog.open).toHaveBeenCalledWith(FeedbackModalComponent, expect.anything());
    });

    it('a bolinha abre o modal mesmo sem usuário carregado, sem reagendar', () => {
      authService.getCurrentUser.mockReturnValue(null);

      component.abrirFeedback();

      expect(feedbackService.adiar).not.toHaveBeenCalled();
      expect(dialog.open).toHaveBeenCalledTimes(1);
    });

    it('mostra agradecimento quando o feedback é enviado', () => {
      feedbackService.deveExibir.mockReturnValue(true);
      dialog.open.mockReturnValueOnce({ afterClosed: () => of('enviado') });

      component.pedirFeedbackSeNecessario();

      expect(dialog.open).toHaveBeenCalledTimes(2);
      expect(dialog.open).toHaveBeenLastCalledWith(
        SuccessModalComponent,
        expect.objectContaining({
          data: expect.objectContaining({ title: 'Obrigado!' }),
        }),
      );
    });
  });
});
