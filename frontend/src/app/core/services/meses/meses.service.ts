import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';

export interface Mes {
  id: string;
  nome: string;
  numero: number;
}

@Injectable({
  providedIn: 'root',
})
export class MesesService {
  constructor(private apiService: ApiService) {}

  // Listar todos os meses
  getMeses(): Observable<Mes[]> {
    return this.apiService.get<Mes[]>('/meses');
  }

  // Buscar mês por ID
  getMes(id: string): Observable<Mes> {
    return this.apiService.get<Mes>(`/meses/${id}`);
  }

  // Buscar mês por número
  getMesPorNumero(numero: number): Observable<Mes | undefined> {
    return new Observable((observer) => {
      this.getMeses().subscribe((meses) => {
        const mes = meses.find((m) => m.numero === numero);
        observer.next(mes);
        observer.complete();
      });
    });
  }

  // Obter mês atual
  getMesAtual(): Observable<Mes | undefined> {
    const mesAtual = new Date().getMonth() + 1; // getMonth() retorna 0-11
    return this.getMesPorNumero(mesAtual);
  }

  // Obter nome do mês por número
  getNomeMes(numero: number): string {
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return meses[numero - 1] || 'Mês inválido';
  }

  // Obter número do mês por nome
  getNumeroMes(nome: string): number {
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return meses.indexOf(nome) + 1;
  }
}
