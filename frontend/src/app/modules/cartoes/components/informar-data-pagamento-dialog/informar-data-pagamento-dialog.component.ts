import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { dataHojeISO } from '@core/utils/cartoes.util';

export interface InformarDataPagamentoDialogData {
  cartao: Cartao;
}

@Component({
  selector: 'app-informar-data-pagamento-dialog',
  templateUrl: './informar-data-pagamento-dialog.component.html',
  styleUrl: './informar-data-pagamento-dialog.component.scss',
  standalone: false,
})
export class InformarDataPagamentoDialogComponent {
  form: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: InformarDataPagamentoDialogData,
    private dialogRef: MatDialogRef<
      InformarDataPagamentoDialogComponent,
      string | undefined
    >,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      dataPagamento: [dataHojeISO(), Validators.required],
    });
  }

  fechar(): void {
    this.dialogRef.close();
  }

  salvar(): void {
    const dataPagamento = String(
      this.form.get('dataPagamento')?.value || '',
    ).trim();
    if (!dataPagamento) {
      this.form.get('dataPagamento')?.markAsTouched();
      return;
    }
    this.dialogRef.close(dataPagamento);
  }
}
