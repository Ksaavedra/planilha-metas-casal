import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule, NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { AppStore } from '../../../../store/app.store';
import { NgxEchartsDirective } from 'ngx-echarts';

@Component({
  selector: 'app-relatorio-page',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule],
  providers: [
    {
      provide: NGX_ECHARTS_CONFIG,
      useValue: {
        echarts: () => import('echarts'),
      },
    },
  ],
  templateUrl: './relatorio-page.component.html',
  styleUrls: ['./relatorio-page.component.scss'],
})
export class RelatorioPageComponent {
  private store = inject(AppStore);

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

  anosDisponiveis = [2020, 2021, 2022, 2023, 2024, 2025];
  anoSelecionado = 2024;

  // Dados organizados por ano
  dadosPorAno: {
    [ano: number]: {
      receitas: number[];
      despesas: number[];
      dividas: number[];
      investimentos: number[];
    };
  } = {
    2020: {
      receitas: [
        3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500,
      ],
      despesas: [800, 850, 900, 750, 800, 900, 850, 800, 750, 900, 850, 800],
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
      dividas: [
        2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500,
      ],
      investimentos: [
        1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200,
      ],
    },
  };

  // Configuração do gráfico ECharts com dataset
  chartOption: EChartsOption = {
    title: {
      text: 'Relatório de Saldo',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
      },
    },
    legend: {
      data: ['2020', '2021', '2022', '2023', '2024', '2025'],
      bottom: 10,
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
        result += `<div style="font-size: 14px; color: #333; margin-bottom: 4px;">${mes} - ${ano}</div>`;
        result += `<div style="display: flex; align-items: center; gap: 8px;">`;
        result += `<div style="width: 12px; height: 12px; background-color: ${cor}; border-radius: 2px;"></div>`;
        result += `<span style="color: #333; font-weight: bold; font-size: 16px;">Total: R$ ${valor.toLocaleString(
          'pt-BR',
          { minimumFractionDigits: 2 }
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
        formatter: function (value: number) {
          return `R$ ${value.toLocaleString('pt-BR')}`;
        },
      },
    },
    dataset: {
      source: this.getDatasetSource(),
    },
    series: [
      {
        type: 'bar',
        name: '2020',
        itemStyle: { color: '#5470c6' },
      },
      {
        type: 'bar',
        name: '2021',
        itemStyle: { color: '#91cc75' },
      },
      {
        type: 'bar',
        name: '2022',
        itemStyle: { color: '#fac858' },
      },
      {
        type: 'bar',
        name: '2023',
        itemStyle: { color: '#ee6666' },
      },
      {
        type: 'bar',
        name: '2024',
        itemStyle: { color: '#73c0de' },
      },
      {
        type: 'bar',
        name: '2025',
        itemStyle: { color: '#3ba272' },
      },
    ],
  };

  mergeOptions: EChartsOption = {};

  // Configuração do segundo gráfico - Receitas e Despesas
  chartOptionReceitasDespesas: EChartsOption = {
    title: {
      text: 'Receitas e Despesas',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
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
      formatter: function (params: any) {
        const valor = params.value;
        const tipo = params.seriesName;
        const mes = params.name;
        const cor = params.color;

        let result = `<div style="background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #ddd; box-shadow: 0 3px 6px rgba(0,0,0,0.15);">`;
        result += `<div style="font-size: 14px; color: #333; margin-bottom: 4px;">${mes} - ${tipo}</div>`;
        result += `<div style="display: flex; align-items: center; gap: 8px;">`;
        result += `<div style="width: 12px; height: 12px; background-color: ${cor}; border-radius: 2px;"></div>`;
        result += `<span style="color: #333; font-weight: bold; font-size: 16px;">R$ ${valor.toLocaleString(
          'pt-BR',
          { minimumFractionDigits: 2 }
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
        formatter: function (value: number) {
          return `R$ ${value.toLocaleString('pt-BR')}`;
        },
      },
    },
    series: [
      {
        name: 'Receitas',
        type: 'bar',
        data: this.dadosReceitas,
        itemStyle: { color: '#4CAF50' }, // Verde
        label: {
          show: true,
          position: 'top',
          formatter: function (params: any) {
            return `R$ ${params.value.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}`;
          },
        },
      },
      {
        name: 'Despesas',
        type: 'bar',
        data: this.dadosDespesas,
        itemStyle: { color: '#F44336' }, // Vermelho
        label: {
          show: true,
          position: 'bottom',
          formatter: function (params: any) {
            return `R$ ${params.value.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}`;
          },
        },
      },
    ],
  };

  // Configuração do terceiro gráfico - Dívidas x Investimentos (Projetado)
  chartOptionDividasInvestimentos: EChartsOption = {
    title: {
      text: 'Dívidas x Investimentos (Projetado para o Período)',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
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
        result += `<div style="font-size: 14px; color: #333; margin-bottom: 8px;">${params[0].name}</div>`;

        params.forEach((param: any) => {
          const valor = param.value;
          const cor = param.color;
          const nome = param.seriesName;

          result += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">`;
          result += `<div style="width: 12px; height: 12px; background-color: ${cor}; border-radius: 50%;"></div>`;
          result += `<span style="color: #333; font-weight: bold;">${nome}: R$ ${valor.toLocaleString(
            'pt-BR',
            { minimumFractionDigits: 2 }
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
        formatter: function (value: number) {
          return `R$ ${value.toLocaleString('pt-BR')}`;
        },
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
          formatter: function (params: any) {
            return `R$ ${params.value.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}`;
          },
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

  get dadosReceitas() {
    return this.dadosPorAno[this.anoSelecionado]?.receitas || [];
  }

  get dadosDespesas() {
    return this.dadosPorAno[this.anoSelecionado]?.despesas || [];
  }

  get dadosDividas() {
    return this.dadosPorAno[this.anoSelecionado]?.dividas || [];
  }

  get dadosInvestimentos() {
    return this.dadosPorAno[this.anoSelecionado]?.investimentos || [];
  }

  get dadosTotal() {
    return this.dadosReceitas.map(
      (receita: number, i: number) =>
        receita -
        this.dadosDespesas[i] -
        this.dadosDividas[i] -
        this.dadosInvestimentos[i]
    );
  }

  get totalReceitas() {
    return this.dadosReceitas.reduce(
      (sum: number, valor: number) => sum + valor,
      0
    );
  }

  get totalDespesas() {
    return this.dadosDespesas.reduce(
      (sum: number, valor: number) => sum + valor,
      0
    );
  }

  get totalDividas() {
    return this.dadosDividas.reduce(
      (sum: number, valor: number) => sum + valor,
      0
    );
  }

  get totalInvestimentos() {
    return this.dadosInvestimentos.reduce(
      (sum: number, valor: number) => sum + valor,
      0
    );
  }

  get saldoTotal() {
    return (
      this.totalReceitas -
      this.totalDespesas -
      this.totalDividas -
      this.totalInvestimentos
    );
  }

  onAnoChange() {
    this.atualizarGraficoReceitasDespesas();
  }

  private atualizarGraficoReceitasDespesas() {
    this.chartOptionReceitasDespesas = {
      title: {
        text: 'Receitas e Despesas',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333',
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
        formatter: function (params: any) {
          const valor = params.value;
          const tipo = params.seriesName;
          const mes = params.name;
          const cor = params.color;

          let result = `<div style="background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #ddd; box-shadow: 0 3px 6px rgba(0,0,0,0.15);">`;
          result += `<div style="font-size: 14px; color: #333; margin-bottom: 4px;">${mes} - ${tipo}</div>`;
          result += `<div style="display: flex; align-items: center; gap: 8px;">`;
          result += `<div style="width: 12px; height: 12px; background-color: ${cor}; border-radius: 2px;"></div>`;
          result += `<span style="color: #333; font-weight: bold; font-size: 16px;">R$ ${valor.toLocaleString(
            'pt-BR',
            { minimumFractionDigits: 2 }
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
          formatter: function (value: number) {
            return `R$ ${value.toLocaleString('pt-BR')}`;
          },
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
            formatter: function (params: any) {
              return `R$ ${params.value.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}`;
            },
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
            formatter: function (params: any) {
              return `R$ ${params.value.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}`;
            },
          },
        },
      ],
    };
  }

  testeAno() {
    console.log('Teste - Ano atual:', this.anoSelecionado);
    alert(`Ano selecionado: ${this.anoSelecionado}`);
  }

  randomDataset() {
    this.mergeOptions = {
      dataset: {
        source: [
          ['Mês', '2020', '2021', '2022', '2023', '2024', '2025'],
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
    for (let i = 0; i < 6; i++) {
      res.push(Math.random() * 20000 - 10000); // Valores entre -10.000 e +10.000
    }
    return res;
  }

  private getDatasetSource() {
    const source = [['Mês', '2020', '2021', '2022', '2023', '2024', '2025']];

    this.meses.forEach((mes, index) => {
      const row: any[] = [mes];

      // Adicionar dados de cada ano
      [2020, 2021, 2022, 2023, 2024, 2025].forEach((ano) => {
        const dadosAno = this.dadosPorAno[ano];
        if (dadosAno) {
          const saldo =
            dadosAno.receitas[index] -
            dadosAno.despesas[index] -
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

  private updateChart() {
    // Atualizar o primeiro gráfico (Relatório de Saldo)
    this.chartOption = {
      ...this.chartOption,
      dataset: {
        source: this.getDatasetSource(),
      },
    };

    // Atualizar o segundo gráfico (Receitas e Despesas)
    this.chartOptionReceitasDespesas = {
      ...this.chartOptionReceitasDespesas,
      series: [
        {
          name: 'Receitas',
          type: 'bar',
          data: this.dadosReceitas,
          itemStyle: { color: '#4CAF50' },
          label: {
            show: true,
            position: 'top',
            formatter: function (params: any) {
              return `R$ ${params.value.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}`;
            },
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
            formatter: function (params: any) {
              return `R$ ${params.value.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}`;
            },
          },
        },
      ],
    };
  }
}
