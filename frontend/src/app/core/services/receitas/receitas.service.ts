import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  CreateReceitaRequest,
  Receita,
  UpdateReceitaRequest,
} from '../../interfaces/receitas/receitas';
import { ApiService } from '../api/api.service';

@Injectable({ providedIn: 'root' })
export class ReceitasService {
  private readonly debug = true;

  private readonly confirmSubject = new Subject<number>();
  public readonly confirmDelete$: Observable<number> =
    this.confirmSubject.asObservable();

  constructor(private apiService: ApiService) {}

  private log(acao: string, payload?: unknown): void {
    if (!this.debug) return;
    if (payload === undefined) {
      console.log(`[ReceitasService] ${acao}`);
      return;
    }
  }

  getReceitas(params: { ano: number; mes: number }): Observable<Receita[]> {
    this.log('getReceitas', params);
    return this.apiService.get<Receita[]>('/receitas', params);
  }

  getReceita(id: number): Observable<Receita> {
    this.log('getReceita', { id });
    return this.apiService.get<Receita>(`/receitas/${id}`);
  }

  createReceita(receita: CreateReceitaRequest): Observable<Receita> {
    this.log('createReceita', receita);
    return this.apiService.post<Receita>('/receitas', receita);
  }

  updateReceita(
    id: number,
    receita: UpdateReceitaRequest,
  ): Observable<Receita> {
    this.log('updateReceita', { id, receita });
    return this.apiService.patch<Receita>(`/receitas/${id}`, receita);
  }

  deleteReceita(id: number): Observable<void> {
    this.log('deleteReceita', { id });
    return this.apiService.delete<void>(`/receitas/${id}`);
  }

  calcularTotalReceitas(receitas: Receita[]): number {
    return receitas.reduce((total, d) => total + (Number(d.valor) || 0), 0);
  }
}
