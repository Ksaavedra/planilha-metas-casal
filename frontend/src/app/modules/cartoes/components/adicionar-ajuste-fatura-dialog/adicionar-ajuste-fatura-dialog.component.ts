import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { Divida } from '@core/interfaces/dividas/dividas';
import { DividasService } from '@core/services/dividas/dividas.service';
import {
  CATEGORIAS_AJUSTE_FATURA,
  TIPO_DIVIDA_AJUSTE_FATURA,
  arredondarMoeda,
  labelCategoriaAjuste,
} from '@core/utils/fatura-resumo.util';
import { dataInicioFatura } from '@core/utils/fatura-cartao.util';

export interface AdicionarAjusteFaturaDialogData {
  cartao: Cartao;
  ano: number;
  mes: number;
  ajuste?: Divida;
}

@Component({
  selector: 'app-adicionar-ajuste-fatura-dialog',
  templateUrl: './adicionar-ajuste-fatura-dialog.component.html',
  styleUrl: './adicionar-ajuste-fatura-dialog.component.scss',
  standalone: false,
})
export class AdicionarAjusteFaturaDialogComponent {
  form: FormGroup;
  saving = false;
  erro: string | null = null;

  readonly categorias = CATEGORIAS_AJUSTE_FATURA;

  get editando(): boolean {
    return !!this.data.ajuste;
  }

  get valorAssinadoPreview(): number {
    const v = this.form.getRawValue();
    const valor = Math.abs(Number(v.valor) || 0);
    const cat = CATEGORIAS_AJUSTE_FATURA.find((c) => c.id === v.categoria);
    if (!valor || !cat) return 0;
    return cat.credito ? -valor : valor;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarAjusteFaturaDialogData,
    private dialogRef: MatDialogRef<
      AdicionarAjusteFaturaDialogComponent,
      boolean | undefined
    >,
    private fb: FormBuilder,
    private dividasService: DividasService,
  ) {
    const ajuste = data.ajuste;
    const categoria = ajuste?.objetivo ?? 'credito_fatura_anterior';
    const valorAbs = ajuste ? Math.abs(ajuste.valorTotal || 0) : null;

    this.form = this.fb.group({
      categoria: [categoria, Validators.required],
      valor: [valorAbs, [Validators.required, Validators.min(0.01)]],
      observacoes: [ajuste?.observacoes ?? ''],
    });
  }

  fechar(): void {
    this.dialogRef.close(false);
  }

  excluir(): void {
    if (!this.data.ajuste || this.saving) return;

    this.erro = null;
    this.saving = true;

    this.dividasService.deleteDivida(this.data.ajuste.id).subscribe({
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

  salvar(): void {
    this.erro = null;
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      this.erro = 'Preencha categoria e valor.';
      return;
    }

    const v = this.form.getRawValue();
    const valorAssinado = arredondarMoeda(this.valorAssinadoPreview);
    const dataInicio = dataInicioFatura(this.data.ano, this.data.mes);

    this.saving = true;

    const payload = {
      objetivo: String(v.categoria),
      tipoDivida: TIPO_DIVIDA_AJUSTE_FATURA,
      valorTotal: valorAssinado,
      quantidadeParcelas: 1,
      cartaoId: this.data.cartao.id,
      diaMelhorCompra: this.data.cartao.diaMelhorCompra ?? undefined,
      diaVencimento: this.data.cartao.diaVencimento ?? undefined,
      ano: this.data.ano,
      dataInicio,
      observacoes: v.observacoes ? String(v.observacoes).trim() : '',
      statusDivida: 'quitada' as const,
    };

    const request$ = this.data.ajuste
      ? this.dividasService.updateDivida(this.data.ajuste.id, payload)
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

  labelCategoria(id: string): string {
    return labelCategoriaAjuste(id);
  }

  private mensagemErroHttp(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'Servidor indisponível. Inicie o backend.';
      const apiMsg =
        typeof err.error === 'object' && err.error && 'error' in err.error
          ? String((err.error as { error: string }).error)
          : '';
      if (apiMsg) return apiMsg;
    }
    return 'Não foi possível salvar o ajuste.';
  }
}
