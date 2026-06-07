import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { SidebarService } from '@core/services/sidebar/sidebar.service';
import { AuthService } from '@core/services/auth/auth.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Usuario } from '@core/interfaces/auths/auth';
import { Perfil } from '@core/interfaces/perfis/perfil';
import {
  PerfilFinanceiroService,
  TipoUsoPerfil,
} from '@core/services/perfis/perfil-financeiro.service';
import { SuccessModalComponent } from '@app/shared/components/success-modal/success-modal.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let sidebarService: { getStatus: jest.Mock; changeStatus: jest.Mock };
  let authService: {
    currentUser$: Observable<Usuario | null>;
    getCurrentUser: jest.Mock;
    getProfile: jest.Mock;
    atualizarTipoUso: jest.Mock;
    logout: jest.Mock;
  };
  let router: { navigateByUrl: jest.Mock };
  let dialog: { open: jest.Mock };
  let perfilService: {
    perfis: Perfil[];
    perfis$: Observable<Perfil[]>;
    temGrupoFamiliar$: Observable<boolean>;
    tipoUso$: Observable<TipoUsoPerfil>;
    tipoUsoAtual: TipoUsoPerfil;
    carregarUsuariosCadastrados: jest.Mock;
    adicionarPerfil: jest.Mock;
    atualizarPerfil: jest.Mock;
    removerPerfil: jest.Mock;
    removerTodosPerfis: jest.Mock;
    definirTipoUso: jest.Mock;
  };

  const perfisMock: Perfil[] = [
    { id: 'usuario-1', nome: 'Kelly' },
    { id: 'usuario-2', nome: 'David' },
  ];

  beforeEach(async () => {
    sidebarService = {
      getStatus: jest.fn().mockReturnValue(of(false)),
      changeStatus: jest.fn(),
    };
    authService = {
      currentUser$: of({
        id: 1,
        nomeCompleto: 'Kelly Michele',
        apelido: 'Kelly',
        email: 'kelly@email.com',
        tipoUso: 'familia',
      }),
      getCurrentUser: jest.fn().mockReturnValue({
        id: 1,
        nomeCompleto: 'Kelly Michele',
        apelido: 'Kelly',
        email: 'kelly@email.com',
        tipoUso: 'familia',
      }),
      getProfile: jest.fn().mockReturnValue(
        of({
          id: 1,
          nomeCompleto: 'Kelly Michele',
          apelido: 'Kelly',
          email: 'kelly@email.com',
          tipoUso: 'familia',
        }),
      ),
      atualizarTipoUso: jest.fn().mockReturnValue(of({})),
      logout: jest.fn(),
    };
    router = {
      navigateByUrl: jest.fn(),
    };
    dialog = {
      open: jest.fn(),
    };
    perfilService = {
      perfis: perfisMock,
      perfis$: of(perfisMock),
      temGrupoFamiliar$: of(true),
      tipoUso$: of('familia'),
      tipoUsoAtual: 'familia',
      carregarUsuariosCadastrados: jest.fn(),
      adicionarPerfil: jest.fn().mockReturnValue(of(perfisMock[1])),
      atualizarPerfil: jest
        .fn()
        .mockReturnValue(of({ id: 'usuario-1', nome: 'Kelly Silva' })),
      removerPerfil: jest.fn().mockReturnValue(of(true)),
      removerTodosPerfis: jest.fn().mockReturnValue(of(true)),
      definirTipoUso: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      providers: [
        { provide: SidebarService, useValue: sidebarService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: PerfilFinanceiroService, useValue: perfilService },
        { provide: MatDialog, useValue: dialog },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call sidebar service when onSidebarClick is called', () => {
    component.onSidebarClick();
    expect(sidebarService.changeStatus).toHaveBeenCalled();
  });

  it('should have menu button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    // usar a classe existente .nav-toggle (ou adicione aria-label no HTML)
    const menuButton = compiled.querySelector('.nav-toggle');
    expect(menuButton).toBeTruthy();
  });

  it('should call onSidebarClick when menu button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const menuButton = compiled.querySelector(
      'button[aria-label="Menu"]',
    ) as HTMLButtonElement;
    const spy = jest.spyOn(component, 'onSidebarClick');

    menuButton.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should render header title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titleElement = compiled.querySelector('h1');
    expect(titleElement?.textContent).toContain('ORBIS');
    expect(compiled.textContent).toContain('Planejamento Financeiro');
  });

  it('should have menu button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const menuButton = compiled.querySelector('button[aria-label="Menu"]');
    expect(menuButton).toBeTruthy();
  });

  it('deve fazer logout e navegar para login', () => {
    component.isUserMenuOpen = true;

    component.logout();

    expect(component.isUserMenuOpen).toBe(false);
    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('deve abrir menu do usuário e exibir perfil e nomes cadastrados', () => {
    component.toggleUserMenu();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(component.isUserMenuOpen).toBe(true);
    expect(compiled.textContent).toContain('Meu perfil');
    expect(compiled.textContent).toContain('Família');
    expect(compiled.textContent).toContain('Kelly');
    expect(compiled.textContent).toContain('David');
    expect(compiled.textContent).not.toContain('kelly@email.com');
    expect(compiled.textContent).not.toContain('Adicionar Pessoa');
    expect(compiled.textContent).toContain('Configurações');
    expect(compiled.textContent).toContain('Sair');
  });

  it('deve fechar menu do usuário ao clicar fora do header', () => {
    component.isUserMenuOpen = true;

    component.onDocumentClick({
      target: document.body,
    } as unknown as MouseEvent);

    expect(component.isUserMenuOpen).toBe(false);
  });

  it('não deve fechar menu do usuário ao clicar dentro do header', () => {
    component.isUserMenuOpen = true;

    component.onDocumentClick({
      target: fixture.nativeElement,
    } as unknown as MouseEvent);

    expect(component.isUserMenuOpen).toBe(true);
  });

  it('deve salvar novo perfil usando apenas nome', () => {
    component.novoPerfilNome = 'Max';

    component.salvarNovoPerfil();

    expect(perfilService.adicionarPerfil).toHaveBeenCalledWith('Max', '');
    expect(component.modalAdicionarAberto).toBe(false);
    expect(dialog.open).toHaveBeenCalledTimes(1);
    const [modal, config] = dialog.open.mock.calls[0];
    expect(modal).toBe(SuccessModalComponent);
    expect(config.data.title).toBe('Pessoa adicionada!');
    expect(config.data.message).toContain('David');
  });

  it('não deve fechar modal quando nome não gerar perfil', () => {
    perfilService.adicionarPerfil.mockReturnValueOnce(of(null));
    component.modalAdicionarAberto = true;
    component.novoPerfilNome = ' ';

    component.salvarNovoPerfil();

    expect(component.modalAdicionarAberto).toBe(true);
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('deve abrir e fechar modais de perfil', () => {
    component.isUserMenuOpen = true;
    component.novoPerfilNome = 'Kelly';

    component.abrirAdicionarPerfil();

    expect(component.isUserMenuOpen).toBe(false);
    expect(component.novoPerfilNome).toBe('');
    expect(component.modalAdicionarAberto).toBe(true);

    component.fecharAdicionarPerfil();
    expect(component.modalAdicionarAberto).toBe(false);

    component.abrirConfiguracoes();
    expect(component.configuracoesAberta).toBe(true);

    component.abrirAdicionarPessoaConfiguracoes();
    expect(component.configuracoesAberta).toBe(false);
    expect(component.modalAdicionarAberto).toBe(true);

    component.fecharConfiguracoes();
    expect(component.configuracoesAberta).toBe(false);
  });

  it('deve editar, cancelar e remover perfil', () => {
    const perfil = perfisMock[0];

    component.iniciarEdicaoPerfil(perfil);
    expect(component.perfilEditandoId).toBe(perfil.id);
    expect(component.perfilEditandoNome).toBe(perfil.nome);

    component.atualizarNomeEdicao({ target: { value: 'Kelly Silva' } } as any);
    component.salvarEdicaoPerfil();

    expect(perfilService.atualizarPerfil).toHaveBeenCalledWith(
      perfil.id,
      'Kelly Silva',
      '',
    );
    expect(dialog.open).toHaveBeenCalledTimes(1);
    let [modal, config] = dialog.open.mock.calls[0];
    expect(modal).toBe(SuccessModalComponent);
    expect(config.data.title).toBe('Pessoa atualizada!');
    expect(config.data.message).toContain('Kelly Silva');
    expect(component.perfilEditandoId).toBeNull();

    component.removerPerfil(perfil);
    expect(perfilService.removerPerfil).toHaveBeenCalledWith(perfil.id);
    expect(dialog.open).toHaveBeenCalledTimes(2);
    [modal, config] = dialog.open.mock.calls[1];
    expect(modal).toBe(SuccessModalComponent);
    expect(config.data.title).toBe('Pessoa removida!');
    expect(config.data.message).toContain('Kelly');
  });

  it('deve ignorar salvar edição sem perfil selecionado', () => {
    component.salvarEdicaoPerfil();

    expect(perfilService.atualizarPerfil).not.toHaveBeenCalled();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('deve ignorar salvar edição vazia e remoção inexistente sem sucesso', () => {
    perfilService.removerPerfil.mockReturnValueOnce(of(false));
    component.iniciarEdicaoPerfil(perfisMock[0]);
    component.perfilEditandoNome = '   ';

    component.salvarEdicaoPerfil();
    component.removerPerfil(perfisMock[0]);

    expect(perfilService.atualizarPerfil).not.toHaveBeenCalled();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('deve retornar título, label, usuário no topo e apelido no perfil', () => {
    expect(component.tituloLista()).toBe('Família');
    expect(component.labelTipoUso('individual')).toBe('Individual');
    expect(component.labelTipoUso('familia')).toBe('Família');
    expect(
      component.usuarioLogin({
        id: 2,
        usuario: 'usuario1',
        nomeCompleto: 'User Name',
        apelido: 'User',
        email: 'user@email.com',
      }),
    ).toBe('usuario1');
    expect(
      component.apelidoUsuario({
        id: 2,
        usuario: 'usuario1',
        nomeCompleto: 'User Name',
        apelido: 'User',
        email: 'user@email.com',
      }),
    ).toBe('User');
    expect(
      component.apelidoUsuario({
        id: 3,
        nomeCompleto: 'Sem Apelido',
        email: 'sem@email.com',
      }),
    ).toBe('Sem Apelido');
    expect(component.trackByPerfilId(0, perfisMock[0])).toBe(perfisMock[0].id);
  });

  it('deve esconder a pessoa principal e o nome da conta na lista da família', () => {
    const user: Usuario = {
      id: 377,
      usuario: 'usuario1',
      nomeCompleto: 'Kelly Michele Torrico',
      apelido: 'Kelly Michele',
      email: 'kelly@email.com',
    };
    const perfis: Perfil[] = [
      {
        id: 'usuario-3',
        nome: 'Kelly Michele Torrico',
        apelido: 'Kelly Michele',
        principal: true,
      },
      { id: 'usuario-4', nome: 'Kelly Michele Torrico' },
      { id: 'usuario-5', nome: 'David' },
    ];

    expect(component.perfisFamilia(perfis, user)).toEqual([
      { id: 'usuario-5', nome: 'David' },
    ]);
  });

  it('deve usar a pessoa principal quando o usuário salvo não tiver apelido', () => {
    const user: Usuario = {
      id: 377,
      usuario: 'kelly@email.com',
      nomeCompleto: '',
      email: 'kelly@email.com',
    };
    const perfis: Perfil[] = [
      {
        id: 'usuario-3',
        nome: 'Kelly Michele Torrico',
        apelido: 'Kelly Michele',
        principal: true,
      },
      { id: 'usuario-5', nome: 'David' },
    ];

    expect(component.nomeMeuPerfil(user, perfis)).toBe('Kelly Michele');
  });

  it('deve controlar troca de tipo de uso', () => {
    component.abrirTipoUso();
    expect(component.configuracoesAberta).toBe(false);
    expect(component.modalTipoUsoAberto).toBe(true);
    expect(component.tipoUsoSelecionado).toBe('familia');

    component.fecharTipoUso();
    expect(component.modalTipoUsoAberto).toBe(false);

    component.tipoUsoSelecionado = 'individual';
    component.salvarTipoUso();
    expect(component.modalConfirmarIndividualAberto).toBe(true);

    component.salvarTrocaParaIndividual();
    expect(authService.atualizarTipoUso).toHaveBeenCalledWith('individual');
    expect(perfilService.definirTipoUso).toHaveBeenCalledWith('individual');
    expect(component.modalConfirmarIndividualAberto).toBe(false);
  });

  it('deve ativar família com confirmação e remover pessoas quando solicitado', () => {
    perfilService.tipoUsoAtual = 'individual';
    component.abrirTipoUso();
    component.tipoUsoSelecionado = 'familia';

    component.salvarTipoUso();
    expect(component.modalConfirmarAtivarFamiliaAberto).toBe(true);

    component.confirmarAtivarFamilia();
    expect(authService.atualizarTipoUso).toHaveBeenCalledWith('familia');
    expect(perfilService.definirTipoUso).toHaveBeenCalledWith('familia');

    perfilService.tipoUsoAtual = 'familia';
    component.tipoUsoSelecionado = 'individual';
    component.salvarTipoUso();
    component.acaoPessoasAoIndividual = 'remover';
    component.salvarTrocaParaIndividual();

    expect(perfilService.removerTodosPerfis).toHaveBeenCalled();
  });
});
