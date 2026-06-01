import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as echarts from 'echarts';
import { ReceitasService } from '../../../../core/services/receitas/receitas.service';
import { DespesasService } from '../../../../core/services/despesas/despesas.service';
import { CartoesService } from '../../../../core/services/cartoes/cartoes.service';
import { Despesa } from '@app/core/interfaces/despesas/despesas';
import { Receita } from '@app/core/interfaces/receitas/receitas';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { RelatorioGraficosComponent } from '../relatorio-graficos/relatorio-graficos.component';

type EChartsOption = Record<string, unknown>;

const ANOS_COMPARACAO: readonly number[] = [
  2020, 2021, 2022, 2023, 2024, 2025, 2026,
];
const ANO_REFERENCIA_MIN = ANOS_COMPARACAO[0];

@Component({
  selector: 'app-relatorio-page',
  templateUrl: './relatorio-page.component.html',
  styleUrls: ['./relatorio-page.component.scss'],
  standalone: false,
})
export class RelatorioPageComponent implements AfterViewInit {
  @ViewChild('chartSaldo') chartSaldo?: ElementRef<HTMLElement>;
  @ViewChild('chartReceitasDespesas')
  chartReceitasDespesas?: ElementRef<HTMLElement>;
  @ViewChild('chartDividasInvestimentos')
  chartDividasInvestimentos?: ElementRef<HTMLElement>;
  @ViewChild(RelatorioGraficosComponent)
  graficosComponent?: RelatorioGraficosComponent;

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

  readonly anosComparacao = ANOS_COMPARACAO;
  readonly anoAtual = new Date().getFullYear();
  anoSelecionado = this.anoAtual;
  anosSaldoSelecionados: number[] = [this.anoAtual];
  anosSaldoComparacao: number[] = [this.anoAtual];
  readonly limiteAnosAdicionaisGraficoSaldo = 5;
  readonly limiteAnosGraficoSaldo = this.limiteAnosAdicionaisGraficoSaldo + 1;
  private comparandoGraficoSaldo = false;

  visaoRelatorio: 'resumo' | 'categorias' | 'guia' | 'graficos' = 'resumo';

  naturezaReceitaLinhas: {
    id: 'fixa' | 'variavel';
    label: string;
    valores: number[];
    total: number;
  }[] = [];

  receitasPorTipoLinhas: {
    tipo: string;
    valores: number[];
    total: number;
  }[] = [];

  naturezaDespesaLinhas: {
    id: 'fixa' | 'variavel';
    label: string;
    valores: number[];
    total: number;
  }[] = [];

  despesasPorCategoriaLinhas: {
    categoria: string;
    valores: number[];
    total: number;
  }[] = [];

  dadosReceitas: number[] = [];
  dadosDespesas: number[] = [];
  dadosCartaoCredito: number[] = [];
  dadosDividas: number[] = [];
  dadosInvestimentos: number[] = [];
  dadosTotal: number[] = [];
  totalReceitas = 0;
  totalDespesas = 0;
  totalCartaoCredito = 0;
  totalDividas = 0;
  totalInvestimentos = 0;

  dadosPorAno: {
    [ano: number]: {
      receitas: number[];
      despesas: number[];
      cartaoCredito: number[];
      dividas: number[];
      investimentos: number[];
    };
  } = {
    2020: {
      receitas: [
        3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500,
      ],
      despesas: [800, 850, 900, 750, 800, 900, 850, 800, 750, 900, 850, 800],
      cartaoCredito: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      dividas: [
        1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200,
      ],
      investimentos: [
        500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,
      ],
    },
    2021: {
      receitas: [
        4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000,
      ],
      despesas: [900, 950, 1000, 850, 900, 1000, 950, 900, 850, 1000, 950, 900],
      cartaoCredito: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      dividas: [
        1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500,
      ],
      investimentos: [
        600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600,
      ],
    },
    2022: {
      receitas: [
        4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500,
      ],
      despesas: [
        1000, 1050, 1100, 950, 1000, 1100, 1050, 1000, 950, 1100, 1050, 1000,
      ],
      cartaoCredito: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      dividas: [
        1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800,
      ],
      investimentos: [
        700, 700, 700, 700, 700, 700, 700, 700, 700, 700, 700, 700,
      ],
    },
    2023: {
      receitas: [
        4800, 4800, 4800, 4800, 4800, 4800, 4800, 4800, 4800, 4800, 4800, 4800,
      ],
      despesas: [
        1100, 1150, 1200, 1050, 1100, 1200, 1150, 1100, 1050, 1200, 1150, 1100,
      ],
      cartaoCredito: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      dividas: [
        2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000,
      ],
      investimentos: [
        800, 800, 800, 800, 800, 800, 800, 800, 800, 800, 800, 800,
      ],
    },
    2024: {
      receitas: [
        4990.85, 16934.41, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000,
        5000,
      ],
      despesas: [211.12, 72.51, 19.9, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      cartaoCredito: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      dividas: [4263.65, 0, 0, 0, 0, 6006.96, 0, 0, 0, 0, 0, 2477.57],
      investimentos: [24168.68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    2025: {
      receitas: [
        5500, 5500, 5500, 5500, 5500, 5500, 5500, 5500, 5500, 5500, 5500, 5500,
      ],
      despesas: [
        1300, 1350, 1400, 1250, 1300, 1400, 1350, 1300, 1250, 1400, 1350, 1300,
      ],
      cartaoCredito: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      dividas: [
        2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500,
      ],
      investimentos: [
        1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200,
      ],
    },
    /** Receitas por mês: preenchido pela API; demais séries fixas em 0 (mock). */
    2026: {
      receitas: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      despesas: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      cartaoCredito: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      dividas: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      investimentos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  };

  ngAfterViewInit(): void {
    if (this.visaoRelatorio === 'graficos') {
      setTimeout(() => this.reinicializarGraficosAposVoltarResumo(), 0);
    }
  }

  private getGraphicContainers() {
    const isGraficos = this.visaoRelatorio === 'graficos';
    return {
      chartSaldo: isGraficos
        ? this.graficosComponent?.chartSaldo
        : this.chartSaldo,
      chartReceitasDespesas: isGraficos
        ? this.graficosComponent?.chartReceitasDespesas
        : this.chartReceitasDespesas,
      chartReceitasFixasVariaveis: isGraficos
        ? this.graficosComponent?.chartReceitasFixasVariaveis
        : undefined,
      chartDespesasCategoria: isGraficos
        ? this.graficosComponent?.chartDespesasCategoria
        : undefined,
      chartFaturas: isGraficos
        ? this.graficosComponent?.chartFaturas
        : undefined,
      chartInvestimentos: isGraficos
        ? this.graficosComponent?.chartInvestimentos
        : undefined,
      chartDividas: isGraficos
        ? this.graficosComponent?.chartDividas
        : undefined,
      chartDividasInvestimentos: isGraficos
        ? undefined
        : this.chartDividasInvestimentos,
    };
  }

  private initCharts() {
    const {
      chartSaldo,
      chartReceitasDespesas,
      chartReceitasFixasVariaveis,
      chartDespesasCategoria,
      chartFaturas,
      chartInvestimentos,
      chartDividas,
      chartDividasInvestimentos,
    } = this.getGraphicContainers();

    const e = echarts as any;

    if (!chartSaldo?.nativeElement) {
      return;
    }

    const saldoChart = e.init(chartSaldo.nativeElement);
    saldoChart.setOption(this.chartOption);

    const receiptsEl = chartReceitasDespesas?.nativeElement;
    if (receiptsEl) {
      const receiptsChart = e.init(receiptsEl);
      receiptsChart.setOption(this.chartOptionReceitasDespesas);
    }

    const receitasFixasEl = chartReceitasFixasVariaveis?.nativeElement;
    if (receitasFixasEl) {
      const receitasFixasChart = e.init(receitasFixasEl);
      receitasFixasChart.setOption(this.chartOptionReceitasFixasVariaveis);
    }

    const despesasCategoriaEl = chartDespesasCategoria?.nativeElement;
    if (despesasCategoriaEl) {
      const despesasCategoriaChart = e.init(despesasCategoriaEl);
      despesasCategoriaChart.setOption(this.chartOptionDespesasCategoria);
    }

    const faturasEl = chartFaturas?.nativeElement;
    if (faturasEl) {
      const faturasChart = e.init(faturasEl);
      faturasChart.setOption(this.chartOptionFaturas);
    }

    const investimentosEl = chartInvestimentos?.nativeElement;
    if (investimentosEl) {
      const investimentosChart = e.init(investimentosEl);
      investimentosChart.setOption(this.chartOptionInvestimentos);
    }

    const dividasEl = chartDividas?.nativeElement;
    if (dividasEl) {
      const dividasChart = e.init(dividasEl);
      dividasChart.setOption(this.chartOptionDividasDonut);
    }

    const dividasInvestimentosEl = chartDividasInvestimentos?.nativeElement;
    if (dividasInvestimentosEl) {
      const dividasInvestimentosChart = e.init(dividasInvestimentosEl);
      dividasInvestimentosChart.setOption(this.chartOptionDividasInvestimentos);
    }
  }

  private sincronizarGraficoSaldoECharts(): void {
    this.chartOption = {
      ...this.chartOption,
      legend: this.getLegendaGraficoSaldo(),
      dataset: { source: this.getDatasetSource() },
      series: this.getSeriesGraficoSaldo(),
    };
    const { chartSaldo } = this.getGraphicContainers();
    const el = chartSaldo?.nativeElement;
    if (!el) return;

    const e = echarts as any;

    const chart = e.getInstanceByDom(el) || e.init(el);

    chart.setOption(this.chartOption, { notMerge: true });
  }

  private sincronizarGraficosBarraELinha(): void {
    const {
      chartReceitasDespesas,
      chartReceitasFixasVariaveis,
      chartDespesasCategoria,
      chartFaturas,
      chartInvestimentos,
      chartDividas,
      chartDividasInvestimentos,
    } = this.getGraphicContainers();

    const e = echarts as any;

    const sync = (
      element: ElementRef<HTMLElement> | undefined,
      option: EChartsOption,
    ) => {
      const el = element?.nativeElement;
      if (!el || !option || Object.keys(option).length === 0) return;
      const chart = e.getInstanceByDom(el) || e.init(el);
      chart.setOption(option, { notMerge: false });
    };

    sync(chartReceitasDespesas, this.chartOptionReceitasDespesas);
    sync(chartReceitasFixasVariaveis, this.chartOptionReceitasFixasVariaveis);
    sync(chartDespesasCategoria, this.chartOptionDespesasCategoria);
    sync(chartFaturas, this.chartOptionFaturas);
    sync(chartInvestimentos, this.chartOptionInvestimentos);
    sync(chartDividas, this.chartOptionDividasDonut);
    sync(chartDividasInvestimentos, this.chartOptionDividasInvestimentos);
  }

  chartOption: EChartsOption = {
    title: {
      text: 'Relatório de Saldo',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6b7280',
      },
    },
    legend: {
      ...this.getLegendaGraficoSaldo(),
    },
    tooltip: {
      trigger: 'item',
      axisPointer: {
        type: 'shadow',
      },
      formatter: function (params: any) {
        const valor = params.value[params.seriesIndex + 1];
        const ano = params.seriesName;
        const mes = params.name;
        const cor = params.color;

        let result = `<div style="background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #ddd; box-shadow: 0 3px 6px rgba(0,0,0,0.15);">`;
        result += `<div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">${mes} - ${ano}</div>`;
        result += `<div style="display: flex; align-items: center; gap: 8px;">`;
        result += `<div style="width: 12px; height: 12px; background-color: ${cor}; border-radius: 2px;"></div>`;
        result += `<span style="color: #6b7280; font-weight: bold; font-size: 16px;">Total: R$ ${valor.toLocaleString(
          'pt-BR',
          { minimumFractionDigits: 2 },
        )}</span>`;
        result += `</div>`;
        result += `</div>`;

        return result;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      axisLabel: {
        rotate: 45,
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Valor (R$)',
      axisLabel: {
        formatter: (value: number) => this.formatarValorRealSemCentavos(value),
      },
    },
    dataset: {
      source: this.getDatasetSource(),
    },
    series: this.getSeriesGraficoSaldo(),
  };

  mergeOptions: EChartsOption = {};
  chartOptionReceitasDespesas: EChartsOption = {};
  chartOptionReceitasFixasVariaveis: EChartsOption = {};
  chartOptionDespesasCategoria: EChartsOption = {};
  chartOptionFaturas: EChartsOption = {};
  chartOptionInvestimentos: EChartsOption = {};
  chartOptionDividasDonut: EChartsOption = {};

  private formatarTooltipReceitasDespesas(params: any): string {
    const valor = params.value;
    const tipo = params.seriesName;
    const mes = params.name;
    const cor = params.color;

    let result = `<div style="background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #ddd; box-shadow: 0 3px 6px rgba(0,0,0,0.15);">`;
    result += `<div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">${mes} - ${tipo}</div>`;
    result += `<div style="display: flex; align-items: center; gap: 8px;">`;
    result += `<div style="width: 12px; height: 12px; background-color: ${cor}; border-radius: 2px;"></div>`;
    result += `<span style="color: #6b7280; font-weight: bold; font-size: 16px;">R$ ${valor.toLocaleString(
      'pt-BR',
      { minimumFractionDigits: 2 },
    )}</span>`;
    result += `</div>`;
    result += `</div>`;

    return result;
  }

  private formatarValorRealSemCentavos(valor: number): string {
    return `R$ ${valor.toLocaleString('pt-BR')}`;
  }

  private formatarValorRealComCentavos(params: any): string {
    return `R$ ${params.value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    })}`;
  }

  chartOptionDividasInvestimentos: EChartsOption = {
    title: {
      text: 'Dívidas x Investimentos',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6b7280',
      },
    },
    legend: {
      data: ['Dívidas', 'Investimentos'],
      bottom: 10,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      formatter: function (params: any) {
        let result = `<div style="background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #ddd; box-shadow: 0 3px 6px rgba(0,0,0,0.15);">`;
        result += `<div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">${params[0].name}</div>`;

        params.forEach((param: any) => {
          const valor = param.value;
          const cor = param.color;
          const nome = param.seriesName;

          result += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">`;
          result += `<div style="width: 12px; height: 12px; background-color: ${cor}; border-radius: 50%;"></div>`;
          result += `<span style="color: #6b7280; font-weight: bold;">${nome}: R$ ${valor.toLocaleString(
            'pt-BR',
            { minimumFractionDigits: 2 },
          )}</span>`;
          result += `</div>`;
        });

        result += `</div>`;
        return result;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: this.meses,
      axisLabel: {
        rotate: 45,
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Valor (R$)',
      min: -20000,
      max: 40000,
      interval: 20000,
      axisLabel: {
        formatter: (value: number) => this.formatarValorRealSemCentavos(value),
      },
    },
    series: [
      {
        name: 'Dívidas',
        type: 'line',
        data: [
          31360.73, 27180.83, 23629.98, 20221.3, 16307.23, 10300.27, 5508.66, 0,
          -4747.14, -6779.27, -9407.96, -11885.53,
        ],
        itemStyle: { color: '#F44336' },
        lineStyle: { color: '#F44336', width: 3 },
        symbol: 'circle',
        symbolSize: 8,
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => this.formatarValorRealComCentavos(params),
          fontSize: 10,
          color: '#F44336',
        },
      },
      {
        name: 'Investimentos',
        type: 'line',
        data: [
          35000, 35000, 35000, 35000, 35000, 35000, 35000, 35000, 35000, 35000,
          35000, 35000,
        ],
        itemStyle: { color: '#2196F3' },
        lineStyle: { color: '#2196F3', width: 3 },
        symbol: 'circle',
        symbolSize: 8,
        label: {
          show: false,
        },
      },
    ],
  };

  get saldoTotal() {
    return (
      this.totalReceitas -
      this.totalDespesas -
      this.totalCartaoCredito -
      this.totalDividas -
      this.totalInvestimentos
    );
  }

  calcularTotais() {
    const dadosAno = this.dadosPorAno[this.anoSelecionado];
    if (dadosAno) {
      this.dadosReceitas = dadosAno.receitas;
      this.dadosDespesas = dadosAno.despesas;
      this.dadosCartaoCredito = dadosAno.cartaoCredito;
      this.dadosDividas = dadosAno.dividas;
      this.dadosInvestimentos = dadosAno.investimentos;

      this.totalReceitas = this.dadosReceitas.reduce(
        (sum, valor) => sum + valor,
        0,
      );
      this.totalDespesas = this.dadosDespesas.reduce(
        (sum, valor) => sum + valor,
        0,
      );
      this.totalCartaoCredito = this.dadosCartaoCredito.reduce(
        (sum, valor) => sum + valor,
        0,
      );
      this.totalDividas = this.dadosDividas.reduce(
        (sum, valor) => sum + valor,
        0,
      );
      this.totalInvestimentos = this.dadosInvestimentos.reduce(
        (sum, valor) => sum + valor,
        0,
      );

      this.dadosTotal = this.dadosReceitas.map(
        (receita, index) =>
          receita -
          this.dadosDespesas[index] -
          this.dadosCartaoCredito[index] -
          this.dadosDividas[index] -
          this.dadosInvestimentos[index],
      );
    }
  }

  onAnoChange() {
    const ano = Number(this.anoSelecionado);

    if (!Number.isFinite(ano) || ano < ANO_REFERENCIA_MIN) {
      return;
    }

    this.anoSelecionado = Math.round(ano);
    this.garantirDadosAno(this.anoSelecionado);

    if (
      !this.comparandoGraficoSaldo ||
      !this.anosSaldoComparacao.includes(this.anoSelecionado)
    ) {
      this.anosSaldoSelecionados = [this.anoSelecionado];
    } else {
      this.anosSaldoSelecionados = [...this.anosSaldoComparacao];
    }

    this.carregarReceitasAno(this.anoSelecionado);
    this.carregarDespesasAno(this.anoSelecionado);
    this.carregarCartoesAno(this.anoSelecionado);

    this.calcularTotais();
    this.configurarGraficosCards();
    this.atualizarGraficoReceitasDespesas();
    this.sincronizarGraficosBarraELinha();

    setTimeout(() => {
      this.sincronizarGraficoSaldoECharts();
      this.sincronizarGraficosBarraELinha();
      this.resizeTodosGraficosResumo();
    }, 300);
  }

  get podeAnoAnterior(): boolean {
    return Number(this.anoSelecionado) > ANO_REFERENCIA_MIN;
  }

  get podeProximoAno(): boolean {
    return true;
  }

  get estaEmAnoFuturo(): boolean {
    return Number(this.anoSelecionado) > this.anoAtual;
  }

  get estaForaDoAnoAtual(): boolean {
    return Number(this.anoSelecionado) !== this.anoAtual;
  }

  get exibirAvisoRelatorioVazio(): boolean {
    return (
      this.estaForaDoAnoAtual &&
      [
        ...this.dadosReceitas,
        ...this.dadosDespesas,
        ...this.dadosCartaoCredito,
        ...this.dadosDividas,
        ...this.dadosInvestimentos,
      ].every((valor) => Number(valor) === 0)
    );
  }

  get podeAdicionarAnoGraficoSaldo(): boolean {
    const ano = Number(this.anoSelecionado);

    if (!Number.isFinite(ano)) {
      return false;
    }

    if (ano === this.anoAtual) {
      return false;
    }

    if (this.anosSaldoComparacao.includes(ano)) {
      return false;
    }

    return (
      this.totalAnosAdicionaisGraficoSaldo <
      this.limiteAnosAdicionaisGraficoSaldo
    );
  }

  get podeLimparFiltrosGraficoSaldo(): boolean {
    return this.totalAnosAdicionaisGraficoSaldo > 0;
  }

  get totalAnosAdicionaisGraficoSaldo(): number {
    return this.anosSaldoComparacao.filter((ano) => ano !== this.anoAtual)
      .length;
  }

  anoAnterior(): void {
    if (!this.podeAnoAnterior) return;
    this.anoSelecionado = Number(this.anoSelecionado) - 1;
    this.onAnoChange();
  }

  proximoAno(): void {
    if (!this.podeProximoAno) return;
    this.anoSelecionado = Number(this.anoSelecionado) + 1;
    this.onAnoChange();
  }

  voltarParaAnoAtual(): void {
    if (Number(this.anoSelecionado) === this.anoAtual) {
      return;
    }
    this.anoSelecionado = this.anoAtual;
    this.onAnoChange();
  }

  adicionarAnoAoGraficoSaldo(): void {
    const ano = Number(this.anoSelecionado);

    if (
      !Number.isFinite(ano) ||
      ano === this.anoAtual ||
      this.anosSaldoComparacao.includes(ano) ||
      this.totalAnosAdicionaisGraficoSaldo >=
        this.limiteAnosAdicionaisGraficoSaldo
    ) {
      return;
    }

    this.comparandoGraficoSaldo = true;
    this.anosSaldoComparacao.push(ano);
    this.anosSaldoComparacao.sort((a, b) => a - b);
    this.anosSaldoSelecionados = [...this.anosSaldoComparacao];
    this.sincronizarGraficoSaldoECharts();
  }

  removerAnoDoGraficoSaldo(ano: number): void {
    if (ano === this.anoAtual) {
      return;
    }

    const atualizada = this.anosSaldoComparacao.filter((a) => a !== ano);
    if (atualizada.length === 0) {
      return;
    }

    this.anosSaldoComparacao = atualizada;
    this.comparandoGraficoSaldo = this.totalAnosAdicionaisGraficoSaldo > 0;
    this.anosSaldoSelecionados = this.comparandoGraficoSaldo
      ? [...this.anosSaldoComparacao]
      : [this.anoSelecionado];
    this.sincronizarGraficoSaldoECharts();
  }

  limparFiltrosGraficoSaldo(): void {
    this.comparandoGraficoSaldo = false;
    this.anoSelecionado = this.anoAtual;
    this.anosSaldoComparacao = [this.anoAtual];
    this.anosSaldoSelecionados = [this.anoAtual];
    this.onAnoChange();
  }

  rotuloAnoGraficoSaldo(ano: number): string {
    return ano === this.anoAtual ? `${ano} (atual)` : String(ano);
  }

  selecionarVisao(visao: 'resumo' | 'categorias' | 'guia' | 'graficos'): void {
    this.visaoRelatorio = visao;

    if (visao === 'resumo') {
      this.cdr.detectChanges();

      setTimeout(() => {
        this.reinicializarGraficosAposVoltarResumo();
      }, 300);
    }
  }

  // private reinicializarGraficosAposVoltar(): void {
  //   if (this.visaoRelatorio === 'resumo') {
  //     this.reinicializarGraficosAposVoltarResumo();
  //   }
  // }

  private reinicializarGraficosAposVoltarResumo(): void {
    // this.disposeEchartsNosTresConteiners();
    const { chartSaldo } = this.getGraphicContainers();
    if (!chartSaldo?.nativeElement) {
      return;
    }

    this.initCharts();
    this.sincronizarGraficoSaldoECharts();
    this.sincronizarGraficosBarraELinha();
    this.atualizarGraficoReceitasDespesas();
    // this.resizeTodosGraficosResumo();

    setTimeout(() => {
      this.resizeTodosGraficosResumo();
    }, 100);
  }

  // private disposeEchartsNosTresConteiners(): void {
  //   const e = echarts as {
  //     getInstanceByDom?: (d: HTMLElement) => { dispose: () => void } | null;
  //   };
  //   if (!e.getInstanceByDom) return;
  //   const { chartSaldo, chartReceitasDespesas, chartDividasInvestimentos } =
  //     this.getGraphicContainers();
  //   for (const ref of [
  //     chartSaldo,
  //     chartReceitasDespesas,
  //     chartDividasInvestimentos,
  //   ]) {
  //     const el = ref?.nativeElement;
  //     if (!el) continue;
  //     const inst = e.getInstanceByDom(el);
  //     inst?.dispose();
  //   }
  // }

  private resizeTodosGraficosResumo(): void {
    const e = echarts as {
      getInstanceByDom?: (d: HTMLElement) => { resize: () => void } | null;
    };
    if (!e.getInstanceByDom) return;
    const {
      chartSaldo,
      chartReceitasDespesas,
      chartReceitasFixasVariaveis,
      chartDespesasCategoria,
      chartFaturas,
      chartInvestimentos,
      chartDividas,
      chartDividasInvestimentos,
    } = this.getGraphicContainers();
    for (const ref of [
      chartSaldo,
      chartReceitasDespesas,
      chartReceitasFixasVariaveis,
      chartDespesasCategoria,
      chartFaturas,
      chartInvestimentos,
      chartDividas,
      chartDividasInvestimentos,
    ]) {
      const el = ref?.nativeElement;
      if (!el) continue;
      e.getInstanceByDom(el)?.resize();
    }
  }

  private atualizarGraficoReceitasDespesas() {
    this.chartOptionReceitasDespesas = {
      title: {
        text: 'Receitas e Despesas',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#6b7280',
        },
      },
      legend: {
        data: ['Receitas', 'Despesas'],
        bottom: 10,
      },
      tooltip: {
        trigger: 'item',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) =>
          this.formatarTooltipReceitasDespesas(params),
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: this.meses,
        axisLabel: {
          rotate: 45,
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Valor (R$)',
        max: 20000,
        interval: 5000,
        axisLabel: {
          formatter: (value: number) =>
            this.formatarValorRealSemCentavos(value),
        },
      },
      series: [
        {
          name: 'Receitas',
          type: 'bar',
          data: this.dadosReceitas,
          itemStyle: { color: '#4CAF50' },
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) =>
              this.formatarValorRealComCentavos(params),
          },
        },
        {
          name: 'Despesas',
          type: 'bar',
          data: this.dadosDespesas,
          itemStyle: { color: '#F44336' },
          label: {
            show: true,
            position: 'bottom',
            formatter: (params: any) =>
              this.formatarValorRealComCentavos(params),
          },
        },
      ],
    };
  }

  private atualizarGraficosFinanceiros(): void {
    const receitasFixas =
      this.naturezaReceitaLinhas.find((item) => item.id === 'fixa')?.valores ||
      new Array(12).fill(0);
    const receitasVariaveis =
      this.naturezaReceitaLinhas.find((item) => item.id === 'variavel')
        ?.valores || new Array(12).fill(0);

    this.chartOptionReceitasFixasVariaveis = {
      title: {
        text: 'Receitas fixas e variáveis',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: '700',
          color: '#334155',
        },
      },
      legend: {
        data: ['Fixas', 'Variáveis'],
        bottom: 10,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) =>
          this.formatarTooltipReceitasDespesas(params[0]),
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: this.meses,
        axisLabel: {
          rotate: 45,
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Valor (R$)',
        axisLabel: {
          formatter: (value: number) =>
            this.formatarValorRealSemCentavos(value),
        },
      },
      series: [
        {
          name: 'Fixas',
          type: 'bar',
          data: receitasFixas,
          itemStyle: { color: '#2563EB' },
        },
        {
          name: 'Variáveis',
          type: 'bar',
          data: receitasVariaveis,
          itemStyle: { color: '#38BDF8' },
        },
      ],
    };

    const despesasCategoria = this.despesasPorCategoriaLinhas.map((item) => ({
      name: item.categoria,
      value: item.total,
    }));

    this.chartOptionDespesasCategoria = {
      title: {
        text: 'Despesas por categoria',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: '700',
          color: '#334155',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) =>
          `${params.name}: R$ ${Number(params.value).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
          })}`,
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center',
      },
      series: [
        {
          name: 'Categorias',
          type: 'pie',
          radius: ['50%', '75%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            formatter: '{b}: {d}%',
          },
          labelLine: {
            show: true,
          },
          data: despesasCategoria.length
            ? despesasCategoria
            : [{ name: 'Sem dados', value: 1 }],
        },
      ],
    };

    this.chartOptionFaturas = {
      title: {
        text: 'Faturas',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: '700',
          color: '#334155',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) =>
          this.formatarValorRealComCentavos(params[0]),
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: this.meses,
        axisLabel: {
          rotate: 45,
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Valor (R$)',
        axisLabel: {
          formatter: (value: number) =>
            this.formatarValorRealSemCentavos(value),
        },
      },
      series: [
        {
          name: 'Faturas',
          type: 'line',
          data: this.dadosCartaoCredito,
          itemStyle: { color: '#f97316' },
          lineStyle: { width: 3 },
          symbol: 'circle',
          symbolSize: 6,
          smooth: true,
        },
      ],
    };

    this.chartOptionInvestimentos = {
      title: {
        text: 'Investimentos',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: '700',
          color: '#334155',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) =>
          this.formatarValorRealComCentavos(params[0]),
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: this.meses,
        axisLabel: {
          rotate: 45,
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Valor (R$)',
        axisLabel: {
          formatter: (value: number) =>
            this.formatarValorRealSemCentavos(value),
        },
      },
      series: [
        {
          name: 'Investimentos',
          type: 'line',
          data: this.dadosInvestimentos,
          itemStyle: { color: '#10b981' },
          lineStyle: { width: 3 },
          areaStyle: { color: 'rgba(16, 185, 129, 0.2)' },
          symbol: 'circle',
          symbolSize: 6,
          smooth: true,
        },
      ],
    };

    const totalPago = Math.max(
      0,
      this.totalReceitas - this.totalDespesas - this.totalCartaoCredito,
    );
    const totalRestante = Math.max(0, this.totalDividas - totalPago);

    this.chartOptionDividasDonut = {
      title: {
        text: 'Dívidas: Pago x Restante',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: '700',
          color: '#334155',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) =>
          `${params.name}: R$ ${Number(params.value).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
          })}`,
      },
      legend: {
        bottom: 10,
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            formatter: '{b}: {d}%',
          },
          labelLine: {
            show: true,
          },
          data: [
            {
              name: 'Pago',
              value: totalPago || 1,
              itemStyle: { color: '#0ea5e9' },
            },
            {
              name: 'Restante',
              value: totalRestante || 1,
              itemStyle: { color: '#f97316' },
            },
          ],
        },
      ],
    };
  }

  randomDataset() {
    this.mergeOptions = {
      dataset: {
        source: [
          ['Mês', ...ANOS_COMPARACAO.map((a) => String(a))],
          ['Janeiro', ...this.getRandomValues()],
          ['Fevereiro', ...this.getRandomValues()],
          ['Março', ...this.getRandomValues()],
          ['Abril', ...this.getRandomValues()],
          ['Maio', ...this.getRandomValues()],
          ['Junho', ...this.getRandomValues()],
          ['Julho', ...this.getRandomValues()],
          ['Agosto', ...this.getRandomValues()],
          ['Setembro', ...this.getRandomValues()],
          ['Outubro', ...this.getRandomValues()],
          ['Novembro', ...this.getRandomValues()],
          ['Dezembro', ...this.getRandomValues()],
        ],
      },
    };
  }

  private getRandomValues() {
    const res: number[] = [];
    for (let i = 0; i < ANOS_COMPARACAO.length; i++) {
      res.push(Math.random() * 20000 - 10000);
    }
    return res;
  }

  private getSeriesGraficoSaldo() {
    return this.getAnosGraficoSaldo().map((ano) => ({
      type: 'bar',
      name: this.rotuloAnoGraficoSaldo(ano),
      itemStyle: { color: this.getCorGraficoSaldo(ano) },
    }));
  }

  private getCorGraficoSaldo(ano: number): string {
    if (ano === this.anoAtual) {
      return '#7C3AED';
    }

    if (ano < this.anoAtual) {
      const coresPassado = ['#FACC15', '#F97316', '#DC2626'];
      const distancia = this.anoAtual - ano;
      return coresPassado[Math.min(distancia - 1, coresPassado.length - 1)];
    }

    const coresFuturo = ['#2563EB', '#38BDF8', '#06B6D4', '#2DD4BF'];
    const distancia = ano - this.anoAtual;
    return coresFuturo[Math.min(distancia - 1, coresFuturo.length - 1)];
  }

  private getAnosGraficoSaldo(): number[] {
    return this.anosSaldoSelecionados.length
      ? [...this.anosSaldoSelecionados]
      : [this.anoAtual];
  }

  private getLegendaGraficoSaldo(): {
    data: string[];
    selectedMode: boolean;
    bottom: number;
  } {
    const data = this.getAnosGraficoSaldo().map((ano) =>
      this.rotuloAnoGraficoSaldo(ano),
    );
    return {
      data,
      selectedMode: false,
      bottom: 10,
    };
  }

  private getDatasetSource() {
    const anos = this.getAnosGraficoSaldo();
    const source: (string | number)[][] = [
      ['Mês', ...anos.map((ano) => this.rotuloAnoGraficoSaldo(ano))],
    ];

    this.meses.forEach((mes, index) => {
      const row: (string | number)[] = [mes];

      anos.forEach((ano) => {
        const dadosAno = this.dadosPorAno[ano];
        if (dadosAno) {
          const saldo =
            dadosAno.receitas[index] -
            dadosAno.despesas[index] -
            dadosAno.cartaoCredito[index] -
            dadosAno.dividas[index] -
            dadosAno.investimentos[index];
          row.push(saldo);
        } else {
          row.push(0);
        }
      });

      source.push(row);
    });

    return source;
  }

  chartOptionReceitas: EChartsOption = {};
  chartOptionDespesas: EChartsOption = {};
  chartOptionDividas: EChartsOption = {};
  chartOptionSaldo: EChartsOption = {};

  constructor(
    private receitasService: ReceitasService,
    private despesasService: DespesasService,
    private cartoesService: CartoesService,
    private cdr: ChangeDetectorRef,
  ) {
    this.carregarReceitasAno(this.anoSelecionado);
    this.carregarDespesasAno(this.anoSelecionado);
    this.carregarCartoesAno(this.anoSelecionado);
    this.calcularTotais();
    this.configurarGraficosCards();
    this.atualizarGraficoReceitasDespesas();
    this.atualizarGraficosFinanceiros();
  }

  private carregarReceitasAno(ano: number): void {
    if (!this.garantirDadosAno(ano)) return;
    const porMes$ = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) =>
      this.receitasService.getReceitas({ ano, mes }).pipe(
        catchError(() => of([] as Receita[])),
        map((lista) => lista || []),
      ),
    );
    forkJoin(porMes$).subscribe({
      next: (listasPorMes) => {
        this.dadosPorAno[ano].receitas = listasPorMes.map((lista) =>
          lista.reduce((s, r) => s + (Number(r.valor) || 0), 0),
        );

        this.agregarReceitasPorCategorias(listasPorMes);
        this.aoAtualizarResumoAposDadosDaApi();
      },
    });
  }

  private carregarDespesasAno(ano: number): void {
    if (!this.garantirDadosAno(ano)) return;
    const porMes$ = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) =>
      this.despesasService.getDespesas({ ano, mes }).pipe(
        catchError(() => of([] as Despesa[])),
        map((lista) => lista || []),
      ),
    );
    forkJoin(porMes$).subscribe({
      next: (listasPorMes) => {
        this.dadosPorAno[ano].despesas = listasPorMes.map((lista) =>
          lista.reduce((s, d) => s + (Number(d.valor) || 0), 0),
        );
        this.agregarDespesasPorCategorias(listasPorMes);
        this.aoAtualizarResumoAposDadosDaApi();
      },
    });
  }

  private carregarCartoesAno(ano: number): void {
    if (!this.garantirDadosAno(ano)) return;
    const cartoesPorMes$ = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) =>
      this.cartoesService.getCartoes({ ano, mes }).pipe(
        catchError(() => of([] as Cartao[])),
        map((lista) => lista || []),
      ),
    );

    forkJoin(cartoesPorMes$).subscribe({
      next: (cartoesPorMes) => {
        this.dadosPorAno[ano].cartaoCredito = this.meses.map((_, index) => {
          const total = this.totalAPagarMesCartoes(cartoesPorMes[index]);
          return Math.round(total * 100) / 100;
        });
        this.aoAtualizarResumoAposDadosDaApi();
      },
    });
  }

  private totalAPagarMesCartoes(cartoes: Cartao[]): number {
    return cartoes.reduce(
      (s, cartao) => s + (Number(cartao.totalAPagarMes) || 0),
      0,
    );
  }

  private garantirDadosAno(ano: number): boolean {
    if (!Number.isFinite(ano) || ano < ANO_REFERENCIA_MIN) {
      return false;
    }
    if (!this.dadosPorAno[ano]) {
      this.dadosPorAno[ano] = this.criarDadosAnoVazio();
    }
    return true;
  }

  private criarDadosAnoVazio(): {
    receitas: number[];
    despesas: number[];
    cartaoCredito: number[];
    dividas: number[];
    investimentos: number[];
  } {
    const serieVazia = () => new Array(this.meses.length).fill(0) as number[];
    return {
      receitas: serieVazia(),
      despesas: serieVazia(),
      cartaoCredito: serieVazia(),
      dividas: serieVazia(),
      investimentos: serieVazia(),
    };
  }

  private agregarReceitasPorCategorias(listasPorMes: Receita[][]): void {
    const fixa = new Array(12).fill(0) as number[];
    const variavel = new Array(12).fill(0) as number[];
    const porCategoria = new Map<string, number[]>();

    for (let m = 0; m < 12; m++) {
      for (const r of listasPorMes[m] || []) {
        const v = Number(r.valor) || 0;
        if (v === 0) continue;
        if (r.natureza === 'variavel') variavel[m] += v;
        else fixa[m] += v;
        const cat = String(r.categoria || 'Outras').trim() || 'Outras';
        if (!porCategoria.has(cat))
          porCategoria.set(cat, new Array(12).fill(0));
        porCategoria.get(cat)![m] += v;
      }
    }

    const sum = (a: number[]) => a.reduce((s, n) => s + n, 0);
    this.naturezaReceitaLinhas = [
      {
        id: 'fixa',
        label: 'Receitas fixas',
        valores: fixa,
        total: sum(fixa),
      },
      {
        id: 'variavel',
        label: 'Receitas variáveis',
        valores: variavel,
        total: sum(variavel),
      },
    ];
    this.receitasPorTipoLinhas = Array.from(porCategoria.entries())
      .map(([tipo, valores]) => ({
        tipo,
        valores,
        total: sum(valores),
      }))
      .filter((l) => l.total > 0)
      .sort((a, b) =>
        a.tipo.localeCompare(b.tipo, 'pt-BR', {
          sensitivity: 'base',
        }),
      );
  }

  private agregarDespesasPorCategorias(listasPorMes: Despesa[][]): void {
    const fixa = new Array(12).fill(0) as number[];
    const variavel = new Array(12).fill(0) as number[];
    const porCategoria = new Map<string, number[]>();

    for (let m = 0; m < 12; m++) {
      for (const d of listasPorMes[m] || []) {
        const v = Number(d.valor) || 0;
        if (v === 0) continue;
        if (d.natureza === 'variavel') variavel[m] += v;
        else fixa[m] += v;
        const cat = String(d.categoria || 'Outras').trim() || 'Outras';
        if (!porCategoria.has(cat))
          porCategoria.set(cat, new Array(12).fill(0));
        porCategoria.get(cat)![m] += v;
      }
    }

    const sum = (a: number[]) => a.reduce((s, n) => s + n, 0);
    this.naturezaDespesaLinhas = [
      {
        id: 'fixa',
        label: 'Despesas fixas',
        valores: fixa,
        total: sum(fixa),
      },
      {
        id: 'variavel',
        label: 'Despesas variáveis',
        valores: variavel,
        total: sum(variavel),
      },
    ];
    this.despesasPorCategoriaLinhas = Array.from(porCategoria.entries())
      .map(([categoria, valores]) => ({
        categoria,
        valores,
        total: sum(valores),
      }))
      .filter((l) => l.total > 0)
      .sort((a, b) =>
        a.categoria.localeCompare(b.categoria, 'pt-BR', {
          sensitivity: 'base',
        }),
      );
  }

  private aoAtualizarResumoAposDadosDaApi(): void {
    this.calcularTotais();
    this.configurarGraficosCards();
    this.atualizarGraficoReceitasDespesas();
    this.atualizarGraficosFinanceiros();
    this.sincronizarGraficoSaldoECharts();
    this.sincronizarGraficosBarraELinha();
  }

  configurarGraficosCards() {
    // Gráfico de Receitas - Barras
    this.chartOptionReceitas = {
      grid: { left: 10, right: 10, top: 10, bottom: 10 },
      xAxis: { type: 'category', data: this.meses.slice(0, 6), show: false },
      yAxis: { type: 'value', show: false },
      series: [
        {
          type: 'bar',
          data: this.dadosReceitas.slice(0, 6),
          itemStyle: { color: '#28a745' },
          barWidth: '60%',
        },
      ],
      tooltip: { show: false },
      animation: false,
    };

    // Gráfico de Despesas - Barras
    this.chartOptionDespesas = {
      grid: { left: 10, right: 10, top: 10, bottom: 10 },
      xAxis: { type: 'category', data: this.meses.slice(0, 6), show: false },
      yAxis: { type: 'value', show: false },
      series: [
        {
          type: 'bar',
          data: this.dadosDespesas.slice(0, 6),
          itemStyle: { color: '#dc3545' },
          barWidth: '60%',
        },
      ],
      tooltip: { show: false },
      animation: false,
    };

    // Gráfico de Dívidas - Linha
    this.chartOptionDividas = {
      grid: { left: 10, right: 10, top: 10, bottom: 10 },
      xAxis: { type: 'category', data: this.meses.slice(0, 6), show: false },
      yAxis: { type: 'value', show: false },
      series: [
        {
          type: 'line',
          data: this.dadosDividas.slice(0, 6),
          itemStyle: { color: '#ffc107' },
          lineStyle: { color: '#ffc107', width: 3 },
          symbol: 'circle',
          symbolSize: 4,
        },
      ],
      tooltip: { show: false },
      animation: false,
    };

    // Gráfico de Investimentos - Área
    this.chartOptionInvestimentos = {
      grid: { left: 10, right: 10, top: 10, bottom: 10 },
      xAxis: { type: 'category', data: this.meses.slice(0, 6), show: false },
      yAxis: { type: 'value', show: false },
      series: [
        {
          type: 'line',
          data: this.dadosInvestimentos.slice(0, 6),
          areaStyle: { color: 'rgba(23, 162, 184, 0.3)' },
          itemStyle: { color: '#17a2b8' },
          lineStyle: { color: '#17a2b8', width: 2 },
          symbol: 'circle',
          symbolSize: 3,
        },
      ],
      tooltip: { show: false },
      animation: false,
    };

    // Gráfico de Saldo - Pizza
    const saldoPositivo = this.saldoTotal >= 0;
    this.chartOptionSaldo = {
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          data: [
            {
              value: Math.abs(this.saldoTotal),
              itemStyle: { color: saldoPositivo ? '#28a745' : '#dc3545' },
            },
            {
              value: Math.max(0, 1000 - Math.abs(this.saldoTotal)),
              itemStyle: { color: '#f8f9fa' },
            },
          ],
          label: { show: false },
          labelLine: { show: false },
        },
      ],
      tooltip: { show: false },
      animation: false,
    };
  }
}
