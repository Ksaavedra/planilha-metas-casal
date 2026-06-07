import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { PerfilFinanceiroService } from './perfil-financeiro.service';
import { UsuariosService } from '@core/services/usuarios/usuarios.service';

describe('PerfilFinanceiroService', () => {
  let service: PerfilFinanceiroService;
  let usuariosService: {
    getUsuarios: jest.Mock;
    createUsuario: jest.Mock;
    updateUsuario: jest.Mock;
    deleteUsuario: jest.Mock;
  };

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
      updateUsuario: jest.fn().mockReturnValue(of({ id: 1, nome: 'Kelly Oliveira' })),
      deleteUsuario: jest.fn().mockReturnValue(of(undefined)),
    };
    service = criarService();
  });

  it('deve iniciar vazio sem depender de localStorage', () => {
    expect(service).toBeTruthy();
    expect(service.perfis).toEqual([]);
    expect(service.temGrupoFamiliarAtual).toBe(false);
    expect(service.tipoUsoAtual).toBe('individual');
  });

  it('deve definir tipo de uso e atualizar estado familiar', async () => {
    service.definirTipoUso('familia');

    expect(service.tipoUsoAtual).toBe('familia');
    expect(service.temGrupoFamiliarAtual).toBe(true);
    await expect(firstValueFrom(service.temGrupoFamiliar$)).resolves.toBe(true);
  });

  it('deve carregar usuários cadastrados da API mantendo pessoas cadastradas', async () => {
    usuariosService.getUsuarios.mockReturnValue(
      of([
        { id: 1, nome: ' Kelly ' },
        { id: 2, nome: 'kelly' },
        { id: 3, nome: 'David' },
        { id: 4, nome: '' },
      ]),
    );

    service.carregarUsuariosCadastrados();

    expect(usuariosService.getUsuarios).toHaveBeenCalled();
    expect(service.perfis).toEqual([
      { id: 'usuario-1', nome: 'Kelly' },
      { id: 'usuario-2', nome: 'kelly' },
      { id: 'usuario-3', nome: 'David' },
    ]);
    expect(service.temGrupoFamiliarAtual).toBe(false);
    await expect(firstValueFrom(service.temGrupoFamiliar$)).resolves.toBe(false);
  });

  it('deve manter estado atual quando carregar usuários falhar', () => {
    usuariosService.getUsuarios.mockReturnValueOnce(
      of([{ id: 1, nome: 'Kelly' }]),
    );
    service.carregarUsuariosCadastrados();
    usuariosService.getUsuarios.mockReturnValueOnce(
      throwError(() => new Error('erro')),
    );

    service.carregarUsuariosCadastrados();

    expect(service.perfis).toEqual([{ id: 'usuario-1', nome: 'Kelly' }]);
    expect(service.temGrupoFamiliarAtual).toBe(false);
  });

  it('deve adicionar perfil usando UsuariosService e atualizar estado', async () => {
    usuariosService.createUsuario.mockReturnValue(of({ id: 7, nome: 'Kelly Silva' }));

    const novo = await firstValueFrom(service.adicionarPerfil('  Kelly   Silva  '));

    expect(novo).toEqual({ id: 'usuario-7', nome: 'Kelly Silva' });
    expect(usuariosService.createUsuario).toHaveBeenCalledWith(
      'Kelly Silva',
      undefined,
    );
    expect(service.perfis).toEqual([{ id: 'usuario-7', nome: 'Kelly Silva' }]);
  });

  it('não deve adicionar nome vazio ou quando API falhar', async () => {
    usuariosService.createUsuario.mockReturnValueOnce(of({ id: 1, nome: 'Kélly' }));
    usuariosService.createUsuario.mockReturnValueOnce(of({ id: 2, nome: 'kelly' }));

    expect(await firstValueFrom(service.adicionarPerfil('   '))).toBeNull();
    const primeiro = await firstValueFrom(service.adicionarPerfil('Kélly'));
    const mesmoNomePermitido = await firstValueFrom(service.adicionarPerfil('kelly'));
    usuariosService.createUsuario.mockReturnValueOnce(
      throwError(() => new Error('erro')),
    );
    const comErro = await firstValueFrom(service.adicionarPerfil('Max'));

    expect(primeiro).toEqual({ id: 'usuario-1', nome: 'Kélly' });
    expect(mesmoNomePermitido).toEqual({ id: 'usuario-2', nome: 'kelly' });
    expect(comErro).toBeNull();
    expect(service.perfis).toEqual([
      { id: 'usuario-1', nome: 'Kélly' },
      { id: 'usuario-2', nome: 'kelly' },
    ]);
  });

  it('deve atualizar perfil usando UsuariosService', async () => {
    usuariosService.getUsuarios.mockReturnValue(of([{ id: 1, nome: 'Kelly' }]));
    usuariosService.updateUsuario.mockReturnValue(
      of({ id: 1, nome: 'Kelly Oliveira' }),
    );
    service.carregarUsuariosCadastrados();

    const atualizado = await firstValueFrom(
      service.atualizarPerfil('usuario-1', '  Kelly Oliveira '),
    );

    expect(atualizado).toEqual({ id: 'usuario-1', nome: 'Kelly Oliveira' });
    expect(usuariosService.updateUsuario).toHaveBeenCalledWith(
      1,
      'Kelly Oliveira',
      undefined,
    );
    expect(service.perfis).toEqual([
      { id: 'usuario-1', nome: 'Kelly Oliveira' },
    ]);
  });

  it('não deve atualizar com nome inválido, id local ou erro da API', async () => {
    usuariosService.getUsuarios.mockReturnValue(of([{ id: 1, nome: 'Kelly' }]));
    service.carregarUsuariosCadastrados();

    expect(await firstValueFrom(service.atualizarPerfil('usuario-1', '   '))).toBeNull();
    expect(await firstValueFrom(service.atualizarPerfil('pessoa-local', 'Local'))).toBeNull();

    usuariosService.updateUsuario.mockReturnValueOnce(
      throwError(() => new Error('erro')),
    );

    expect(await firstValueFrom(service.atualizarPerfil('usuario-1', 'Kelly Silva'))).toBeNull();
    expect(service.perfis).toEqual([{ id: 'usuario-1', nome: 'Kelly' }]);
  });

  it('deve remover perfil usando UsuariosService', async () => {
    usuariosService.getUsuarios.mockReturnValue(
      of([
        { id: 1, nome: 'Kelly' },
        { id: 2, nome: 'David' },
      ]),
    );
    service.carregarUsuariosCadastrados();

    const removido = await firstValueFrom(service.removerPerfil('usuario-1'));

    expect(removido).toBe(true);
    expect(usuariosService.deleteUsuario).toHaveBeenCalledWith(1);
    expect(service.perfis).toEqual([{ id: 'usuario-2', nome: 'David' }]);
  });

  it('deve remover todos os perfis usando UsuariosService', async () => {
    usuariosService.getUsuarios.mockReturnValue(
      of([
        { id: 1, nome: 'Kelly' },
        { id: 2, nome: 'David' },
      ]),
    );
    service.carregarUsuariosCadastrados();

    const removido = await firstValueFrom(service.removerTodosPerfis());

    expect(removido).toBe(true);
    expect(usuariosService.deleteUsuario).toHaveBeenCalledWith(1);
    expect(usuariosService.deleteUsuario).toHaveBeenCalledWith(2);
    expect(service.perfis).toEqual([]);
  });

  it('não deve remover perfil inexistente, id local ou quando API falhar', async () => {
    usuariosService.getUsuarios.mockReturnValue(of([{ id: 1, nome: 'Kelly' }]));
    service.carregarUsuariosCadastrados();

    expect(await firstValueFrom(service.removerPerfil('nao-existe'))).toBe(false);
    expect(await firstValueFrom(service.removerPerfil('pessoa-local'))).toBe(false);

    usuariosService.deleteUsuario.mockReturnValueOnce(
      throwError(() => new Error('erro')),
    );

    expect(await firstValueFrom(service.removerPerfil('usuario-1'))).toBe(false);
    expect(service.perfis).toEqual([{ id: 'usuario-1', nome: 'Kelly' }]);
  });
});
