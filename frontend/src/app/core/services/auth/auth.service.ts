import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import {
  Usuario,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  PerfilResponse,
} from '@core/interfaces/auths/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'current_user';

  constructor(private apiService: ApiService) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userStr = localStorage.getItem(this.userKey);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as Usuario;
        this.currentUserSubject.next(user);
      } catch (error) {
        this.clearAuth();
      }
    }
  }

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

  logout(): void {
    this.clearAuth();
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  getProfile(): Observable<PerfilResponse> {
    return this.apiService.get<PerfilResponse>('/auth/perfil').pipe(
      tap((usuario) => {
        localStorage.setItem(this.userKey, JSON.stringify(usuario));
        this.currentUserSubject.next(usuario);
      }),
      catchError((error) => {
        if (error?.status === 401) {
          this.clearAuth();
        }
        throw error;
      }),
    );
  }

  private setAuth(token: string, user: Usuario): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }
}
