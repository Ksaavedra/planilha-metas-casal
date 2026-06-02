import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PerfilFinanceiroService } from './perfil-financeiro.service';
import { UsuariosService } from '@core/services/usuarios/usuarios.service';

describe('PerfilFinanceiroService', () => {
  let service: PerfilFinanceiroService;
  let usuariosService: {
    getUsuarios: jest.Mock;
    createUsuario: jest.Mock;
  };

  const storageKey = 'orbis_perfis_financeiros';

  const criarService = (): PerfilFinanceiroService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        PerfilFinanceiroService,
        { provide: UsuariosService, useValue: usuariosService },
      ],
    });
    return TestBed.inject(PerfilFinanceiroService);
  };

  beforeEach(() => {
    localStorage.clear();
    usuariosService = {
      getUsuarios: jest.fn().mockReturnValue(of([])),
      createUsuario: jest.fn().mockReturnValue(of({ id: 10, nome: 'Kelly' })),
    };
    service = criarService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve ser criado com lista vazia quando não houver storage', () => {
    expect(service).toBeTruthy();
    expect(service.perfis).toEqual([]);
    expect(service.temGrupoFamiliarAtual).toBe(false);
  });

  it('deve carregar perfis válidos do localStorage ignorando família antiga e nomes vazios', () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify([
        { id: 'familia-1', nome: 'Família Kelly', tipo: 'familia' },
        { id: 'usuario-1', nome: ' Kelly ', tipo: 'usuario' },
        { id: 'sem-nome', nome: '   ', tipo: 'usuario' },
        { id: 'usuario-2', nome: 'David' },
      ]),
    );

    service = criarService();

    expect(service.perfis).toEqual([
      { id: 'usuario-1', nome: 'Kelly' },
      { id: 'usuario-2', nome: 'David' },
    ]);
    expect(service.temGrupoFamiliarAtual).toBe(true);
  });

  it('deve retornar lista vazia quando localStorage estiver inválido', () => {
    localStorage.setItem(storageKey, '{erro');

    service = criarService();

    expect(service.perfis).toEqual([]);
  });

  it('deve retornar lista vazia quando localStorage não for array', () => {
    localStorage.setItem(storageKey, JSON.stringify({ id: 'usuario-1' }));

    service = criarService();

    expect(service.perfis).toEqual([]);
  });

  it('deve criar id local quando item do storage não tiver id', () => {
    localStorage.setItem(storageKey, JSON.stringify([{ nome: 'Carla' }]));

    service = criarService();

    expect(service.perfis[0].nome).toBe('Carla');
    expect(service.perfis[0].id).toContain('pessoa-carla-');
  });

  it('deve ignorar perfil do storage com nome nulo', () => {
    localStorage.setItem(storageKey, JSON.stringify([{ id: null, nome: null }]));

    service = criarService();

    expect(service.perfis).toEqual([]);
  });

  it('deve carregar usuários cadastrados da API quando a lista local estiver vazia', () => {
    usuariosService.getUsuarios.mockReturnValue(
      of([
        { id: 1, nome: 'Kelly' },
        { id: 2, nome: 'David' },
      ]),
    );

    service.carregarUsuariosCadastrados();

    expect(usuariosService.getUsuarios).toHaveBeenCalled();
    expect(service.perfis).toEqual([
      { id: 'usuario-1', nome: 'Kelly' },
      { id: 'usuario-2', nome: 'David' },
    ]);
    expect(JSON.parse(localStorage.getItem(storageKey) || '[]')).toEqual(
      service.perfis,
    );
  });

  it('não deve persistir nada quando API retornar lista vazia', () => {
    usuariosService.getUsuarios.mockReturnValue(of([]));

    service.carregarUsuariosCadastrados();

    expect(service.perfis).toEqual([]);
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('deve ignorar usuário sem nome ao carregar API', () => {
    usuariosService.getUsuarios.mockReturnValue(
      of([
        { id: 1, nome: '' },
        { id: 2, nome: 'Eloina' },
      ]),
    );

    service.carregarUsuariosCadastrados();

    expect(service.perfis).toEqual([{ id: 'usuario-2', nome: 'Eloina' }]);
  });

  it('não deve buscar usuários cadastrados quando já existir lista local', () => {
    service.adicionarPerfil('Kelly');
    usuariosService.getUsuarios.mockClear();

    service.carregarUsuariosCadastrados();

    expect(usuariosService.getUsuarios).not.toHaveBeenCalled();
  });

  it('deve ignorar erro ao carregar usuários cadastrados', () => {
    usuariosService.getUsuarios.mockReturnValue(throwError(() => new Error('erro')));

    service.carregarUsuariosCadastrados();

    expect(service.perfis).toEqual([]);
  });

  it('deve adicionar perfil, persistir e sincronizar id retornado pela API', () => {
    usuariosService.createUsuario.mockReturnValue(of({ id: 7, nome: 'Kelly' }));

    const novo = service.adicionarPerfil('  Kelly   Silva  ');

    expect(novo?.nome).toBe('Kelly Silva');
    expect(usuariosService.createUsuario).toHaveBeenCalledWith('Kelly Silva');
    expect(service.perfis).toEqual([{ id: 'usuario-7', nome: 'Kelly' }]);
  });

  it('deve manter perfil temporário quando criação na API falhar', () => {
    usuariosService.createUsuario.mockReturnValue(throwError(() => new Error('erro')));

    const novo = service.adicionarPerfil('Max');

    expect(novo?.nome).toBe('Max');
    expect(service.perfis.length).toBe(1);
    expect(service.perfis[0].id).toContain('pessoa-max-');
  });

  it('não deve adicionar nome vazio nem duplicado normalizado', () => {
    expect(service.adicionarPerfil('   ')).toBeNull();
    expect(usuariosService.createUsuario).not.toHaveBeenCalled();

    const primeiro = service.adicionarPerfil('Kélly');
    usuariosService.createUsuario.mockClear();
    const duplicado = service.adicionarPerfil('kelly');

    expect(primeiro?.nome).toBe('Kélly');
    expect(duplicado).toEqual(service.perfis[0]);
    expect(service.perfis.length).toBe(1);
    expect(usuariosService.createUsuario).not.toHaveBeenCalled();
  });

  it('deve atualizar nome do perfil e ignorar atualização vazia', () => {
    usuariosService.createUsuario.mockReturnValue(of({ id: 1, nome: 'Kelly' }));
    service.adicionarPerfil('Kelly');

    service.atualizarPerfil('usuario-1', '  Kelly Oliveira ');

    expect(service.perfis[0].nome).toBe('Kelly Oliveira');

    service.atualizarPerfil('usuario-1', '   ');

    expect(service.perfis[0].nome).toBe('Kelly Oliveira');
  });

  it('deve manter demais perfis ao atualizar um id específico', () => {
    usuariosService.createUsuario
      .mockReturnValueOnce(of({ id: 1, nome: 'Kelly' }))
      .mockReturnValueOnce(of({ id: 2, nome: 'David' }));
    service.adicionarPerfil('Kelly');
    service.adicionarPerfil('David');

    service.atualizarPerfil('usuario-2', 'David Silva');

    expect(service.perfis).toEqual([
      { id: 'usuario-1', nome: 'Kelly' },
      { id: 'usuario-2', nome: 'David Silva' },
    ]);
  });

  it('deve gerar id local com timestamp quando o nome não formar slug', () => {
    usuariosService.createUsuario.mockReturnValue(throwError(() => new Error('erro')));

    const novo = service.adicionarPerfil('!!!');

    expect(novo?.id).toContain('pessoa-');
    expect(novo?.nome).toBe('!!!');
  });

  it('deve normalizar comparação nula como string vazia', () => {
    expect((service as any).normalizarComparacao(null)).toBe('');
    expect((service as any).normalizarComparacao(undefined)).toBe('');
  });

  it('deve remover perfil existente e retornar false para inexistente', () => {
    usuariosService.createUsuario
      .mockReturnValueOnce(of({ id: 1, nome: 'Kelly' }))
      .mockReturnValueOnce(of({ id: 2, nome: 'David' }));
    service.adicionarPerfil('Kelly');
    service.adicionarPerfil('David');

    expect(service.removerPerfil('usuario-1')).toBe(true);
    expect(service.perfis).toEqual([{ id: 'usuario-2', nome: 'David' }]);
    expect(service.temGrupoFamiliarAtual).toBe(false);
    expect(service.removerPerfil('nao-existe')).toBe(false);
  });
});
