import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Usuario } from '@core/interfaces/auths/auth';
import { AuthService } from '@core/services/auth/auth.service';
import { SidebarService } from '../../services/sidebar/sidebar.service';
import { Perfil } from '@core/interfaces/perfis/perfil';
import {
  PerfilFinanceiroService,
  TipoUsoPerfil,
} from '@core/services/perfis/perfil-financeiro.service';
import { SuccessModalComponent } from '@app/shared/components/success-modal/success-modal.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent implements OnInit {
  @Output() showOverlay: EventEmitter<boolean> = new EventEmitter();
  sidebarStatus!: boolean;
  currentUser$: Observable<Usuario | null>;
  perfis$: Observable<Perfil[]>;
  temGrupoFamiliar$: Observable<boolean>;
  tipoUso$: Observable<TipoUsoPerfil>;
  isUserMenuOpen = false;
  modalAdicionarAberto = false;
  configuracoesAberta = false;
  modalTipoUsoAberto = false;
  modalConfirmarAtivarFamiliaAberto = false;
  modalConfirmarIndividualAberto = false;
  novoPerfilNome = '';
  novoPerfilApelido = '';
  perfilErroMensagem = '';
  perfilEditandoId: string | null = null;
  perfilEditandoNome = '';
  perfilEditandoApelido = '';
  tipoUsoSelecionado: TipoUsoPerfil = 'individual';
  acaoPessoasAoIndividual: 'manter' | 'remover' = 'manter';

  constructor(
    private sidebar: SidebarService,
    private authService: AuthService,
    private router: Router,
    private perfilService: PerfilFinanceiroService,
    private elementRef: ElementRef<HTMLElement>,
    private dialog: MatDialog,
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.perfis$ = this.perfilService.perfis$;
    this.temGrupoFamiliar$ = this.perfilService.temGrupoFamiliar$;
    this.tipoUso$ = this.perfilService.tipoUso$;
  }

  ngOnInit(): void {
    const usuario = this.authService.getCurrentUser();
    if (usuario?.tipoUso) {
      this.perfilService.definirTipoUso(usuario.tipoUso);
    }

    this.authService.getProfile().subscribe({
      next: (perfil) => {
        if (perfil.tipoUso) {
          this.perfilService.definirTipoUso(perfil.tipoUso);
        }
        this.perfilService.carregarUsuariosCadastrados();
      },
      error: () => undefined,
    });

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isUserMenuOpen) return;

    const target = event.target as Node | null;
    if (target && this.elementRef.nativeElement.contains(target)) return;

    this.closeUserMenu();
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  abrirAdicionarPerfil(): void {
    this.closeUserMenu();
    this.novoPerfilNome = '';
    this.novoPerfilApelido = '';
    this.perfilErroMensagem = '';
    this.modalAdicionarAberto = true;
  }

  abrirAdicionarPessoaConfiguracoes(): void {
    this.configuracoesAberta = false;
    this.abrirAdicionarPerfil();
  }

  fecharAdicionarPerfil(): void {
    this.modalAdicionarAberto = false;
    this.perfilErroMensagem = '';
  }

  salvarNovoPerfil(): void {
    const nome = this.novoPerfilNome.trim();
    if (!nome) {
      this.perfilErroMensagem = 'Informe o nome da pessoa.';
      return;
    }

    this.perfilErroMensagem = '';
    this.perfilService
      .adicionarPerfil(nome, this.novoPerfilApelido)
      .subscribe((perfil) => {
        if (perfil) {
          this.fecharAdicionarPerfil();
          this.abrirModalSucesso(
            'Pessoa adicionada!',
            `"${this.nomePerfil(perfil)}" foi adicionada com sucesso.`,
          );
        } else {
          this.perfilErroMensagem =
            'Esta pessoa já corresponde ao proprietário da conta.';
        }
      });
  }

  abrirConfiguracoes(): void {
    this.closeUserMenu();
    this.configuracoesAberta = true;
  }

  fecharConfiguracoes(): void {
    this.configuracoesAberta = false;
    this.perfilErroMensagem = '';
    this.cancelarEdicaoPerfil();
  }

  abrirTipoUso(): void {
    this.configuracoesAberta = false;
    this.tipoUsoSelecionado = this.perfilService.tipoUsoAtual;
    this.modalTipoUsoAberto = true;
  }

  fecharTipoUso(): void {
    this.modalTipoUsoAberto = false;
  }

  salvarTipoUso(): void {
    const atual = this.perfilService.tipoUsoAtual;
    this.modalTipoUsoAberto = false;

    if (this.tipoUsoSelecionado === atual) return;

    if (this.tipoUsoSelecionado === 'familia') {
      this.modalConfirmarAtivarFamiliaAberto = true;
      return;
    }

    if (this.perfilService.perfis.length === 0) {
      this.atualizarTipoUso('individual');
      return;
    }

    this.acaoPessoasAoIndividual = 'manter';
    this.modalConfirmarIndividualAberto = true;
  }

  confirmarAtivarFamilia(): void {
    this.atualizarTipoUso('familia', () => {
      this.modalConfirmarAtivarFamiliaAberto = false;
    });
  }

  cancelarAtivarFamilia(): void {
    this.modalConfirmarAtivarFamiliaAberto = false;
  }

  salvarTrocaParaIndividual(): void {
    const concluir = (): void => {
      this.atualizarTipoUso('individual', () => {
        this.modalConfirmarIndividualAberto = false;
      });
    };

    if (this.acaoPessoasAoIndividual === 'remover') {
      this.perfilService.removerTodosPerfis().subscribe(() => concluir());
      return;
    }

    concluir();
  }

  cancelarTrocaParaIndividual(): void {
    this.modalConfirmarIndividualAberto = false;
    this.acaoPessoasAoIndividual = 'manter';
  }

  iniciarEdicaoPerfil(perfil: Perfil): void {
    this.perfilEditandoId = perfil.id;
    this.perfilEditandoNome = perfil.nome;
    this.perfilEditandoApelido = perfil.apelido || '';
    this.perfilErroMensagem = '';
  }

  atualizarNomeEdicao(event: Event): void {
    this.perfilEditandoNome = (event.target as HTMLInputElement).value;
  }

  atualizarApelidoEdicao(event: Event): void {
    this.perfilEditandoApelido = (event.target as HTMLInputElement).value;
  }

  salvarEdicaoPerfil(): void {
    if (!this.perfilEditandoId) return;
    const nomeEditado = this.perfilEditandoNome.trim();
    if (!nomeEditado) {
      this.perfilErroMensagem = 'Informe o nome da pessoa.';
      return;
    }

    this.perfilService
      .atualizarPerfil(
        this.perfilEditandoId,
        nomeEditado,
        this.perfilEditandoApelido,
      )
      .subscribe((perfil) => {
        if (perfil) {
          this.abrirModalSucesso(
            'Pessoa atualizada!',
            `A pessoa foi atualizada para "${this.nomePerfil(perfil)}".`,
          );
          this.cancelarEdicaoPerfil();
          this.perfilErroMensagem = '';
        } else {
          this.perfilErroMensagem =
            'Esta pessoa já corresponde ao proprietário da conta.';
        }
      });
  }

  cancelarEdicaoPerfil(): void {
    this.perfilEditandoId = null;
    this.perfilEditandoNome = '';
    this.perfilEditandoApelido = '';
  }

  removerPerfil(perfil: Perfil): void {
    if (perfil.principal) {
      return;
    }

    this.perfilService.removerPerfil(perfil.id).subscribe((removido) => {
      if (removido) {
        this.abrirModalSucesso(
          'Pessoa removida!',
          `"${this.nomePerfil(perfil)}" foi removida com sucesso.`,
        );
      }
    });
  }

  tituloLista(): string {
    return 'Família';
  }

  perfisFamilia(perfis: Perfil[], user?: Usuario | null): Perfil[] {
    const nomesConta = this.nomesDaConta(user);
    return perfis.filter((perfil) => {
      if (perfil.principal) return false;

      const nomesPerfil = [
        perfil.nome,
        perfil.apelido,
        perfil.nomeExibicao,
      ].map((valor) => this.normalizarComparacao(valor));

      return !nomesPerfil.some((nome) => nome && nomesConta.has(nome));
    });
  }

  labelTipoUso(tipoUso: TipoUsoPerfil): string {
    return tipoUso === 'familia' ? 'Família' : 'Individual';
  }

  usuarioLogin(user: Usuario): string {
    return this.valorSemEmail(user.usuario);
  }

  apelidoUsuario(user: Usuario): string {
    return (
      this.valorSemEmail(user.apelido) ||
      this.valorSemEmail(user.nomeCompleto) ||
      this.valorSemEmail(user.usuario)
    );
  }

  nomeMeuPerfil(user: Usuario, perfis: Perfil[]): string {
    const nomeUsuario = this.apelidoUsuario(user);
    if (nomeUsuario) return nomeUsuario;

    const perfilPrincipal = perfis.find((perfil) => perfil.principal);

    return perfilPrincipal ? this.nomePerfil(perfilPrincipal) : '';
  }

  private valorSemEmail(valor: string | null | undefined): string {
    const texto = String(valor || '').trim();
    return texto.includes('@') ? '' : texto;
  }

  private nomesDaConta(user?: Usuario | null): Set<string> {
    return new Set(
      [user?.nomeCompleto, user?.apelido, user?.usuario]
        .map((valor) => this.valorSemEmail(valor))
        .map((valor) => this.normalizarComparacao(valor))
        .filter(Boolean),
    );
  }

  private normalizarComparacao(valor: string | null | undefined): string {
    return String(valor || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  trackByPerfilId(_: number, perfil: Perfil): string {
    return perfil.id;
  }

  nomePerfil(perfil: Perfil): string {
    return perfil.nomeExibicao || perfil.apelido || perfil.nome;
  }

  private atualizarTipoUso(
    tipoUso: TipoUsoPerfil,
    onSuccess?: () => void,
  ): void {
    this.authService.atualizarTipoUso(tipoUso).subscribe({
      next: () => {
        this.perfilService.definirTipoUso(tipoUso);
        onSuccess?.();
      },
      error: () => {
        this.perfilService.definirTipoUso(tipoUso);
        onSuccess?.();
      },
    });
  }

  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  private abrirModalSucesso(title: string, message: string): void {
    this.dialog.open(SuccessModalComponent, {
      width: 'min(520px, 96vw)',
      maxHeight: '90vh',
      data: {
        title,
        message,
        confirmText: 'OK',
      },
    });
  }
}
