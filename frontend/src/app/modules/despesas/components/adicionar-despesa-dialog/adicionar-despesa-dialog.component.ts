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
import { DespesasService } from 'app/core/services/despesas/despesas.service';
import {
  Despesa,
  NaturezaDespesa,
} from '@app/core/interfaces/despesas/despesas';
import { listaCategoriasSugestao } from '../../despesas-categorias.suggestions';
import { UsuariosService } from '@app/core/services/usuarios/usuarios.service';

export interface AdicionarDespesaDialogData {
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
  @ViewChild('pessoaInput')
  pessoasAutocompleteOptions: string[] = [];
  filteredPessoas$!: Observable<string[]>;
  categoriasOpcoes: string[] = [];
  listaAutocompletePessoaAtiva = false;

  private naturezaSub?: Subscription;
  private pessoasApiSub?: Subscription;
  private readonly pessoasOpcoesAtualizadas$ = new Subject<void>();
  private pessoaInputRef?: ElementRef<HTMLInputElement>;

  form: FormGroup;
  saving = false;
  erro: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarDespesaDialogData,
    private dialogRef: MatDialogRef<
      AdicionarDespesaDialogComponent,
      boolean | undefined
    >,
    private fb: FormBuilder,
    private despesasService: DespesasService,
    private usuariosService: UsuariosService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      pessoa: ['', [Validators.required, Validators.minLength(2)]],
      natureza: ['', Validators.required],
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
    this.inicializarFormulario();
    this.configurarFiltroPessoas();
    this.carregarPessoasOpcoes();
    this.configurarCategoriasPorNatureza();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.naturezaSub?.unsubscribe();
    this.pessoasApiSub?.unsubscribe();
    this.pessoasOpcoesAtualizadas$.complete();
  }

  private inicializarFormulario(): void {
    const d = this.data.despesa;

    if (d) {
      this.form.patchValue(
        {
          pessoa: d.pessoa ?? '',
          natureza: d.natureza,
          categoria: d.categoria,
          descricao: d.descricao,
          valor: d.valor,
          data: d.data ?? '',
        },
        { emitEvent: false },
      );
      return;
    }

    this.form.reset(
      {
        pessoa: '',
        natureza: '',
        categoria: '',
        descricao: '',
        valor: null,
        data: this.dataDefaultIso(),
      },
      { emitEvent: false },
    );
  }

  private getPessoaFiltroValue(): string {
    const value = this.form.get('pessoa')?.value;
    return String(value ?? '').trim();
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

  private configurarCategoriasPorNatureza(): void {
    this.atualizarCategoriasOpcoes();

    this.naturezaSub = this.form.get('natureza')?.valueChanges.subscribe(() => {
      this.tratarMudancaNatureza();
    });
  }

  private tratarMudancaNatureza(): void {
    const raw = String(this.form.get('natureza')?.value ?? '').trim();

    if (raw !== 'fixa' && raw !== 'variavel') {
      this.form.patchValue({ categoria: '' }, { emitEvent: false });
      this.atualizarCategoriasOpcoes();
      return;
    }

    const lista = listaCategoriasSugestao(raw as NaturezaDespesa);
    const cur = String(this.form.get('categoria')?.value || '').trim();

    if (cur && !lista.includes(cur)) {
      this.form.patchValue({ categoria: '' }, { emitEvent: false });
    }

    this.atualizarCategoriasOpcoes();
  }

  get isEdicao(): boolean {
    return this.data.despesa != null;
  }

  get tituloDialog(): string {
    return this.isEdicao ? 'Editar despesa' : 'Incluir despesa';
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
    this.pessoasApiSub = this.usuariosService
      .getUsuarios()
      .subscribe((usuarios) => {
        this.pessoasAutocompleteOptions = this.normalizarListaNomes(
          usuarios.map((u) => u.nome),
        );
        this.pessoasOpcoesAtualizadas$.next();
        this.cdr.markForCheck();
      });
  }

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

  private atualizarCategoriasOpcoes(): void {
    const raw = String(this.form.get('natureza')?.value ?? '').trim();
    if (raw !== 'fixa' && raw !== 'variavel') {
      const cur = String(this.form.get('categoria')?.value || '').trim();
      this.categoriasOpcoes = cur ? [cur] : [];
      return;
    }
    const lista = listaCategoriasSugestao(raw as NaturezaDespesa);
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
    const request$ = this.isEdicao
      ? this.despesasService.updateDespesa(this.data.despesa!.id, payload)
      : this.despesasService.createDespesa(payload);

    const salvarDespesa = (): void => {
      request$.subscribe({ next: onOk, error: onErr });
    };

    if (pessoaTrim) {
      this.usuariosService.createUsuario(pessoaTrim).subscribe({
        next: salvarDespesa,
        error: () => salvarDespesa(),
      });
    } else {
      salvarDespesa();
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
