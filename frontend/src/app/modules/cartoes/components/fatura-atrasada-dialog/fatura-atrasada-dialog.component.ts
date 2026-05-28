import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { Cartao } from '@core/interfaces/cartoes/cartoes';

export interface FaturaAtrasadaDialogData {
  cartao: Cartao;
}

export type FaturaAtrasadaDialogResult =
  | { acao: 'pagar'; valorPago: number }
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
    return Math.max(0, this.data.cartao.valorUtilizado || 0);
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
        [Validators.required, Validators.min(this.valorEmAberto || 0.01)],
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

    this.dialogRef.close({ acao: 'pagar', valorPago });
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
