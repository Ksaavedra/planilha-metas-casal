import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  EditarValorDialogData,
  EditarValorDialogResult,
} from '@core/interfaces/metas/editar-modal';
import {
  getValorFaltanteMeta,
  getValorMaximoPermitidoMes,
} from '@app/core/utils';

@Component({
  selector: 'app-editar-valor-dialog',
  templateUrl: './editar-valor-dialog.component.html',
  styleUrl: './editar-valor-dialog.component.scss',
  standalone: false,
})
export class EditarValorDialogComponent implements OnInit {
  valor = 0;
  valorInput = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditarValorDialogData,
    private dialogRef: MatDialogRef<
      EditarValorDialogComponent,
      EditarValorDialogResult | undefined
    >,
  ) {}

  ngOnInit(): void {
    const mes = this.data.meta.meses?.find((m) => m.id === this.data.mesId);
    this.valor = mes?.valor ?? 0;
    this.valorInput = this.valor === 0 ? '' : String(this.valor);
  }

  /** Mesmo cálculo do card (evolucao-metas / elaborando-metas). */
  get valorFaltanteParaConcluir(): number {
    return getValorFaltanteMeta(this.data.meta);
  }

  /** Teto deste mês ao salvar (considera valor já pago no mês em edição). */
  get valorMaximoPermitido(): number {
    return getValorMaximoPermitidoMes(this.data.meta, this.data.mesId);
  }

  get valorUltrapassaLimite(): boolean {
    return this.valor > this.valorMaximoPermitido + 0.009;
  }

  get podeSalvar(): boolean {
    return this.valor >= 0 && !this.valorUltrapassaLimite;
  }

  get mesNome(): string {
    const mes = this.data.meta.meses?.find((m) => m.id === this.data.mesId);
    if (mes?.nome) return mes.nome;

    const { meses, mesId } = this.data;
    if (meses.length && mesId > 0 && mesId <= meses.length) {
      return meses[mesId - 1] ?? '';
    }
    return '';
  }

  onValorChange(valor: string): void {
    this.valor = this.parseNumeroBR(valor);
    this.valorInput = valor;
  }

  onValorBlur(): void {
    this.valor = this.parseNumeroBR(this.valorInput);
    this.valorInput = this.valor === 0 ? '' : String(this.valor);
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

    if (event.code.startsWith('Numpad')) return;

    if (!teclasPermitidas.includes(event.key)) {
      event.preventDefault();
    }
  }

  fechar(): void {
    this.dialogRef.close();
  }

  salvar(): void {
    if (!this.podeSalvar) return;

    this.dialogRef.close({
      metaId: this.data.meta.id,
      mesId: this.data.mesId,
      valor: this.valor,
    });
  }

  private parseNumeroBR(v: unknown): number {
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
}
