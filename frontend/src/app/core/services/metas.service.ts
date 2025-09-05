import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Meta, MesMeta } from '../interfaces/mes-meta';
import { ApiService } from './api.service';

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
  constructor(private apiService: ApiService) {}

  // Listar todas as metas
  getMetas(): Observable<Meta[]> {
    return this.apiService.get<Meta[]>('/metas');
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
