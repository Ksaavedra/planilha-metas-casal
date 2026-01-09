import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MetaExtended } from '../../../core/interfaces/mes-meta';

@Component({
  selector: 'app-editar-valor-modal',
  templateUrl: './editar-valor-modal.component.html',
  styleUrls: ['./editar-valor-modal.component.scss'],
})
export class EditarValorModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() meta: MetaExtended | null = null;
  @Input() mesId = -1;
  @Input() valor = 0;
  @Input() meses: string[] = [];
  @Output() valorChange = new EventEmitter<number>();
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  valorInput: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['valor'] || changes['isOpen']) {
      this.valorInput = this.valor === 0 ? '' : String(this.valor);
    }
  }

  onValorChange(valor: string): void {
    const parsed = this.parseNumeroBR(valor);
    this.valorChange.emit(parsed);
    this.valorInput = valor;
  }

  onValorBlur(): void {
    const parsed = this.parseNumeroBR(this.valorInput);
    this.valorChange.emit(parsed);
    this.valorInput = parsed === 0 ? '' : String(parsed);
  }

  private parseNumeroBR(v: any): number {
    if (v === null || v === undefined) return 0;

    let s = String(v).trim();
    if (!s) return 0;

    s = s.replace(/\s+/g, '').replace(/[^\d.,-]+/g, '');

    if (s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      const parts = s.split('.');
      if (parts.length > 2) {
        const dec = parts.pop();
        s = parts.join('') + '.' + dec;
      }
    }

    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  validarApenasNumeros(event: KeyboardEvent): void {
    const teclasPermitidas = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      ',',
      '.',
      'Backspace',
      'Delete',
      'Tab',
      'Enter',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];

    if (event.code.startsWith('Numpad')) {
      return;
    }

    if (!teclasPermitidas.includes(event.key)) {
      event.preventDefault();
    }
  }

  handleClose(): void {
    this.cancel.emit();
  }

  onBackdropClick(_e?: MouseEvent): void {
    this.handleClose();
  }

  stop(e: Event): void {
    e.stopPropagation();
  }

  onSave(): void {
    this.save.emit();
  }

  onCancel(): void {
    this.handleClose();
  }

  get mesNome(): string {
    if (this.mesId === -1 || !this.meses.length) return '';
    return this.meses[this.mesId - 1] || '';
  }
}
