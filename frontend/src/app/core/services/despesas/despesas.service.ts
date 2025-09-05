import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';

export interface Despesa {
  id: number;
  mes_id: number;
  categoriaId: number;
  descricao: string;
  valor: number;
  status: 'Vazio' | 'Programado' | 'Pago';
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

export interface CreateDespesaRequest {
  mes_id: number;
  categoriaId: number;
  descricao: string;
  valor: number;
  status?: 'Vazio' | 'Programado' | 'Pago';
  data?: string;
  observacao?: string;
}

export interface UpdateDespesaRequest extends Partial<CreateDespesaRequest> {}

@Injectable({
  providedIn: 'root',
})
export class DespesasService {
  constructor(private apiService: ApiService) {}

  // Listar todas as despesas
  getDespesas(params?: {
    mes_id?: number;
    categoriaId?: number;
  }): Observable<Despesa[]> {
    return this.apiService.get<Despesa[]>('/despesas', params);
  }

  // Buscar despesa por ID
  getDespesa(id: number): Observable<Despesa> {
    return this.apiService.get<Despesa>(`/despesas/${id}`);
  }

  // Criar nova despesa
  createDespesa(despesa: CreateDespesaRequest): Observable<Despesa> {
    return this.apiService.post<Despesa>('/despesas', despesa);
  }

  // Atualizar despesa
  updateDespesa(
    id: number,
    despesa: UpdateDespesaRequest
  ): Observable<Despesa> {
    return this.apiService.patch<Despesa>(`/despesas/${id}`, despesa);
  }

  // Deletar despesa
  deleteDespesa(id: number): Observable<void> {
    return this.apiService.delete(`/despesas/${id}`);
  }

  // Filtrar despesas por mês
  getDespesasPorMes(mesId: number): Observable<Despesa[]> {
    return this.getDespesas({ mes_id: mesId });
  }

  // Filtrar despesas por categoria
  getDespesasPorCategoria(categoriaId: number): Observable<Despesa[]> {
    return this.getDespesas({ categoriaId });
  }

  // Calcular total de despesas
  calcularTotalDespesas(despesas: Despesa[]): number {
    return despesas.reduce((total, despesa) => total + despesa.valor, 0);
  }

  // Agrupar despesas por categoria
  agruparPorCategoria(despesas: Despesa[]): { [key: string]: number } {
    return despesas.reduce((acc, despesa) => {
      const categoria = despesa.categoria.nome;
      acc[categoria] = (acc[categoria] || 0) + despesa.valor;
      return acc;
    }, {} as { [key: string]: number });
  }
}
