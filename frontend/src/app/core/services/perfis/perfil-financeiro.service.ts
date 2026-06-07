import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Perfil } from '@core/interfaces/perfis/perfil';
import { Usuario } from '@core/interfaces/usuarios';
import { UsuariosService } from '@core/services/usuarios/usuarios.service';

export type TipoUsoPerfil = 'individual' | 'familia';

@Injectable({ providedIn: 'root' })
export class PerfilFinanceiroService {
  private readonly tipoUsoStorageKey = 'orbis:tipo-uso-perfil';
  private readonly perfisSubject = new BehaviorSubject<Perfil[]>([]);
  private readonly tipoUsoSubject = new BehaviorSubject<TipoUsoPerfil>(
    this.carregarTipoUso(),
  );

  readonly perfis$ = this.perfisSubject.asObservable();
  readonly tipoUso$ = this.tipoUsoSubject.asObservable();
  readonly temGrupoFamiliar$ = this.tipoUso$.pipe(
    map((tipoUso) => tipoUso === 'familia'),
  );

  constructor(private usuariosService: UsuariosService) {}

  get perfis(): Perfil[] {
    return this.perfisSubject.value;
  }

  get temGrupoFamiliarAtual(): boolean {
    return this.tipoUsoAtual === 'familia';
  }

  get tipoUsoAtual(): TipoUsoPerfil {
    return this.tipoUsoSubject.value;
  }

  carregarUsuariosCadastrados(): void {
    this.recarregarPerfis().subscribe();
  }

  adicionarPerfil(nome: string, apelido?: string | null): Observable<Perfil | null> {
    const nomeNormalizado = this.normalizarNome(nome);
    const apelidoNormalizado = this.normalizarNome(apelido ?? '');
    if (!nomeNormalizado) return of(null);

    return this.usuariosService.createUsuario(
      nomeNormalizado,
      apelidoNormalizado || undefined,
    ).pipe(
      map((usuario) => this.perfilDeUsuario(usuario)),
      tap((perfil) => this.salvarPerfis([...this.perfis, perfil])),
      catchError(() => of(null)),
    );
  }

  atualizarPerfil(
    id: string,
    nome: string,
    apelido?: string | null,
  ): Observable<Perfil | null> {
    const nomeNormalizado = this.normalizarNome(nome);
    const apelidoNormalizado = this.normalizarNome(apelido ?? '');
    const usuarioId = this.extrairUsuarioId(id);
    if (!nomeNormalizado || usuarioId === null) return of(null);

    return this.usuariosService
      .updateUsuario(usuarioId, nomeNormalizado, apelidoNormalizado || undefined)
      .pipe(
        map((usuario) => this.perfilDeUsuario(usuario)),
        tap((perfilApi) => {
          const atualizados = this.perfis.map((perfil) =>
            perfil.id === id ? perfilApi : perfil,
          );
          this.salvarPerfis(atualizados);
        }),
        catchError(() => of(null)),
      );
  }

  removerPerfil(id: string): Observable<boolean> {
    const usuarioId = this.extrairUsuarioId(id);
    const existe = this.perfis.some((perfil) => perfil.id === id);
    if (!existe || usuarioId === null) return of(false);

    return this.usuariosService.deleteUsuario(usuarioId).pipe(
      map(() => true),
      tap(() => {
        this.salvarPerfis(this.perfis.filter((perfil) => perfil.id !== id));
      }),
      catchError(() => of(false)),
    );
  }

  removerTodosPerfis(): Observable<boolean> {
    const ids = this.perfis
      .filter((perfil) => !perfil.principal)
      .map((perfil) => this.extrairUsuarioId(perfil.id))
      .filter((id): id is number => id !== null);

    if (ids.length === 0) return of(true);

    return forkJoin(ids.map((id) => this.usuariosService.deleteUsuario(id))).pipe(
      map(() => true),
      tap(() => this.salvarPerfis([])),
      catchError(() => of(false)),
    );
  }

  definirTipoUso(tipoUso: TipoUsoPerfil): void {
    this.tipoUsoSubject.next(tipoUso);
    this.salvarTipoUso(tipoUso);
  }

  private recarregarPerfis(): Observable<Perfil[]> {
    return this.usuariosService.getUsuarios().pipe(
      map((usuarios) => this.criarPerfisDeUsuarios(usuarios)),
      tap((perfis) => this.salvarPerfis(perfis)),
      catchError(() => of(this.perfis)),
    );
  }

  private criarPerfisDeUsuarios(usuarios: Usuario[]): Perfil[] {
    return usuarios
      .map((usuario) => this.perfilDeUsuario(usuario))
      .filter((perfil) => Boolean(perfil.nome));
  }

  private perfilDeUsuario(usuario: Usuario): Perfil {
    const nome = this.normalizarNome(usuario.nome);
    const apelido = this.normalizarNome(usuario.apelido ?? '');
    const nomeExibicao = this.normalizarNome(usuario.nomeExibicao || apelido || nome);
    const perfil: Perfil = {
      id: `usuario-${usuario.id}`,
      nome,
    };

    if (usuario.principal !== undefined) {
      perfil.principal = Boolean(usuario.principal);
    }

    if (apelido) {
      perfil.apelido = apelido;
    }

    if (nomeExibicao && nomeExibicao !== nome) {
      perfil.nomeExibicao = nomeExibicao;
    }

    return perfil;
  }

  private salvarPerfis(perfis: Perfil[]): void {
    this.perfisSubject.next(perfis);
  }

  private extrairUsuarioId(id: string): number | null {
    if (!id.startsWith('usuario-')) return null;

    const usuarioId = Number(id.replace('usuario-', ''));
    return Number.isInteger(usuarioId) && usuarioId > 0 ? usuarioId : null;
  }

  private normalizarNome(nome: string): string {
    return String(nome ?? '').trim().replace(/\s+/g, ' ');
  }

  private carregarTipoUso(): TipoUsoPerfil {
    try {
      return localStorage.getItem(this.tipoUsoStorageKey) === 'familia'
        ? 'familia'
        : 'individual';
    } catch {
      return 'individual';
    }
  }

  private salvarTipoUso(tipoUso: TipoUsoPerfil): void {
    try {
      localStorage.setItem(this.tipoUsoStorageKey, tipoUso);
    } catch {
      // O app continua funcional mesmo se o navegador bloquear storage.
    }
  }
}
