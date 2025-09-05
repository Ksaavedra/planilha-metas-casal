import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api.service';

export interface Receita {
  id: number;
  mes_id: number;
  categoriaId: number;
  descricao: string;
  valor: number;
  status: 'Vazio' | 'Programado' | 'Recebido';
  tipo: 'Ativa' | 'Passiva' | 'Extra';
  data?: string;
  observacao?: string;
  categoria: Categoria;
  mes: Mes;
}

export interface Categoria {
  id: number;
  nome: string;
  tipo: string;
  descricao?: string;
  ativo: boolean;
}

export interface Mes {
  id: number;
  nome: string;
  numero: number;
}

export interface CreateReceitaRequest {
  mes_id: number;
  categoriaId: number;
  descricao: string;
  valor: number;
  status?: 'Vazio' | 'Programado' | 'Recebido';
  tipo?: 'Ativa' | 'Passiva' | 'Extra';
  data?: string;
  observacao?: string;
}

export interface UpdateReceitaRequest extends Partial<CreateReceitaRequest> {}

@Injectable({
  providedIn: 'root',
})
export class ReceitasService {
  constructor(private apiService: ApiService) {}

  // Listar todas as receitas
  getReceitas(params?: {
    mes_id?: number;
    categoriaId?: number;
    tipo?: string;
  }): Observable<Receita[]> {
    return this.apiService.get<Receita[]>('/receitas', params);
  }

  // Buscar receita por ID
  getReceita(id: number): Observable<Receita> {
    return this.apiService.get<Receita>(`/receitas/${id}`);
  }

  // Criar nova receita
  createReceita(receita: CreateReceitaRequest): Observable<Receita> {
    return this.apiService.post<Receita>('/receitas', receita);
  }

  // Atualizar receita
  updateReceita(
    id: number,
    receita: UpdateReceitaRequest
  ): Observable<Receita> {
    return this.apiService.patch<Receita>(`/receitas/${id}`, receita);
  }

  // Deletar receita
  deleteReceita(id: number): Observable<void> {
    return this.apiService.delete(`/receitas/${id}`);
  }

  // Filtrar receitas por mês
  getReceitasPorMes(mesId: number): Observable<Receita[]> {
    return this.getReceitas({ mes_id: mesId });
  }

  // Filtrar receitas por categoria
  getReceitasPorCategoria(categoriaId: number): Observable<Receita[]> {
    return this.getReceitas({ categoriaId });
  }

  // Filtrar receitas por tipo
  getReceitasPorTipo(
    tipo: 'Ativa' | 'Passiva' | 'Extra'
  ): Observable<Receita[]> {
    return this.getReceitas({ tipo });
  }

  // Calcular total de receitas
  calcularTotalReceitas(receitas: Receita[]): number {
    return receitas.reduce((total, receita) => total + receita.valor, 0);
  }

  // Agrupar receitas por categoria
  agruparPorCategoria(receitas: Receita[]): { [key: string]: number } {
    return receitas.reduce((acc, receita) => {
      const categoria = receita.categoria.nome;
      acc[categoria] = (acc[categoria] || 0) + receita.valor;
      return acc;
    }, {} as { [key: string]: number });
  }

  // Agrupar receitas por tipo
  agruparPorTipo(receitas: Receita[]): { [key: string]: number } {
    return receitas.reduce((acc, receita) => {
      const tipo = receita.tipo;
      acc[tipo] = (acc[tipo] || 0) + receita.valor;
      return acc;
    }, {} as { [key: string]: number });
  }
}
