import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotaFeedback } from '@core/interfaces/feedback/feedback';
import { FeedbackService } from '@core/services/feedback/feedback.service';
import {
  TELAS_FEEDBACK,
  TelaFeedback,
  telaFeedbackDaUrl,
} from '@core/constants/feedback-telas.constant';

export interface FeedbackModalData {
  pagina?: string;
}

export type FeedbackModalResultado = 'enviado' | 'adiado';

interface OpcaoNota {
  nota: NotaFeedback;
  icone: string;
  label: string;
}

@Component({
  selector: 'app-feedback-modal',
  templateUrl: './feedback-modal.component.html',
  styleUrls: ['./feedback-modal.component.scss'],
  standalone: false,
})
export class FeedbackModalComponent {
  readonly comentarioMax = 1000;
  readonly opcoes: OpcaoNota[] = [
    { nota: 1, icone: 'sentiment_very_dissatisfied', label: 'Muito ruim' },
    { nota: 2, icone: 'sentiment_dissatisfied', label: 'Ruim' },
    { nota: 3, icone: 'sentiment_neutral', label: 'Ok' },
    { nota: 4, icone: 'sentiment_satisfied', label: 'Bom' },
    { nota: 5, icone: 'sentiment_very_satisfied', label: 'Adorei' },
  ];
  readonly telas = TELAS_FEEDBACK;

  nota: NotaFeedback | null = null;
  tela: TelaFeedback;
  comentario = '';
  enviando = false;
  erro: string | null = null;

  constructor(
    private feedbackService: FeedbackService,
    private dialogRef: MatDialogRef<FeedbackModalComponent, FeedbackModalResultado>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: FeedbackModalData | null,
  ) {
    this.tela = telaFeedbackDaUrl(data?.pagina);
  }

  get labelNotaSelecionada(): string {
    return this.opcoes.find((o) => o.nota === this.nota)?.label ?? '';
  }

  selecionarNota(nota: NotaFeedback): void {
    this.nota = nota;
    this.erro = null;
  }

  enviar(): void {
    if (this.nota === null || this.enviando) return;

    this.enviando = true;
    this.erro = null;

    const comentario = this.comentario.trim();
    this.feedbackService
      .enviar({
        nota: this.nota,
        comentario: comentario || undefined,
        pagina: this.tela.label,
      })
      .subscribe({
        next: () => {
          this.enviando = false;
          this.dialogRef.close('enviado');
        },
        error: () => {
          this.enviando = false;
          this.erro = 'Não foi possível enviar agora. Tente novamente.';
        },
      });
  }

  agoraNao(): void {
    this.dialogRef.close('adiado');
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.agoraNao();
    }
  }
}
