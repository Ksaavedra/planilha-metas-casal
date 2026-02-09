import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from '../api/api.service';

export type PessoaReceita = string;
export type TipoReceita =
  | 'Salário'
  | 'Bônus'
  | 'Freela'
  | 'Renda extra'
  | 'Aluguel'
  | 'Outras rendas compartilhadas';
export type CategoriaReceita = 'Fixa' | 'Variável';

export interface ReceitaMensal {
  id?: number;
  pessoa: PessoaReceita;
  tipo: TipoReceita;
  categoria: CategoriaReceita;
  valor: number;
  ano?: number;
  mes?: number;
}

@Injectable({ providedIn: 'root' })
export class ReceitasMensaisService {
  /** Cache de nomes para o autocomplete; carregado com a página de receitas. */
  private pessoasCache$ = new BehaviorSubject<string[]>([]);

  constructor(private api: ApiService) {}

  getPorMesAno(ano: number, mes: number): Observable<ReceitaMensal[]> {
    return this.api.get<ReceitaMensal[]>('/receitas', { ano, mes });
  }

  /** Retorna o cache atual de pessoas (para o autocomplete abrir já com lista). */
  getPessoasCache(): string[] {
    return this.pessoasCache$.value;
  }

  /** Inclui um nome no cache (ex.: após adicionar receita para nova pessoa). Assim o autocomplete já mostra na próxima abertura do modal. */
  addPessoaToCache(nome: string): void {
    const n = (nome || '').trim();
    if (!n) return;
    const atual = this.pessoasCache$.value;
    const key = n.toLowerCase();
    if (atual.some((p) => p.toLowerCase() === key)) return;
    this.pessoasCache$.next([...atual, n].sort((a, b) => a.localeCompare(b)));
  }

  /** Carrega pessoas da API e atualiza o cache. Chamar ao abrir a página e ao abrir o modal. */
  loadPessoasDistintas(): Observable<string[]> {
    // Limpa o cache antes de buscar: a lista exibida deve vir só da API (evita David/Kelly antigos).
    this.pessoasCache$.next([]);
    return this.api.get<string[]>('/receitas/pessoas').pipe(
      catchError(() => of([])),
      tap((pessoas) => {
        const lista = (pessoas || [])
          .map((p) => (p || '').trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        this.pessoasCache$.next(lista);
      }),
    );
  }

  /** Observable da API (para quem precisar só da chamada). */
  getPessoasDistintas(): Observable<string[]> {
    return this.api.get<string[]>('/receitas/pessoas');
  }

  create(
    receita: ReceitaMensal & { ano: number; mes: number },
  ): Observable<ReceitaMensal> {
    return this.api.post<ReceitaMensal>('/receitas', receita);
  }

  update(
    id: number,
    receita: Partial<ReceitaMensal>,
  ): Observable<ReceitaMensal> {
    return this.api.patch<ReceitaMensal>(`/receitas/${id}`, receita);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/receitas/${id}`);
  }

  /** Cria receitas de Salário (Fixa) para cada mês selecionado no ano. Retorna as criadas. */
  createSalariosParaUsuario(
    nomeUsuario: string,
    valorSalario: number,
    meses: number[],
    ano: number,
  ): Observable<ReceitaMensal[]> {
    const pessoa = nomeUsuario.trim() as PessoaReceita;
    const requests = meses.map((mes) =>
      this.api.post<ReceitaMensal>('/receitas', {
        pessoa,
        tipo: 'Salário' as TipoReceita,
        categoria: 'Fixa' as CategoriaReceita,
        valor: valorSalario,
        ano,
        mes,
      }),
    );
    return forkJoin(requests);
  }
}
