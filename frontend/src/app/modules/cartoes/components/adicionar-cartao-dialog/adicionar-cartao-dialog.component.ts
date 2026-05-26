import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { Cartao, CreateCartaoRequest } from '@core/interfaces/cartoes/cartoes';
import { CartoesService } from '@core/services/cartoes/cartoes.service';
import { INSTITUICOES_DIVIDA_OPCOES } from '@core/constants/dividas-instituicoes.constant';

export interface AdicionarCartaoDialogData {
  cartao: Cartao | null;
}

@Component({
  selector: 'app-adicionar-cartao-dialog',
  templateUrl: './adicionar-cartao-dialog.component.html',
  styleUrl: './adicionar-cartao-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdicionarCartaoDialogComponent implements OnInit {
  readonly bancos = INSTITUICOES_DIVIDA_OPCOES;

  form: FormGroup;
  saving = false;
  erro: string | null = null;

  get isEdicao(): boolean {
    return this.data.cartao != null;
  }

  get tituloDialog(): string {
    return this.isEdicao ? 'Editar cartão' : 'Adicionar cartão';
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarCartaoDialogData,
    private dialogRef: MatDialogRef<
      AdicionarCartaoDialogComponent,
      boolean | undefined
    >,
    private fb: FormBuilder,
    private cartoesService: CartoesService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      banco: ['', Validators.required],
      limite: [null, [Validators.required, Validators.min(0.01)]],
      diaFechamento: [null, [Validators.min(1), Validators.max(31)]],
      diaVencimento: [null, [Validators.min(1), Validators.max(31)]],
      diaMelhorCompra: [null, [Validators.min(1), Validators.max(31)]],
    });
  }

  ngOnInit(): void {
    const c = this.data.cartao;
    if (c) {
      this.form.patchValue({
        nome: c.nome,
        banco: c.banco,
        limite: c.limite,
        diaFechamento: c.diaFechamento ?? null,
        diaVencimento: c.diaVencimento ?? null,
        diaMelhorCompra: c.diaMelhorCompra ?? null,
      });
    }
    this.cdr.markForCheck();
  }

  fechar(): void {
    this.dialogRef.close(false);
  }

  salvar(): void {
    this.erro = null;
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      this.erro = 'Preencha nome, banco e limite do cartão.';
      this.cdr.markForCheck();
      return;
    }

    const v = this.form.getRawValue();
    const payload: CreateCartaoRequest = {
      nome: String(v.nome).trim(),
      banco: String(v.banco).trim(),
      limite: Number(v.limite),
      faturaPaga:
        Number(v.valorUtilizado) > 0
          ? false
          : (this.data.cartao?.faturaPaga ?? false),
      valorFaturaPaga:
        Number(v.valorUtilizado) > 0
          ? 0
          : (this.data.cartao?.valorFaturaPaga ?? 0),
      diaFechamento: Number(v.diaFechamento) || undefined,
      diaVencimento: Number(v.diaVencimento) || undefined,
      diaMelhorCompra: Number(v.diaMelhorCompra) || undefined,
    };

    this.saving = true;
    const request$ = this.data.cartao
      ? this.cartoesService.updateCartao(this.data.cartao.id, payload)
      : this.cartoesService.createCartao(payload);

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

  private mensagemErroHttp(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Servidor indisponível. Inicie o backend na pasta backend (npm start).';
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
