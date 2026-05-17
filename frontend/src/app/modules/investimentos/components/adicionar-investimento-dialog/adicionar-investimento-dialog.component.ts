import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Investimento } from '@core/interfaces/investimentos/investimentos';
import { TIPOS_INVESTIMENTO_OPCOES } from '@core/constants/investimentos-tipos.constant';
import { HttpErrorResponse } from '@angular/common/http';
import { InvestimentosService } from '@core/services/investimentos/investimentos.service';

export interface AdicionarInvestimentoDialogData {
  investimento: Investimento | null;
  ano: number;
}

@Component({
  selector: 'app-adicionar-investimento-dialog',
  templateUrl: './adicionar-investimento-dialog.component.html',
  styleUrl: './adicionar-investimento-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdicionarInvestimentoDialogComponent implements OnInit {
  readonly tipos = TIPOS_INVESTIMENTO_OPCOES;
  readonly statusOpcoes = [
    { value: 'crescendo', label: 'Crescendo' },
    { value: 'estavel', label: 'Estável' },
    { value: 'finalizado', label: 'Finalizado' },
  ];

  form: FormGroup;
  saving = false;
  erro: string | null = null;

  get titulo(): string {
    return this.data.investimento ? 'Editar investimento' : 'Adicionar investimento';
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarInvestimentoDialogData,
    private dialogRef: MatDialogRef<
      AdicionarInvestimentoDialogComponent,
      boolean | undefined
    >,
    private fb: FormBuilder,
    private investimentosService: InvestimentosService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      descricao: ['', Validators.required],
      tipoInvestimento: ['', Validators.required],
      valorInvestido: [null, [Validators.required, Validators.min(0.01)]],
      valorAtual: [null, [Validators.required, Validators.min(0)]],
      aporteMensal: [0, [Validators.min(0)]],
      statusInvestimento: ['crescendo', Validators.required],
      instituicao: [''],
      dataInicio: [''],
      observacoes: [''],
    });
  }

  ngOnInit(): void {
    const inv = this.data.investimento;
    if (inv) {
      this.form.patchValue({
        descricao: inv.descricao,
        tipoInvestimento: inv.tipoInvestimento,
        valorInvestido: inv.valorInvestido,
        valorAtual: inv.valorAtual,
        aporteMensal: inv.aporteMensal ?? 0,
        statusInvestimento: inv.statusInvestimento,
        instituicao: inv.instituicao ?? '',
        dataInicio: inv.dataInicio ?? '',
        observacoes: inv.observacoes ?? '',
      });
    } else {
      this.form.get('valorAtual')?.setValue(null);
    }
    this.cdr.markForCheck();
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  salvar(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      this.erro = 'Preencha objetivo, tipo e valores obrigatórios.';
      this.cdr.markForCheck();
      return;
    }

    const v = this.form.getRawValue();
    const valorInvestido = Number(v.valorInvestido);
    const valorAtual =
      v.valorAtual != null && v.valorAtual !== ''
        ? Number(v.valorAtual)
        : valorInvestido;

    const payload = {
      descricao: String(v.descricao).trim(),
      tipoInvestimento: v.tipoInvestimento,
      valorInvestido,
      valorAtual,
      aporteMensal: Number(v.aporteMensal) || 0,
      statusInvestimento: v.statusInvestimento,
      instituicao: v.instituicao ? String(v.instituicao).trim() : undefined,
      ano: this.data.ano,
      dataInicio: v.dataInicio || undefined,
      observacoes: v.observacoes ? String(v.observacoes).trim() : undefined,
    };

    this.saving = true;
    this.erro = null;

    const req = this.data.investimento
      ? this.investimentosService.updateInvestimento(
          this.data.investimento.id,
          payload,
        )
      : this.investimentosService.createInvestimento(payload);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.dialogRef.close(true);
      },
      error: (err: unknown) => {
        this.saving = false;
        this.erro = this.mensagemErroHttp(err, 'salvar');
        this.cdr.markForCheck();
      },
    });
  }

  private mensagemErroHttp(err: unknown, acao: 'salvar' | 'carregar'): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Servidor indisponível. Inicie o backend na pasta backend (npm start).';
      }
      if (err.status === 404) {
        return 'Rota de investimentos não encontrada. Reinicie o servidor backend para carregar a API nova.';
      }
      const apiMsg =
        typeof err.error === 'object' && err.error && 'error' in err.error
          ? String((err.error as { error: string }).error)
          : '';
      if (apiMsg) {
        return apiMsg;
      }
    }
    return acao === 'salvar'
      ? 'Não foi possível salvar. Tente novamente.'
      : 'Não foi possível carregar os investimentos.';
  }
}
