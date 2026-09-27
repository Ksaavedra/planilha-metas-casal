import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: false,
})
export class LoginComponent implements OnInit {
  carregando = false;
  erro: string | null = null;
  sucesso: string | null = null;
  mostrarSenha = false;

  form = this.fb.group({
    usuarioOuEmail: ['', Validators.required],
    senha: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('senhaRedefinida') === '1') {
      this.sucesso = 'Senha redefinida com sucesso. Faça login com sua nova senha.';
    }
  }

  entrar(): void {
    this.erro = null;
    this.sucesso = null;

    if (this.form.invalid || this.carregando) {
      this.form.markAllAsTouched();
      this.erro = 'Informe usuário ou email e senha para entrar.';
      return;
    }

    const { usuarioOuEmail, senha } = this.form.getRawValue();
    this.carregando = true;

    this.authService
      .login({
        usuarioOuEmail: String(usuarioOuEmail).trim(),
        senha: String(senha),
      })
      .subscribe({
        next: () => {
          this.carregando = false;
          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
          this.router.navigateByUrl(returnUrl);
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

    return 'Não foi possível entrar. Verifique seus dados e tente novamente.';
  }
}
