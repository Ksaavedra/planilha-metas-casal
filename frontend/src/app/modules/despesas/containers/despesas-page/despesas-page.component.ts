import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AdicionarDespesaDialogComponent,
  AdicionarDespesaDialogData,
} from '../../components/adicionar-despesa-dialog/adicionar-despesa-dialog.component';
import {
  Despesa,
  DespesasService,
  NaturezaDespesa,
} from 'app/core/services/despesas/despesas.service';

@Component({
  selector: 'app-despesas-page',
  templateUrl: './despesas-page.component.html',
  styleUrls: ['./despesas-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DespesasPageComponent implements OnInit {
  readonly tituloSecundario = 'Tudo que você gasta no dia a dia';

  /** Aba: tabelas do mês ou dicas (fixa vs variável). */
  visaoDespesas: 'lista' | 'exemplos' = 'lista';

  /** Categorias de exemplo para lançar como despesa fixa. */
  readonly exemplosCategoriasFixas: readonly string[] = [
    'Aluguel / financiamento',
    'Internet / celular (plano mensal)',
    'Condomínio / IPTU',
    'Plano de saúde / dentista (convênio)',
    'Escola / cursos / idiomas',
    'Assinaturas (Netflix, streaming, apps, jornal, etc.)',
    'Seguros (vida, residência, carro, etc.)',
    'Carro (parcela, seguro, IPVA parcelado, licenciamento)',
    'Pets (convênio / plano de saúde animal)',
    'Academia / esporte / clube',
    'Empregada / diarista (valor fixo mensal)',
  ];

  /** Categorias de exemplo para lançar como despesa variável. */
  readonly exemplosCategoriasVariaveis: readonly string[] = [
    'Mercado',
    'Transporte (combustível, Uber, estacionamento, pedágio)',
    'Lazer / compras / bares e shows',
    'Energia, água e gás',
    'Pets (ração, tosa, pet shop, emergências, fora do convênio)',
    'Cuidados pessoais (cabeleireiro, estética, barbearia, etc.)',
    'Manutenção da casa, do carro e eletro (oficina, consertos)',
    'Farmácia e suplementos',
    'Presentes e datas comemorativas',
    'Viagem / hotel / Airbnb',
    'Restaurante / delivery / iFood',
    'Roupas, calçados e acessórios',
    'Educação avulsa (livros, material escolar, workshop pontual)',
  ];

  mesAtual: Date = new Date();
  despesas: Despesa[] = [];
  loading = false;
  erroCarregar: string | null = null;

  meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  constructor(
    private despesasService: DespesasService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
  ) {}

  get nomeMesAtual(): string {
    const m = this.mesAtual.getMonth();
    const a = this.mesAtual.getFullYear();
    return `${this.meses[m]} ${a}`;
  }

  get despesasFixas(): Despesa[] {
    return this.despesas.filter((d) => d.natureza === 'fixa');
  }

  get despesasVariaveis(): Despesa[] {
    return this.despesas.filter((d) => d.natureza === 'variavel');
  }

  get totalFixas(): number {
    return this.despesasService.calcularTotalDespesas(this.despesasFixas);
  }

  get totalVariaveis(): number {
    return this.despesasService.calcularTotalDespesas(this.despesasVariaveis);
  }

  get totalGeral(): number {
    return this.despesasService.calcularTotalDespesas(this.despesas);
  }

  get anoRef(): number {
    return this.mesAtual.getFullYear();
  }

  get mesRef(): number {
    return this.mesAtual.getMonth() + 1;
  }

  ngOnInit(): void {
    this.carregar();
  }

  mesAnterior(): void {
    const d = new Date(this.mesAtual);
    d.setMonth(d.getMonth() - 1);
    this.mesAtual = d;
    this.carregar();
  }

  proximoMes(): void {
    const d = new Date(this.mesAtual);
    d.setMonth(d.getMonth() + 1);
    this.mesAtual = d;
    this.carregar();
  }

  selecionarVisao(visao: 'lista' | 'exemplos'): void {
    this.visaoDespesas = visao;
    this.cdr.markForCheck();
  }

  abrirModalAdicionarDespesa(): void {
    this.abrirDialogDespesa(null);
  }

  editar(d: Despesa): void {
    this.abrirDialogDespesa(d);
  }

  private abrirDialogDespesa(despesa: Despesa | null): void {
    const data: AdicionarDespesaDialogData = {
      despesa,
      ano: this.anoRef,
      mes: this.mesRef,
    };
    const ref = this.dialog.open(AdicionarDespesaDialogComponent, {
      width: 'min(520px, 96vw)',
      maxHeight: '90vh',
      data,
    });
    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.carregar();
      }
    });
  }

  carregar(): void {
    this.loading = true;
    this.erroCarregar = null;
    this.cdr.markForCheck();
    this.despesasService
      .getDespesas({ ano: this.anoRef, mes: this.mesRef })
      .subscribe({
        next: (rows) => {
          this.despesas = rows;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.despesas = [];
          this.loading = false;
          this.erroCarregar =
            e?.error?.error ||
            e?.message ||
            'Não foi possível carregar despesas.';
          this.cdr.markForCheck();
        },
      });
  }

  excluir(d: Despesa): void {
    if (!confirm(`Excluir "${d.descricao}"?`)) {
      return;
    }
    this.despesasService.deleteDespesa(d.id).subscribe({
      next: () => {
        this.carregar();
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.erroCarregar = e?.error?.error || e?.message || 'Erro ao excluir.';
        this.cdr.markForCheck();
      },
    });
  }

  labelNatureza(n: NaturezaDespesa): string {
    return n === 'fixa' ? 'Fixa' : 'Variável';
  }
}
