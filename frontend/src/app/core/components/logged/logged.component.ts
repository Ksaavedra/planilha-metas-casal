import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SidebarService } from '../../services/sidebar/sidebar.service';
import { AuthService } from '../../services/auth/auth.service';
import { FeedbackService } from '../../services/feedback/feedback.service';
import {
  FeedbackModalComponent,
  FeedbackModalData,
  FeedbackModalResultado,
} from 'shared/components/feedback-modal/feedback-modal.component';
import { SuccessModalComponent } from 'shared/components/success-modal/success-modal.component';

/** Espera a tela carregar antes de pedir feedback. */
export const FEEDBACK_ATRASO_MS = 4000;

@Component({
    selector: 'app-logged',
    templateUrl: './logged.component.html',
    styleUrls: ['./logged.component.scss'],
    standalone: false
})
export class LoggedComponent implements OnInit, OnDestroy {
  sidebarStatus: boolean = false;
  isMobile: boolean = false;
  showOverlay: boolean = false;

  private feedbackTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private sidebar: SidebarService,
    private authService: AuthService,
    private feedbackService: FeedbackService,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit() {
    this.sidebar.getStatus().subscribe((status) => {
      this.sidebarStatus = status;
    });

    this.sidebar.isMobile().subscribe((mobile) => {
      this.isMobile = mobile;
    });

    this.feedbackTimer = setTimeout(
      () => this.pedirFeedbackSeNecessario(),
      FEEDBACK_ATRASO_MS,
    );
  }

  ngOnDestroy(): void {
    clearTimeout(this.feedbackTimer);
  }

  onShowOverlay(show: boolean) {
    this.showOverlay = show;
  }

  fecharSidebarMobile(): void {
    if (this.isMobile && this.sidebarStatus) {
      this.sidebar.changeStatus();
    }
  }

  fecharSidebarAoClicarConteudo(): void {
    if (this.sidebarStatus) {
      this.sidebar.close();
    }
  }

  pedirFeedbackSeNecessario(): void {
    const usuario = this.authService.getCurrentUser();
    if (!usuario || !this.feedbackService.deveExibir(usuario.id)) return;

    this.abrirFeedback();
  }

  abrirFeedback(): void {
    if (this.dialog.openDialogs.length) return;

    const usuario = this.authService.getCurrentUser();
    if (usuario) {
      this.feedbackService.adiar(usuario.id);
    }

    const data: FeedbackModalData = { pagina: this.router.url };
    this.dialog
      .open<FeedbackModalComponent, FeedbackModalData, FeedbackModalResultado>(
        FeedbackModalComponent,
        {
          width: 'min(440px, 96vw)',
          data,
          autoFocus: false,
          disableClose: true,
        },
      )
      .afterClosed()
      .subscribe((resultado) => {
        if (resultado === 'enviado') {
          this.dialog.open(SuccessModalComponent, {
            width: 'min(420px, 96vw)',
            data: {
              title: 'Obrigado!',
              message: 'Seu feedback foi enviado.',
              confirmText: 'OK',
              autoCloseMs: 2500,
            },
          });
        }
      });
  }
}
