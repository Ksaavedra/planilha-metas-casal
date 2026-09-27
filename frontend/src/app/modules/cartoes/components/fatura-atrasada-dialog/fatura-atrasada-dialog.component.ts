import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { Cartao } from '@core/interfaces/cartoes/cartoes';

export interface FaturaAtrasadaDialogData {
  cartao: Cartao;
  valorEmAberto?: number;
}

export type FaturaAtrasadaDialogResult =
  | { acao: 'pagar'; valorPago: number; previsaoPagamento: string }
  | { acao: 'depois'; observacaoAtraso?: string; previsaoPagamento?: string };

@Component({
  selector: 'app-fatura-atrasada-dialog',
  templateUrl: './fatura-atrasada-dialog.component.html',
  styleUrl: './fatura-atrasada-dialog.component.scss',
  standalone: false,
})
export class FaturaAtrasadaDialogComponent {
  form: FormGroup;
  erro: string | null = null;

  get valorEmAberto(): number {
    const informado = this.data.valorEmAberto;
    if (informado != null && Number.isFinite(informado)) {
      return Math.max(0, Math.round(informado * 100) / 100);
    }
    return Math.max(0, Math.round((this.data.cartao.valorUtilizado || 0) * 100) / 100);
  }

  get podePagarDepois(): boolean {
    return Boolean(this.form.get('previsaoPagamento')?.value);
  }

  get podePagarAgora(): boolean {
    const valorPago = Number(this.form.get('valorPago')?.value) || 0;
    return (
      valorPago >= this.valorEmAberto &&
      this.valorEmAberto > 0 &&
      this.podePagarDepois
    );
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FaturaAtrasadaDialogData,
    private dialogRef: MatDialogRef<
      FaturaAtrasadaDialogComponent,
      FaturaAtrasadaDialogResult | undefined
    >,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      valorPago: [
        this.valorEmAberto,
        [Validators.required, Validators.min(0.01)],
      ],
      observacaoAtraso: [data.cartao.observacaoAtraso ?? ''],
      previsaoPagamento: [data.cartao.previsaoPagamento ?? '', Validators.required],
    });
  }

  fechar(): void {
    this.dialogRef.close();
  }

  pagarAgora(): void {
    this.erro = null;
    const valorPago = Number(this.form.get('valorPago')?.value) || 0;

    if (!this.podePagarDepois) {
      this.erro = 'Informe a previsão de pagamento.';
      this.form.get('previsaoPagamento')?.markAsTouched();
      return;
    }

    if (!this.podePagarAgora) {
      this.erro = 'Informe o valor total em aberto para regularizar a fatura.';
      this.form.get('valorPago')?.markAsTouched();
      return;
    }

    this.dialogRef.close({
      acao: 'pagar',
      valorPago,
      previsaoPagamento: String(
        this.form.get('previsaoPagamento')?.value || '',
      ).slice(0, 10),
    });
  }

  pagarDepois(): void {
    this.erro = null;
    const v = this.form.getRawValue();
    if (!this.podePagarDepois) {
      this.erro = 'Informe a previsão de pagamento para pagar depois.';
      this.form.get('previsaoPagamento')?.markAsTouched();
      return;
    }

    this.dialogRef.close({
      acao: 'depois',
      observacaoAtraso: v.observacaoAtraso
        ? String(v.observacaoAtraso).trim()
        : undefined,
      previsaoPagamento: v.previsaoPagamento || undefined,
    });
  }
}
