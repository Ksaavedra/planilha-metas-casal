import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';

function senhasIguais(control: AbstractControl): ValidationErrors | null {
  const senha = control.get('senha')?.value;
  const confirmarSenha = control.get('confirmarSenha')?.value;

  if (!senha || !confirmarSenha) return null;
  return senha === confirmarSenha ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  standalone: false,
})
export class RegisterComponent {
  carregando = false;
  erro: string | null = null;
  sucesso: string | null = null;

  form = this.fb.group(
    {
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required],
    },
    { validators: senhasIguais },
  );

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  criarConta(): void {
    this.erro = null;
    this.sucesso = null;

    if (this.form.invalid || this.carregando) {
      this.form.markAllAsTouched();
      this.erro = 'Preencha os dados corretamente para criar sua conta.';
      return;
    }

    const { nome, email, senha } = this.form.getRawValue();
    this.carregando = true;

    this.authService
      .register({
        nome: String(nome).trim(),
        email: String(email).trim(),
        senha: String(senha),
      })
      .subscribe({
        next: () => {
          this.carregando = false;
          this.sucesso = 'Conta criada com sucesso!';
          this.router.navigateByUrl('/dashboard');
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

    return 'Não foi possível criar a conta. Tente novamente.';
  }
}
