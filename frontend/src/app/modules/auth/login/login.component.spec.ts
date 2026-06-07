import { FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const authService = {
    login: jest.fn(),
  };
  const router = {
    navigateByUrl: jest.fn(),
  };
  const route = {
    snapshot: {
      queryParamMap: {
        get: jest.fn(),
      },
    },
  };

  function criar() {
    return new LoginComponent(
      new FormBuilder(),
      authService as any,
      router as any,
      route as any,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    authService.login.mockReturnValue(of({}));
    route.snapshot.queryParamMap.get.mockReturnValue(null);
  });

  it('deve bloquear formulário inválido', () => {
    const component = criar();

    component.entrar();

    expect(component.erro).toBe('Informe usuário ou email e senha para entrar.');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('deve fazer login e navegar para dashboard por padrão', () => {
    const component = criar();
    component.form.patchValue({ usuarioOuEmail: 'usuario1', senha: '123456' });

    component.entrar();

    expect(authService.login).toHaveBeenCalledWith({
      usuarioOuEmail: 'usuario1',
      senha: '123456',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.carregando).toBe(false);
  });

  it('deve respeitar returnUrl após login', () => {
    route.snapshot.queryParamMap.get.mockReturnValue('/metas');
    const component = criar();
    component.form.patchValue({ usuarioOuEmail: 'teste@email.com', senha: '123456' });

    component.entrar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/metas');
  });

  it('deve alternar para recuperação de senha mantendo apenas o email', () => {
    const component = criar();
    component.form.patchValue({ usuarioOuEmail: 'teste@email.com', senha: '123456' });
    component.erro = 'erro anterior';
    component.sucesso = 'sucesso anterior';

    component.iniciarRecuperacao();

    expect(component.modoRecuperacao).toBe(true);
    expect(component.form.get('usuarioOuEmail')?.value).toBe('teste@email.com');
    expect(component.form.get('senha')?.value).toBeNull();
    expect(component.erro).toBeNull();
    expect(component.sucesso).toBeNull();
  });

  it('deve voltar da recuperação para o login', () => {
    const component = criar();
    component.iniciarRecuperacao();
    component.erro = 'erro anterior';
    component.sucesso = 'sucesso anterior';

    component.voltarParaLogin();

    expect(component.modoRecuperacao).toBe(false);
    expect(component.erro).toBeNull();
    expect(component.sucesso).toBeNull();
  });

  it('deve validar email antes de recuperar senha', () => {
    const component = criar();

    component.recuperarSenha();

    expect(component.erro).toBe('Informe um email válido para recuperar sua senha.');
    expect(component.sucesso).toBeNull();
  });

  it('deve exibir aviso ao solicitar recuperação de senha', () => {
    const component = criar();
    component.form.patchValue({ usuarioOuEmail: 'teste@email.com' });

    component.recuperarSenha();

    expect(component.erro).toBeNull();
    expect(component.sucesso).toBe(
      'Email validado com sucesso. A recuperação automática ainda precisa ser configurada no backend.',
    );
  });

  it('deve exibir erro amigável da API ou fallback', () => {
    authService.login.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { error: 'Email ou senha inválidos.' },
          }),
      ),
    );
    const component = criar();
    component.form.patchValue({ usuarioOuEmail: 'teste@email.com', senha: '123456' });

    component.entrar();
    expect(component.erro).toBe('Email ou senha inválidos.');

    authService.login.mockReturnValueOnce(throwError(() => new Error('erro')));
    component.entrar();
    expect(component.erro).toBe(
      'Não foi possível entrar. Verifique seus dados e tente novamente.',
    );

    authService.login.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 400, error: {} })),
    );
    component.entrar();
    expect(component.erro).toBe(
      'Não foi possível entrar. Verifique seus dados e tente novamente.',
    );

    authService.login.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 400, error: 'erro' })),
    );
    component.entrar();
    expect(component.erro).toBe(
      'Não foi possível entrar. Verifique seus dados e tente novamente.',
    );
  });
});
