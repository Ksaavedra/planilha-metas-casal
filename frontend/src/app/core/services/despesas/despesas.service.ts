import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';

/** Despesa recorrente (ex.: aluguel) vs que muda mês a mês (mercado). */
export type NaturezaDespesa = 'fixa' | 'variavel';

export interface Despesa {
  id: number;
  pessoa?: string;
  natureza: NaturezaDespesa;
  categoria: string;
  descricao: string;
  valor: number;
  data: string | null;
  ano: number;
  mes: number;
}

export interface CreateDespesaRequest {
  pessoa: string;
  natureza: NaturezaDespesa;
  categoria: string;
  descricao: string;
  valor: number;
  data?: string | null;
  ano: number;
  mes: number;
}

export type UpdateDespesaRequest = Partial<CreateDespesaRequest>;

@Injectable({ providedIn: 'root' })
export class DespesasService {
  constructor(private apiService: ApiService) {}

  getDespesas(params: { ano: number; mes: number }): Observable<Despesa[]> {
    return this.apiService.get<Despesa[]>('/despesas', params);
  }

  getDespesa(id: number): Observable<Despesa> {
    return this.apiService.get<Despesa>(`/despesas/${id}`);
  }

  createDespesa(despesa: CreateDespesaRequest): Observable<Despesa> {
    return this.apiService.post<Despesa>('/despesas', despesa);
  }

  updateDespesa(
    id: number,
    despesa: UpdateDespesaRequest,
  ): Observable<Despesa> {
    return this.apiService.patch<Despesa>(`/despesas/${id}`, despesa);
  }

  deleteDespesa(id: number): Observable<void> {
    return this.apiService.delete<void>(`/despesas/${id}`);
  }

  /** Total do array (útil para subtotais). */
  calcularTotalDespesas(despesas: Despesa[]): number {
    return despesas.reduce((total, d) => total + (Number(d.valor) || 0), 0);
  }
}
