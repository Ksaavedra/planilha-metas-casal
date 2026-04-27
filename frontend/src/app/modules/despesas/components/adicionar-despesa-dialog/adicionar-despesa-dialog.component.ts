import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { merge, Observable, Subject, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import {
  Despesa,
  DespesasService,
  NaturezaDespesa,
} from 'app/core/services/despesas/despesas.service';
import { ReceitasService } from 'app/core/services/receitas/receitas.service';
import { listaCategoriasSugestao } from '../../despesas-categorias.suggestions';

export interface AdicionarDespesaDialogData {
  /** `null` = nova despesa; caso contrário, edição. */
  despesa: Despesa | null;
  ano: number;
  mes: number;
}

@Component({
  selector: 'app-adicionar-despesa-dialog',
  templateUrl: './adicionar-despesa-dialog.component.html',
  styleUrls: ['./adicionar-despesa-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdicionarDespesaDialogComponent implements OnInit, OnDestroy {
  /** Pessoas distintas das receitas (cache + API), como no adicionar-usuário. */
  pessoasAutocompleteOptions: string[] = [];

  filteredPessoas$!: Observable<string[]>;

  /** Opções do select (sugestões + valor atual se for legado, fora da lista). */
  categoriasOpcoes: string[] = [];

  private naturezaSub?: Subscription;
  private pessoasApiSub?: Subscription;
  /** Atualiza a lista do autocomplete sem escrever no FormControl (evita limpar a escolha da lista). */
  private readonly pessoasOpcoesAtualizadas$ = new Subject<void>();

  @ViewChild('pessoaInput')
  private pessoaInputRef?: ElementRef<HTMLInputElement>;

  form: FormGroup;
  saving = false;
  erro: string | null = null;

  get isEdicao(): boolean {
    return this.data.despesa != null;
  }

  get tituloDialog(): string {
    return this.isEdicao ? 'Editar despesa' : 'Incluir despesa';
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarDespesaDialogData,
    private dialogRef: MatDialogRef<
      AdicionarDespesaDialogComponent,
      boolean | undefined
    >,
    private fb: FormBuilder,
    private despesasService: DespesasService,
    private receitasService: ReceitasService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      pessoa: ['', [Validators.required, Validators.minLength(2)]],
      natureza: ['fixa' as NaturezaDespesa, Validators.required],
      categoria: ['', Validators.required],
      descricao: ['', [Validators.required, Validators.maxLength(200)]],
      valor: [
        null as number | null,
        [Validators.required, Validators.min(0.01)],
      ],
      data: [''],
    });
  }

  ngOnInit(): void {
    const d = this.data.despesa;
    if (d) {
      this.form.patchValue(
        {
          pessoa: d.pessoa ?? '',
          natureza: d.natureza,
          categoria: d.categoria,
          descricao: d.descricao,
          valor: d.valor,
          data: d.data || '',
        },
        { emitEvent: false },
      );
    } else {
      this.form.reset(
        {
          pessoa: '',
          natureza: 'fixa',
          categoria: '',
          descricao: '',
          valor: null,
          data: this.dataDefaultIso(),
        },
        { emitEvent: false },
      );
    }

    const pessoaCtrl = this.form.get('pessoa')!;
    this.filteredPessoas$ = merge(
      pessoaCtrl.valueChanges,
      this.pessoasOpcoesAtualizadas$,
    ).pipe(
      map(() => this._filterPessoa(String(pessoaCtrl.value ?? ''))),
      startWith(this._filterPessoa(String(pessoaCtrl.value ?? ''))),
    );

    this.carregarPessoasOpcoes();

    this.atualizarCategoriasOpcoes();
    this.naturezaSub = this.form.get('natureza')?.valueChanges.subscribe(() => {
      const n = (this.form.get('natureza')?.value || 'fixa') as NaturezaDespesa;
      const lista = listaCategoriasSugestao(n);
      const cur = String(this.form.get('categoria')?.value || '').trim();
      if (cur && !lista.includes(cur)) {
        this.form.patchValue({ categoria: '' }, { emitEvent: false });
      }
      this.atualizarCategoriasOpcoes();
    });
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.naturezaSub?.unsubscribe();
    this.pessoasApiSub?.unsubscribe();
    this.pessoasOpcoesAtualizadas$.complete();
  }

  private toTitleCase(value: string): string {
    if (!value || !value.trim()) return value;
    return value
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private _filterPessoa(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.pessoasAutocompleteOptions.filter((option) =>
      option.toLowerCase().includes(filterValue),
    );
  }

  /** Normaliza e deduplica, igual ao adicionar-usuário (receitas). */
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
      .sort((a, b) => a.localeCompare(b));
  }

  private carregarPessoasOpcoes(): void {
    this.pessoasAutocompleteOptions = this.normalizarListaNomes(
      this.receitasService.getPessoasCache(),
    );
    this.pessoasOpcoesAtualizadas$.next();
    this.cdr.markForCheck();

    this.pessoasApiSub = this.receitasService
      .loadPessoasDistintas()
      .subscribe((pessoas) => {
        this.pessoasAutocompleteOptions = this.normalizarListaNomes(
          pessoas || [],
        );
        this.pessoasOpcoesAtualizadas$.next();
        this.cdr.markForCheck();
      });
  }

  /** Nome a gravar: FormControl, ou o texto do input (corrige desfasamento com o autocomplete). */
  private pessoaTextoParaSalvar(): string {
    const ctrl = this.form.get('pessoa');
    const doForm = String(ctrl?.value ?? '').trim();
    if (doForm) {
      return doForm;
    }
    return String(this.pessoaInputRef?.nativeElement?.value ?? '').trim();
  }

  onPessoaBlur(): void {
    const ctrl = this.form.get('pessoa');
    const v = String(ctrl?.value || '');
    const formatado = this.toTitleCase(v);
    if (formatado && formatado !== v) {
      ctrl?.setValue(formatado, { emitEvent: true });
    }
  }

  /** Alinha o <select> com a lista fixa/variável; mantém categoria legada visível. */
  private atualizarCategoriasOpcoes(): void {
    const n = (this.form.get('natureza')?.value || 'fixa') as NaturezaDespesa;
    const lista = listaCategoriasSugestao(n);
    const cur = String(this.form.get('categoria')?.value || '').trim();
    this.categoriasOpcoes =
      cur && !lista.includes(cur) ? [cur, ...lista] : [...lista];
  }

  fechar(): void {
    this.dialogRef.close();
  }

  salvar(): void {
    this.erro = null;
    const pessoaTrim = this.toTitleCase(this.pessoaTextoParaSalvar());
    if (pessoaTrim) {
      this.form.get('pessoa')?.setValue(pessoaTrim, { emitEvent: true });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }
    const v = this.form.value;
    const dataStr =
      v.data && String(v.data).trim() !== '' ? String(v.data).trim() : null;
    const payload = {
      pessoa: pessoaTrim,
      natureza: v.natureza as NaturezaDespesa,
      categoria: String(v.categoria).trim(),
      descricao: String(v.descricao).trim(),
      valor: Number(v.valor),
      data: dataStr,
      ano: this.data.ano,
      mes: this.data.mes,
    };
    this.saving = true;
    this.cdr.markForCheck();
    const onOk = () => {
      this.saving = false;
      this.dialogRef.close(true);
    };
    const onErr = (e: { error?: { error?: string }; message?: string }) => {
      this.saving = false;
      this.erro = e?.error?.error || e?.message || 'Não foi possível salvar.';
      this.cdr.markForCheck();
    };
    if (this.isEdicao) {
      this.despesasService
        .updateDespesa(this.data.despesa!.id, payload)
        .subscribe({ next: onOk, error: onErr });
    } else {
      this.despesasService
        .createDespesa(payload)
        .subscribe({ next: onOk, error: onErr });
    }
  }

  private dataDefaultIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
