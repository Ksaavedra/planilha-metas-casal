import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { MetaExtended } from '../interfaces/mes-meta';

export interface ModalEditarValorState {
  isOpen: boolean;
  meta: MetaExtended | null;
  mesId: number;
  valor: number;
  meses: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ModalEditarValorService {
  private initialState: ModalEditarValorState = {
    isOpen: false,
    meta: null,
    mesId: -1,
    valor: 0,
    meses: [],
  };

  private stateSubject = new BehaviorSubject<ModalEditarValorState>(
    this.initialState
  );
  public state$: Observable<ModalEditarValorState> =
    this.stateSubject.asObservable();

  // Subject para emitir evento de save
  private saveSubject = new Subject<{
    metaId: number | string;
    mesId: number;
    valor: number;
  }>();
  public save$: Observable<{
    metaId: number | string;
    mesId: number;
    valor: number;
  }> = this.saveSubject.asObservable();

  getState(): ModalEditarValorState {
    return this.stateSubject.value;
  }

  open(meta: MetaExtended, mesId: number, meses: string[]): void {
    const mes = meta.meses.find((m) => m.id === mesId);
    if (!mes) return;

    this.stateSubject.next({
      isOpen: true,
      meta,
      mesId,
      valor: mes.valor,
      meses,
    });
  }

  close(): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      isOpen: false,
    });
  }

  updateValor(valor: number): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      valor,
    });
  }

  triggerSave(): void {
    const state = this.stateSubject.value;
    if (state.meta && state.mesId !== -1) {
      this.saveSubject.next({
        metaId: state.meta.id,
        mesId: state.mesId,
        valor: state.valor,
      });
    }
    this.close();
  }

  reset(): void {
    this.stateSubject.next(this.initialState);
  }
}
