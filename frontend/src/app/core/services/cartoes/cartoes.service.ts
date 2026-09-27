import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments';
import {
  Cartao,
  CreateCartaoRequest,
  PagamentoFaturaCartao,
  RegistrarPagamentoFaturaRequest,
  UpdateCartaoRequest,
} from '../../interfaces/cartoes/cartoes';

@Injectable({ providedIn: 'root' })
export class CartoesService {
  private readonly API_URL = `${environment.apiUrl}/cartoes`;

  constructor(private http: HttpClient) {}

  getCartoes(params?: { ano: number; mes: number }): Observable<Cartao[]> {
    return this.http.get<Cartao[]>(this.API_URL, { params });
  }

  getCartao(id: number): Observable<Cartao> {
    return this.http.get<Cartao>(`${this.API_URL}/${id}`);
  }

  createCartao(body: CreateCartaoRequest): Observable<Cartao> {
    return this.http.post<Cartao>(this.API_URL, body);
  }

  updateCartao(id: number, body: UpdateCartaoRequest): Observable<Cartao> {
    return this.http.patch<Cartao>(`${this.API_URL}/${id}`, body);
  }

  deleteCartao(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  registrarPagamentoFatura(
    id: number,
    body: RegistrarPagamentoFaturaRequest,
  ): Observable<PagamentoFaturaCartao> {
    return this.http.put<PagamentoFaturaCartao>(
      `${this.API_URL}/${id}/fatura-pagamento`,
      body,
    );
  }

  desfazerPagamentoFatura(
    id: number,
    ano: number,
    mes: number,
  ): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}/fatura-pagamento`, {
      params: { ano, mes },
    });
  }
}
