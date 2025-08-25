import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Meta } from '../../../core/interfaces/mes-meta';

@Injectable({
  providedIn: 'root',
})
export class MetasService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Buscar todas as metas
  getMetas(): Observable<Meta[]> {
    return this.http.get<Meta[]>(`${this.apiUrl}/metas`);
  }

  // Criar nova meta
  createMeta(meta: Omit<Meta, 'id'> | Partial<Meta>): Observable<Meta> {
    const { id, ...body } = meta as any;
    return this.http.post<Meta>(`${this.apiUrl}/metas`, body);
  }

  // Atualizar meta com patch
  updateMeta(id: number, patch: Partial<Meta>): Observable<Meta> {
    return this.http.patch<Meta>(`${this.apiUrl}/metas/${id}`, patch);
  }

  // Deletar meta
  deleteMeta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/metas/${id}`);
  }

  // Atualizar meta com PUT
  updateMetaFull(id: number, full: Meta): Observable<Meta> {
    return this.http.put<Meta>(`${this.apiUrl}/metas/${id}`, full);
  }
}
