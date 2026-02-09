import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from '../api/api.service';

// --- Tipos e interfaces da API ---
export type PessoaReceita = string;
export type TipoReceita =
  | 'Salário'
  | 'Bônus'
  | 'Freela'
  | 'Renda extra'
  | 'Aluguel'
  | 'Outras rendas compartilhadas';
export type CategoriaReceita = 'Fixa' | 'Variável';

/** Opções para select de Tipo de receita (ordem do dropdown). */
export const TIPOS_RECEITA: TipoReceita[] = [
  'Salário',
  'Bônus',
  'Freela',
  'Renda extra',
  'Aluguel',
  'Outras rendas compartilhadas',
];

/** Opções para select de Categoria (Fixa / Variável). */
export const CATEGORIAS_RECEITA: CategoriaReceita[] = ['Fixa', 'Variável'];

export interface ReceitaMensal {
  id?: number;
  pessoa: PessoaReceita;
  tipo: TipoReceita;
  categoria: CategoriaReceita;
  valor: number;
  ano?: number;
  mes?: number;
}

// --- Estado do modal Adicionar/Editar ---
export interface ModalAdicionarUsuarioState {
  isOpen: boolean;
  isEditMode: boolean;
  receitaId?: number;
  nomeUsuario: string;
  valorSalarioRaw: string;
  tipo: TipoReceita;
  categoria: CategoriaReceita;
  mesesSelecionados: number[];
  ano: number;
}

// --- Estado do modal Confirmar/Sucesso Excluir ---
export interface ModalConfirmarExcluirReceitaState {
  isOpen: boolean;
  message: string;
  receitaId: number | null;
}

export interface ModalSucessoExcluirReceitaState {
  isOpen: boolean;
}

/**
 * Serviço principal de receitas: API, cache de pessoas, modal adicionar/editar e modal excluir.
 */
@Injectable({ providedIn: 'root' })
export class ReceitasService {
  // --- API + Cache ---
  private readonly pessoasCache$ = new BehaviorSubject<string[]>([]);

  // --- Modal Adicionar/Editar ---
  private readonly stateSubject =
    new BehaviorSubject<ModalAdicionarUsuarioState>(this.getInitialState());

  // private stateSubject = new BehaviorSubject<ModalAdicionarUsuarioState>(this.initialState);
  public readonly state$: Observable<ModalAdicionarUsuarioState> =
    this.stateSubject.asObservable();

  private readonly saveSubject = new Subject<{
    nomeUsuario: string;
    valorSalario: number;
    tipo: TipoReceita;
    categoria: CategoriaReceita;
    meses: number[];
    ano: number;
    receitaId?: number;
  }>();
  public save$ = this.saveSubject.asObservable();

  // --- Modal Excluir ---
  private confirmStateSubject =
    new BehaviorSubject<ModalConfirmarExcluirReceitaState>({
      isOpen: false,
      message: '',
      receitaId: null,
    });
  public readonly confirmState$: Observable<ModalConfirmarExcluirReceitaState> =
    this.confirmStateSubject.asObservable();

  private readonly confirmSubject = new Subject<number>();
  public readonly confirmDelete$: Observable<number> =
    this.confirmSubject.asObservable();

  private readonly successStateSubject =
    new BehaviorSubject<ModalSucessoExcluirReceitaState>({
      isOpen: false,
    });
  public readonly successState$: Observable<ModalSucessoExcluirReceitaState> =
    this.successStateSubject.asObservable();

  constructor(private api: ApiService) {}

  private getInitialState(): ModalAdicionarUsuarioState {
    return {
      isOpen: false,
      isEditMode: false,
      nomeUsuario: '',
      valorSalarioRaw: '',
      tipo: 'Salário',
      categoria: 'Fixa',
      mesesSelecionados: [],
      ano: new Date().getFullYear(),
    };
  }

  private normalizarListaPessoas(pessoas: string[]): string[] {
    const vistos = new Set<string>();

    return (pessoas || [])
      .map((p) => (p || '').trim())
      .filter(Boolean)
      .map((p) => p) // se quiser TitleCase aqui, dá pra colocar
      .filter((p) => {
        const key = p.toLowerCase();
        if (vistos.has(key)) return false;
        vistos.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  }

  // ========== API e cache ==========
  getPorMesAno(ano: number, mes: number): Observable<ReceitaMensal[]> {
    return this.api.get<ReceitaMensal[]>('/receitas', { ano, mes });
  }

  getPessoasCache(): string[] {
    return this.pessoasCache$.value;
  }

  addPessoaToCache(nome: string): void {
    const n = (nome || '').trim();
    if (!n) return;
    const atual = this.pessoasCache$.value;
    const key = n.toLowerCase();
    if (atual.some((p) => p.toLowerCase() === key)) return;
    this.pessoasCache$.next(this.normalizarListaPessoas([...atual, n]));
  }

  loadPessoasDistintas(): Observable<string[]> {
    return this.api.get<string[]>('/receitas/pessoas').pipe(
      catchError(() => of([])),
      tap((pessoas) => {
        // const lista = (pessoas || [])
        //   .map((p) => (p || '').trim())
        //   .filter(Boolean)
        //   .sort((a, b) => a.localeCompare(b));
        this.pessoasCache$.next(this.normalizarListaPessoas(pessoas || []));
      }),
    );
  }

  refreshPessoas(): void {
    this.loadPessoasDistintas().subscribe();
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

  /** Cria receitas para cada mês selecionado com tipo e categoria escolhidos. */
  createReceitasParaUsuario(
    nomeUsuario: string,
    valorSalario: number,
    tipo: TipoReceita,
    categoria: CategoriaReceita,
    meses: number[],
    ano: number,
  ): Observable<ReceitaMensal[]> {
    const pessoa = (nomeUsuario || '').trim() as PessoaReceita;
    const requests = (meses || []).map((mes) =>
      this.api.post<ReceitaMensal>('/receitas', {
        pessoa,
        tipo,
        categoria,
        valor: valorSalario,
        ano,
        mes,
      }),
    );
    return forkJoin(requests);
  }

  // ========== Modal Adicionar/Editar ==========
  getState(): ModalAdicionarUsuarioState {
    return this.stateSubject.value;
  }

  open(): void {
    const anoAtual = new Date().getFullYear();
    this.stateSubject.next({
      ...this.getInitialState(),
      isOpen: true,
      isEditMode: false,
      ano: anoAtual,
    });
  }

  openForEdit(receita: {
    id?: number;
    pessoa: string;
    valor: number;
    tipo?: TipoReceita;
    categoria?: CategoriaReceita;
    ano?: number;
    mes?: number;
  }): void {
    if (receita.id == null) return;
    const valorRaw =
      receita.valor == null ? '' : receita.valor.toFixed(2).replace('.', ',');
    const tipo = this.normalizarTipo(receita.tipo);
    const categoria = this.normalizarCategoria(receita.categoria);
    this.stateSubject.next({
      ...this.getInitialState(),
      isOpen: true,
      isEditMode: true,
      receitaId: receita.id,
      nomeUsuario: receita.pessoa?.trim() ?? '',
      valorSalarioRaw: valorRaw,
      tipo,
      categoria,
      mesesSelecionados: receita.mes != null ? [receita.mes] : [],
      ano: receita.ano ?? new Date().getFullYear(),
    });
  }

  private normalizarTipo(tipo?: string | TipoReceita): TipoReceita {
    if (tipo && TIPOS_RECEITA.includes(tipo as TipoReceita)) return tipo as TipoReceita;
    return 'Salário';
  }

  private normalizarCategoria(cat?: string | CategoriaReceita): CategoriaReceita {
    if (cat === 'Variável' || cat === 'Fixa') return cat;
    if (typeof cat === 'string' && /variavel|variável/i.test(cat)) return 'Variável';
    return 'Fixa';
  }

  close(): void {
    this.stateSubject.next({ ...this.getInitialState(), isOpen: false });
  }

  updateNomeUsuario(nome: string): void {
    const currentState = this.stateSubject.value;
    if (currentState.nomeUsuario === nome) return;
    this.stateSubject.next({ ...currentState, nomeUsuario: nome });
  }

  updateValorSalarioRaw(valor: string): void {
    const currentState = this.stateSubject.value;
    if (currentState.valorSalarioRaw === valor) return;
    this.stateSubject.next({ ...currentState, valorSalarioRaw: valor });
  }

  updateTipo(tipo: TipoReceita): void {
    const currentState = this.stateSubject.value;
    if (currentState.tipo === tipo) return;
    this.stateSubject.next({ ...currentState, tipo });
  }

  updateCategoria(categoria: CategoriaReceita): void {
    const currentState = this.stateSubject.value;
    if (currentState.categoria === categoria) return;
    this.stateSubject.next({ ...currentState, categoria });
  }

  toggleMes(mes: number): void {
    const currentState = this.stateSubject.value;
    const meses = [...currentState.mesesSelecionados];
    const index = meses.indexOf(mes);
    if (index > -1) meses.splice(index, 1);
    else {
      meses.push(mes);
      meses.sort((a, b) => a - b);
    }
    this.stateSubject.next({ ...currentState, mesesSelecionados: meses });
  }

  selecionarTodosMeses(): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      mesesSelecionados: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    });
  }

  desmarcarTodosMeses(): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, mesesSelecionados: [] });
  }

  updateAno(ano: number): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ano });
  }

  triggerSave(
    nomeUsuario: string,
    valorSalario: number,
    tipo: TipoReceita,
    categoria: CategoriaReceita,
    meses: number[],
    ano: number,
    receitaId?: number,
  ): void {
    this.saveSubject.next({
      nomeUsuario,
      valorSalario,
      tipo,
      categoria,
      meses,
      ano,
      receitaId,
    });
  }

  reset(): void {
    this.stateSubject.next(this.getInitialState());
  }

  // ========== Modal Excluir ==========
  openConfirm(receita: { id?: number; pessoa?: string; valor: number }): void {
    if (receita.id == null) return;
    const valorStr = receita.valor.toFixed(2).replace('.', ',');
    const nome = (receita.pessoa ?? '').trim();
    const message = nome
      ? `Excluir esta receita de ${nome} (R$ ${valorStr})?`
      : `Excluir esta receita (R$ ${valorStr})?`;
    this.confirmStateSubject.next({
      isOpen: true,
      message,
      receitaId: receita.id,
    });
  }

  onConfirm(): void {
    const state = this.confirmStateSubject.value;
    if (state.receitaId != null) this.confirmSubject.next(state.receitaId);
    this.confirmStateSubject.next({
      isOpen: false,
      message: '',
      receitaId: null,
    });
  }

  onCancel(): void {
    this.confirmStateSubject.next({
      isOpen: false,
      message: '',
      receitaId: null,
    });
  }

  openSuccess(): void {
    this.successStateSubject.next({ isOpen: true });
  }

  closeSuccess(): void {
    this.successStateSubject.next({ isOpen: false });
  }
}
