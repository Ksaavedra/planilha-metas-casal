import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments';
import {
  CreateDividaRequest,
  Divida,
  UpdateDividaRequest,
} from '../../interfaces/dividas/dividas';

@Injectable({ providedIn: 'root' })
export class DividasService {
  private readonly API_URL = `${environment.apiUrl}/dividas`;
  private readonly MES_STORAGE_KEY = 'dividas_mes_referencia';

  constructor(private http: HttpClient) {}

  getMesReferencia(): Date {
    const salvo = localStorage.getItem(this.MES_STORAGE_KEY);
    if (salvo) {
      const [y, m] = salvo.split('-').map((x) => parseInt(x, 10));
      if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
        return new Date(y, m - 1, 1);
      }
    }
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  }

  setMesReferencia(data: Date): void {
    const y = data.getFullYear();
    const m = String(data.getMonth() + 1).padStart(2, '0');
    localStorage.setItem(this.MES_STORAGE_KEY, `${y}-${m}`);
  }

  getDividas(ano: number): Observable<Divida[]> {
    return this.http.get<Divida[]>(this.API_URL, { params: { ano } });
  }

  getDivida(id: number): Observable<Divida> {
    return this.http.get<Divida>(`${this.API_URL}/${id}`);
  }

  createDivida(body: CreateDividaRequest): Observable<Divida> {
    return this.http.post<Divida>(this.API_URL, body);
  }

  updateDivida(id: number, body: UpdateDividaRequest): Observable<Divida> {
    return this.http.patch<Divida>(`${this.API_URL}/${id}`, body);
  }

  deleteDivida(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
