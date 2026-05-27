import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { Divida } from '@core/interfaces/dividas/dividas';
import { TIPOS_DIVIDA_OPCOES } from '@core/constants/dividas-tipos.constant';
import { DividasService } from '@core/services/dividas/dividas.service';
import { CartoesService } from '@core/services/cartoes/cartoes.service';
import {
  calcularParcelaMensal,
  calcularValorPagoAcumulado,
  projetarDividaNoMes,
} from '@core/utils/dividas.util';

type ContextoDividas = 'emprestimos' | 'financiamentos';

export interface AdicionarDividaDialogData {
  divida: Divida | null;
  ano: number;
  mes?: number;
  contexto?: ContextoDividas;
}

@Component({
  selector: 'app-adicionar-divida-dialog',
  templateUrl: './adicionar-divida-dialog.component.html',
  styleUrl: './adicionar-divida-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdicionarDividaDialogComponent implements OnInit, OnDestroy {
  cartoes: Cartao[] = [];
  form: FormGroup;
  saving = false;
  erro: string | null = null;
  parcelaCalculada = 0;
  valorTotalForm = 0;
  quantidadeParcelasForm = 0;

  private formSub?: Subscription;

  get isEdicao(): boolean {
    return this.data.divida != null;
  }

  get tituloDialog(): string {
    const alvo =
      this.data.contexto === 'financiamentos' ? 'financiamento' : 'empréstimo';
    return this.isEdicao ? `Editar ${alvo}` : `Adicionar ${alvo}`;
  }

  get tipos() {
    const tipo =
      this.data.contexto === 'financiamentos' ? 'financiamento' : 'emprestimo';
    return TIPOS_DIVIDA_OPCOES.filter((t) => t.value === tipo);
  }

  get labelValorPago(): string {
    return this.data.mes ? 'Pago neste mês (R$)' : 'Valor já pago (R$)';
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarDividaDialogData,

    private dialogRef: MatDialogRef<
      AdicionarDividaDialogComponent,
      boolean | undefined
    >,
    private fb: FormBuilder,
    private dividasService: DividasService,
    private cartoesService: CartoesService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      objetivo: ['', Validators.required],
      tipoDivida: ['', Validators.required],
      valorTotal: [null, [Validators.required, Validators.min(0.01)]],
      valorPago: [0, [Validators.min(0)]],
      quantidadeParcelas: [null, [Validators.required, Validators.min(1)]],
      cartaoId: [''],
      dataInicio: [''],
      observacoes: [''],
    });
  }

  ngOnInit(): void {
    this.carregarCartoes();
    const d = this.data.divida;

    if (d) {
      const mes = this.data.mes ?? new Date().getMonth() + 1;
      const proj = projetarDividaNoMes(d, this.data.ano, mes);
      this.form.patchValue({
        objetivo: d.objetivo,
        tipoDivida: d.tipoDivida,
        valorTotal: d.valorTotal,
        valorPago: proj?.valorPagoNoMes ?? d.valorPago ?? 0,
        quantidadeParcelas: d.quantidadeParcelas ?? 1,
        cartaoId: d.cartaoId ?? '',
        dataInicio: d.dataInicio ?? '',
        observacoes: d.observacoes ?? '',
      });
    } else {
      const mes = this.data.mes ?? new Date().getMonth() + 1;
      const dia = String(new Date().getDate()).padStart(2, '0');
      const mm = String(mes).padStart(2, '0');

      this.form.patchValue({
        quantidadeParcelas: 1,

        tipoDivida:
          this.data.contexto === 'financiamentos'
            ? 'financiamento'
            : 'emprestimo',

        dataInicio: `${this.data.ano}-${mm}-${dia}`,
      });
    }

    this.formSub = this.form.valueChanges.subscribe(() => {
      this.atualizarParcelaCalculada();
    });
    this.atualizarParcelaCalculada();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.formSub?.unsubscribe();
  }

  fechar(): void {
    this.dialogRef.close(false);
  }

  salvar(): void {
    this.erro = null;

    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      this.erro =
        'Preencha objetivo, tipo, valor total e quantidade de parcelas.';
      this.cdr.markForCheck();

      return;
    }

    const v = this.form.getRawValue();
    const valorTotal = Number(v.valorTotal);
    const quantidadeParcelas = Number(v.quantidadeParcelas);
    const parcelaMensal = calcularParcelaMensal(valorTotal, quantidadeParcelas);
    const mes = this.data.mes ?? new Date().getMonth() + 1;
    const valorPagoNoMes = Number(v.valorPago) || 0;
    const valorPago = this.data.mes
      ? calcularValorPagoAcumulado(
          valorTotal,
          quantidadeParcelas,
          v.dataInicio || undefined,
          mes,
          valorPagoNoMes,
        )
      : valorPagoNoMes;

    const payload = {
      objetivo: String(v.objetivo).trim(),
      tipoDivida: v.tipoDivida,
      valorTotal,
      valorPago,
      parcelaMensal,
      quantidadeParcelas,
      cartaoId: v.cartaoId ? Number(v.cartaoId) : null,
      ano: this.data.ano,
      dataInicio: v.dataInicio || undefined,
      observacoes: v.observacoes ? String(v.observacoes).trim() : undefined,
    };

    this.saving = true;

    const request$ = this.data.divida
      ? this.dividasService.updateDivida(this.data.divida.id, payload)
      : this.dividasService.createDivida(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;

        this.dialogRef.close(true);
      },

      error: (err: unknown) => {
        this.saving = false;

        this.erro = this.mensagemErroHttp(err);

        this.cdr.markForCheck();
      },
    });
  }

  private atualizarParcelaCalculada(): void {
    const v = this.form.getRawValue();

    this.valorTotalForm = Number(v.valorTotal) || 0;
    this.quantidadeParcelasForm = Number(v.quantidadeParcelas) || 0;
    this.parcelaCalculada = calcularParcelaMensal(
      this.valorTotalForm,
      this.quantidadeParcelasForm,
    );
    this.cdr.markForCheck();
  }

  private carregarCartoes(): void {
    this.cartoesService.getCartoes().subscribe({
      next: (lista) => {
        this.cartoes = lista;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cartoes = [];
        this.cdr.markForCheck();
      },
    });
  }

  private mensagemErroHttp(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Servidor indisponível. Inicie o backend na pasta backend (npm start).';
      }

      if (err.status === 404) {
        return 'Rota de dívidas não encontrada. Reinicie o servidor backend.';
      }

      const apiMsg =
        typeof err.error === 'object' && err.error && 'error' in err.error
          ? String((err.error as { error: string }).error)
          : '';

      if (apiMsg) return apiMsg;
    }

    return 'Não foi possível salvar. Tente novamente.';
  }
}
