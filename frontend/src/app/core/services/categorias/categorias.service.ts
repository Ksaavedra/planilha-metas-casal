import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';

export interface Categoria {
  id: number;
  nome: string;
  tipo: string;
  descricao?: string;
  ativo: boolean;
}

export interface CreateCategoriaRequest {
  nome: string;
  tipo: string;
  descricao?: string;
}

export interface UpdateCategoriaRequest
  extends Partial<CreateCategoriaRequest> {
  ativo?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CategoriasService {
  constructor(private apiService: ApiService) {}

  // Listar todas as categorias
  getCategorias(params?: { tipo?: string }): Observable<Categoria[]> {
    return this.apiService.get<Categoria[]>('/categorias', params);
  }

  // Buscar categoria por ID
  getCategoria(id: number): Observable<Categoria> {
    return this.apiService.get<Categoria>(`/categorias/${id}`);
  }

  // Criar nova categoria
  createCategoria(categoria: CreateCategoriaRequest): Observable<Categoria> {
    return this.apiService.post<Categoria>('/categorias', categoria);
  }

  // Filtrar categorias por tipo
  getCategoriasPorTipo(tipo: 'receita' | 'despesa'): Observable<Categoria[]> {
    return this.getCategorias({ tipo });
  }

  // Obter categorias de despesas
  getCategoriasDespesas(): Observable<Categoria[]> {
    return this.getCategoriasPorTipo('despesa');
  }

  // Obter categorias de receitas
  getCategoriasReceitas(): Observable<Categoria[]> {
    return this.getCategoriasPorTipo('receita');
  }

  // Verificar se categoria existe
  categoriaExiste(nome: string, tipo: string): Observable<boolean> {
    return new Observable((observer) => {
      this.getCategorias({ tipo }).subscribe((categorias) => {
        const existe = categorias.some(
          (cat) => cat.nome.toLowerCase() === nome.toLowerCase()
        );
        observer.next(existe);
        observer.complete();
      });
    });
  }
}
