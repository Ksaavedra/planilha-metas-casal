import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface ModalConfirmarExcluirReceitaState {
  isOpen: boolean;
  message: string;
  receitaId: number | null;
}

export interface ModalSucessoExcluirReceitaState {
  isOpen: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ModalExcluirReceitaService {
  private confirmStateSubject = new BehaviorSubject<ModalConfirmarExcluirReceitaState>({
    isOpen: false,
    message: '',
    receitaId: null,
  });
  public confirmState$: Observable<ModalConfirmarExcluirReceitaState> =
    this.confirmStateSubject.asObservable();

  /** Emitido quando o usuário clica em "Sim, Excluir"; a página chama a API e depois openSuccess(). */
  private confirmSubject = new Subject<number>();
  public confirmDelete$: Observable<number> = this.confirmSubject.asObservable();

  private successStateSubject = new BehaviorSubject<ModalSucessoExcluirReceitaState>({
    isOpen: false,
  });
  public successState$: Observable<ModalSucessoExcluirReceitaState> =
    this.successStateSubject.asObservable();

  openConfirm(receita: { id?: number; pessoa?: string; valor: number }): void {
    if (receita.id == null) return;
    const valorStr = receita.valor.toFixed(2).replace('.', ',');
    const nome = (receita.pessoa ?? '').trim();
    const message = nome
      ? `Excluir esta receita de ${nome} (R$ ${valorStr})?`
      : `Excluir esta receita (R$ ${valorStr})?`;
    this.confirmStateSubject.next({
      isOpen: true,
      message,
      receitaId: receita.id,
    });
  }

  onConfirm(): void {
    const state = this.confirmStateSubject.value;
    if (state.receitaId != null) {
      this.confirmSubject.next(state.receitaId);
    }
    this.confirmStateSubject.next({
      isOpen: false,
      message: '',
      receitaId: null,
    });
  }

  onCancel(): void {
    this.confirmStateSubject.next({
      isOpen: false,
      message: '',
      receitaId: null,
    });
  }

  openSuccess(): void {
    this.successStateSubject.next({ isOpen: true });
  }

  closeSuccess(): void {
    this.successStateSubject.next({ isOpen: false });
  }
}
