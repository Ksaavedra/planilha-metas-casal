import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Perfil } from '@core/interfaces/perfis/perfil';
import { Usuario } from '@core/interfaces/usuarios';
import { UsuariosService } from '@core/services/usuarios/usuarios.service';

const STORAGE_PERFIS_KEY = 'orbis_perfis_financeiros';

@Injectable({ providedIn: 'root' })
export class PerfilFinanceiroService {
  private readonly perfisSubject = new BehaviorSubject<Perfil[]>(
    this.carregarPerfis(),
  );
  readonly perfis$ = this.perfisSubject.asObservable();
  readonly temGrupoFamiliar$ = this.perfis$.pipe(
    map((perfis) => this.temGrupoFamiliar(perfis)),
  );

  constructor(private usuariosService: UsuariosService) {}

  get perfis(): Perfil[] {
    return this.perfisSubject.value;
  }

  get temGrupoFamiliarAtual(): boolean {
    return this.temGrupoFamiliar(this.perfis);
  }

  carregarUsuariosCadastrados(): void {
    if (this.perfis.length) return;

    this.usuariosService.getUsuarios().subscribe({
      next: (usuarios) => {
        const perfis = this.criarPerfisDeUsuarios(usuarios);
        if (perfis.length) {
          this.salvarPerfis(perfis);
        }
      },
      error: () => undefined,
    });
  }

  adicionarPerfil(nome: string): Perfil | null {
    const nomeNormalizado = this.normalizarNome(nome);
    if (!nomeNormalizado) return null;

    const existente = this.perfis.find(
      (perfil) =>
        this.normalizarComparacao(perfil.nome) ===
        this.normalizarComparacao(nomeNormalizado),
    );
    if (existente) return existente;

    const novo: Perfil = {
      id: this.criarId(nomeNormalizado),
      nome: nomeNormalizado,
    };

    this.salvarPerfis([...this.perfis, novo]);
    this.usuariosService.createUsuario(nomeNormalizado).subscribe({
      next: (usuario) => this.sincronizarUsuarioCriado(novo.id, usuario),
      error: () => undefined,
    });

    return novo;
  }

  atualizarPerfil(id: string, nome: string): void {
    const nomeNormalizado = this.normalizarNome(nome);
    if (!nomeNormalizado) return;

    const atualizados = this.perfis.map((perfil) =>
      perfil.id === id ? { ...perfil, nome: nomeNormalizado } : perfil,
    );
    this.salvarPerfis(atualizados);
  }

  removerPerfil(id: string): boolean {
    const existe = this.perfis.some((perfil) => perfil.id === id);
    if (!existe) return false;

    this.salvarPerfis(this.perfis.filter((perfil) => perfil.id !== id));
    return true;
  }

  private carregarPerfis(): Perfil[] {
    try {
      const raw = localStorage.getItem(STORAGE_PERFIS_KEY);
      const perfis = raw ? (JSON.parse(raw) as unknown[]) : [];
      if (!Array.isArray(perfis)) return [];

      return perfis
        .filter((perfil: any) => perfil?.tipo !== 'familia')
        .map((perfil: any) => ({
          id: String(perfil?.id ?? this.criarId(perfil?.nome)),
          nome: this.normalizarNome(perfil?.nome),
        }))
        .filter((perfil) => perfil.nome.length > 0);
    } catch {
      return [];
    }
  }

  private criarPerfisDeUsuarios(usuarios: Usuario[]): Perfil[] {
    const perfisPorNome = new Map<string, Perfil>();
    usuarios.forEach((usuario) => {
      const perfil = this.perfilDeUsuario(usuario);
      if (perfil.nome) {
        perfisPorNome.set(this.normalizarComparacao(perfil.nome), perfil);
      }
    });

    return Array.from(perfisPorNome.values());
  }

  private sincronizarUsuarioCriado(idTemporario: string, usuario: Usuario): void {
    const perfilApi = this.perfilDeUsuario(usuario);
    const atualizados = this.perfis.map((perfil) =>
      perfil.id === idTemporario ? perfilApi : perfil,
    );
    this.salvarPerfis(atualizados);
  }

  private perfilDeUsuario(usuario: Usuario): Perfil {
    return {
      id: `usuario-${usuario.id}`,
      nome: this.normalizarNome(usuario.nome),
    };
  }

  private salvarPerfis(perfis: Perfil[]): void {
    this.perfisSubject.next(perfis);
    localStorage.setItem(STORAGE_PERFIS_KEY, JSON.stringify(perfis));
  }

  private criarId(nome: string): string {
    const base = this.normalizarComparacao(nome)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `pessoa-${base || Date.now()}-${Date.now()}`;
  }

  private normalizarNome(nome: string): string {
    return String(nome ?? '').trim().replace(/\s+/g, ' ');
  }

  private normalizarComparacao(nome: string | null | undefined): string {
    return String(nome ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private temGrupoFamiliar(perfis: Perfil[]): boolean {
    return perfis.length > 1;
  }
}
