import { Component } from '@angular/core';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-relatorio-page',
  templateUrl: './relatorio-page.component.html',
  styleUrls: ['./relatorio-page.component.scss'],
})
export class RelatorioPageComponent {
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

  // Propriedades de dados
  dadosReceitas: number[] = [];
  dadosDespesas: number[] = [];
  dadosDividas: number[] = [];
  dadosInvestimentos: number[] = [];
  dadosTotal: number[] = [];
  totalReceitas = 0;
  totalDespesas = 0;
  totalDividas = 0;
  totalInvestimentos = 0;

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
        color: '#6b7280',
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
        result += `<div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">${mes} - ${ano}</div>`;
        result += `<div style="display: flex; align-items: center; gap: 8px;">`;
        result += `<div style="width: 12px; height: 12px; background-color: ${cor}; border-radius: 2px;"></div>`;
        result += `<span style="color: #6b7280; font-weight: bold; font-size: 16px;">Total: R$ ${valor.toLocaleString(
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
      formatter: function (params: any) {
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
        data: [],
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
        data: [],
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

  get saldoTotal() {
    return (
      this.totalReceitas -
      this.totalDespesas -
      this.totalDividas -
      this.totalInvestimentos
    );
  }

  calcularTotais() {
    const dadosAno = this.dadosPorAno[this.anoSelecionado];
    if (dadosAno) {
      this.dadosReceitas = dadosAno.receitas;
      this.dadosDespesas = dadosAno.despesas;
      this.dadosDividas = dadosAno.dividas;
      this.dadosInvestimentos = dadosAno.investimentos;

      this.totalReceitas = this.dadosReceitas.reduce(
        (sum, valor) => sum + valor,
        0
      );
      this.totalDespesas = this.dadosDespesas.reduce(
        (sum, valor) => sum + valor,
        0
      );
      this.totalDividas = this.dadosDividas.reduce(
        (sum, valor) => sum + valor,
        0
      );
      this.totalInvestimentos = this.dadosInvestimentos.reduce(
        (sum, valor) => sum + valor,
        0
      );

      this.dadosTotal = this.dadosReceitas.map(
        (receita, index) =>
          receita -
          this.dadosDespesas[index] -
          this.dadosDividas[index] -
          this.dadosInvestimentos[index]
      );
    }
  }

  onAnoChange() {
    this.calcularTotais();
    this.configurarGraficosCards();
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
        formatter: function (params: any) {
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

  // Configurações dos gráficos para cada card
  chartOptionReceitas: EChartsOption = {};
  chartOptionDespesas: EChartsOption = {};
  chartOptionDividas: EChartsOption = {};
  chartOptionInvestimentos: EChartsOption = {};
  chartOptionSaldo: EChartsOption = {};

  constructor() {
    this.calcularTotais();
    this.configurarGraficosCards();
    this.atualizarGraficoReceitasDespesas();
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
