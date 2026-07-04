import { Component, Inject, OnDestroy, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Cartao } from '@core/interfaces/cartoes/cartoes';

import { Divida } from '@core/interfaces/dividas/dividas';

import { DividasService } from '@core/services/dividas/dividas.service';

import {
  calcularParcelaMensal,
  catalogoObjetivosCompraParcelamento,
  filtrarSugestoesObjetivoCompra,
  resolverObjetivoCompraSalvo,
  SugestaoObjetivoCompra,
} from '@core/utils/dividas.util';

import {
  compraNoPeriodoFatura,
  dataCompraPadraoNaFatura,
  dataInicioFatura,
  dataInicioParcelasDaCompra,
  labelFaturaMes,
  labelPrimeiraParcela,
  periodoCompraLimitesIso,
  periodoFaturaCartao,
} from '@core/utils/fatura-cartao.util';

import { forkJoin, map, merge, Observable, startWith, Subject, Subscription } from 'rxjs';

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
export class AdicionarParcelamentoDialogComponent implements OnInit, OnDestroy {
  form: FormGroup;

  saving = false;

  erro: string | null = null;

  comprasAutocompleteOptions: string[] = [];

  filteredCompras$!: Observable<SugestaoObjetivoCompra[]>;

  listaAutocompleteCompraAtiva = false;

  private comprasApiSub?: Subscription;

  private readonly comprasOpcoesAtualizadas$ = new Subject<void>();

  get editando(): boolean {
    return !!this.data.parcelamento;
  }

  get minQuantidadeParcelas(): number {
    return 1;
  }

  get parcelaCalculada(): number {
    const v = this.form.getRawValue();

    return calcularParcelaMensal(
      Number(v.valorTotal) || 0,

      Number(v.quantidadeParcelas) || 0,
    );
  }

  get primeiraParcelaLabel(): string {
    const dataCompra = this.form.get('dataCompra')?.value;

    if (!dataCompra) {
      return labelFaturaMes(this.data.ano, this.data.mes);
    }

    return labelPrimeiraParcela(
      dataCompra,
      this.data.cartao,
      this.faturaContexto,
    );
  }

  get faturaLabel(): string {
    return labelFaturaMes(this.data.ano, this.data.mes);
  }

  get periodoCompraLabel(): string | null {
    const periodo = periodoFaturaCartao(
      this.data.cartao,
      this.data.ano,
      this.data.mes,
    );
    return periodo?.periodoLabel ?? null;
  }

  get periodoCompraCompleto(): string | null {
    const periodo = periodoFaturaCartao(
      this.data.cartao,
      this.data.ano,
      this.data.mes,
    );
    if (!periodo) return null;
    return `${periodo.periodoInicioLabel} a ${periodo.periodoFimLabel}`;
  }

  get dataCompraMin(): string | null {
    return (
      periodoCompraLimitesIso(this.data.cartao, this.data.ano, this.data.mes)
        ?.min ?? null
    );
  }

  get dataCompraMax(): string | null {
    return (
      periodoCompraLimitesIso(this.data.cartao, this.data.ano, this.data.mes)
        ?.max ?? null
    );
  }

  private get faturaContexto(): { ano: number; mes: number } {
    return { ano: this.data.ano, mes: this.data.mes };
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
    const parcelamento = data.parcelamento;

    const dataCompraPadrao = parcelamento
      ? this.dataCompraDeParcelamento(parcelamento)
      : dataCompraPadraoNaFatura(data.cartao, data.ano, data.mes);

    this.form = this.fb.group({
      objetivo: [parcelamento?.objetivo ?? '', Validators.required],

      valorTotal: [
        parcelamento?.valorTotal ?? null,

        [Validators.required, Validators.min(0.01)],
      ],

      quantidadeParcelas: [
        parcelamento?.quantidadeParcelas ?? 1,

        [Validators.required, Validators.min(1)],
      ],

      dataCompra: [dataCompraPadrao, Validators.required],

      observacoes: [parcelamento?.observacoes ?? ''],
    });
  }

  ngOnInit(): void {
    this.configurarFiltroCompras();
    this.carregarComprasOpcoes();
  }

  ngOnDestroy(): void {
    this.comprasApiSub?.unsubscribe();
    this.comprasOpcoesAtualizadas$.complete();
  }

  fechar(): void {
    this.dialogRef.close(false);
  }

  onCompraFieldFocus(): void {
    if (this.listaAutocompleteCompraAtiva) return;
    this.listaAutocompleteCompraAtiva = true;
    this.comprasOpcoesAtualizadas$.next();
  }

  salvar(): void {
    this.erro = null;

    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();

      this.erro = 'Preencha descrição, valor e quantidade de parcelas.';

      return;
    }

    const v = this.form.getRawValue();

    const dataCompra = String(v.dataCompra).slice(0, 10);

    if (
      !this.editando &&
      !compraNoPeriodoFatura(dataCompra, this.data.cartao, this.faturaContexto)
    ) {
      const periodo = this.periodoCompraLabel;
      this.erro = periodo
        ? `A data da compra deve estar no período desta fatura (${periodo}).`
        : 'A data da compra deve estar no período desta fatura.';
      return;
    }

    const dataInicio = this.editando
      ? dataInicioParcelasDaCompra(
          dataCompra,
          this.data.cartao,
          this.faturaContexto,
        )
      : dataInicioFatura(this.data.ano, this.data.mes);

    this.saving = true;

    const objetivo = resolverObjetivoCompraSalvo(
      String(v.objetivo),
      this.comprasAutocompleteOptions,
    );

    const payload = {
      objetivo,

      tipoDivida: 'parcelamento',

      valorTotal: Number(v.valorTotal),

      quantidadeParcelas: Number(v.quantidadeParcelas),

      cartaoId: this.data.cartao.id,

      ...(this.data.cartao.diaMelhorCompra != null
        ? { diaMelhorCompra: this.data.cartao.diaMelhorCompra }
        : {}),
      ...(this.data.cartao.diaVencimento != null
        ? { diaVencimento: this.data.cartao.diaVencimento }
        : {}),

      ano: this.data.ano,

      dataCompra,
      dataInicio,

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

  private configurarFiltroCompras(): void {
    const objetivoCtrl = this.form.get('objetivo')!;

    this.filteredCompras$ = merge(
      objetivoCtrl.valueChanges,
      this.comprasOpcoesAtualizadas$,
    ).pipe(
      map(() => this.filtrarCompras(this.getObjetivoFiltroValue())),
      startWith(this.filtrarCompras(this.getObjetivoFiltroValue())),
    );
  }

  private carregarComprasOpcoes(): void {
    const anos = [this.data.ano, this.data.ano - 1];

    this.comprasApiSub = forkJoin(
      anos.map((ano) => this.dividasService.getDividas(ano)),
    )
      .pipe(map((listas) => listas.flat()))
      .subscribe({
        next: (dividas) => {
          this.comprasAutocompleteOptions = catalogoObjetivosCompraParcelamento(
            dividas,
            this.data.cartao.id,
          );
          this.comprasOpcoesAtualizadas$.next();
        },
        error: () => {
          this.comprasAutocompleteOptions = [];
          this.comprasOpcoesAtualizadas$.next();
        },
      });
  }

  private getObjetivoFiltroValue(): string {
    return String(this.form.get('objetivo')?.value ?? '').trim();
  }

  private filtrarCompras(termo: string): SugestaoObjetivoCompra[] {
    if (!this.listaAutocompleteCompraAtiva) {
      return [];
    }

    return filtrarSugestoesObjetivoCompra(
      this.comprasAutocompleteOptions,
      termo,
    );
  }

  private dataCompraDeParcelamento(parcelamento: Divida): string {
    if (parcelamento.dataCompra) {
      return parcelamento.dataCompra.slice(0, 10);
    }

    if (parcelamento.dataInicio) {
      return parcelamento.dataInicio.slice(0, 10);
    }

    return dataCompraPadraoNaFatura(
      this.data.cartao,

      this.data.ano,

      this.data.mes,
    );
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
}
