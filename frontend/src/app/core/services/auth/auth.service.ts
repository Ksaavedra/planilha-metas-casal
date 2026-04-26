import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import {
  Usuario,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from 'auths/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  constructor(private apiService: ApiService) {
    this.loadStoredAuth();
  }

  // Carregar dados de autenticação armazenados
  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userStr = localStorage.getItem(this.userKey);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  // Login
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((response) => {
        this.setAuth(response.token, response.usuario);
      }),
      catchError((error) => {
        console.error('Erro no login:', error);
        throw error;
      }),
    );
  }

  // Registro
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/registrar', userData).pipe(
      tap((response) => {
        this.setAuth(response.token, response.usuario);
      }),
      catchError((error) => {
        console.error('Erro no registro:', error);
        throw error;
      }),
    );
  }

  // Logout
  logout(): void {
    this.clearAuth();
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    return !!token;
  }

  // Obter token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Obter usuário atual
  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  // Definir autenticação
  private setAuth(token: string, user: Usuario): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // Limpar autenticação
  private clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  // Verificar perfil (mock para teste)
  getProfile(): Observable<Usuario> {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      return of(currentUser);
    }

    // Se não há usuário, retorna um mock
    return of({
      id: '1',
      nome: 'Usuário Teste',
      email: 'teste@exemplo.com',
    });
  }
}
