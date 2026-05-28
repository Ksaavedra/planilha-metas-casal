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

    expect(component.erro).toBe('Informe email e senha para entrar.');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('deve fazer login e navegar para dashboard por padrão', () => {
    const component = criar();
    component.form.patchValue({ email: 'teste@email.com', senha: '123456' });

    component.entrar();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'teste@email.com',
      senha: '123456',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.carregando).toBe(false);
  });

  it('deve respeitar returnUrl após login', () => {
    route.snapshot.queryParamMap.get.mockReturnValue('/metas');
    const component = criar();
    component.form.patchValue({ email: 'teste@email.com', senha: '123456' });

    component.entrar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/metas');
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
    component.form.patchValue({ email: 'teste@email.com', senha: '123456' });

    component.entrar();
    expect(component.erro).toBe('Email ou senha inválidos.');

    authService.login.mockReturnValueOnce(throwError(() => new Error('erro')));
    component.entrar();
    expect(component.erro).toBe(
      'Não foi possível entrar. Verifique seus dados e tente novamente.',
    );
  });
});
