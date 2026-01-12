import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ModalAdicionarUsuarioService } from '../../../core/services/modal-adicionar-usuario.service';

@Component({
  selector: 'app-adicionar-usuario-modal',
  templateUrl: './adicionar-usuario-modal.component.html',
  styleUrls: ['./adicionar-usuario-modal.component.scss'],
})
export class AdicionarUsuarioModalComponent implements OnInit, OnDestroy {
  isOpen = false;
  nomeUsuario = '';
  valorSalarioRaw = '';
  mesesSelecionados: number[] = [];
  ano: number = new Date().getFullYear();

  nomeFormControl = new FormControl('', [Validators.required]);
  valorSalarioFormControl = new FormControl('', [
    Validators.required,
    this.valorGreaterThanZero,
  ]);

  meses = [
    { numero: 1, nome: 'Janeiro' },
    { numero: 2, nome: 'Fevereiro' },
    { numero: 3, nome: 'Março' },
    { numero: 4, nome: 'Abril' },
    { numero: 5, nome: 'Maio' },
    { numero: 6, nome: 'Junho' },
    { numero: 7, nome: 'Julho' },
    { numero: 8, nome: 'Agosto' },
    { numero: 9, nome: 'Setembro' },
    { numero: 10, nome: 'Outubro' },
    { numero: 11, nome: 'Novembro' },
    { numero: 12, nome: 'Dezembro' },
  ];

  anosDisponiveis: number[] = [];

  private subscription?: Subscription;

  constructor(private modalService: ModalAdicionarUsuarioService) {}

  ngOnInit(): void {
    // Gerar lista de anos (ano atual - 3 até ano atual + 3)
    const anoAtual = new Date().getFullYear();
    for (let i = anoAtual - 3; i <= anoAtual + 3; i++) {
      this.anosDisponiveis.push(i);
    }

    this.subscription = this.modalService.state$.subscribe((state) => {
      this.isOpen = state.isOpen;
      this.nomeUsuario = state.nomeUsuario;
      this.valorSalarioRaw = state.valorSalarioRaw;
      this.mesesSelecionados = state.mesesSelecionados;

      // Garantir que o ano seja sempre o ano atual quando o modal abrir
      if (state.isOpen) {
        const anoAtualCalculado = new Date().getFullYear();
        this.ano = anoAtualCalculado;
        this.nomeFormControl.setValue(state.nomeUsuario);
        this.valorSalarioFormControl.setValue(state.valorSalarioRaw);
      } else {
        this.ano = state.ano;
        this.nomeFormControl.reset();
        this.valorSalarioFormControl.reset();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  valorGreaterThanZero(control: FormControl): { [key: string]: any } | null {
    if (!control.value) return null;
    const valor = parseFloat(String(control.value).replace(',', '.'));
    return valor > 0 ? null : { mustBeGreaterThanZero: true };
  }

  onNomeChange(nome: string): void {
    this.modalService.updateNomeUsuario(nome);
    this.nomeFormControl.setValue(nome);
  }

  onValorSalarioChange(valor: string): void {
    const valorLimpo = String(valor || '').replace(/[^0-9,\.]/g, '');
    this.modalService.updateValorSalarioRaw(valorLimpo);
    this.valorSalarioFormControl.setValue(valorLimpo);
  }

  validarApenasNumeros(event: KeyboardEvent): void {
    const teclasControle = [
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
      'Ctrl',
      'Alt',
      'Shift',
      'Meta',
      'Cmd',
    ];

    if (teclasControle.includes(event.key)) {
      return;
    }

    if (event.code.startsWith('Numpad')) {
      if (
        event.code.includes('Comma') ||
        event.code.includes('Period') ||
        (event.code >= 'Numpad0' && event.code <= 'Numpad9')
      ) {
        return;
      }
    }

    const teclasPermitidas = /^[0-9,\.]$/;
    if (!teclasPermitidas.test(event.key)) {
      event.preventDefault();
    }
  }

  toggleMes(mes: number): void {
    this.modalService.toggleMes(mes);
  }

  isMesSelecionado(mes: number): boolean {
    return this.mesesSelecionados.includes(mes);
  }

  selecionarTodosMeses(): void {
    this.modalService.selecionarTodosMeses();
  }

  desmarcarTodosMeses(): void {
    this.modalService.desmarcarTodosMeses();
  }

  getTodosMesesSelecionados(): boolean {
    return this.mesesSelecionados.length === 12;
  }

  parseNumeroBR(valor: string): number {
    if (!valor || valor.trim() === '') return 0;

    let limpo = String(valor)
      .trim()
      .replace(/[^\d,\.]/g, '');

    if (!limpo) return 0;

    if (limpo.includes(',')) {
      limpo = limpo.replace(/\./g, '');
      limpo = limpo.replace(',', '.');
      const resultado = parseFloat(limpo);
      return isNaN(resultado) ? 0 : resultado;
    }

    if (limpo.includes('.')) {
      const partes = limpo.split('.');
      if (partes.length > 2) {
        const decimal = partes.pop();
        limpo = partes.join('') + '.' + decimal;
      }
      const resultado = parseFloat(limpo);
      return isNaN(resultado) ? 0 : resultado;
    }

    const resultado = parseFloat(limpo);
    return isNaN(resultado) ? 0 : resultado;
  }

  onAnoChange(ano: number): void {
    this.modalService.updateAno(ano);
  }

  onSave(): void {
    if (this.nomeFormControl.invalid || this.valorSalarioFormControl.invalid) {
      this.nomeFormControl.markAllAsTouched();
      this.valorSalarioFormControl.markAllAsTouched();
      return;
    }

    if (this.mesesSelecionados.length === 0) {
      alert('Por favor, selecione pelo menos um mês.');
      return;
    }

    const nomeUsuario = this.nomeUsuario.trim();
    const valorSalario = this.parseNumeroBR(this.valorSalarioRaw);

    this.modalService.triggerSave(
      nomeUsuario,
      valorSalario,
      this.mesesSelecionados,
      this.ano
    );
    this.modalService.close();
    this.modalService.reset();
  }

  onCancel(): void {
    this.modalService.close();
    this.modalService.reset();
  }

  stop(event: Event): void {
    event.stopPropagation();
  }
}
