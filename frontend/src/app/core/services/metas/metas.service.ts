import { Injectable } from '@angular/core';
import { Observable, tap, catchError } from 'rxjs';
import { Meta, MesMeta } from '../../interfaces/mes-meta';
import { ApiService } from '../api/api.service';
import { environment } from 'src/environments';

export interface CreateMetaRequest {
  nome: string;
  valorMeta: number;
  valorPorMes: number;
  mesesNecessarios?: number;
  valorAtual?: number;
  meses?: Partial<MesMeta>[];
}

export interface UpdateMetaRequest extends Partial<CreateMetaRequest> {
  meses?: Partial<MesMeta>[];
}

@Injectable({
  providedIn: 'root',
})
export class MetasService {
  private readonly API_URL = `${environment.apiUrl}/metas`;

  constructor(private apiService: ApiService) {
    console.log('🎯 MetasService inicializado');
    console.log('🌐 API URL:', this.API_URL);
  }

  // Método para log detalhado
  private logRequest(method: string, endpoint: string): void {
    const timestamp = new Date().toLocaleTimeString();
    console.group(
      `🚀 [${timestamp}] MetasService - ${method.toUpperCase()} ${endpoint}`
    );
  }

  // Listar todas as metas
  getMetas(): Observable<Meta[]> {
    this.logRequest('GET', '');
    return this.apiService.get<Meta[]>('/metas').pipe(
      tap((response) => {
        console.log(`📊 Total de metas retornadas: ${response.length}`);
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  // Buscar meta por ID
  getMeta(id: number): Observable<Meta> {
    return this.apiService.get<Meta>(`/metas/${id}`);
  }

  // Criar nova meta
  createMeta(meta: CreateMetaRequest): Observable<Meta> {
    return this.apiService.post<Meta>('/metas', meta);
  }

  // Atualizar meta
  updateMeta(id: number, meta: UpdateMetaRequest): Observable<Meta> {
    return this.apiService.patch<Meta>(`/metas/${id}`, meta);
  }

  // Deletar meta
  deleteMeta(id: number): Observable<void> {
    return this.apiService.delete(`/metas/${id}`);
  }

  // Calcular progresso da meta
  calcularProgresso(meta: Meta): number {
    if (meta.valorMeta <= 0) return 0;
    return Math.min((meta.valorAtual / meta.valorMeta) * 100, 100);
  }

  // Calcular meses restantes
  calcularMesesRestantes(meta: Meta): number {
    if (meta.valorPorMes <= 0) return 0;
    const valorRestante = meta.valorMeta - meta.valorAtual;
    return Math.ceil(valorRestante / meta.valorPorMes);
  }
}
