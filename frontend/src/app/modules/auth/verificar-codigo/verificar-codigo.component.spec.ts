import { FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { VerificarCodigoComponent } from './verificar-codigo.component';

describe('VerificarCodigoComponent', () => {
  const authService = {
    verifyResetCode: jest.fn(),
  };
  const recoveryState = {
    email: '',
    setResetToken: jest.fn(),
  };
  const router = {
    navigate: jest.fn(),
  };

  const FALLBACK = 'Não foi possível verificar o código. Tente novamente.';
  const ERRO_VALIDACAO = 'Informe o código de 6 dígitos recebido por email.';

  function criar() {
    return new VerificarCodigoComponent(
      new FormBuilder(),
      authService as any,
      recoveryState as any,
      router as any,
    );
  }

  function criarComEmail(email = 'teste@email.com') {
    recoveryState.email = email;
    const component = criar();
    component.ngOnInit();
    return component;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    recoveryState.email = '';
    authService.verifyResetCode.mockReturnValue(of({ resetToken: 'token-123' }));
  });

  it('deve iniciar com estado padrão', () => {
    const component = criar();

    expect(component.carregando).toBe(false);
    expect(component.erro).toBeNull();
    expect(component.email).toBe('');
  });

  describe('ngOnInit', () => {
    it('deve redirecionar para recuperar senha quando não há email', () => {
      const component = criar();

      component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/recuperar-senha']);
    });

    it('deve carregar email do estado sem redirecionar', () => {
      const component = criarComEmail('a@b.com');

      expect(component.email).toBe('a@b.com');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('verificar', () => {
    it('deve bloquear formulário vazio', () => {
      const component = criarComEmail();

      component.verificar();

      expect(component.erro).toBe(ERRO_VALIDACAO);
      expect(component.form.get('codigo')?.touched).toBe(true);
      expect(authService.verifyResetCode).not.toHaveBeenCalled();
    });

    it('deve bloquear código fora do padrão de 6 dígitos', () => {
      const component = criarComEmail();
      component.form.patchValue({ codigo: '12a45' });

      component.verificar();

      expect(component.erro).toBe(ERRO_VALIDACAO);
      expect(authService.verifyResetCode).not.toHaveBeenCalled();
    });

    it('deve bloquear quando já está carregando', () => {
      const component = criarComEmail();
      component.form.patchValue({ codigo: '123456' });
      component.carregando = true;

      component.verificar();

      expect(component.erro).toBe(ERRO_VALIDACAO);
      expect(authService.verifyResetCode).not.toHaveBeenCalled();
    });

    it('deve bloquear quando não há email', () => {
      const component = criar();
      component.form.patchValue({ codigo: '123456' });

      component.verificar();

      expect(component.erro).toBe(ERRO_VALIDACAO);
      expect(authService.verifyResetCode).not.toHaveBeenCalled();
    });

    it('deve verificar código, guardar token e navegar para nova senha', () => {
      const component = criarComEmail('teste@email.com');
      component.form.patchValue({ codigo: '123456' });

      component.verificar();

      expect(authService.verifyResetCode).toHaveBeenCalledWith({
        email: 'teste@email.com',
        codigo: '123456',
      });
      expect(component.carregando).toBe(false);
      expect(component.erro).toBeNull();
      expect(recoveryState.setResetToken).toHaveBeenCalledWith('token-123');
      expect(router.navigate).toHaveBeenCalledWith(['/recuperar-senha/nova-senha']);
    });

    it('deve exibir mensagem da API em HttpErrorResponse', () => {
      authService.verifyResetCode.mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { error: 'Código inválido.' },
            }),
        ),
      );
      const component = criarComEmail();
      component.form.patchValue({ codigo: '123456' });

      component.verificar();

      expect(component.carregando).toBe(false);
      expect(component.erro).toBe('Código inválido.');
      expect(recoveryState.setResetToken).not.toHaveBeenCalled();
    });

    it.each([
      ['erro como string', 'falhou'],
      ['erro nulo', null],
      ['objeto sem chave error', { message: 'x' }],
      ['mensagem vazia', { error: '' }],
    ])('deve usar fallback em HttpErrorResponse com %s', (_desc, error) => {
      authService.verifyResetCode.mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 500, error })),
      );
      const component = criarComEmail();
      component.form.patchValue({ codigo: '123456' });

      component.verificar();

      expect(component.erro).toBe(FALLBACK);
    });

    it('deve usar fallback para erro genérico', () => {
      authService.verifyResetCode.mockReturnValueOnce(
        throwError(() => new Error('rede')),
      );
      const component = criarComEmail();
      component.form.patchValue({ codigo: '123456' });

      component.verificar();

      expect(component.carregando).toBe(false);
      expect(component.erro).toBe(FALLBACK);
    });
  });
});
