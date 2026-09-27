import { FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { NovaSenhaComponent } from './nova-senha.component';

describe('NovaSenhaComponent', () => {
  const authService = {
    resetPassword: jest.fn(),
  };
  const recoveryState = {
    resetToken: '',
    clear: jest.fn(),
  };
  const router = {
    navigate: jest.fn(),
  };

  const FALLBACK = 'Não foi possível redefinir a senha. Tente novamente.';

  function criar() {
    return new NovaSenhaComponent(
      new FormBuilder(),
      authService as any,
      recoveryState as any,
      router as any,
    );
  }

  function criarComToken(token = 'token-abc') {
    recoveryState.resetToken = token;
    const component = criar();
    component.ngOnInit();
    return component;
  }

  function preencher(component: NovaSenhaComponent, senha = '123456', confirmar = senha) {
    component.form.patchValue({ novaSenha: senha, confirmarSenha: confirmar });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    recoveryState.resetToken = '';
    authService.resetPassword.mockReturnValue(of({ message: 'Senha redefinida.' }));
  });

  it('deve iniciar com estado padrão', () => {
    const component = criar();

    expect(component.carregando).toBe(false);
    expect(component.erro).toBeNull();
    expect(component.mostrarSenha).toBe(false);
    expect(component.mostrarConfirmacao).toBe(false);
    expect(component.resetToken).toBe('');
  });

  describe('ngOnInit', () => {
    it('deve redirecionar para recuperar senha quando não há token', () => {
      const component = criar();

      component.ngOnInit();

      expect(component.resetToken).toBe('');
      expect(router.navigate).toHaveBeenCalledWith(['/recuperar-senha']);
    });

    it('deve carregar o token do estado sem redirecionar', () => {
      const component = criarComToken('token-xyz');

      expect(component.resetToken).toBe('token-xyz');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('validador senhasIguais', () => {
    it('não deve acusar erro quando algum campo está vazio', () => {
      const component = criar();

      component.form.patchValue({ novaSenha: '123456', confirmarSenha: '' });
      expect(component.form.errors).toBeNull();

      component.form.patchValue({ novaSenha: '', confirmarSenha: '123456' });
      expect(component.form.errors).toBeNull();
    });

    it('deve acusar senhas diferentes', () => {
      const component = criar();

      preencher(component, '123456', '654321');

      expect(component.form.errors).toEqual({ senhasDiferentes: true });
    });

    it('não deve acusar erro quando os controles não existem', () => {
      const component = criar();
      const validator = component.form.validator!;

      expect(validator(new FormBuilder().group({}))).toBeNull();
    });

    it('não deve acusar erro quando senhas são iguais', () => {
      const component = criar();

      preencher(component, '123456', '123456');

      expect(component.form.errors).toBeNull();
      expect(component.form.valid).toBe(true);
    });
  });

  describe('senhasDiferentes', () => {
    it('deve ser false quando senhas diferem mas confirmação não foi tocada', () => {
      const component = criar();
      preencher(component, '123456', '654321');

      expect(component.senhasDiferentes).toBe(false);
    });

    it('deve ser true quando senhas diferem e confirmação foi tocada', () => {
      const component = criar();
      preencher(component, '123456', '654321');
      component.form.get('confirmarSenha')?.markAsTouched();

      expect(component.senhasDiferentes).toBe(true);
    });

    it('deve ser false quando senhas são iguais mesmo com confirmação tocada', () => {
      const component = criar();
      preencher(component, '123456', '123456');
      component.form.get('confirmarSenha')?.markAsTouched();

      expect(component.senhasDiferentes).toBe(false);
    });

    it('deve ser false quando controle de confirmação não existe', () => {
      const component = criar();
      preencher(component, '123456', '654321');
      component.form.removeControl('confirmarSenha' as never);
      (component.form as any).setErrors({ senhasDiferentes: true });

      expect(component.senhasDiferentes).toBe(false);
    });
  });

  describe('salvar', () => {
    it('deve bloquear formulário inválido', () => {
      const component = criarComToken();

      component.salvar();

      expect(component.erro).toBe('Preencha a nova senha corretamente.');
      expect(component.form.get('novaSenha')?.touched).toBe(true);
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });

    it('deve bloquear senha com menos de 6 caracteres', () => {
      const component = criarComToken();
      preencher(component, '123', '123');

      component.salvar();

      expect(component.erro).toBe('Preencha a nova senha corretamente.');
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });

    it('deve bloquear quando já está carregando', () => {
      const component = criarComToken();
      preencher(component);
      component.carregando = true;

      component.salvar();

      expect(component.erro).toBe('Preencha a nova senha corretamente.');
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });

    it('deve bloquear quando não há token de redefinição', () => {
      const component = criar();
      preencher(component);

      component.salvar();

      expect(component.erro).toBe('Preencha a nova senha corretamente.');
      expect(authService.resetPassword).not.toHaveBeenCalled();
    });

    it('deve redefinir senha, limpar estado e navegar para login', () => {
      const component = criarComToken('token-abc');
      preencher(component, 'novaSenha1');

      component.salvar();

      expect(authService.resetPassword).toHaveBeenCalledWith({
        resetToken: 'token-abc',
        novaSenha: 'novaSenha1',
      });
      expect(component.carregando).toBe(false);
      expect(component.erro).toBeNull();
      expect(recoveryState.clear).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { senhaRedefinida: '1' },
      });
    });

    it('deve exibir mensagem da API em HttpErrorResponse', () => {
      authService.resetPassword.mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { error: 'Token expirado.' },
            }),
        ),
      );
      const component = criarComToken();
      preencher(component);

      component.salvar();

      expect(component.carregando).toBe(false);
      expect(component.erro).toBe('Token expirado.');
      expect(recoveryState.clear).not.toHaveBeenCalled();
    });

    it.each([
      ['erro como string', 'falhou'],
      ['erro nulo', null],
      ['objeto sem chave error', { message: 'x' }],
      ['mensagem vazia', { error: '' }],
    ])('deve usar fallback em HttpErrorResponse com %s', (_desc, error) => {
      authService.resetPassword.mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 500, error })),
      );
      const component = criarComToken();
      preencher(component);

      component.salvar();

      expect(component.erro).toBe(FALLBACK);
    });

    it('deve usar fallback para erro genérico', () => {
      authService.resetPassword.mockReturnValueOnce(
        throwError(() => new Error('rede')),
      );
      const component = criarComToken();
      preencher(component);

      component.salvar();

      expect(component.carregando).toBe(false);
      expect(component.erro).toBe(FALLBACK);
    });

    it('deve limpar erro anterior ao salvar novamente com sucesso', () => {
      const component = criarComToken();
      component.salvar();
      expect(component.erro).not.toBeNull();

      preencher(component);
      component.salvar();

      expect(component.erro).toBeNull();
    });
  });
});
