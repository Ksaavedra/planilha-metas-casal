import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import * as echarts from 'echarts';
import { Investimento } from '@core/interfaces/investimentos/investimentos';
import {
  TIPOS_INVESTIMENTO_OPCOES,
  iconTipoInvestimento,
  labelTipoInvestimento,
} from '@core/constants/investimentos-tipos.constant';
import { InvestimentosService } from '@core/services/investimentos/investimentos.service';
import {
  calcularResumoInvestimentos,
  statusInvestimentoClasse,
  statusInvestimentoLabel,
} from '@core/utils/investimentos.util';
import {
  AdicionarInvestimentoDialogComponent,
  AdicionarInvestimentoDialogData,
} from '../../components/adicionar-investimento-dialog/adicionar-investimento-dialog.component';
import { ConfirmModalComponent } from 'shared/components/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from 'shared/components/success-modal/success-modal.component';

const ANO_MIN = 2020;
const MESES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

@Component({
  selector: 'app-investimentos-page',
  templateUrl: './investimentos-page.component.html',
  styleUrls: ['./investimentos-page.component.scss'],
  standalone: false,
})
export class InvestimentosPageComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('chartPatrimonio') chartPatrimonio!: ElementRef<HTMLDivElement>;
  @ViewChild('chartRendimento') chartRendimento!: ElementRef<HTMLDivElement>;
  @ViewChild('chartPizza') chartPizza!: ElementRef<HTMLDivElement>;
  readonly tiposOpcoes = TIPOS_INVESTIMENTO_OPCOES;
  readonly labelTipo = labelTipoInvestimento;
  readonly iconTipo = iconTipoInvestimento;
  readonly statusLabel = statusInvestimentoLabel;
  readonly statusClasse = statusInvestimentoClasse;

  visaoInvestimentos: 'lista' | 'exemplos' | 'usuario' = 'lista';
  investimentos: Investimento[] = [];
  carregando = false;
  erroCarregar: string | null = null;
  anoSelecionado = new Date().getFullYear();
  tipoFiltro = '';
  readonly anoAtual = new Date().getFullYear();

  readonly tamanhoPagina = 5;
  paginaTabela = 1;

  private charts: echarts.ECharts[] = [];

  constructor(
    private investimentosService: InvestimentosService,
    private dialog: MatDialog,
  ) {}

  get resumo() {
    return calcularResumoInvestimentos(this.investimentos);
  }

  get exibirAvisoVazio(): boolean {
    return !this.carregando && this.investimentos.length === 0;
  }

  get ocultarConteudo(): boolean {
    return this.exibirAvisoVazio;
  }

  get estaEmAnoFuturo(): boolean {
    return this.anoSelecionado > this.anoAtual;
  }

  get exibirBotaoVoltarAnoAtual(): boolean {
    return (
      this.exibirAvisoVazio && this.anoSelecionado !== this.anoAtual
    );
  }

  get podeAnoAnterior(): boolean {
    return this.anoSelecionado > ANO_MIN;
  }

  get podeProximoAno(): boolean {
    return true;
  }

  get investimentosPaginados(): Investimento[] {
    const start = (this.paginaTabela - 1) * this.tamanhoPagina;
    return this.investimentos.slice(start, start + this.tamanhoPagina);
  }

  get totalPaginasTabela(): number {
    const n = this.investimentos.length;
    return n === 0 ? 0 : Math.ceil(n / this.tamanhoPagina);
  }

  get exibirPaginacaoTabela(): boolean {
    return this.investimentos.length > this.tamanhoPagina;
  }

  get exibindoDeTabela(): number {
    if (!this.investimentos.length) return 0;
    return (this.paginaTabela - 1) * this.tamanhoPagina + 1;
  }

  get exibindoAteTabela(): number {
    return (
      (this.paginaTabela - 1) * this.tamanhoPagina +
      this.investimentosPaginados.length
    );
  }

  paginaAnteriorTabela(): void {
    if (this.paginaTabela > 1) {
      this.paginaTabela--;
    }
  }

  paginaProximaTabela(): void {
    if (this.paginaTabela < this.totalPaginasTabela) {
      this.paginaTabela++;
    }
  }

  ngOnInit(): void {
    this.anoSelecionado = this.investimentosService.getAnoSelecionado();
    this.carregar();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.atualizarGraficos(), 0);
  }

  ngOnDestroy(): void {
    this.charts.forEach((c) => c.dispose());
    this.charts = [];
  }

  carregar(): void {
    this.carregando = true;
    this.erroCarregar = null;
    this.investimentosService
      .getInvestimentos({
        ano: this.anoSelecionado,
        tipo: this.tipoFiltro || undefined,
      })
      .subscribe({
        next: (lista) => {
          this.investimentos = lista;
          this.paginaTabela = 1;
          this.normalizarIndicePagina();
          this.carregando = false;
          setTimeout(() => this.atualizarGraficos(), 0);
        },
        error: (err: unknown) => {
          this.carregando = false;
          this.erroCarregar = this.mensagemErroHttp(err);
          this.investimentos = [];
          this.paginaTabela = 1;
        },
      });
  }

  onTipoFiltroChange(): void {
    this.carregar();
  }

  selecionarVisao(visao: 'lista' | 'exemplos' | 'usuario'): void {
    this.visaoInvestimentos = visao;
    if (visao === 'lista') {
      setTimeout(() => this.atualizarGraficos(), 0);
    }
  }

  anoAnterior(): void {
    if (!this.podeAnoAnterior) return;
    this.anoSelecionado -= 1;
    this.persistirAnoECarregar();
  }

  proximoAno(): void {
    this.anoSelecionado += 1;
    this.persistirAnoECarregar();
  }

  voltarParaAnoAtual(): void {
    this.anoSelecionado = this.anoAtual;
    this.persistirAnoECarregar();
  }

  private persistirAnoECarregar(): void {
    this.investimentosService.setAnoSelecionado(this.anoSelecionado);
    this.carregar();
  }

  private normalizarIndicePagina(): void {
    const total = this.totalPaginasTabela;
    if (total === 0) {
      this.paginaTabela = 1;
    } else if (this.paginaTabela > total) {
      this.paginaTabela = total;
    }
  }

  abrirModalAdicionar(): void {
    this.abrirDialog(null);
  }

  editar(inv: Investimento): void {
    this.abrirDialog(inv);
  }

  private abrirDialog(investimento: Investimento | null): void {
    const data: AdicionarInvestimentoDialogData = {
      investimento,
      ano: this.anoSelecionado,
    };
    const ref = this.dialog.open(AdicionarInvestimentoDialogComponent, {
      width: 'min(520px, 96vw)',
      maxHeight: '90vh',
      data,
      autoFocus: 'dialog',
    });
    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.carregar();
        this.dialog.open(SuccessModalComponent, {
          width: 'min(420px, 96vw)',
          data: {
            title: investimento ? 'Investimento atualizado!' : 'Investimento adicionado!',
            message: 'Os dados foram salvos com sucesso.',
            confirmText: 'OK',
          },
        });
      }
    });
  }

  confirmarExcluir(inv: Investimento): void {
    const ref = this.dialog.open(ConfirmModalComponent, {
      width: 'min(420px, 96vw)',
      data: {
        title: 'Excluir investimento',
        message: `Deseja excluir "${inv.descricao}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
      },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.investimentosService.deleteInvestimento(inv.id).subscribe({
          next: () => this.carregar(),
        });
      }
    });
  }

  lucroPositivo(valor: number): boolean {
    return valor >= 0;
  }

  progressoPatrimonio(inv: Investimento): number {
    if (!inv.valorInvestido || inv.valorInvestido <= 0) return 0;
    return Math.min(100, (inv.valorAtual / inv.valorInvestido) * 100);
  }

  tooltipRentabilidade =
    'Rentabilidade = (patrimônio atual − valor investido) ÷ valor investido × 100';

  private atualizarGraficos(): void {
    if (this.ocultarConteudo) {
      return;
    }
    this.initChart(
      this.chartPatrimonio,
      this.opcaoGraficoPatrimonio(),
    );
    this.initChart(this.chartRendimento, this.opcaoGraficoRendimento());
    this.initChart(this.chartPizza, this.opcaoGraficoPizza());
  }

  private initChart(
    ref: ElementRef<HTMLDivElement> | undefined,
    option: Record<string, unknown>,
  ): void {
    if (!ref?.nativeElement) return;
    const existente = echarts.getInstanceByDom(ref.nativeElement);
    const chart = existente ?? echarts.init(ref.nativeElement);
    chart.setOption(option, { notMerge: true });
    if (!this.charts.includes(chart)) {
      this.charts.push(chart);
    }
  }

  private opcaoGraficoPatrimonio(): Record<string, unknown> {
    const acumulado: number[] = [];
    let total = 0;
    for (let m = 0; m < 12; m++) {
      const aporteMes = this.investimentos.reduce(
        (s, i) => s + (i.aporteMensal || 0),
        0,
      );
      total += aporteMes;
      const base = this.resumo.totalInvestido;
      acumulado.push(
        Math.round((base + total * ((m + 1) / 12)) * 100) / 100,
      );
    }
    return {
      title: { text: 'Evolução do patrimônio', left: 'center', textStyle: { fontSize: 13 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 48, right: 16, bottom: 32, top: 48 },
      xAxis: { type: 'category', data: MESES },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'line',
          smooth: true,
          data: acumulado,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(139, 92, 246, 0.35)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.02)' },
            ]),
          },
          lineStyle: { color: '#7c3aed', width: 2 },
          itemStyle: { color: '#7c3aed' },
        },
      ],
    };
  }

  private opcaoGraficoRendimento(): Record<string, unknown> {
    const aporteTotal = this.investimentos.reduce(
      (s, i) => s + (i.aporteMensal || 0),
      0,
    );
    const mensal = MESES.map(() =>
      Math.round((aporteTotal + this.resumo.lucroAcumulado / 12) * 100) / 100,
    );
    return {
      title: { text: 'Rendimento mensal (estimado)', left: 'center', textStyle: { fontSize: 13 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 48, right: 16, bottom: 32, top: 48 },
      xAxis: { type: 'category', data: MESES },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: mensal,
          itemStyle: {
            color: '#8b5cf6',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }

  private mensagemErroHttp(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Servidor indisponível. Inicie o backend: cd backend && npm start';
      }
      if (err.status === 404) {
        return 'API de investimentos não encontrada. Reinicie o servidor backend (pare e rode npm start na pasta backend).';
      }
    }
    return 'Não foi possível carregar os investimentos.';
  }

  private opcaoGraficoPizza(): Record<string, unknown> {
    const porTipo = new Map<string, number>();
    this.investimentos.forEach((i) => {
      const k = labelTipoInvestimento(i.tipoInvestimento);
      porTipo.set(k, (porTipo.get(k) ?? 0) + (i.valorAtual || 0));
    });
    const data = [...porTipo.entries()].map(([name, value]) => ({ name, value }));
    return {
      title: { text: 'Patrimônio por categoria', left: 'center', textStyle: { fontSize: 13 } },
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          data,
          label: { fontSize: 11 },
          color: [
            '#7c3aed',
            '#8b5cf6',
            '#a78bfa',
            '#c4b5fd',
            '#22c55e',
            '#0ea5e9',
            '#f59e0b',
            '#ec4899',
            '#64748b',
          ],
        },
      ],
    };
  }
}
