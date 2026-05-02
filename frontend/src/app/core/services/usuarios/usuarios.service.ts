import { Injectable } from '@angular/core';
import { environment } from 'src/environments';
import { HttpClient } from '@angular/common/http';
import { CreateUsuariosRequest, Usuario } from '@app/core/interfaces/usuarios';
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

  createUsuario(nome: string): Observable<Usuario> {
    const payload: CreateUsuariosRequest = { nome };
    return this.http.post<Usuario>(this.apiUrl, payload);
  }
}
