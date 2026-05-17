import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AVAILABLE_META_ICONS } from '../../../../core/constants/meta-icons.constant';
import { MesMeta } from '../../../../core/interfaces/metas/mes-meta';
import { CreateMetaRequest } from '../../../../core/interfaces/metas/metas-modais';
import { MetasService } from '../../../../core/services/metas/metas.service';
import { gerarMesesPlanejamento } from '@core/utils/metas-meses.util';

@Component({
  selector: 'app-adicionar-meta-dialog',
  templateUrl: './adicionar-meta-dialog.component.html',
  styleUrls: ['./adicionar-meta-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdicionarMetaDialogComponent implements OnInit, OnDestroy {
  readonly availableIcons = AVAILABLE_META_ICONS;
  readonly tituloDialog = 'Incluir meta';

  form: FormGroup;
  saving = false;
  erro: string | null = null;

  private temValorAtualSub?: Subscription;

  constructor(
    private dialogRef: MatDialogRef<AdicionarMetaDialogComponent, boolean | undefined>,
    private fb: FormBuilder,
    private metasService: MetasService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      valorMeta: ['', [Validators.required, this.valorMaiorQueZeroValidator()]],
      valorPorMes: ['', [Validators.required, this.valorMaiorQueZeroValidator()]],
      temValorAtual: [false],
      valorAtual: [{ value: '', disabled: true }],
      icon: ['bi-bullseye'],
    });
  }

  ngOnInit(): void {
    this.temValorAtualSub = this.form
      .get('temValorAtual')
      ?.valueChanges.subscribe((marcado) => {
        this.onTemValorAtualChange(!!marcado);
      });
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.temValorAtualSub?.unsubscribe();
  }

  get temValorAtual(): boolean {
    return !!this.form.get('temValorAtual')?.value;
  }

  get iconSelecionado(): string {
    return String(this.form.get('icon')?.value ?? 'bi-bullseye');
  }

  selecionarIcon(value: string): void {
    this.form.get('icon')?.setValue(value);
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

    const payload = this.buildDadosMetaParaEnviar();
    if (!payload) {
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    this.metasService.createMeta(payload).subscribe({
      next: () => {
        this.saving = false;
        this.dialogRef.close(true);
      },
      error: (err: { status?: number; statusText?: string; message?: string }) => {
        this.saving = false;
        if (err.status === 0 || err.statusText === 'Unknown Error') {
          this.erro =
            'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
        } else {
          this.erro = err.message || 'Não foi possível criar a meta.';
        }
        this.cdr.markForCheck();
      },
    });
  }

  validarApenasNumeros(event: KeyboardEvent): void {
    const char = String.fromCharCode(event.which);
    if (!/[0-9,\.]/.test(char)) {
      event.preventDefault();
    }
  }

  private onTemValorAtualChange(marcado: boolean): void {
    const ctrl = this.form.get('valorAtual');
    if (!ctrl) return;

    if (marcado) {
      ctrl.enable();
      ctrl.setValidators([
        Validators.required,
        this.valorMaiorOuIgualZeroValidator(),
      ]);
    } else {
      ctrl.disable();
      ctrl.setValue('');
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  private buildDadosMetaParaEnviar(): CreateMetaRequest | null {
    const nome = String(this.form.get('nome')?.value ?? '').trim();
    const valorMeta = this.parseNumeroBR(
      String(this.form.get('valorMeta')?.value ?? ''),
    );
    const valorPorMes = this.parseNumeroBR(
      String(this.form.get('valorPorMes')?.value ?? ''),
    );
    const temValorAtual = this.temValorAtual;
    const valorAtualRaw = String(this.form.get('valorAtual')?.value ?? '').trim();
    const valorAtual = temValorAtual ? this.parseNumeroBR(valorAtualRaw) : 0;

    if (!nome) {
      this.erro = 'Por favor, preencha o nome da meta.';
      this.cdr.markForCheck();
      return null;
    }
    if (valorMeta <= 0) {
      this.erro = 'O valor da meta deve ser maior que zero.';
      this.cdr.markForCheck();
      return null;
    }
    if (valorPorMes <= 0) {
      this.erro = 'O valor por mês deve ser maior que zero.';
      this.cdr.markForCheck();
      return null;
    }
    if (temValorAtual && !valorAtualRaw) {
      this.erro = 'Preencha o valor já guardado.';
      this.cdr.markForCheck();
      return null;
    }
    if (temValorAtual && valorAtual < 0) {
      this.erro = 'O valor já guardado deve ser maior ou igual a zero.';
      this.cdr.markForCheck();
      return null;
    }

    const mesesNecessarios =
      valorPorMes > 0 ? Math.ceil(valorMeta / valorPorMes) : 0;
    const icon = this.iconSelecionado.trim() || 'bi-bullseye';

    return {
      ano: this.metasService.getAnoSelecionado(),
      nome,
      valorMeta,
      valorPorMes,
      mesesNecessarios,
      valorAtual: temValorAtual ? valorAtual : 0,
      icon,
      meses: this.buildMeses(valorMeta, valorPorMes),
    };
  }

  private buildMeses(valorMeta: number, valorPorMes: number): Partial<MesMeta>[] {
    const mesesNecessarios =
      valorPorMes > 0 ? Math.ceil(valorMeta / valorPorMes) : 12;
    const qtd = Math.max(mesesNecessarios, 1);
    return gerarMesesPlanejamento(
      this.metasService.getAnoSelecionado(),
      qtd,
      valorPorMes,
    );
  }

  parseNumeroBR(value: string): number {
    if (!value || !value.trim()) return 0;
    const limpo = value.trim().replace(/\s/g, '');
    const numero = limpo.replace(',', '.');
    const parsed = parseFloat(numero);
    return isNaN(parsed) ? 0 : parsed;
  }

  private valorMaiorQueZeroValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !String(control.value).trim()) {
        return { required: true };
      }
      const valor = this.parseNumeroBR(String(control.value));
      return valor > 0 ? null : { mustBeGreaterThanZero: true };
    };
  }

  private valorMaiorOuIgualZeroValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !String(control.value).trim()) {
        return this.temValorAtual ? { required: true } : null;
      }
      const valor = this.parseNumeroBR(String(control.value));
      return valor >= 0 ? null : { mustBeGreaterOrEqualZero: true };
    };
  }
}
