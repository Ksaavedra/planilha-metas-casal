import { Component, OnInit } from '@angular/core';
import { MetasService } from '../../core/services/metas/metas.service';

@Component({
    selector: 'app-teste-metas',
    template: `
    <div class="teste-metas-container">
      <h2>🎯 Teste MetasService - Console Logs</h2>

      <div class="test-buttons">
        <button (click)="testarListarMetas()" [disabled]="loading">
          📋 Listar Metas
        </button>

        <button (click)="testarCriarMeta()" [disabled]="loading">
          ➕ Criar Meta
        </button>

        <button (click)="testarBuscarMeta()" [disabled]="loading">
          🔍 Buscar Meta ID 1
        </button>

        <button (click)="limparConsole()">🗑️ Limpar Console</button>
      </div>

      <div class="instructions">
        <h3>📱 Como ver os logs:</h3>
        <ol>
          <li>Abra o <strong>DevTools</strong> (F12)</li>
          <li>Vá na aba <strong>Console</strong></li>
          <li>Clique nos botões acima</li>
          <li>Veja os logs detalhados das chamadas da API</li>
        </ol>
      </div>

      <div *ngIf="loading" class="loading">
        <p>⏳ Carregando...</p>
      </div>

      <div *ngIf="resultado" class="resultado">
        <h3>📊 Resultado:</h3>
        <pre>{{ resultado | json }}</pre>
      </div>

      <div *ngIf="erro" class="erro">
        <h3>❌ Erro:</h3>
        <p>{{ erro }}</p>
      </div>
    </div>
  `,
    styles: [
        `
      .teste-metas-container {
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
        font-family: Arial, sans-serif;
      }

      .test-buttons {
        margin: 20px 0;
      }

      button {
        margin: 5px;
        padding: 12px 20px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
      }

      button:hover:not(:disabled) {
        background-color: #0056b3;
      }

      button:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
      }

      .instructions {
        background-color: #e9ecef;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }

      .instructions h3 {
        margin-top: 0;
        color: #495057;
      }

      .instructions ol {
        margin: 10px 0;
      }

      .instructions li {
        margin: 5px 0;
      }

      .loading {
        text-align: center;
        padding: 20px;
        color: #007bff;
      }

      .resultado {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 5px;
        padding: 15px;
        margin: 20px 0;
      }

      .resultado h3 {
        margin-top: 0;
        color: #155724;
      }

      .resultado pre {
        background-color: #f8f9fa;
        padding: 10px;
        border-radius: 3px;
        overflow-x: auto;
      }

      .erro {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 5px;
        padding: 15px;
        margin: 20px 0;
      }

      .erro h3 {
        margin-top: 0;
        color: #721c24;
      }
    `,
    ],
    standalone: false
})
export class TesteMetasComponent implements OnInit {
  loading = false;
  resultado: any = null;
  erro: string | null = null;

  constructor(private metasService: MetasService) {}

  ngOnInit(): void {
    console.log('🧪 TesteMetasComponent inicializado');
    console.log(
      '💡 Abra o DevTools (F12) e vá na aba Console para ver os logs detalhados'
    );
  }

  testarListarMetas(): void {
    this.limparResultados();
    this.loading = true;

    console.log('🎯 Iniciando teste: Listar Metas');

    this.metasService.getMetas().subscribe({
      next: (metas) => {
        this.resultado = metas;
        this.loading = false;
        console.log('✅ Teste concluído: Listar Metas');
      },
      error: (error) => {
        this.erro = error.message || 'Erro ao listar metas';
        this.loading = false;
        console.error('❌ Erro no teste: Listar Metas', error);
      },
    });
  }

  testarCriarMeta(): void {
    this.limparResultados();
    this.loading = true;

    console.log('🎯 Iniciando teste: Criar Meta');

    const novaMeta = {
      nome: 'Meta Teste Console',
      valorMeta: 3000,
      valorPorMes: 300,
      mesesNecessarios: 10,
    };

    this.metasService.createMeta(novaMeta).subscribe({
      next: (meta) => {
        this.resultado = meta;
        this.loading = false;
        console.log('✅ Teste concluído: Criar Meta');
      },
      error: (error) => {
        this.erro = error.message || 'Erro ao criar meta';
        this.loading = false;
        console.error('❌ Erro no teste: Criar Meta', error);
      },
    });
  }

  testarBuscarMeta(): void {
    this.limparResultados();
    this.loading = true;

    console.log('🎯 Iniciando teste: Buscar Meta ID 1');

    this.metasService.getMeta(1).subscribe({
      next: (meta) => {
        this.resultado = meta;
        this.loading = false;
        console.log('✅ Teste concluído: Buscar Meta');
      },
      error: (error) => {
        this.erro = error.message || 'Erro ao buscar meta';
        this.loading = false;
        console.error('❌ Erro no teste: Buscar Meta', error);
      },
    });
  }

  limparConsole(): void {
    console.clear();
    console.log('🗑️ Console limpo!');
    console.log('🧪 TesteMetasComponent - Console limpo');
  }

  private limparResultados(): void {
    this.resultado = null;
    this.erro = null;
  }
}
