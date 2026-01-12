import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface ModalAdicionarUsuarioState {
  isOpen: boolean;
  nomeUsuario: string;
  valorSalarioRaw: string;
  mesesSelecionados: number[]; // Array de números de mês (1-12)
  ano: number; // Ano selecionado
}

@Injectable({
  providedIn: 'root',
})
export class ModalAdicionarUsuarioService {
  private initialState: ModalAdicionarUsuarioState = {
    isOpen: false,
    nomeUsuario: '',
    valorSalarioRaw: '',
    mesesSelecionados: [],
    ano: new Date().getFullYear(),
  };

  private stateSubject = new BehaviorSubject<ModalAdicionarUsuarioState>(
    this.initialState
  );
  public state$: Observable<ModalAdicionarUsuarioState> =
    this.stateSubject.asObservable();

  // Subject para emitir evento de save
  private saveSubject = new Subject<{
    nomeUsuario: string;
    valorSalario: number;
    meses: number[];
    ano: number;
  }>();
  public save$: Observable<{
    nomeUsuario: string;
    valorSalario: number;
    meses: number[];
    ano: number;
  }> = this.saveSubject.asObservable();

  getState(): ModalAdicionarUsuarioState {
    return this.stateSubject.value;
  }

  open(): void {
    const anoAtual = new Date().getFullYear();
    this.stateSubject.next({
      ...this.initialState,
      isOpen: true,
      ano: anoAtual, // Ano atual por padrão
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
    this.stateSubject.next({
      ...currentState,
      nomeUsuario: nome,
    });
  }

  updateValorSalarioRaw(valor: string): void {
    const currentState = this.stateSubject.value;
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
    ano: number
  ): void {
    this.saveSubject.next({ nomeUsuario, valorSalario, meses, ano });
  }

  reset(): void {
    this.stateSubject.next(this.initialState);
  }
}
