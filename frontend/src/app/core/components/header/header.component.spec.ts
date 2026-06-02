import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { SidebarService } from '@core/services/sidebar/sidebar.service';
import { AuthService } from '@core/services/auth/auth.service';
import { Router } from '@angular/router';
import { Usuario } from '@core/interfaces/auths/auth';
import { Perfil } from '@core/interfaces/perfis/perfil';
import { PerfilFinanceiroService } from '@core/services/perfis/perfil-financeiro.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let sidebarService: { getStatus: jest.Mock; changeStatus: jest.Mock };
  let authService: { currentUser$: Observable<Usuario | null>; logout: jest.Mock };
  let router: { navigateByUrl: jest.Mock };
  let perfilService: {
    perfis: Perfil[];
    perfis$: Observable<Perfil[]>;
    temGrupoFamiliar$: Observable<boolean>;
    carregarUsuariosCadastrados: jest.Mock;
    adicionarPerfil: jest.Mock;
    atualizarPerfil: jest.Mock;
    removerPerfil: jest.Mock;
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
      currentUser$: of({ id: 1, nome: 'Kelly', email: 'kelly@email.com' }),
      logout: jest.fn(),
    };
    router = {
      navigateByUrl: jest.fn(),
    };
    perfilService = {
      perfis: perfisMock,
      perfis$: of(perfisMock),
      temGrupoFamiliar$: of(true),
      carregarUsuariosCadastrados: jest.fn(),
      adicionarPerfil: jest.fn().mockReturnValue(perfisMock[1]),
      atualizarPerfil: jest.fn(),
      removerPerfil: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      providers: [
        { provide: SidebarService, useValue: sidebarService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: PerfilFinanceiroService, useValue: perfilService },
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
    expect(compiled.textContent).toContain('Família:');
    expect(compiled.textContent).toContain('Kelly');
    expect(compiled.textContent).toContain('David');
    expect(compiled.textContent).toContain('Adicionar Perfil');
    expect(compiled.textContent).toContain('Configurações');
    expect(compiled.textContent).toContain('Sair');
  });

  it('deve salvar novo perfil usando apenas nome', () => {
    component.novoPerfilNome = 'Max';

    component.salvarNovoPerfil();

    expect(perfilService.adicionarPerfil).toHaveBeenCalledWith('Max');
    expect(component.modalAdicionarAberto).toBe(false);
  });

  it('não deve fechar modal quando nome não gerar perfil', () => {
    perfilService.adicionarPerfil.mockReturnValueOnce(null);
    component.modalAdicionarAberto = true;
    component.novoPerfilNome = ' ';

    component.salvarNovoPerfil();

    expect(component.modalAdicionarAberto).toBe(true);
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

    expect(perfilService.atualizarPerfil).toHaveBeenCalledWith(perfil.id, 'Kelly Silva');
    expect(component.perfilEditandoId).toBeNull();

    component.removerPerfil(perfil);
    expect(perfilService.removerPerfil).toHaveBeenCalledWith(perfil.id);
  });

  it('deve ignorar salvar edição sem perfil selecionado', () => {
    component.salvarEdicaoPerfil();

    expect(perfilService.atualizarPerfil).not.toHaveBeenCalled();
  });

  it('deve retornar título individual e fallback de nome por e-mail', () => {
    expect(component.tituloLista([perfisMock[0]])).toBe('Individual:');
    expect(component.tituloLista(perfisMock)).toBe('Família:');
    expect(component.nomeUsuario({ id: 2, nome: '', email: 'user@email.com' })).toBe('user@email.com');
    expect(component.trackByPerfilId(0, perfisMock[0])).toBe(perfisMock[0].id);
  });
});
