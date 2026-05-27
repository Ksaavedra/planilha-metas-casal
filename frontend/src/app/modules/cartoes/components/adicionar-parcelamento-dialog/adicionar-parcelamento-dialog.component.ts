import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { Divida } from '@core/interfaces/dividas/dividas';
import { DividasService } from '@core/services/dividas/dividas.service';
import { calcularParcelaMensal } from '@core/utils/dividas.util';

export interface AdicionarParcelamentoDialogData {
  cartao: Cartao;
  ano: number;
  mes: number;
  parcelamento?: Divida;
}

@Component({
  selector: 'app-adicionar-parcelamento-dialog',
  templateUrl: './adicionar-parcelamento-dialog.component.html',
  styleUrl: './adicionar-parcelamento-dialog.component.scss',
  standalone: false,
})
export class AdicionarParcelamentoDialogComponent {
  form: FormGroup;
  saving = false;
  erro: string | null = null;

  get editando(): boolean {
    return !!this.data.parcelamento;
  }

  get parcelaCalculada(): number {
    const v = this.form.getRawValue();
    return calcularParcelaMensal(
      Number(v.valorTotal) || 0,
      Number(v.quantidadeParcelas) || 0,
    );
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarParcelamentoDialogData,
    private dialogRef: MatDialogRef<
      AdicionarParcelamentoDialogComponent,
      boolean | undefined
    >,
    private fb: FormBuilder,
    private dividasService: DividasService,
  ) {
    const dia = String(new Date().getDate()).padStart(2, '0');
    const mes = String(data.mes).padStart(2, '0');
    const parcelamento = data.parcelamento;

    this.form = this.fb.group({
      objetivo: [parcelamento?.objetivo ?? '', Validators.required],
      valorTotal: [
        parcelamento?.valorTotal ?? null,
        [Validators.required, Validators.min(0.01)],
      ],
      quantidadeParcelas: [
        parcelamento?.quantidadeParcelas ?? null,
        [Validators.required, Validators.min(2)],
      ],
      dataInicio: [
        this.dataInput(parcelamento?.dataInicio, `${data.ano}-${mes}-${dia}`),
        Validators.required,
      ],
      observacoes: [parcelamento?.observacoes ?? ''],
    });
  }

  fechar(): void {
    this.dialogRef.close(false);
  }

  salvar(): void {
    this.erro = null;
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      this.erro = 'Preencha descrição, valor e quantidade de parcelas.';
      return;
    }

    const v = this.form.getRawValue();
    this.saving = true;
    const payload = {
      objetivo: String(v.objetivo).trim(),
      tipoDivida: 'parcelamento',
      valorTotal: Number(v.valorTotal),
      quantidadeParcelas: Number(v.quantidadeParcelas),
      cartaoId: this.data.cartao.id,
      ano: this.data.ano,
      dataInicio: v.dataInicio,
      observacoes: v.observacoes ? String(v.observacoes).trim() : '',
    };
    const request$ = this.data.parcelamento
      ? this.dividasService.updateDivida(this.data.parcelamento.id, payload)
      : this.dividasService.createDivida({ ...payload, valorPago: 0 });

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.dialogRef.close(true);
      },
      error: (err: unknown) => {
        this.saving = false;
        this.erro = this.mensagemErroHttp(err);
      },
    });
  }

  private mensagemErroHttp(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Servidor indisponível. Inicie o backend.';
      }

      const apiMsg =
        typeof err.error === 'object' && err.error && 'error' in err.error
          ? String((err.error as { error: string }).error)
          : '';

      if (apiMsg) return apiMsg;
    }

    return 'Não foi possível salvar o parcelamento.';
  }

  private dataInput(valor: string | null | undefined, fallback: string): string {
    if (!valor) return fallback;
    return valor.slice(0, 10);
  }
}
