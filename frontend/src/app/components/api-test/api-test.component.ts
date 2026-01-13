import { Component, OnInit } from '@angular/core';
import { MetasService } from '../../core/services/metas/metas.service';
import { ReceitasService } from '../../core/services/relatorios/receitas.service';
import { DespesasService } from '../../core/services/despesas/despesas.service';
import { CategoriasService } from '../../core/services/categorias/categorias.service';
import { MesesService } from '../../core/services/meses/meses.service';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
    selector: 'app-api-test',
    template: `
    <div class="api-test-container">
      <h2>🧪 Teste de Integração com APIs</h2>

      <div class="test-section">
        <h3>🔐 Autenticação</h3>
        <button (click)="testLogin()" [disabled]="loading">Testar Login</button>
        <button (click)="testRegister()" [disabled]="loading">
          Testar Registro
        </button>
        <div *ngIf="authResult" class="result">
          <pre>{{ authResult | json }}</pre>
        </div>
      </div>

      <div class="test-section">
        <h3>🎯 Metas</h3>
        <button (click)="testMetas()" [disabled]="loading">Listar Metas</button>
        <button (click)="testCreateMeta()" [disabled]="loading">
          Criar Meta
        </button>
        <div *ngIf="metasResult" class="result">
          <pre>{{ metasResult | json }}</pre>
        </div>
      </div>

      <div class="test-section">
        <h3>💰 Receitas</h3>
        <button (click)="testReceitas()" [disabled]="loading">
          Listar Receitas
        </button>
        <button (click)="testCreateReceita()" [disabled]="loading">
          Criar Receita
        </button>
        <div *ngIf="receitasResult" class="result">
          <pre>{{ receitasResult | json }}</pre>
        </div>
      </div>

      <div class="test-section">
        <h3>💸 Despesas</h3>
        <button (click)="testDespesas()" [disabled]="loading">
          Listar Despesas
        </button>
        <button (click)="testCreateDespesa()" [disabled]="loading">
          Criar Despesa
        </button>
        <div *ngIf="despesasResult" class="result">
          <pre>{{ despesasResult | json }}</pre>
        </div>
      </div>

      <div class="test-section">
        <h3>📂 Categorias</h3>
        <button (click)="testCategorias()" [disabled]="loading">
          Listar Categorias
        </button>
        <button (click)="testCreateCategoria()" [disabled]="loading">
          Criar Categoria
        </button>
        <div *ngIf="categoriasResult" class="result">
          <pre>{{ categoriasResult | json }}</pre>
        </div>
      </div>

      <div class="test-section">
        <h3>📅 Meses</h3>
        <button (click)="testMeses()" [disabled]="loading">Listar Meses</button>
        <div *ngIf="mesesResult" class="result">
          <pre>{{ mesesResult | json }}</pre>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <p>⏳ Carregando...</p>
      </div>

      <div *ngIf="error" class="error">
        <p>❌ Erro: {{ error }}</p>
      </div>
    </div>
  `,
    styles: [
        `
      .api-test-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        font-family: Arial, sans-serif;
      }

      .test-section {
        margin-bottom: 30px;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
      }

      .test-section h3 {
        margin-top: 0;
        color: #333;
      }

      button {
        margin: 5px;
        padding: 10px 15px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      button:hover:not(:disabled) {
        background-color: #0056b3;
      }

      button:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
      }

      .result {
        margin-top: 15px;
        padding: 10px;
        background-color: #e9ecef;
        border-radius: 4px;
        max-height: 300px;
        overflow-y: auto;
      }

      .result pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .loading {
        text-align: center;
        padding: 20px;
        color: #007bff;
      }

      .error {
        padding: 15px;
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        margin-top: 20px;
      }
    `,
    ],
    standalone: false
})
export class ApiTestComponent implements OnInit {
  loading = false;
  error: string | null = null;

  authResult: any = null;
  metasResult: any = null;
  receitasResult: any = null;
  despesasResult: any = null;
  categoriasResult: any = null;
  mesesResult: any = null;

  constructor(
    private metasService: MetasService,
    private receitasService: ReceitasService,
    private despesasService: DespesasService,
    private categoriasService: CategoriasService,
    private mesesService: MesesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('🧪 Componente de teste de API inicializado');
  }

  private setLoading(loading: boolean): void {
    this.loading = loading;
    this.error = null;
  }

  // Testes de Autenticação
  testLogin(): void {
    this.setLoading(true);
    this.authService
      .login({
        email: 'teste@exemplo.com',
        senha: '123456',
      })
      .subscribe({
        next: (result) => {
          this.authResult = result;
          this.setLoading(false);
        },
        error: (error) => {
          this.error = error.message || 'Erro no login';
          this.setLoading(false);
        },
      });
  }

  testRegister(): void {
    this.setLoading(true);
    this.authService
      .register({
        nome: 'Usuário Teste',
        email: 'teste@exemplo.com',
        senha: '123456',
      })
      .subscribe({
        next: (result) => {
          this.authResult = result;
          this.setLoading(false);
        },
        error: (error) => {
          this.error = error.message || 'Erro no registro';
          this.setLoading(false);
        },
      });
  }

  // Testes de Metas
  testMetas(): void {
    this.setLoading(true);
    this.metasService.getMetas().subscribe({
      next: (result) => {
        this.metasResult = result;
        this.setLoading(false);
      },
      error: (error) => {
        this.error = error.message || 'Erro ao listar metas';
        this.setLoading(false);
      },
    });
  }

  testCreateMeta(): void {
    this.setLoading(true);
    this.metasService
      .createMeta({
        nome: 'Teste Meta',
        valorMeta: 1000,
        valorPorMes: 100,
      })
      .subscribe({
        next: (result) => {
          this.metasResult = result;
          this.setLoading(false);
        },
        error: (error) => {
          this.error = error.message || 'Erro ao criar meta';
          this.setLoading(false);
        },
      });
  }

  // Testes de Receitas
  testReceitas(): void {
    this.setLoading(true);
    this.receitasService.getReceitas().subscribe({
      next: (result) => {
        this.receitasResult = result;
        this.setLoading(false);
      },
      error: (error) => {
        this.error = error.message || 'Erro ao listar receitas';
        this.setLoading(false);
      },
    });
  }

  testCreateReceita(): void {
    this.setLoading(true);
    this.receitasService
      .createReceita({
        mes_id: 1,
        categoriaId: 1,
        descricao: 'Teste Receita',
        valor: 500,
      })
      .subscribe({
        next: (result) => {
          this.receitasResult = result;
          this.setLoading(false);
        },
        error: (error) => {
          this.error = error.message || 'Erro ao criar receita';
          this.setLoading(false);
        },
      });
  }

  // Testes de Despesas
  testDespesas(): void {
    this.setLoading(true);
    this.despesasService.getDespesas().subscribe({
      next: (result) => {
        this.despesasResult = result;
        this.setLoading(false);
      },
      error: (error) => {
        this.error = error.message || 'Erro ao listar despesas';
        this.setLoading(false);
      },
    });
  }

  testCreateDespesa(): void {
    this.setLoading(true);
    this.despesasService
      .createDespesa({
        mes_id: 1,
        categoriaId: 3,
        descricao: 'Teste Despesa',
        valor: 200,
      })
      .subscribe({
        next: (result) => {
          this.despesasResult = result;
          this.setLoading(false);
        },
        error: (error) => {
          this.error = error.message || 'Erro ao criar despesa';
          this.setLoading(false);
        },
      });
  }

  // Testes de Categorias
  testCategorias(): void {
    this.setLoading(true);
    this.categoriasService.getCategorias().subscribe({
      next: (result) => {
        this.categoriasResult = result;
        this.setLoading(false);
      },
      error: (error) => {
        this.error = error.message || 'Erro ao listar categorias';
        this.setLoading(false);
      },
    });
  }

  testCreateCategoria(): void {
    this.setLoading(true);
    this.categoriasService
      .createCategoria({
        nome: 'Teste Categoria',
        tipo: 'receita',
        descricao: 'Categoria de teste',
      })
      .subscribe({
        next: (result) => {
          this.categoriasResult = result;
          this.setLoading(false);
        },
        error: (error) => {
          this.error = error.message || 'Erro ao criar categoria';
          this.setLoading(false);
        },
      });
  }

  // Testes de Meses
  testMeses(): void {
    this.setLoading(true);
    this.mesesService.getMeses().subscribe({
      next: (result) => {
        this.mesesResult = result;
        this.setLoading(false);
      },
      error: (error) => {
        this.error = error.message || 'Erro ao listar meses';
        this.setLoading(false);
      },
    });
  }
}
