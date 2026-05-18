import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments';
import {
  CreateInvestimentoRequest,
  Investimento,
  UpdateInvestimentoRequest,
} from '../../interfaces/investimentos/investimentos';

@Injectable({ providedIn: 'root' })
export class InvestimentosService {
  private readonly API_URL = `${environment.apiUrl}/investimentos`;
  private readonly ANO_STORAGE_KEY = 'investimentos_ano_selecionado';

  constructor(private http: HttpClient) {}

  getAnoSelecionado(): number {
    const salvo = localStorage.getItem(this.ANO_STORAGE_KEY);
    const n = salvo ? parseInt(salvo, 10) : NaN;
    return Number.isFinite(n) ? n : new Date().getFullYear();
  }

  setAnoSelecionado(ano: number): void {
    localStorage.setItem(this.ANO_STORAGE_KEY, String(ano));
  }

  getInvestimentos(params: {
    ano: number;
    tipo?: string;
  }): Observable<Investimento[]> {
    const query: Record<string, string | number> = { ano: params.ano };
    if (params.tipo) {
      query['tipo'] = params.tipo;
    }
    return this.http.get<Investimento[]>(this.API_URL, { params: query });
  }

  getInvestimento(id: number): Observable<Investimento> {
    return this.http.get<Investimento>(`${this.API_URL}/${id}`);
  }

  createInvestimento(
    body: CreateInvestimentoRequest,
  ): Observable<Investimento> {
    return this.http.post<Investimento>(this.API_URL, body);
  }

  updateInvestimento(
    id: number,
    body: UpdateInvestimentoRequest,
  ): Observable<Investimento> {
    return this.http.patch<Investimento>(`${this.API_URL}/${id}`, body);
  }

  deleteInvestimento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
