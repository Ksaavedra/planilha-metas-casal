import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { PasswordRecoveryStateService } from '@core/services/auth/password-recovery-state.service';

@Component({
  selector: 'app-verificar-codigo',
  templateUrl: './verificar-codigo.component.html',
  styleUrl: './verificar-codigo.component.scss',
  standalone: false,
})
export class VerificarCodigoComponent implements OnInit {
  carregando = false;
  erro: string | null = null;
  email = '';

  form = this.fb.group({
    codigo: [
      '',
      [Validators.required, Validators.pattern(/^\d{6}$/)],
    ],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private recoveryState: PasswordRecoveryStateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.email = this.recoveryState.email;
    if (!this.email) {
      this.router.navigate(['/recuperar-senha']);
    }
  }

  verificar(): void {
    this.erro = null;

    if (this.form.invalid || this.carregando || !this.email) {
      this.form.markAllAsTouched();
      this.erro = 'Informe o código de 6 dígitos recebido por email.';
      return;
    }

    const codigo = String(this.form.getRawValue().codigo).trim();
    this.carregando = true;

    this.authService.verifyResetCode({ email: this.email, codigo }).subscribe({
      next: (response) => {
        this.carregando = false;
        this.recoveryState.setResetToken(response.resetToken);
        this.router.navigate(['/recuperar-senha/nova-senha']);
      },
      error: (err: unknown) => {
        this.carregando = false;
        this.erro = this.mensagemErro(err);
      },
    });
  }

  private mensagemErro(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const apiMsg =
        typeof err.error === 'object' && err.error && 'error' in err.error
          ? String((err.error as { error: string }).error)
          : '';
      if (apiMsg) return apiMsg;
    }

    return 'Não foi possível verificar o código. Tente novamente.';
  }
}
