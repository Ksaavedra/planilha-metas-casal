import { FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  const authService = {
    register: jest.fn(),
  };
  const router = {
    navigateByUrl: jest.fn(),
  };

  function criar() {
    return new RegisterComponent(
      new FormBuilder(),
      authService as any,
      router as any,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    authService.register.mockReturnValue(of({}));
  });

  it('deve bloquear formulário inválido e senhas diferentes', () => {
    const component = criar();

    component.criarConta();
    expect(component.erro).toBe(
      'Preencha os dados corretamente para criar sua conta.',
    );
    expect(authService.register).not.toHaveBeenCalled();

    component.form.patchValue({
      nome: 'Kelly',
      email: 'kelly@email.com',
      senha: '123456',
      confirmarSenha: '654321',
    });
    component.form.get('confirmarSenha')?.markAsTouched();

    expect(component.senhasDiferentes).toBe(true);
  });

  it('deve criar conta e navegar para dashboard', () => {
    const component = criar();
    component.form.patchValue({
      nome: 'Kelly',
      email: 'kelly@email.com',
      senha: '123456',
      confirmarSenha: '123456',
    });

    component.criarConta();

    expect(authService.register).toHaveBeenCalledWith({
      nome: 'Kelly',
      email: 'kelly@email.com',
      senha: '123456',
    });
    expect(component.sucesso).toBe('Conta criada com sucesso!');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('deve exibir erro da API ou fallback', () => {
    authService.register.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { error: 'Email já cadastrado.' },
          }),
      ),
    );
    const component = criar();
    component.form.patchValue({
      nome: 'Kelly',
      email: 'kelly@email.com',
      senha: '123456',
      confirmarSenha: '123456',
    });

    component.criarConta();
    expect(component.erro).toBe('Email já cadastrado.');

    authService.register.mockReturnValueOnce(throwError(() => new Error('erro')));
    component.criarConta();
    expect(component.erro).toBe('Não foi possível criar a conta. Tente novamente.');
  });
});
