import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface ModalAdicionarMetaState {
  isOpen: boolean;
  nome: string;
  valorMetaRaw: string;
  valorPorMesRaw: string;
  valorAtualRaw: string;
  temValorAtual: boolean;
}

export interface ModalSucessoState {
  isOpen: boolean;
  title: string;
  message: string;
}

export interface ModalConfirmarDeleteState {
  isOpen: boolean;
  message: string;
  metaId: number | null;
  metaNome: string;
}

export interface ModalSucessoDeleteState {
  isOpen: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ModalAdicionarMetaService {
  private initialState: ModalAdicionarMetaState = {
    isOpen: false,
    nome: '',
    valorMetaRaw: '',
    valorPorMesRaw: '',
    valorAtualRaw: '',
    temValorAtual: false,
  };

  private stateSubject = new BehaviorSubject<ModalAdicionarMetaState>(
    this.initialState
  );
  public state$: Observable<ModalAdicionarMetaState> =
    this.stateSubject.asObservable();

  // Subject para emitir evento de save
  private saveSubject = new Subject<void>();
  public save$: Observable<void> = this.saveSubject.asObservable();

  // Estado do modal de sucesso
  private sucessoStateSubject = new BehaviorSubject<ModalSucessoState>({
    isOpen: false,
    title: '',
    message: '',
  });
  public sucessoState$: Observable<ModalSucessoState> =
    this.sucessoStateSubject.asObservable();

  // Estado do modal de confirmação de exclusão
  private confirmarDeleteStateSubject =
    new BehaviorSubject<ModalConfirmarDeleteState>({
      isOpen: false,
      message: '',
      metaId: null,
      metaNome: '',
    });
  public confirmarDeleteState$: Observable<ModalConfirmarDeleteState> =
    this.confirmarDeleteStateSubject.asObservable();

  // Subject para emitir evento de confirmação de exclusão
  private confirmDeleteSubject = new Subject<number>();
  public confirmDelete$: Observable<number> =
    this.confirmDeleteSubject.asObservable();

  // Estado do modal de sucesso de exclusão
  private sucessoDeleteStateSubject =
    new BehaviorSubject<ModalSucessoDeleteState>({
      isOpen: false,
    });
  public sucessoDeleteState$: Observable<ModalSucessoDeleteState> =
    this.sucessoDeleteStateSubject.asObservable();

  getState(): ModalAdicionarMetaState {
    return this.stateSubject.value;
  }

  open(): void {
    this.stateSubject.next({
      ...this.initialState,
      isOpen: true,
    });
  }

  close(): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      isOpen: false,
    });
  }

  updateNome(nome: string): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      nome,
    });
  }

  updateValorMetaRaw(valor: string): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      valorMetaRaw: valor,
    });
  }

  updateValorPorMesRaw(valor: string): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      valorPorMesRaw: valor,
    });
  }

  updateValorAtualRaw(valor: string): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      valorAtualRaw: valor,
    });
  }

  updateTemValorAtual(temValorAtual: boolean): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      temValorAtual,
      // Se desmarcar o checkbox, limpa o valor
      valorAtualRaw: temValorAtual ? this.stateSubject.value.valorAtualRaw : '',
    });
  }

  triggerSave(): void {
    this.saveSubject.next();
  }

  reset(): void {
    this.stateSubject.next(this.initialState);
  }

  getSucessoState(): ModalSucessoState {
    return this.sucessoStateSubject.value;
  }

  showSucesso(title: string, message: string): void {
    this.sucessoStateSubject.next({
      isOpen: true,
      title,
      message,
    });
  }

  closeSucesso(): void {
    this.sucessoStateSubject.next({
      ...this.sucessoStateSubject.value,
      isOpen: false,
    });
    // Sempre fecha e reseta o modal de adicionar quando fecha o modal de sucesso
    this.close();
    this.reset();
  }

  // Métodos para modal de confirmação de exclusão
  getConfirmarDeleteState(): ModalConfirmarDeleteState {
    return this.confirmarDeleteStateSubject.value;
  }

  openConfirmarDelete(metaId: number, metaNome: string): void {
    this.confirmarDeleteStateSubject.next({
      isOpen: true,
      message: `Tem certeza que deseja excluir a meta '${metaNome}'?`,
      metaId,
      metaNome,
    });
  }

  closeConfirmarDelete(): void {
    this.confirmarDeleteStateSubject.next({
      ...this.confirmarDeleteStateSubject.value,
      isOpen: false,
      metaId: null,
      metaNome: '',
    });
  }

  confirmDelete(): void {
    const state = this.confirmarDeleteStateSubject.value;
    if (state.metaId !== null) {
      this.confirmDeleteSubject.next(state.metaId);
    } else {
      console.error('❌ metaId é null! Não é possível confirmar exclusão.');
    }
    this.closeConfirmarDelete();
  }

  // Métodos para modal de sucesso de exclusão
  getSucessoDeleteState(): ModalSucessoDeleteState {
    return this.sucessoDeleteStateSubject.value;
  }

  showSucessoDelete(): void {
    this.closeConfirmarDelete();
    this.sucessoDeleteStateSubject.next({
      isOpen: true,
    });
  }

  closeSucessoDelete(): void {
    this.sucessoDeleteStateSubject.next({
      isOpen: false,
    });
  }
}
