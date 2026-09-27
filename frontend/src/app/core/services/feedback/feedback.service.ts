import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import {
  CreateFeedbackRequest,
  Feedback,
} from '@core/interfaces/feedback/feedback';

export const FEEDBACK_INTERVALO_DIAS = 15;
const DIA_MS = 24 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  constructor(private apiService: ApiService) {}

  enviar(feedback: CreateFeedbackRequest): Observable<Feedback> {
    return this.apiService.post<Feedback>('/feedback', feedback);
  }

  /**
   * No primeiro acesso só agenda o próximo pedido, para não interromper
   * quem acabou de começar a usar o sistema.
   */
  deveExibir(usuarioId: number, agora: Date = new Date()): boolean {
    const proximo = this.lerProximaData(usuarioId);
    if (proximo === null) {
      this.adiar(usuarioId, agora);
      return false;
    }
    return agora.getTime() >= proximo;
  }

  adiar(usuarioId: number, agora: Date = new Date()): void {
    const proximo = agora.getTime() + FEEDBACK_INTERVALO_DIAS * DIA_MS;
    try {
      localStorage.setItem(this.chave(usuarioId), new Date(proximo).toISOString());
    } catch {
      // ignore storage errors
    }
  }

  private lerProximaData(usuarioId: number): number | null {
    try {
      const salvo = localStorage.getItem(this.chave(usuarioId));
      const data = salvo ? Date.parse(salvo) : NaN;
      return Number.isFinite(data) ? data : null;
    } catch {
      return null;
    }
  }

  private chave(usuarioId: number): string {
    return `feedback_proximo_${usuarioId}`;
  }
}
