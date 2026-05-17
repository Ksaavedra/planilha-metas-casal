import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateReceitaRequest,
  Receita,
  UpdateReceitaRequest,
} from '../../interfaces/receitas/receitas';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments';

@Injectable({ providedIn: 'root' })
export class ReceitasService {
  private readonly API_URL = `${environment.apiUrl}/receitas`;

  constructor(private httpClient: HttpClient) {}

  getReceitas(params: { ano: number; mes: number }): Observable<Receita[]> {
    return this.httpClient.get<Receita[]>(`${this.API_URL}`, { params });
  }

  getReceita(id: number): Observable<Receita> {
    return this.httpClient.get<Receita>(`${this.API_URL}/${id}`);
  }

  createReceita(receita: CreateReceitaRequest): Observable<Receita> {
    return this.httpClient.post<Receita>(`${this.API_URL}`, receita);
  }

  updateReceita(
    id: number,
    receita: UpdateReceitaRequest,
  ): Observable<Receita> {
    return this.httpClient.patch<Receita>(`${this.API_URL}/${id}`, receita);
  }

  deleteReceita(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.API_URL}/${id}`);
  }
}
