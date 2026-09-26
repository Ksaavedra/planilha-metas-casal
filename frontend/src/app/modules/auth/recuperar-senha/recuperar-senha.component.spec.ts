import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
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
});
