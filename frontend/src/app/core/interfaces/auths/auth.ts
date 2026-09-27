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

export interface MessageResponse {
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyResetCodeRequest {
  email: string;
  codigo: string;
}

export interface VerifyResetCodeResponse extends MessageResponse {
  resetToken: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  novaSenha: string;
}
