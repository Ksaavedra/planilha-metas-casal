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
import { Investimento } from '@core/interfaces/investimentos/investimentos';
import { TIPOS_INVESTIMENTO_OPCOES } from '@core/constants/investimentos-tipos.constant';
import { HttpErrorResponse } from '@angular/common/http';
import { InvestimentosService } from '@core/services/investimentos/investimentos.service';
import { UsuariosService } from '@core/services/usuarios/usuarios.service';
import { map, merge, Observable, startWith, Subject, Subscription } from 'rxjs';

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
export class AdicionarInvestimentoDialogComponent implements OnInit, OnDestroy {
  readonly tipos = TIPOS_INVESTIMENTO_OPCOES;
  readonly statusOpcoes = [
    { value: 'crescendo', label: 'Crescendo' },
    { value: 'estavel', label: 'Estável' },
    { value: 'finalizado', label: 'Finalizado' },
  ];

  pessoasAutocompleteOptions: string[] = [];
  filteredPessoas$!: Observable<string[]>;
  listaAutocompletePessoaAtiva = false;

  private pessoasApiSub?: Subscription;
  private readonly pessoasOpcoesAtualizadas$ = new Subject<void>();

  form: FormGroup;
  saving = false;
  erro: string | null = null;

  get isEdicao(): boolean {
    return this.data.investimento != null;
  }

  get tituloDialog(): string {
    return this.isEdicao ? 'Editar investimento' : 'Incluir investimento';
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarInvestimentoDialogData,
    private dialogRef: MatDialogRef<
      AdicionarInvestimentoDialogComponent,
      boolean | undefined
    >,
    private fb: FormBuilder,
    private investimentosService: InvestimentosService,
    private usuariosService: UsuariosService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      descricao: ['', Validators.required],
      pessoa: [''],
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
        pessoa: inv.pessoa ?? '',
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
    this.configurarFiltroPessoas();
    this.carregarPessoasOpcoes();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.pessoasApiSub?.unsubscribe();
    this.pessoasOpcoesAtualizadas$.complete();
  }

  private configurarFiltroPessoas(): void {
    const pessoaCtrl = this.form.get('pessoa')!;
    this.filteredPessoas$ = merge(
      pessoaCtrl.valueChanges,
      this.pessoasOpcoesAtualizadas$,
    ).pipe(
      map(() => this._filterPessoa(this.getPessoaFiltroValue())),
      startWith(this._filterPessoa(this.getPessoaFiltroValue())),
    );
  }

  private getPessoaFiltroValue(): string {
    return String(this.form.get('pessoa')?.value ?? '').trim();
  }

  private _filterPessoa(value: string): string[] {
    if (!this.listaAutocompletePessoaAtiva) {
      return [];
    }
    const filterValue = value.toLowerCase();
    return this.pessoasAutocompleteOptions.filter((option) =>
      option.toLowerCase().includes(filterValue),
    );
  }

  onPessoaFieldFocus(): void {
    if (this.listaAutocompletePessoaAtiva) {
      return;
    }
    this.listaAutocompletePessoaAtiva = true;
    this.pessoasOpcoesAtualizadas$.next();
    this.cdr.markForCheck();
  }

  onPessoaBlur(): void {
    const ctrl = this.form.get('pessoa');
    const v = String(ctrl?.value || '');
    const formatado = this.toTitleCase(v);
    if (formatado && formatado !== v) {
      ctrl?.setValue(formatado, { emitEvent: true });
    }
  }

  /** Busca nomes cadastrados em /api/usuarios para o autocomplete. */
  private carregarPessoasOpcoes(): void {
    this.pessoasApiSub = this.usuariosService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.pessoasAutocompleteOptions = this.normalizarListaNomes(
          usuarios.map((u) => u.nome),
        );
        this.pessoasOpcoesAtualizadas$.next();
        this.cdr.markForCheck();
      },
    });
  }

  private normalizarListaNomes(bruto: (string | null | undefined)[]): string[] {
    const nomes = (bruto || [])
      .map((p) => this.toTitleCase((p || '').trim()))
      .filter(Boolean);
    const vistos = new Set<string>();
    return nomes
      .filter((n) => {
        const key = n.toLowerCase();
        if (vistos.has(key)) return false;
        vistos.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  private toTitleCase(value: string): string {
    if (!value?.trim()) return value;
    return value
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private pessoaTextoParaSalvar(): string {
    return String(this.form.get('pessoa')?.value ?? '').trim();
  }

  fechar(): void {
    this.dialogRef.close(false);
  }

  salvar(): void {
    this.erro = null;
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      this.erro = 'Preencha objetivo, tipo e valores obrigatórios.';
      this.cdr.markForCheck();
      return;
    }

    const pessoaTrim = this.toTitleCase(this.pessoaTextoParaSalvar());
    if (pessoaTrim) {
      this.form.get('pessoa')?.setValue(pessoaTrim, { emitEvent: false });
    }

    const v = this.form.getRawValue();
    const valorInvestido = Number(v.valorInvestido);
    const valorAtual =
      v.valorAtual != null && v.valorAtual !== ''
        ? Number(v.valorAtual)
        : valorInvestido;

    const payload = {
      descricao: String(v.descricao).trim(),
      pessoa: pessoaTrim || undefined,
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

    const request$ = this.data.investimento
      ? this.investimentosService.updateInvestimento(
          this.data.investimento.id,
          payload,
        )
      : this.investimentosService.createInvestimento(payload);

    const salvarInvestimento = (): void => {
      request$.subscribe({
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
    };

    if (pessoaTrim) {
      this.usuariosService.createUsuario(pessoaTrim).subscribe({
        next: salvarInvestimento,
        error: () => salvarInvestimento(),
      });
    } else {
      salvarInvestimento();
    }
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
