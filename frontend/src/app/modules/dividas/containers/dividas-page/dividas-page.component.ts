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
import { Divida, DividaNoMes } from '@core/interfaces/dividas/dividas';
import {
  iconTipoDivida,
  labelTipoDivida,
} from '@core/constants/dividas-tipos.constant';
import { DividasService } from '@core/services/dividas/dividas.service';
import {
  calcularResumoDividasNoMes,
  calcularTotaisTabelaDividasNoMes,
  formatarMoedaGrafico,
  MESES_LABELS_GRAFICO,
  parcelaMensalDivida,
  progressoDivida,
  projetarDividasNoMes,
  projetarEvolucaoRestante,
  projetarPagamentosMensais,
  statusParcelaMesClasse,
  statusParcelaMesLabel,
  totalParcelaMensalPendenteNoMes,
} from '@core/utils/dividas.util';
import {
  AdicionarDividaDialogComponent,
  AdicionarDividaDialogData,
} from '../../components/adicionar-divida-dialog/adicionar-divida-dialog.component';
import { ConfirmModalComponent } from 'shared/components/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from 'shared/components/success-modal/success-modal.component';

@Component({
  selector: 'app-dividas-page',
  templateUrl: './dividas-page.component.html',
  styleUrls: ['./dividas-page.component.scss'],
  standalone: false,
})
export class DividasPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartEvolucao') chartEvolucao!: ElementRef<HTMLDivElement>;
  @ViewChild('chartPagoRestante')
  chartPagoRestante!: ElementRef<HTMLDivElement>;
  @ViewChild('chartCategoria') chartCategoria!: ElementRef<HTMLDivElement>;
  @ViewChild('chartPagamentos') chartPagamentos!: ElementRef<HTMLDivElement>;

  readonly labelTipo = labelTipoDivida;
  readonly iconTipo = iconTipoDivida;
  readonly statusMesLabel = statusParcelaMesLabel;
  readonly statusMesClasse = statusParcelaMesClasse;
  readonly progresso = progressoDivida;
  readonly parcelaMensal = parcelaMensalDivida;

  dividas: DividaNoMes[] = [];
  private dividasAno: Divida[] = [];
  private anoCarregado: number | null = null;
  carregando = false;
  erroCarregar: string | null = null;
  mesAtual: Date = new Date();

  readonly meses = [
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

  readonly tamanhoPagina = 5;
  paginaTabela = 1;

  private charts: echarts.ECharts[] = [];

  constructor(
    private dividasService: DividasService,
    private dialog: MatDialog,
  ) {}

  get resumo() {
    return calcularResumoDividasNoMes(this.dividas);
  }

  get totaisTabela() {
    return calcularTotaisTabelaDividasNoMes(this.dividas);
  }

  get exibirAvisoVazio(): boolean {
    return !this.carregando && this.dividas.length === 0;
  }

  get ocultarConteudo(): boolean {
    return this.exibirAvisoVazio;
  }

  get nomeMesAtual(): string {
    const m = this.mesAtual.getMonth();
    const a = this.mesAtual.getFullYear();
    return `${this.meses[m]} ${a}`;
  }

  get anoRef(): number {
    return this.mesAtual.getFullYear();
  }

  get mesRef(): number {
    return this.mesAtual.getMonth() + 1;
  }

  get mesAtualLabel(): string {
    const hoje = new Date();
    return `${this.meses[hoje.getMonth()]} ${hoje.getFullYear()}`;
  }

  get estaEmMesFuturo(): boolean {
    const hoje = new Date();
    const ref = new Date(
      this.mesAtual.getFullYear(),
      this.mesAtual.getMonth(),
      1,
    );
    const atual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return ref > atual;
  }

  get exibirBotaoVoltarMesAtual(): boolean {
    if (!this.exibirAvisoVazio) return false;
    const hoje = new Date();
    return (
      this.mesAtual.getFullYear() !== hoje.getFullYear() ||
      this.mesAtual.getMonth() !== hoje.getMonth()
    );
  }

  get dividasPaginadas(): Divida[] {
    const start = (this.paginaTabela - 1) * this.tamanhoPagina;
    return this.dividas.slice(start, start + this.tamanhoPagina);
  }

  get totalPaginasTabela(): number {
    const n = this.dividas.length;
    return n === 0 ? 0 : Math.ceil(n / this.tamanhoPagina);
  }

  get exibirPaginacaoTabela(): boolean {
    return this.dividas.length > this.tamanhoPagina;
  }

  get exibindoDeTabela(): number {
    if (!this.dividas.length) return 0;
    return (this.paginaTabela - 1) * this.tamanhoPagina + 1;
  }

  get exibindoAteTabela(): number {
    return (
      (this.paginaTabela - 1) * this.tamanhoPagina +
      this.dividasPaginadas.length
    );
  }

  paginaAnteriorTabela(): void {
    if (this.paginaTabela > 1) this.paginaTabela--;
  }

  paginaProximaTabela(): void {
    if (this.paginaTabela < this.totalPaginasTabela) this.paginaTabela++;
  }

  ngOnInit(): void {
    this.mesAtual = this.dividasService.getMesReferencia();
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
    this.dividasService.getDividas(this.anoRef).subscribe({
      next: (lista) => {
        this.dividasAno = lista;
        this.anoCarregado = this.anoRef;
        this.aplicarFiltroMes();
        this.carregando = false;
        setTimeout(() => this.atualizarGraficos(), 0);
      },
      error: (err: unknown) => {
        this.carregando = false;
        this.erroCarregar = this.mensagemErroHttp(err);
        this.dividasAno = [];
        this.anoCarregado = null;
        this.dividas = [];
        this.paginaTabela = 1;
      },
    });
  }

  mesAnterior(): void {
    const d = new Date(this.mesAtual);
    d.setMonth(d.getMonth() - 1);
    this.mesAtual = d;
    this.persistirMesECarregar();
  }

  proximoMes(): void {
    const d = new Date(this.mesAtual);
    d.setMonth(d.getMonth() + 1);
    this.mesAtual = d;
    this.persistirMesECarregar();
  }

  voltarParaMesAtual(): void {
    const hoje = new Date();
    this.mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.persistirMesECarregar();
  }

  private persistirMesECarregar(): void {
    this.dividasService.setMesReferencia(this.mesAtual);
    if (this.anoCarregado === this.anoRef) {
      this.aplicarFiltroMes();
      setTimeout(() => this.atualizarGraficos(), 0);
      return;
    }
    this.carregar();
  }

  private aplicarFiltroMes(): void {
    this.dividas = projetarDividasNoMes(
      this.dividasAno,
      this.anoRef,
      this.mesRef,
    );
    this.paginaTabela = 1;
    this.normalizarIndicePagina();
  }

  private normalizarIndicePagina(): void {
    const total = this.totalPaginasTabela;
    if (total === 0) this.paginaTabela = 1;
    else if (this.paginaTabela > total) this.paginaTabela = total;
  }

  abrirModalAdicionar(): void {
    this.abrirDialog(null);
  }

  editar(d: DividaNoMes): void {
    this.abrirDialog(d);
  }

  private abrirDialog(divida: DividaNoMes | null): void {
    const data: AdicionarDividaDialogData = {
      divida,
      ano: this.anoRef,
      mes: this.mesRef,
    };
    const ref = this.dialog.open(AdicionarDividaDialogComponent, {
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
            title: divida ? 'Dívida atualizada!' : 'Dívida adicionada!',
            message: 'Os dados foram salvos com sucesso.',
            confirmText: 'OK',
          },
        });
      }
    });
  }

  confirmarExcluir(d: Divida): void {
    const ref = this.dialog.open(ConfirmModalComponent, {
      width: 'min(420px, 96vw)',
      data: {
        title: 'Excluir dívida',
        message: `Deseja excluir "${d.objetivo}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
      },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.dividasService.deleteDivida(d.id).subscribe({
          next: () => this.carregar(),
        });
      }
    });
  }

  private atualizarGraficos(): void {
    if (this.ocultarConteudo) return;
    this.initChart(this.chartEvolucao, this.opcaoGraficoEvolucao());
    this.initChart(this.chartPagoRestante, this.opcaoGraficoPagoRestante());
    this.initChart(this.chartCategoria, this.opcaoGraficoCategoria());
    this.initChart(this.chartPagamentos, this.opcaoGraficoPagamentos());
  }

  private initChart(
    ref: ElementRef<HTMLDivElement> | undefined,
    option: Record<string, unknown>,
  ): void {
    if (!ref?.nativeElement) return;
    const existente = echarts.getInstanceByDom(ref.nativeElement);
    const chart = existente ?? echarts.init(ref.nativeElement);
    chart.setOption(option, { notMerge: true });
    if (!this.charts.includes(chart)) this.charts.push(chart);
  }

  private eixoMesesGrafico() {
    return {
      type: 'category' as const,
      data: [...MESES_LABELS_GRAFICO],
      axisLabel: {
        rotate: 40,
        fontSize: 10,
        color: '#64748b',
        interval: 0,
      },
    };
  }

  private eixoValorGrafico() {
    return {
      type: 'value' as const,
      axisLabel: {
        formatter: (v: number) => formatarMoedaGrafico(v),
        fontSize: 10,
        color: '#64748b',
      },
    };
  }

  private tooltipEixoValor() {
    return {
      trigger: 'axis' as const,
      valueFormatter: (v: number) => formatarMoedaGrafico(Number(v) || 0),
    };
  }

  private opcaoGraficoEvolucao(): Record<string, unknown> {
    const parcelaMensal = totalParcelaMensalPendenteNoMes(this.dividas);
    const dados = projetarEvolucaoRestante(
      this.resumo.valorRestante,
      parcelaMensal,
    );
    return {
      title: {
        text: 'Evolução da dívida',
        left: 'center',
        textStyle: { fontSize: 13 },
      },
      tooltip: this.tooltipEixoValor(),
      grid: { left: 56, right: 16, bottom: 56, top: 48 },
      xAxis: this.eixoMesesGrafico(),
      yAxis: this.eixoValorGrafico(),
      series: [
        {
          type: 'line',
          smooth: true,
          data: dados,
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

  private opcaoGraficoPagoRestante(): Record<string, unknown> {
    return {
      title: {
        text: 'Total pago x restante',
        left: 'center',
        textStyle: { fontSize: 13 },
      },
      tooltip: {
        trigger: 'item',
        valueFormatter: (v: number) => formatarMoedaGrafico(Number(v) || 0),
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          data: [
            { name: 'Pago', value: this.resumo.totalPago },
            { name: 'Restante', value: this.resumo.valorRestante },
          ],
          color: ['#22c55e', '#f59e0b'],
          label: { fontSize: 11 },
        },
      ],
    };
  }

  private opcaoGraficoCategoria(): Record<string, unknown> {
    const porTipo = new Map<string, number>();
    this.dividas.forEach((d) => {
      const k = labelTipoDivida(d.tipoDivida);
      porTipo.set(k, (porTipo.get(k) ?? 0) + (d.valorRestante || 0));
    });
    const data = [...porTipo.entries()].map(([name, value]) => ({
      name,
      value,
    }));
    return {
      title: {
        text: 'Dívidas por categoria',
        left: 'center',
        textStyle: { fontSize: 13 },
      },
      tooltip: {
        trigger: 'item',
        valueFormatter: (v: number) => formatarMoedaGrafico(Number(v) || 0),
      },
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
            '#ec4899',
            '#f59e0b',
            '#64748b',
          ],
        },
      ],
    };
  }

  private opcaoGraficoPagamentos(): Record<string, unknown> {
    const parcelaMensal = totalParcelaMensalPendenteNoMes(this.dividas);
    const mensal = projetarPagamentosMensais(parcelaMensal);
    return {
      title: {
        text: 'Evolução mensal dos pagamentos',
        left: 'center',
        textStyle: { fontSize: 13 },
      },
      tooltip: this.tooltipEixoValor(),
      grid: { left: 56, right: 16, bottom: 56, top: 48 },
      xAxis: this.eixoMesesGrafico(),
      yAxis: this.eixoValorGrafico(),
      series: [
        {
          type: 'bar',
          data: mensal,
          itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] },
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
        return 'API de dívidas não encontrada. Reinicie o servidor backend.';
      }
    }
    return 'Não foi possível carregar as dívidas.';
  }
}
