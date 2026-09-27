import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { PasswordRecoveryStateService } from '@core/services/auth/password-recovery-state.service';

function senhasIguais(control: AbstractControl): ValidationErrors | null {
  const senha = control.get('novaSenha')?.value;
  const confirmarSenha = control.get('confirmarSenha')?.value;

  if (!senha || !confirmarSenha) return null;
  return senha === confirmarSenha ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-nova-senha',
  templateUrl: './nova-senha.component.html',
  styleUrl: './nova-senha.component.scss',
  standalone: false,
})
export class NovaSenhaComponent implements OnInit {
  carregando = false;
  erro: string | null = null;
  mostrarSenha = false;
  mostrarConfirmacao = false;
  resetToken = '';

  form = this.fb.group(
    {
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required],
    },
    { validators: senhasIguais },
  );

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private recoveryState: PasswordRecoveryStateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.resetToken = this.recoveryState.resetToken;
    if (!this.resetToken) {
      this.router.navigate(['/recuperar-senha']);
    }
  }

  salvar(): void {
    this.erro = null;

    if (this.form.invalid || this.carregando || !this.resetToken) {
      this.form.markAllAsTouched();
      this.erro = 'Preencha a nova senha corretamente.';
      return;
    }

    const { novaSenha } = this.form.getRawValue();
    this.carregando = true;

    this.authService
      .resetPassword({
        resetToken: this.resetToken,
        novaSenha: String(novaSenha),
      })
      .subscribe({
        next: () => {
          this.carregando = false;
          this.recoveryState.clear();
          this.router.navigate(['/login'], {
            queryParams: { senhaRedefinida: '1' },
          });
        },
        error: (err: unknown) => {
          this.carregando = false;
          this.erro = this.mensagemErro(err);
        },
      });
  }

  get senhasDiferentes(): boolean {
    return (
      Boolean(this.form.errors?.['senhasDiferentes']) &&
      Boolean(this.form.get('confirmarSenha')?.touched)
    );
  }

  private mensagemErro(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const apiMsg =
        typeof err.error === 'object' && err.error && 'error' in err.error
          ? String((err.error as { error: string }).error)
          : '';
      if (apiMsg) return apiMsg;
    }

    return 'Não foi possível redefinir a senha. Tente novamente.';
  }
}
