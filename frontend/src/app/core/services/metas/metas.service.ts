import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import {
  CreateMetaRequest,
  Meta,
  ModalConfirmarDeleteState,
  ModalSucessoDeleteState,
  ModalSucessoState,
  UpdateMetaRequest,
} from '../../interfaces/metas';
import { ApiService } from '../api/api.service';
import { environment } from 'src/environments';

/**
 * Serviço principal de metas: API + modais de sucesso/exclusão.
 */
@Injectable({ providedIn: 'root' })
export class MetasService {
  private readonly API_URL = `${environment.apiUrl}/metas`;
  private readonly ANO_STORAGE_KEY = 'metas_ano_selecionado';
  private readonly anoSelecionadoSubject = new BehaviorSubject<number>(
    this.readAnoSalvo(),
  );
  readonly anoSelecionado$ = this.anoSelecionadoSubject.asObservable();

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

  getAnoSelecionado(): number {
    return this.anoSelecionadoSubject.value;
  }

  setAnoSelecionado(ano: number): void {
    this.anoSelecionadoSubject.next(ano);
    try {
      localStorage.setItem(this.ANO_STORAGE_KEY, String(ano));
    } catch {
      // ignore storage errors
    }
  }

  private readAnoSalvo(): number {
    try {
      const stored = localStorage.getItem(this.ANO_STORAGE_KEY);
      const parsed = stored ? parseInt(stored, 10) : NaN;
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return new Date().getFullYear();
  }

  // ========== API ==========
  getMetas(ano?: number): Observable<Meta[]> {
    const anoConsulta = ano ?? this.getAnoSelecionado();
    this.logRequest('GET', `?ano=${anoConsulta}`);
    return this.apiService.get<Meta[]>(`/metas?ano=${anoConsulta}`).pipe(
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
