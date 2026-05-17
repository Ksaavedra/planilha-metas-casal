import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import {
  CreateMetaRequest,
  Meta,
  ModalAdicionarMetaState,
  ModalConfirmarDeleteState,
  ModalSucessoDeleteState,
  ModalSucessoState,
  UpdateMetaRequest,
} from '../../interfaces/metas';
import { ApiService } from '../api/api.service';
import { environment } from 'src/environments';

/**
 * Serviço principal de metas: API + modal adicionar meta + modais de exclusão.
 */
@Injectable({ providedIn: 'root' })
export class MetasService {
  private readonly API_URL = `${environment.apiUrl}/metas`;

  // --- Modal Adicionar Meta ---
  private readonly initialStateAdicionar: ModalAdicionarMetaState = {
    isOpen: false,
    nome: '',
    valorMetaRaw: '',
    valorPorMesRaw: '',
    valorAtualRaw: '',
    temValorAtual: false,
    icon: 'bi-bullseye',
  };
  private stateAdicionarSubject = new BehaviorSubject<ModalAdicionarMetaState>(
    this.initialStateAdicionar,
  );
  public state$: Observable<ModalAdicionarMetaState> =
    this.stateAdicionarSubject.asObservable();

  private saveAdicionarSubject = new Subject<void>();
  public save$: Observable<void> = this.saveAdicionarSubject.asObservable();

  private sucessoStateSubject = new BehaviorSubject<ModalSucessoState>({
    isOpen: false,
    title: '',
    message: '',
  });
  public sucessoState$: Observable<ModalSucessoState> =
    this.sucessoStateSubject.asObservable();

  private confirmarDeleteStateSubject =
    new BehaviorSubject<ModalConfirmarDeleteState>({
      isOpen: false,
      message: '',
      metaId: null,
      metaNome: '',
    });
  public confirmarDeleteState$: Observable<ModalConfirmarDeleteState> =
    this.confirmarDeleteStateSubject.asObservable();

  private confirmDeleteSubject = new Subject<number>();
  public confirmDelete$: Observable<number> =
    this.confirmDeleteSubject.asObservable();

  private sucessoDeleteStateSubject =
    new BehaviorSubject<ModalSucessoDeleteState>({ isOpen: false });
  public sucessoDeleteState$: Observable<ModalSucessoDeleteState> =
    this.sucessoDeleteStateSubject.asObservable();

  constructor(private apiService: ApiService) {
    console.log('🎯 MetasService inicializado');
    console.log('🌐 API URL:', this.API_URL);
  }

  private logRequest(method: string, endpoint: string): void {
    const timestamp = new Date().toLocaleTimeString();
    console.group(
      `🚀 [${timestamp}] MetasService - ${method.toUpperCase()} ${endpoint}`,
    );
  }

  // ========== API ==========
  getMetas(): Observable<Meta[]> {
    this.logRequest('GET', '');
    return this.apiService.get<Meta[]>('/metas').pipe(
      tap((response) => {
        console.log(`📊 Total de metas retornadas: ${response.length}`);
      }),
      catchError((error) => {
        throw error;
      }),
    );
  }

  getMeta(id: number): Observable<Meta> {
    return this.apiService.get<Meta>(`/metas/${id}`);
  }

  createMeta(meta: CreateMetaRequest): Observable<Meta> {
    return this.apiService.post<Meta>('/metas', meta);
  }

  updateMeta(id: number, meta: UpdateMetaRequest): Observable<Meta> {
    return this.apiService.patch<Meta>(`/metas/${id}`, meta);
  }

  deleteMeta(id: number): Observable<void> {
    return this.apiService.delete(`/metas/${id}`);
  }

  // ========== Modal Adicionar Meta ==========
  getState(): ModalAdicionarMetaState {
    return this.stateAdicionarSubject.value;
  }

  open(): void {
    this.stateAdicionarSubject.next({
      ...this.initialStateAdicionar,
      isOpen: true,
    });
  }

  close(): void {
    this.stateAdicionarSubject.next({
      ...this.stateAdicionarSubject.value,
      isOpen: false,
    });
  }

  updateNome(nome: string): void {
    this.stateAdicionarSubject.next({
      ...this.stateAdicionarSubject.value,
      nome,
    });
  }

  updateValorMetaRaw(valor: string): void {
    this.stateAdicionarSubject.next({
      ...this.stateAdicionarSubject.value,
      valorMetaRaw: valor,
    });
  }

  updateValorPorMesRaw(valor: string): void {
    this.stateAdicionarSubject.next({
      ...this.stateAdicionarSubject.value,
      valorPorMesRaw: valor,
    });
  }

  updateValorAtualRaw(valor: string): void {
    this.stateAdicionarSubject.next({
      ...this.stateAdicionarSubject.value,
      valorAtualRaw: valor,
    });
  }

  updateTemValorAtual(temValorAtual: boolean): void {
    this.stateAdicionarSubject.next({
      ...this.stateAdicionarSubject.value,
      temValorAtual,
      valorAtualRaw: temValorAtual
        ? this.stateAdicionarSubject.value.valorAtualRaw
        : '',
    });
  }

  updateIcon(icon: string): void {
    this.stateAdicionarSubject.next({
      ...this.stateAdicionarSubject.value,
      icon,
    });
  }

  triggerSave(): void {
    this.saveAdicionarSubject.next();
  }

  reset(): void {
    this.stateAdicionarSubject.next(this.initialStateAdicionar);
  }

  getSucessoState(): ModalSucessoState {
    return this.sucessoStateSubject.value;
  }

  showSucesso(title: string, message: string): void {
    this.sucessoStateSubject.next({ isOpen: true, title, message });
  }

  closeSucesso(): void {
    this.sucessoStateSubject.next({
      ...this.sucessoStateSubject.value,
      isOpen: false,
    });
    this.close();
    this.reset();
  }

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

  getSucessoDeleteState(): ModalSucessoDeleteState {
    return this.sucessoDeleteStateSubject.value;
  }

  showSucessoDelete(): void {
    this.closeConfirmarDelete();
    this.sucessoDeleteStateSubject.next({ isOpen: true });
  }

  closeSucessoDelete(): void {
    this.sucessoDeleteStateSubject.next({ isOpen: false });
  }
}
