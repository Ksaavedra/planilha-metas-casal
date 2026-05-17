export interface Usuario {
  id: string;
  nome: string;
  email: string;
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

export interface AuthResponse {
  message: string;
  token: string;
  usuario: Usuario;
}
