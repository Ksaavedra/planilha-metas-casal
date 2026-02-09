import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface ModalAdicionarUsuarioState {
  isOpen: boolean;
  isEditMode: boolean;
  receitaId?: number;
  nomeUsuario: string;
  valorSalarioRaw: string;
  mesesSelecionados: number[];
  ano: number;
}

@Injectable({
  providedIn: 'root',
})
export class ModalAdicionarUsuarioService {
  private initialState: ModalAdicionarUsuarioState = {
    isOpen: false,
    isEditMode: false,
    nomeUsuario: '',
    valorSalarioRaw: '',
    mesesSelecionados: [],
    ano: new Date().getFullYear(),
  };

  private stateSubject = new BehaviorSubject<ModalAdicionarUsuarioState>(
    this.initialState,
  );
  public state$: Observable<ModalAdicionarUsuarioState> =
    this.stateSubject.asObservable();

  private saveSubject = new Subject<{
    nomeUsuario: string;
    valorSalario: number;
    meses: number[];
    ano: number;
    receitaId?: number; // presente quando for edição
  }>();
  public save$ = this.saveSubject.asObservable();

  getState(): ModalAdicionarUsuarioState {
    return this.stateSubject.value;
  }

  open(): void {
    const anoAtual = new Date().getFullYear();
    this.stateSubject.next({
      ...this.initialState,
      isOpen: true,
      isEditMode: false,
      ano: anoAtual,
    });
  }

  /** Abre o modal para editar uma receita (mesmo layout do adicionar). */
  openForEdit(receita: {
    id?: number;
    pessoa: string;
    valor: number;
    ano?: number;
    mes?: number;
  }): void {
    const valorRaw =
      receita.valor == null ? '' : receita.valor.toFixed(2).replace('.', ',');
    this.stateSubject.next({
      ...this.initialState,
      isOpen: true,
      isEditMode: true,
      receitaId: receita.id,
      nomeUsuario: receita.pessoa?.trim() ?? '',
      valorSalarioRaw: valorRaw,
      mesesSelecionados: receita.mes != null ? [receita.mes] : [],
      ano: receita.ano ?? new Date().getFullYear(),
    });
  }

  close(): void {
    this.stateSubject.next({
      ...this.initialState,
      isOpen: false,
    });
  }

  updateNomeUsuario(nome: string): void {
    const currentState = this.stateSubject.value;
    if (currentState.nomeUsuario === nome) return;
    this.stateSubject.next({
      ...currentState,
      nomeUsuario: nome,
    });
  }

  updateValorSalarioRaw(valor: string): void {
    const currentState = this.stateSubject.value;
    if (currentState.valorSalarioRaw === valor) return;
    this.stateSubject.next({
      ...currentState,
      valorSalarioRaw: valor,
    });
  }

  toggleMes(mes: number): void {
    const currentState = this.stateSubject.value;
    const meses = [...currentState.mesesSelecionados];
    const index = meses.indexOf(mes);

    if (index > -1) {
      meses.splice(index, 1);
    } else {
      meses.push(mes);
      meses.sort((a, b) => a - b);
    }

    this.stateSubject.next({
      ...currentState,
      mesesSelecionados: meses,
    });
  }

  selecionarTodosMeses(): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      mesesSelecionados: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    });
  }

  desmarcarTodosMeses(): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      mesesSelecionados: [],
    });
  }

  updateAno(ano: number): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      ano: ano,
    });
  }

  triggerSave(
    nomeUsuario: string,
    valorSalario: number,
    meses: number[],
    ano: number,
    receitaId?: number,
  ): void {
    this.saveSubject.next({
      nomeUsuario,
      valorSalario,
      meses,
      ano,
      receitaId,
    });
  }

  reset(): void {
    this.stateSubject.next(this.initialState);
  }
}
