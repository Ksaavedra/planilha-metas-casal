export interface Usuario {
  id: number;
  nome: string;
  email: string;
  dataCriacao?: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface PerfilResponse extends Usuario {}

export interface AuthResponse {
  message: string;
  token: string;
  usuario: Usuario;
}
