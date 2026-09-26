import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { PasswordRecoveryStateService } from '@core/services/auth/password-recovery-state.service';

@Component({
  selector: 'app-recuperar-senha',
  templateUrl: './recuperar-senha.component.html',
  styleUrl: './recuperar-senha.component.scss',
  standalone: false,
})
export class RecuperarSenhaComponent implements OnInit {
  carregando = false;
  erro: string | null = null;
  sucesso: string | null = null;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private recoveryState: PasswordRecoveryStateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.recoveryState.clear();
  }

  enviar(): void {
    this.erro = null;
    this.sucesso = null;

    if (this.form.invalid || this.carregando) {
      this.form.markAllAsTouched();
      this.erro = 'Informe um email válido para recuperar sua senha.';
      return;
    }

    const email = String(this.form.getRawValue().email).trim();
    this.carregando = true;

    this.authService.forgotPassword({ email }).subscribe({
      next: (response) => {
        this.carregando = false;
        this.sucesso = response.message;
        this.recoveryState.setEmail(email);
        this.router.navigate(['/recuperar-senha/verificar']);
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

    return 'Não foi possível solicitar a recuperação. Tente novamente.';
  }
}
