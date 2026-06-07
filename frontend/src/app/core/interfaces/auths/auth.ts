export interface Usuario {
  id: number;
  usuario?: string;
  nomeCompleto: string;
  apelido?: string | null;
  email: string;
  tipoUso?: 'individual' | 'familia';
  dataCriacao?: string;
}

export interface LoginRequest {
  usuarioOuEmail: string;
  senha: string;
}

export interface RegisterRequest {
  usuario: string;
  nomeCompleto: string;
  apelido: string;
  email: string;
  senha: string;
}

export interface PerfilResponse extends Usuario {}

export interface AuthResponse {
  message: string;
  token: string;
  usuario: Usuario;
}
