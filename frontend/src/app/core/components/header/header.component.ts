import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Usuario } from '@core/interfaces/auths/auth';
import { AuthService } from '@core/services/auth/auth.service';
import { SidebarService } from '../../services/sidebar/sidebar.service';
import { Perfil } from '@core/interfaces/perfis/perfil';
import { PerfilFinanceiroService } from '@core/services/perfis/perfil-financeiro.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: false
})
export class HeaderComponent implements OnInit {
  @Output() showOverlay: EventEmitter<boolean> = new EventEmitter();
  sidebarStatus!: boolean;
  currentUser$: Observable<Usuario | null>;
  perfis$: Observable<Perfil[]>;
  temGrupoFamiliar$: Observable<boolean>;
  isUserMenuOpen = false;
  modalAdicionarAberto = false;
  configuracoesAberta = false;
  novoPerfilNome = '';
  perfilEditandoId: string | null = null;
  perfilEditandoNome = '';

  constructor(
    private sidebar: SidebarService,
    private authService: AuthService,
    private router: Router,
    private perfilService: PerfilFinanceiroService,
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.perfis$ = this.perfilService.perfis$;
    this.temGrupoFamiliar$ = this.perfilService.temGrupoFamiliar$;
  }

  ngOnInit(): void {
    this.perfilService.carregarUsuariosCadastrados();
    this.sidebar.getStatus().subscribe((value) => {
      this.sidebarStatus = value;
      this.showOverlay.emit(value);
    });
  }

  onSidebarClick() {
    this.sidebar.changeStatus();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  abrirAdicionarPerfil(): void {
    this.closeUserMenu();
    this.novoPerfilNome = '';
    this.modalAdicionarAberto = true;
  }

  fecharAdicionarPerfil(): void {
    this.modalAdicionarAberto = false;
  }

  salvarNovoPerfil(): void {
    const perfil = this.perfilService.adicionarPerfil(this.novoPerfilNome);
    if (perfil) {
      this.fecharAdicionarPerfil();
    }
  }

  abrirConfiguracoes(): void {
    this.closeUserMenu();
    this.configuracoesAberta = true;
  }

  fecharConfiguracoes(): void {
    this.configuracoesAberta = false;
    this.cancelarEdicaoPerfil();
  }

  iniciarEdicaoPerfil(perfil: Perfil): void {
    this.perfilEditandoId = perfil.id;
    this.perfilEditandoNome = perfil.nome;
  }

  atualizarNomeEdicao(event: Event): void {
    this.perfilEditandoNome = (event.target as HTMLInputElement).value;
  }

  salvarEdicaoPerfil(): void {
    if (!this.perfilEditandoId) return;
    this.perfilService.atualizarPerfil(
      this.perfilEditandoId,
      this.perfilEditandoNome,
    );
    this.cancelarEdicaoPerfil();
  }

  cancelarEdicaoPerfil(): void {
    this.perfilEditandoId = null;
    this.perfilEditandoNome = '';
  }

  removerPerfil(perfil: Perfil): void {
    this.perfilService.removerPerfil(perfil.id);
  }

  tituloLista(perfis: Perfil[]): string {
    return perfis.length > 1 ? 'Família:' : 'Individual:';
  }

  nomeUsuario(user: Usuario): string {
    return user.nome || user.email;
  }

  trackByPerfilId(_: number, perfil: Perfil): string {
    return perfil.id;
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
