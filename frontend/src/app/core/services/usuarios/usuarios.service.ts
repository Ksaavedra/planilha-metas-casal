import { Injectable } from '@angular/core';
import { environment } from 'src/environments';
import { HttpClient } from '@angular/common/http';
import {
  CreateUsuariosRequest,
  UpdateUsuariosRequest,
  Usuario,
} from '@app/core/interfaces/usuarios';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  createUsuario(nome: string, apelido?: string | null): Observable<Usuario> {
    const payload: CreateUsuariosRequest = { nome };
    if (apelido?.trim()) {
      payload.apelido = apelido.trim();
    }
    return this.http.post<Usuario>(this.apiUrl, payload);
  }

  updateUsuario(
    id: number,
    nome: string,
    apelido?: string | null,
  ): Observable<Usuario> {
    const payload: UpdateUsuariosRequest = { nome };
    if (apelido?.trim()) {
      payload.apelido = apelido.trim();
    }
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, payload);
  }

  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
