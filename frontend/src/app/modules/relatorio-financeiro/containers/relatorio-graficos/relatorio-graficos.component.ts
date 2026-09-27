import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as echarts from 'echarts';

type EChartsOption = Record<string, unknown>;

@Component({
  selector: 'app-relatorio-graficos',
  templateUrl: './relatorio-graficos.component.html',
  styleUrls: ['./relatorio-graficos.component.scss'],
  standalone: false,
})
export class RelatorioGraficosComponent implements AfterViewInit, OnChanges {
  @Input() anoSelecionado = new Date().getFullYear();
  @Input() anoAtual = new Date().getFullYear();
  @Input() anosSaldoSelecionados: number[] = [];
  @Input() podeAnoAnterior = false;
  @Input() podeProximoAno = false;
  @Input() podeAdicionarAnoGraficoSaldo = false;
  @Input() podeLimparFiltrosGraficoSaldo = false;
  @Input() totalAnosAdicionaisGraficoSaldo = 0;
  @Input() limiteAnosAdicionaisGraficoSaldo = 0;
  @Input() exibirAvisoRelatorioVazio = false;
  @Input() chartOption: EChartsOption = {};
  @Input() chartOptionReceitasDespesas: EChartsOption = {};
  @Input() chartOptionReceitasFixasVariaveis: EChartsOption = {};
  @Input() chartOptionDespesasCategoria: EChartsOption = {};
  @Input() chartOptionFaturas: EChartsOption = {};
  @Input() chartOptionInvestimentos: EChartsOption = {};
  @Input() chartOptionDividasDonut: EChartsOption = {};

  @Output() anoAnterior = new EventEmitter<void>();
  @Output() proximoAno = new EventEmitter<void>();
  @Output() adicionarAnoAoGraficoSaldo = new EventEmitter<void>();
  @Output() limparFiltrosGraficoSaldo = new EventEmitter<void>();
  @Output() removerAnoDoGraficoSaldo = new EventEmitter<number>();
  @Output() voltarParaAnoAtual = new EventEmitter<void>();

  @ViewChild('chartSaldo') chartSaldo!: ElementRef<HTMLElement>;
  @ViewChild('chartReceitasDespesas')
  chartReceitasDespesas!: ElementRef<HTMLElement>;
  @ViewChild('chartReceitasFixasVariaveis')
  chartReceitasFixasVariaveis!: ElementRef<HTMLElement>;
  @ViewChild('chartDespesasCategoria')
  chartDespesasCategoria!: ElementRef<HTMLElement>;
  @ViewChild('chartFaturas') chartFaturas!: ElementRef<HTMLElement>;
  @ViewChild('chartInvestimentos') chartInvestimentos!: ElementRef<HTMLElement>;
  @ViewChild('chartDividas') chartDividas!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    this.renderCharts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.keys(changes).length === 0) {
      return;
    }
    this.renderCharts();
  }

  removerAno(ano: number): void {
    this.removerAnoDoGraficoSaldo.emit(ano);
  }

  rotuloAnoGraficoSaldo(ano: number): string {
    return ano === this.anoAtual ? `${ano} (atual)` : String(ano);
  }

  voltarAoAnoAtual(): void {
    this.voltarParaAnoAtual.emit();
  }

  private renderCharts(): void {
    this.renderChart(this.chartSaldo, this.chartOption);
    this.renderChart(
      this.chartReceitasDespesas,
      this.chartOptionReceitasDespesas,
    );
    this.renderChart(
      this.chartReceitasFixasVariaveis,
      this.chartOptionReceitasFixasVariaveis,
    );
    this.renderChart(
      this.chartDespesasCategoria,
      this.chartOptionDespesasCategoria,
    );
    this.renderChart(this.chartFaturas, this.chartOptionFaturas);
    this.renderChart(this.chartInvestimentos, this.chartOptionInvestimentos);
    this.renderChart(this.chartDividas, this.chartOptionDividasDonut);
  }

  private renderChart(
    elementRef: ElementRef<HTMLElement> | undefined,
    option: EChartsOption,
  ): void {
    if (
      !elementRef?.nativeElement ||
      !option ||
      Object.keys(option).length === 0
    ) {
      return;
    }

    const e = echarts as any;
    const el = elementRef.nativeElement;
    const chart = e.getInstanceByDom(el) || e.init(el);

    chart.setOption(option, { notMerge: true });
    chart.resize();
  }
}
