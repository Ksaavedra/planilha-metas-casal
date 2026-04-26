import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Despesa,
  DespesasService,
  NaturezaDespesa,
} from 'app/core/services/despesas/despesas.service';

export interface AdicionarDespesaDialogData {
  /** `null` = nova despesa; caso contrário, edição. */
  despesa: Despesa | null;
  ano: number;
  mes: number;
}

const CATEGORIAS: string[] = [
  'Casa',
  'Alimentação',
  'Transporte',
  'Internet / celular',
  'Lazer / compras',
  'Saúde',
  'Educação',
  'Outros',
];

@Component({
  selector: 'app-adicionar-despesa-dialog',
  templateUrl: './adicionar-despesa-dialog.component.html',
  styleUrls: ['./adicionar-despesa-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdicionarDespesaDialogComponent implements OnInit {
  readonly exemplos: string[] = [
    'Aluguel / financiamento',
    'Mercado 🍎',
    'Transporte 🚗',
    'Internet / celular',
    'Lazer / compras',
  ];
  readonly categorias = CATEGORIAS;

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
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      natureza: ['fixa' as NaturezaDespesa, Validators.required],
      categoria: ['', Validators.required],
      descricao: ['', [Validators.required, Validators.maxLength(200)]],
      valor: [null as number | null, [Validators.required, Validators.min(0.01)]],
      data: [''],
    });
  }

  ngOnInit(): void {
    const d = this.data.despesa;
    if (d) {
      this.form.patchValue({
        natureza: d.natureza,
        categoria: d.categoria,
        descricao: d.descricao,
        valor: d.valor,
        data: d.data || '',
      });
    } else {
      this.form.reset({
        natureza: 'fixa',
        categoria: '',
        descricao: '',
        valor: null,
        data: this.dataDefaultIso(),
      });
    }
    this.cdr.markForCheck();
  }

  fechar(): void {
    this.dialogRef.close();
  }

  salvar(): void {
    this.erro = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }
    const v = this.form.value;
    const dataStr =
      v.data && String(v.data).trim() !== '' ? String(v.data).trim() : null;
    const payload = {
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
