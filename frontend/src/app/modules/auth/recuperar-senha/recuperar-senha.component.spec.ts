import { FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { RecuperarSenhaComponent } from './recuperar-senha.component';

describe('RecuperarSenhaComponent', () => {
  const authService = {
    forgotPassword: jest.fn(),
  };
  const recoveryState = {
    clear: jest.fn(),
    setEmail: jest.fn(),
  };
  const router = {
    navigate: jest.fn(),
  };

  function criar() {
    return new RecuperarSenhaComponent(
      new FormBuilder(),
      authService as any,
      recoveryState as any,
      router as any,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    authService.forgotPassword.mockReturnValue(
      of({ message: 'Se o email estiver cadastrado, enviaremos um código de recuperação.' }),
    );
  });

  it('deve validar email antes de enviar', () => {
    const component = criar();

    component.enviar();

    expect(component.erro).toBe('Informe um email válido para recuperar sua senha.');
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('deve solicitar recuperação e navegar para verificação', () => {
    const component = criar();
    component.form.patchValue({ email: 'teste@email.com' });

    component.enviar();

    expect(authService.forgotPassword).toHaveBeenCalledWith({
      email: 'teste@email.com',
    });
    expect(recoveryState.setEmail).toHaveBeenCalledWith('teste@email.com');
    expect(router.navigate).toHaveBeenCalledWith(['/recuperar-senha/verificar']);
  });

  it('deve limpar o estado de recuperação ao iniciar', () => {
    const component = criar();

    component.ngOnInit();

    expect(recoveryState.clear).toHaveBeenCalled();
  });

  it('deve remover espaços do email e exibir mensagem de sucesso', () => {
    const component = criar();
    component.form.patchValue({ email: 'teste@email.com' });
    component.form.get('email')?.setValue('teste@email.com  ' as any, { emitEvent: false });
    component.form.get('email')?.setErrors(null);

    component.enviar();

    expect(authService.forgotPassword).toHaveBeenCalledWith({ email: 'teste@email.com' });
    expect(component.carregando).toBe(false);
    expect(component.sucesso).toBe(
      'Se o email estiver cadastrado, enviaremos um código de recuperação.',
    );
  });

  it('deve bloquear email inválido', () => {
    const component = criar();
    component.form.patchValue({ email: 'email-invalido' });

    component.enviar();

    expect(component.erro).toBe('Informe um email válido para recuperar sua senha.');
    expect(component.form.get('email')?.touched).toBe(true);
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('deve bloquear quando já está carregando', () => {
    const component = criar();
    component.form.patchValue({ email: 'teste@email.com' });
    component.carregando = true;

    component.enviar();

    expect(component.erro).toBe('Informe um email válido para recuperar sua senha.');
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('deve exibir mensagem da API em HttpErrorResponse', () => {
    authService.forgotPassword.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 429,
            error: { error: 'Muitas tentativas.' },
          }),
      ),
    );
    const component = criar();
    component.form.patchValue({ email: 'teste@email.com' });

    component.enviar();

    expect(component.carregando).toBe(false);
    expect(component.erro).toBe('Muitas tentativas.');
    expect(component.sucesso).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it.each([
    ['erro como string', 'falhou'],
    ['erro nulo', null],
    ['objeto sem chave error', { message: 'x' }],
    ['mensagem vazia', { error: '' }],
  ])('deve usar fallback em HttpErrorResponse com %s', (_desc, error) => {
    authService.forgotPassword.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500, error })),
    );
    const component = criar();
    component.form.patchValue({ email: 'teste@email.com' });

    component.enviar();

    expect(component.erro).toBe(
      'Não foi possível solicitar a recuperação. Tente novamente.',
    );
  });

  it('deve usar fallback para erro genérico e limpar sucesso anterior', () => {
    const component = criar();
    component.sucesso = 'anterior';
    authService.forgotPassword.mockReturnValueOnce(
      throwError(() => new Error('rede')),
    );
    component.form.patchValue({ email: 'teste@email.com' });

    component.enviar();

    expect(component.carregando).toBe(false);
    expect(component.sucesso).toBeNull();
    expect(component.erro).toBe(
      'Não foi possível solicitar a recuperação. Tente novamente.',
    );
  });
});
