import { TestBed } from '@angular/core/testing';
import { PasswordRecoveryStateService } from './password-recovery-state.service';

describe('PasswordRecoveryStateService', () => {
  let service: PasswordRecoveryStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PasswordRecoveryStateService);
  });

  it('deve ser criado com estado vazio', () => {
    expect(service).toBeTruthy();
    expect(service.email).toBe('');
    expect(service.resetToken).toBe('');
  });

  it('setEmail deve armazenar o email sem espaços nas bordas', () => {
    service.setEmail('  teste@email.com  ');

    expect(service.email).toBe('teste@email.com');
  });

  it('setResetToken deve armazenar o token', () => {
    service.setResetToken('token-123');

    expect(service.resetToken).toBe('token-123');
  });

  it('clear deve limpar email e token', () => {
    service.setEmail('teste@email.com');
    service.setResetToken('token-123');

    service.clear();

    expect(service.email).toBe('');
    expect(service.resetToken).toBe('');
  });
});
