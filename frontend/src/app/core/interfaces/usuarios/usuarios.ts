export interface Usuario {
  id: number;
  nome: string;
  apelido?: string | null;
  nomeExibicao?: string;
  principal?: boolean;
}

export interface CreateUsuariosRequest {
  nome: string;
  apelido?: string | null;
}

export interface UpdateUsuariosRequest {
  nome: string;
  apelido?: string | null;
}
