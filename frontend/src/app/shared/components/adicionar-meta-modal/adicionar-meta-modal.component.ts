import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  FormControl,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Subscription } from 'rxjs';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: 'app-adicionar-meta-modal',
  templateUrl: './adicionar-meta-modal.component.html',
  styleUrls: ['./adicionar-meta-modal.component.scss'],
})
export class AdicionarMetaModalComponent
  implements OnChanges, OnInit, OnDestroy
{
  @Input() isOpen = false;
  @Input() nome = '';
  @Input() valorMetaRaw = '';
  @Input() valorPorMesRaw = '';
  @Input() valorAtualRaw = '';
  @Input() temValorAtual = false;

  @Output() save = new EventEmitter<{
    nome: string;
    valorMeta: number;
    valorPorMes: number;
    valorAtual: number;
  }>();
  @Output() cancel = new EventEmitter<void>();
  @Output() nomeChange = new EventEmitter<string>();
  @Output() valorMetaChange = new EventEmitter<string>();
  @Output() valorPorMesChange = new EventEmitter<string>();
  @Output() valorAtualChange = new EventEmitter<string>();
  @Output() temValorAtualChange = new EventEmitter<boolean>();
  @Output() valorMetaChangeEvent = new EventEmitter<Event>();
  @Output() valorPorMesChangeEvent = new EventEmitter<Event>();
  @Output() valorAtualChangeEvent = new EventEmitter<Event>();

  // FormControls
  nomeFormControl = new FormControl('', [Validators.required]);
  valorMetaFormControl = new FormControl('', [
    Validators.required,
    this.valorMaiorQueZeroValidator(),
  ]);
  valorPorMesFormControl = new FormControl('', [
    Validators.required,
    this.valorMaiorQueZeroValidator(),
  ]);
  valorAtualFormControl = new FormControl({ value: '', disabled: true });

  // ErrorStateMatcher para mostrar erros instantaneamente
  matcher = new MyErrorStateMatcher();

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Escuta mudanças nos form controls e emite eventos
    this.subscriptions.push(
      this.nomeFormControl.valueChanges.subscribe((value) => {
        if (value !== null) {
          this.nomeChange.emit(value);
        }
      }),
      this.valorMetaFormControl.valueChanges.subscribe((value) => {
        if (value !== null) {
          this.valorMetaChange.emit(value);
        }
      }),
      this.valorPorMesFormControl.valueChanges.subscribe((value) => {
        if (value !== null) {
          this.valorPorMesChange.emit(value);
        }
      }),
      this.valorAtualFormControl.valueChanges.subscribe((value) => {
        if (value !== null) {
          this.valorAtualChange.emit(value);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // Validators customizados
  valorMaiorQueZeroValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !control.value.trim()) {
        return { required: true };
      }
      const valor = this.parseNumeroBR(control.value);
      return valor > 0 ? null : { mustBeGreaterThanZero: true };
    };
  }

  valorMaiorOuIgualZeroValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !control.value.trim()) {
        return this.temValorAtual ? { required: true } : null;
      }
      const valor = this.parseNumeroBR(control.value);
      return valor >= 0 ? null : { mustBeGreaterOrEqualZero: true };
    };
  }

  onNomeChange(_value: string): void {
    // Validação é feita pelo FormControl
  }

  onValorMetaChange(_value: string): void {
    // Validação é feita pelo FormControl
  }

  onValorPorMesChange(_value: string): void {
    // Validação é feita pelo FormControl
  }

  onValorAtualChange(_value: string): void {
    // Validação é feita pelo FormControl
  }

  onTemValorAtualChange(value: boolean): void {
    this.temValorAtualChange.emit(value);
    if (value) {
      // Habilita o campo e torna obrigatório
      this.valorAtualFormControl.enable();
      this.valorAtualFormControl.setValidators([
        Validators.required,
        this.valorMaiorOuIgualZeroValidator(),
      ]);
    } else {
      // Desabilita o campo e limpa valor
      this.valorAtualFormControl.disable();
      this.valorAtualFormControl.setValue('');
      this.valorAtualFormControl.clearValidators();
    }
    this.valorAtualFormControl.updateValueAndValidity();
  }

  onValorMetaChangeEvent(event: Event): void {
    this.valorMetaChangeEvent.emit(event);
  }

  onValorPorMesChangeEvent(event: Event): void {
    this.valorPorMesChangeEvent.emit(event);
  }

  onValorAtualChangeEvent(event: Event): void {
    this.valorAtualChangeEvent.emit(event);
  }

  parseNumeroBR(value: string): number {
    if (!value || !value.trim()) return 0;
    // Remove espaços e formata
    const limpo = value.trim().replace(/\s/g, '');
    // Substitui vírgula por ponto e converte
    const numero = limpo.replace(',', '.');
    const parsed = parseFloat(numero);
    return isNaN(parsed) ? 0 : parsed;
  }

  onSave(): void {
    // Marca todos os campos como touched para mostrar erros
    this.nomeFormControl.markAsTouched();
    this.valorMetaFormControl.markAsTouched();
    this.valorPorMesFormControl.markAsTouched();
    if (this.temValorAtual) {
      this.valorAtualFormControl.markAsTouched();
    }

    // Valida todos os campos
    if (
      this.nomeFormControl.invalid ||
      this.valorMetaFormControl.invalid ||
      this.valorPorMesFormControl.invalid ||
      (this.temValorAtual && this.valorAtualFormControl.invalid)
    ) {
      return;
    }

    // Sincroniza valores com os inputs antes de salvar
    const nomeValue = this.nomeFormControl.value || '';
    const valorMetaValue = this.valorMetaFormControl.value || '';
    const valorPorMesValue = this.valorPorMesFormControl.value || '';
    const valorAtualValue = this.valorAtualFormControl.value || '';

    // Atualiza os valores através dos eventos para sincronizar com o serviço
    this.nomeChange.emit(nomeValue);
    this.valorMetaChange.emit(valorMetaValue);
    this.valorPorMesChange.emit(valorPorMesValue);
    if (this.temValorAtual) {
      this.valorAtualChange.emit(valorAtualValue);
    } else {
      this.valorAtualChange.emit('');
    }

    // Emite evento para o componente pai processar e salvar
    this.save.emit({
      nome: nomeValue,
      valorMeta: 0, // Será calculado pelo pai através dos valores raw
      valorPorMes: 0, // Será calculado pelo pai através dos valores raw
      valorAtual: 0, // Será calculado pelo pai através dos valores raw
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(_e?: MouseEvent): void {
    // Não fecha ao clicar fora - conforme solicitado pelo usuário
  }

  stop(e: Event): void {
    e.stopPropagation();
  }

  validarApenasNumeros(event: KeyboardEvent): void {
    const char = String.fromCharCode(event.which);
    if (!/[0-9,\.]/.test(char)) {
      event.preventDefault();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        // Bloqueia o scroll do body quando o modal abre
        document.body.style.overflow = 'hidden';
        // Reseta form controls quando abre o modal
        this.nomeFormControl.reset();
        this.valorMetaFormControl.reset();
        this.valorPorMesFormControl.reset();
        this.valorAtualFormControl.reset();
        this.valorAtualFormControl.disable();
      } else {
        // Restaura o scroll do body quando o modal fecha
        document.body.style.overflow = '';
      }
    }

    // Sincroniza valores dos inputs com form controls
    if (changes['nome'] && this.nomeFormControl.value !== this.nome) {
      this.nomeFormControl.setValue(this.nome, { emitEvent: false });
    }
    if (
      changes['valorMetaRaw'] &&
      this.valorMetaFormControl.value !== this.valorMetaRaw
    ) {
      this.valorMetaFormControl.setValue(this.valorMetaRaw, {
        emitEvent: false,
      });
    }
    if (
      changes['valorPorMesRaw'] &&
      this.valorPorMesFormControl.value !== this.valorPorMesRaw
    ) {
      this.valorPorMesFormControl.setValue(this.valorPorMesRaw, {
        emitEvent: false,
      });
    }
    if (
      changes['valorAtualRaw'] &&
      this.valorAtualFormControl.value !== this.valorAtualRaw
    ) {
      this.valorAtualFormControl.setValue(this.valorAtualRaw, {
        emitEvent: false,
      });
    }
    if (changes['temValorAtual']) {
      if (this.temValorAtual) {
        this.valorAtualFormControl.enable();
        this.valorAtualFormControl.setValidators([
          Validators.required,
          this.valorMaiorOuIgualZeroValidator(),
        ]);
      } else {
        this.valorAtualFormControl.disable();
        this.valorAtualFormControl.clearValidators();
      }
      this.valorAtualFormControl.updateValueAndValidity({ emitEvent: false });
    }
  }
}
