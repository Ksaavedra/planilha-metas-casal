import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments';
import {
  Despesa,
  CreateDespesaRequest,
  UpdateDespesaRequest,
} from '../../interfaces/despesas/despesas';

@Injectable({ providedIn: 'root' })
export class DespesasService {
  private readonly API_URL = `${environment.apiUrl}/despesas`;

  constructor(private httpClient: HttpClient) {}

  getDespesas(params: { ano: number; mes: number }): Observable<Despesa[]> {
    return this.httpClient.get<Despesa[]>(`${this.API_URL}`, { params });
  }

  getDespesa(id: number): Observable<Despesa> {
    return this.httpClient.get<Despesa>(`${this.API_URL}/${id}`);
  }

  createDespesa(despesa: CreateDespesaRequest): Observable<Despesa> {
    return this.httpClient.post<Despesa>(`${this.API_URL}`, despesa);
  }

  updateDespesa(
    id: number,
    despesa: UpdateDespesaRequest,
  ): Observable<Despesa> {
    return this.httpClient.patch<Despesa>(`${this.API_URL}/${id}`, despesa);
  }

  deleteDespesa(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.API_URL}/${id}`);
  }
}
