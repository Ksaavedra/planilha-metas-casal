import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RelatorioPageComponent } from './relatorio-page.component';
import { ReceitasService } from '../../../../core/services/receitas/receitas.service';
import { DespesasService } from '../../../../core/services/despesas/despesas.service';
import { CartoesService } from '../../../../core/services/cartoes/cartoes.service';
import { DividasService } from '../../../../core/services/dividas/dividas.service';
import * as echarts from 'echarts';

jest.mock('echarts', () => ({
  init: jest.fn(),
  getInstanceByDom: jest.fn(),
}));

const TEMPLATE_GRAFICOS = `
  <div>
    <div #chartSaldo class="chart-host"></div>
    <div #chartReceitasDespesas class="chart-host"></div>
    <div #chartDividasInvestimentos class="chart-host"></div>
  </div>
`;

describe('RelatorioPageComponent', () => {
  let component: RelatorioPageComponent;
  let fixture: ComponentFixture<RelatorioPageComponent>;
  let receitasStub: { getReceitas: jest.Mock };
  let despesasStub: { getDespesas: jest.Mock };
  let cartoesStub: { getCartoes: jest.Mock };
  let dividasStub: { getDividas: jest.Mock };

  const echartsInitMock = echarts.init as jest.Mock;
  const echartsGetInstanceMock = echarts.getInstanceByDom as jest.Mock;

  const chartMock = {
    setOption: jest.fn(),
    dispose: jest.fn(),
    resize: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    echartsInitMock.mockReturnValue(chartMock);
    echartsGetInstanceMock.mockReturnValue(null);

    receitasStub = {
      getReceitas: jest.fn().mockReturnValue(of([])),
    };
    despesasStub = {
      getDespesas: jest.fn().mockReturnValue(of([])),
    };
    cartoesStub = {
      getCartoes: jest.fn().mockReturnValue(of([])),
    };
    dividasStub = {
      getDividas: jest.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      declarations: [RelatorioPageComponent],
      providers: [
        { provide: ReceitasService, useValue: receitasStub },
        { provide: DespesasService, useValue: despesasStub },
        { provide: DividasService, useValue: dividasStub },
        { provide: CartoesService, useValue: cartoesStub },
      ],
    })
      .overrideComponent(RelatorioPageComponent, {
        set: { template: TEMPLATE_GRAFICOS },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RelatorioPageComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('inicia no ano civil atual com 12 valores em cada série', () => {
    expect(component.anoSelecionado).toBe(new Date().getFullYear());
    expect(component.dadosReceitas.length).toBe(12);
    expect(component.dadosDespesas.length).toBe(12);
    expect(component.dadosDividas.length).toBe(12);
    expect(component.dadosInvestimentos.length).toBe(12);
  });

  it('dadosTotal (Jan) = receitas - despesas - cartão - dívidas - investimentos', () => {
    const y = 2024;
    component.anoSelecionado = y;
    component.onAnoChange();
    const i = 0;
    const ds = component.dadosPorAno[y];
    const esperado =
      ds.receitas[i] -
      ds.despesas[i] -
      ds.cartaoCredito[i] -
      ds.dividas[i] -
      ds.investimentos[i];
    expect(component.dadosTotal[i]).toBeCloseTo(esperado, 6);
  });

  it('totais e saldoTotal fecham a conta', () => {
    const r = component.dadosReceitas.reduce((s, v) => s + v, 0);
    const d = component.dadosDespesas.reduce((s, v) => s + v, 0);
    const c = component.dadosCartaoCredito.reduce((s, v) => s + v, 0);
    const di = component.dadosDividas.reduce((s, v) => s + v, 0);
    const inv = component.dadosInvestimentos.reduce((s, v) => s + v, 0);

    expect(component.totalReceitas).toBeCloseTo(r, 6);
    expect(component.totalDespesas).toBeCloseTo(d, 6);
    expect(component.totalCartaoCredito).toBeCloseTo(c, 6);
    expect(component.totalDividas).toBeCloseTo(di, 6);
    expect(component.totalInvestimentos).toBeCloseTo(inv, 6);
    expect(component.saldoTotal).toBeCloseTo(r - d - c - di - inv, 6);
  });

  it('dataset do gráfico principal inicia só com o ano atual', () => {
    const src = (component.chartOption.dataset as { source: unknown[] }).source;
    expect(src.length).toBe(component.meses.length + 1);
    expect(src[0]).toEqual(['Mês', `${component.anoAtual} (atual)`]);
    (src as unknown[][]).slice(1).forEach((row) => expect(row.length).toBe(2));
  });

  it('getDatasetSource calcula saldos apenas dos anos filtrados', () => {
    component.anosSaldoSelecionados = [2024, 2026];
    const source = (
      component as unknown as { getDatasetSource: () => unknown[][] }
    ).getDatasetSource();
    const header = source[0];
    const janeiro = source[1];

    expect(header).toEqual(['Mês', '2024', '2026 (atual)']);
    expect(janeiro[0]).toBe('Janeiro');

    [2024, 2026].forEach((ano, index) => {
      const ds = component.dadosPorAno[ano];
      const esperado =
        ds.receitas[0] -
        ds.despesas[0] -
        ds.cartaoCredito[0] -
        ds.dividas[0] -
        ds.investimentos[0];
      expect((janeiro as number[])[index + 1]).toBeCloseTo(esperado, 6);
    });
  });

  it('onAnoChange atualiza séries de Receitas/Despesas com o ano selecionado', () => {
    component.anoSelecionado = 2025;
    component.onAnoChange();

    const opt = component.chartOptionReceitasDespesas as {
      series: { data: number[] }[];
      yAxis: { axisLabel: { formatter: (n: number) => string } };
    };
    expect(opt.series[0].data).toEqual(component.dadosReceitas);
    expect(opt.series[1].data).toEqual(component.dadosDespesas);

    const fmt = opt.yAxis.axisLabel.formatter;
    expect(fmt(1234)).toContain('R$');
  });

  it('onAnoChange mostra somente o ano selecionado no gráfico de saldo', () => {
    component.anosSaldoSelecionados = [2026];
    component.anoSelecionado = 2027;

    component.onAnoChange();

    expect(component.anosSaldoSelecionados).toEqual([2027]);
    expect(component.podeAdicionarAnoGraficoSaldo).toBe(true);
  });

  it('desabilita ações do gráfico quando mostra somente o ano atual', () => {
    component.anoSelecionado = component.anoAtual;
    component.anosSaldoSelecionados = [component.anoAtual];

    expect(component.podeAdicionarAnoGraficoSaldo).toBe(false);
    expect(component.podeLimparFiltrosGraficoSaldo).toBe(false);
  });

  it('anoAnterior e proximoAno navegam pelo ano de referência', () => {
    component.anoSelecionado = 2024;

    component.anoAnterior();
    expect(component.anoSelecionado).toBe(2023);

    component.proximoAno();
    expect(component.anoSelecionado).toBe(2024);
  });

  it('voltarParaAnoAtual retorna do ano futuro para o relatório atual', () => {
    component.anoSelecionado = component.anoAtual + 1;

    expect(component.estaEmAnoFuturo).toBe(true);
    expect(component.estaForaDoAnoAtual).toBe(true);

    component.voltarParaAnoAtual();

    expect(component.anoSelecionado).toBe(component.anoAtual);
    expect(component.estaEmAnoFuturo).toBe(false);
    expect(component.estaForaDoAnoAtual).toBe(false);
  });

  it('estaForaDoAnoAtual também identifica anos passados', () => {
    component.anoSelecionado = component.anoAtual - 1;

    expect(component.estaEmAnoFuturo).toBe(false);
    expect(component.estaForaDoAnoAtual).toBe(true);

    component.voltarParaAnoAtual();

    expect(component.anoSelecionado).toBe(component.anoAtual);
  });

  it('onAnoChange cria séries vazias para ano futuro sem mock', () => {
    const futuro = 2027;

    component.anoSelecionado = futuro;
    component.onAnoChange();

    expect(component.dadosPorAno[futuro].receitas).toEqual(
      new Array(12).fill(0),
    );
    expect(component.dadosReceitas).toEqual(new Array(12).fill(0));
  });

  it('carregarCartoesAno soma totalAPagarMes mensal dos cartões', () => {
    cartoesStub.getCartoes.mockImplementation(({ mes }: { mes: number }) =>
      of(
        mes === 4
          ? [
              { id: 1, totalAPagarMes: 100 },
              { id: 2, totalAPagarMes: 50 },
            ]
          : mes === 5
            ? [{ id: 1, totalAPagarMes: 100 }]
            : [],
      ),
    );

    (
      component as unknown as { carregarCartoesAno: (ano: number) => void }
    ).carregarCartoesAno(component.anoAtual);

    expect(component.dadosCartaoCredito[2]).toBe(0);
    expect(component.dadosCartaoCredito[3]).toBe(150);
    expect(component.dadosCartaoCredito[4]).toBe(100);
    expect(component.totalCartaoCredito).toBe(250);
  });

  it('exibirAvisoRelatorioVazio aparece para ano sem dados fora do atual', () => {
    component.anoSelecionado = component.anoAtual + 1;
    component.onAnoChange();
    expect(component.exibirAvisoRelatorioVazio).toBe(true);

    component.anoSelecionado = component.anoAtual;
    component.onAnoChange();
    expect(component.exibirAvisoRelatorioVazio).toBe(false);

    component.anoSelecionado = component.anoAtual - 1;
    component.dadosReceitas = [100, ...new Array(11).fill(0)];
    component.dadosDespesas = new Array(12).fill(0);
    component.dadosDividas = new Array(12).fill(0);
    component.dadosInvestimentos = new Array(12).fill(0);
    expect(component.exibirAvisoRelatorioVazio).toBe(false);
  });

  it('adicionarAnoAoGraficoSaldo inclui ano selecionado e limita em 5 adicionais', () => {
    component.anosSaldoSelecionados = [2026];
    component.anosSaldoComparacao = [2026, 2027, 2035, 2036, 2037];
    component.anoSelecionado = 2040;

    component.adicionarAnoAoGraficoSaldo();

    expect(component.anosSaldoSelecionados).toEqual([
      2026, 2027, 2035, 2036, 2037, 2040,
    ]);

    component.anoSelecionado = 2041;
    expect(component.podeAdicionarAnoGraficoSaldo).toBe(false);
    component.adicionarAnoAoGraficoSaldo();

    expect(component.anosSaldoSelecionados).not.toContain(2041);
  });

  it('adicionarAnoAoGraficoSaldo preserva comparações ao navegar entre anos', () => {
    component.anosSaldoSelecionados = [component.anoAtual];
    component.anoSelecionado = component.anoAtual + 1;
    component.adicionarAnoAoGraficoSaldo();
    expect(component.anosSaldoSelecionados).toEqual([
      component.anoAtual,
      component.anoAtual + 1,
    ]);

    component.anoSelecionado = component.anoAtual + 2;
    component.onAnoChange();
    expect(component.anosSaldoSelecionados).toEqual([component.anoAtual + 2]);

    component.adicionarAnoAoGraficoSaldo();
    expect(component.anosSaldoSelecionados).toEqual([
      component.anoAtual,
      component.anoAtual + 1,
      component.anoAtual + 2,
    ]);
  });

  it('limparFiltrosGraficoSaldo volta para o ano atual', () => {
    component.anoSelecionado = 2040;
    component.anosSaldoSelecionados = [2026, 2027, 2040];
    component.adicionarAnoAoGraficoSaldo();

    component.limparFiltrosGraficoSaldo();

    expect(component.anoSelecionado).toBe(component.anoAtual);
    expect(component.anosSaldoSelecionados).toEqual([component.anoAtual]);
  });

  it('removerAnoDoGraficoSaldo mantém pelo menos um ano selecionado', () => {
    component.anosSaldoSelecionados = [2026, 2027];

    component.removerAnoDoGraficoSaldo(2027);
    expect(component.anosSaldoSelecionados).toEqual([2026]);

    component.removerAnoDoGraficoSaldo(2026);
    expect(component.anosSaldoSelecionados).toEqual([2026]);
  });

  it('getCorGraficoSaldo diferencia passado, presente e futuro', () => {
    const getCorGraficoSaldo = (
      component as unknown as { getCorGraficoSaldo: (ano: number) => string }
    ).getCorGraficoSaldo.bind(component);

    expect(getCorGraficoSaldo(component.anoAtual - 3)).toBe('#DC2626');
    expect(getCorGraficoSaldo(component.anoAtual - 2)).toBe('#F97316');
    expect(getCorGraficoSaldo(component.anoAtual - 1)).toBe('#FACC15');
    expect(getCorGraficoSaldo(component.anoAtual)).toBe('#7C3AED');
    expect(getCorGraficoSaldo(component.anoAtual + 1)).toBe('#2563EB');
    expect(getCorGraficoSaldo(component.anoAtual + 2)).toBe('#38BDF8');
    expect(getCorGraficoSaldo(component.anoAtual + 3)).toBe('#06B6D4');
    expect(getCorGraficoSaldo(component.anoAtual + 4)).toBe('#2DD4BF');
    expect(getCorGraficoSaldo(component.anoAtual + 20)).toBe('#2DD4BF');
  });

  it('randomDataset gera mergeOptions.dataset.source com 13x8', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    component.randomDataset();

    const ds = (component.mergeOptions.dataset as { source: unknown[][] })
      .source;
    expect(ds.length).toBe(13);
    expect(ds[0]).toEqual([
      'Mês',
      '2020',
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
      '2026',
    ]);
    ds.slice(1).forEach((row) => {
      expect(row.length).toBe(8);
      expect(row.slice(1)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });
    (Math.random as jest.Mock).mockRestore();
  });

  it('selecionarVisao alterna entre resumo e categorias', () => {
    expect(component.visaoRelatorio).toBe('resumo');
    component.selecionarVisao('categorias');
    expect(component.visaoRelatorio).toBe('categorias');
    component.selecionarVisao('resumo');
    expect(component.visaoRelatorio).toBe('resumo');
  });

  // ---------- Formatters ----------

  it('tooltip do gráfico principal formata HTML contendo mês, ano e "R$"', () => {
    const fmt = (
      component.chartOption.tooltip as { formatter: (p: unknown) => string }
    ).formatter;
    const html = fmt({
      value: ['Janeiro', 1234],
      seriesIndex: 0,
      seriesName: '2020',
      name: 'Janeiro',
      color: '#000',
    });
    expect(html).toContain('Janeiro - 2020');
    expect(html).toContain('R$');
  });

  it('tooltip de Dívidas x Investimentos usa formato por série e inclui "R$"', () => {
    const fmt = (
      component.chartOptionDividasInvestimentos.tooltip as {
        formatter: (p: unknown[]) => string;
      }
    ).formatter;

    const html = fmt([
      { name: 'Março', value: 100, color: '#F44336', seriesName: 'Dívidas' },
      {
        name: 'Março',
        value: 200,
        color: '#2196F3',
        seriesName: 'Investimentos',
      },
    ]);

    expect(html).toContain('Março');
    expect(html).toContain('Dívidas');
    expect(html).toContain('Investimentos');
    expect(html).toContain('R$');
  });

  it('formatarTooltipReceitasDespesas deve montar HTML completo', () => {
    const html = (
      component as unknown as {
        formatarTooltipReceitasDespesas: (params: {
          value: number;
          seriesName: string;
          name: string;
          color: string;
        }) => string;
      }
    ).formatarTooltipReceitasDespesas({
      value: 1500,
      seriesName: 'Receitas',
      name: 'Janeiro',
      color: '#4CAF50',
    });

    expect(html).toContain('Janeiro - Receitas');
    expect(html).toContain('#4CAF50');
    expect(html).toContain('R$ 1.500,00');
  });

  it('yAxis do gráfico principal formata valores com "R$"', () => {
    const formatter = (
      component.chartOption.yAxis as {
        axisLabel: { formatter: (n: number) => string };
      }
    ).axisLabel.formatter;
    expect(formatter(4321)).toContain('R$ 4.321');
  });

  it('formatarValorRealSemCentavos deve formatar em real', () => {
    const result = (
      component as unknown as {
        formatarValorRealSemCentavos: (value: number) => string;
      }
    ).formatarValorRealSemCentavos(5000);

    expect(result).toBe('R$ 5.000');
  });

  it('formatarValorRealComCentavos deve formatar em real com centavos', () => {
    const result = (
      component as unknown as {
        formatarValorRealComCentavos: (params: { value: number }) => string;
      }
    ).formatarValorRealComCentavos({ value: 2500 });

    expect(result).toBe('R$ 2.500,00');
  });

  it('label formatter de Receitas deve formatar valor em real com centavos', () => {
    const series = component.chartOptionReceitasDespesas.series as {
      label: {
        formatter: (params: { value: number }) => string;
      };
    }[];
    const formatter = series[0].label.formatter;
    expect(formatter({ value: 2000 })).toContain('R$ 2.000,00');
  });

  it('label formatter de Despesas deve formatar valor em real com centavos', () => {
    const series = component.chartOptionReceitasDespesas.series as {
      label: {
        formatter: (params: { value: number }) => string;
      };
    }[];

    const formatter = series[1].label.formatter;

    expect(formatter({ value: 2500 })).toBe('R$ 2.500,00');
  });

  it('formatter inicial de Receitas/Despesas deve chamar formatarTooltipReceitasDespesas', () => {
    const formatter = (
      component.chartOptionReceitasDespesas.tooltip as {
        formatter: (params: unknown) => string;
      }
    ).formatter;

    const html = formatter({
      value: 1500,
      seriesName: 'Receitas',
      name: 'Janeiro',
      color: '#4CAF50',
    });

    expect(html).toContain('Janeiro - Receitas');
    expect(html).toContain('R$ 1.500,00');
  });

  it('formatter inicial de Dívidas/Investimentos deve montar HTML completo', () => {
    const formatter = (
      component.chartOptionDividasInvestimentos.tooltip as {
        formatter: (params: unknown[]) => string;
      }
    ).formatter;

    const html = formatter([
      {
        name: 'Março',
        value: 1000,
        color: '#F44336',
        seriesName: 'Dívidas',
      },
      {
        name: 'Março',
        value: 2000,
        color: '#2196F3',
        seriesName: 'Investimentos',
      },
    ]);

    expect(html).toContain('Março');
    expect(html).toContain('Dívidas: R$ 1.000,00');
    expect(html).toContain('Investimentos: R$ 2.000,00');
    expect(html).toContain('#F44336');
    expect(html).toContain('#2196F3');
  });

  it('chartOptionReceitasDespesas deve chamar formatarTooltipReceitasDespesas no formatter', () => {
    const spy = jest.spyOn(
      component as never,
      'formatarTooltipReceitasDespesas',
    );

    const formatter = (
      component.chartOptionReceitasDespesas.tooltip as {
        formatter: (params: unknown) => string;
      }
    ).formatter;

    formatter({
      value: 1500,
      seriesName: 'Receitas',
      name: 'Janeiro',
      color: '#4CAF50',
    });

    expect(spy).toHaveBeenCalled();
  });

  it('chartOptionReceitasDespesas deve chamar formatarValorRealSemCentavos no yAxis', () => {
    const spy = jest.spyOn(component as any, 'formatarValorRealSemCentavos');

    const formatter = (
      component.chartOptionReceitasDespesas.yAxis as {
        axisLabel: {
          formatter: (value: number) => string;
        };
      }
    ).axisLabel.formatter;

    formatter(5000);

    expect(spy).toHaveBeenCalledWith(5000);
  });

  it('chartOptionReceitasDespesas deve chamar formatarValorRealComCentavos nos labels', () => {
    const spy = jest.spyOn(component as any, 'formatarValorRealComCentavos');

    const series = component.chartOptionReceitasDespesas.series as {
      label: {
        formatter: (params: { value: number }) => string;
      };
    }[];

    series[0].label.formatter({ value: 2000 });
    series[1].label.formatter({ value: 3000 });

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('chartOptionReceitasDespesas deve chamar formatarTooltipReceitasDespesas no tooltip', () => {
    const spy = jest.spyOn(component as any, 'formatarTooltipReceitasDespesas');

    const formatter = (
      component.chartOptionReceitasDespesas.tooltip as {
        formatter: (params: unknown) => string;
      }
    ).formatter;

    formatter({
      value: 1500,
      seriesName: 'Receitas',
      name: 'Janeiro',
      color: '#4CAF50',
    });

    expect(spy).toHaveBeenCalled();
  });

  it('chartOptionDividasInvestimentos deve chamar formatarValorRealSemCentavos no yAxis', () => {
    const spy = jest.spyOn(component as never, 'formatarValorRealSemCentavos');

    const formatter = (
      component.chartOptionDividasInvestimentos.yAxis as {
        axisLabel: { formatter: (value: number) => string };
      }
    ).axisLabel.formatter;

    formatter(4000);

    expect(spy).toHaveBeenCalledWith(4000);
  });

  it('label formatter inicial de Dívidas deve formatar valor com centavos', () => {
    const series = component.chartOptionDividasInvestimentos.series as {
      label: {
        formatter: (params: { value: number }) => string;
      };
    }[];

    const result = series[0].label.formatter({ value: 3456 });

    expect(result).toBe('R$ 3.456,00');
  });

  // it('testeAno() dispara alert com o ano selecionado', () => {
  //   const spy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  //   component.anoSelecionado = 2024;
  //   component.testeAno();
  //   expect(spy).toHaveBeenCalledWith('Ano selecionado: 2024');
  //   spy.mockRestore();
  // });

  it('getDatasetSource usa 0 quando um ano não existe (cobre o ramo "else")', () => {
    component.anosSaldoSelecionados = [2025];
    delete (component.dadosPorAno as Record<number, unknown>)[2025];
    const src = (
      component as unknown as { getDatasetSource: () => unknown[][] }
    ).getDatasetSource();
    const header = src[0] as string[];
    const col2025 = header.indexOf('2025');
    expect(col2025).toBeGreaterThan(0);
    for (let i = 1; i < src.length; i++) {
      expect((src[i] as number[])[col2025]).toBe(0);
    }
  });

  it('propriedades mantêm valores anteriores quando o ano não existe (fallback)', () => {
    component.anoSelecionado = new Date().getFullYear();
    component.onAnoChange();

    const receitasAtuais = [...component.dadosReceitas];
    const despesasAtuais = [...component.dadosDespesas];
    const dividasAtuais = [...component.dadosDividas];
    const investimentosAtuais = [...component.dadosInvestimentos];

    component.anoSelecionado = 1999;
    component.onAnoChange();

    expect(component.dadosReceitas).toEqual(receitasAtuais);
    expect(component.dadosDespesas).toEqual(despesasAtuais);
    expect(component.dadosDividas).toEqual(dividasAtuais);
    expect(component.dadosInvestimentos).toEqual(investimentosAtuais);
  });

  it('getReceitas e getDespesas são chamados 12 vezes ao carregar o ano (forkJoin por mês)', (done) => {
    const callsReceitas = receitasStub.getReceitas.mock.calls.length;
    const callsDespesas = despesasStub.getDespesas.mock.calls.length;
    component['carregarReceitasAno']?.(2026);
    component['carregarDespesasAno']?.(2026);
    setTimeout(() => {
      expect(
        receitasStub.getReceitas.mock.calls.length - callsReceitas,
      ).toBeGreaterThanOrEqual(12);
      expect(
        despesasStub.getDespesas.mock.calls.length - callsDespesas,
      ).toBeGreaterThanOrEqual(12);
      done();
    }, 0);
  });

  it('sincronizarGraficoSaldoECharts deve retornar quando chartSaldo não existe', () => {
    component.chartSaldo = undefined as never;

    expect(() =>
      (
        component as unknown as {
          sincronizarGraficoSaldoECharts: () => void;
        }
      ).sincronizarGraficoSaldoECharts(),
    ).not.toThrow();
  });

  it('sincronizarGraficoSaldoECharts deve usar instância existente', () => {
    const el = document.createElement('div');
    const instanciaExistente = {
      setOption: jest.fn(),
    };

    component.chartSaldo = { nativeElement: el } as never;

    echartsInitMock.mockClear();
    echartsGetInstanceMock.mockClear();

    echartsGetInstanceMock.mockReturnValue(instanciaExistente);

    (
      component as unknown as {
        sincronizarGraficoSaldoECharts: () => void;
      }
    ).sincronizarGraficoSaldoECharts();

    expect(echartsGetInstanceMock).toHaveBeenCalledWith(el);
    expect(echartsInitMock).not.toHaveBeenCalled();
    expect(instanciaExistente.setOption).toHaveBeenCalled();
  });

  it('sincronizarGraficoSaldoECharts deve chamar e.init(el)', () => {
    const el = document.createElement('div');

    component.chartSaldo = { nativeElement: el } as never;

    echartsInitMock.mockClear();
    echartsGetInstanceMock.mockClear();
    chartMock.setOption.mockClear();

    echartsGetInstanceMock.mockImplementation(() => undefined);

    (
      component as unknown as {
        sincronizarGraficoSaldoECharts: () => void;
      }
    ).sincronizarGraficoSaldoECharts();

    expect(echartsGetInstanceMock).toHaveBeenCalledWith(el);
    expect(echartsInitMock).toHaveBeenCalledWith(el);
    expect(chartMock.setOption).toHaveBeenCalled();
  });

  it('sincronizarGraficosBarraELinha deve chamar e.init(el2)', () => {
    const el2 = document.createElement('div');

    component.chartReceitasDespesas = { nativeElement: el2 } as never;
    component.chartDividasInvestimentos = undefined as never;

    echartsInitMock.mockClear();
    echartsGetInstanceMock.mockClear();
    chartMock.setOption.mockClear();

    echartsGetInstanceMock.mockImplementation(() => undefined);

    (
      component as unknown as {
        sincronizarGraficosBarraELinha: () => void;
      }
    ).sincronizarGraficosBarraELinha();

    expect(echartsGetInstanceMock).toHaveBeenCalledWith(el2);
    expect(echartsInitMock).toHaveBeenCalledWith(el2);
    expect(chartMock.setOption).toHaveBeenCalled();
  });

  it('sincronizarGraficosBarraELinha deve chamar e.init(el3)', () => {
    const el3 = document.createElement('div');

    component.chartReceitasDespesas = undefined as never;
    component.chartDividasInvestimentos = { nativeElement: el3 } as never;

    echartsInitMock.mockClear();
    echartsGetInstanceMock.mockClear();
    chartMock.setOption.mockClear();

    echartsGetInstanceMock.mockImplementation(() => undefined);

    (
      component as unknown as {
        sincronizarGraficosBarraELinha: () => void;
      }
    ).sincronizarGraficosBarraELinha();

    expect(echartsGetInstanceMock).toHaveBeenCalledWith(el3);
    expect(echartsInitMock).toHaveBeenCalledWith(el3);
    expect(chartMock.setOption).toHaveBeenCalled();
  });

  it('sincronizarGraficosBarraELinha deve retornar quando não existem gráficos de barra/linha', () => {
    component.chartReceitasDespesas = undefined as never;
    component.chartDividasInvestimentos = undefined as never;

    expect(() =>
      (
        component as unknown as {
          sincronizarGraficosBarraELinha: () => void;
        }
      ).sincronizarGraficosBarraELinha(),
    ).not.toThrow();
  });

  it('sincronizarGraficosBarraELinha deve usar instância existente dos dois gráficos', () => {
    const el2 = document.createElement('div');
    const el3 = document.createElement('div');

    const intanciaEl2 = { setOption: jest.fn() };
    const intanciaEl3 = { setOption: jest.fn() };

    component.chartReceitasDespesas = { nativeElement: el2 } as never;
    component.chartDividasInvestimentos = { nativeElement: el3 } as never;

    echartsInitMock.mockClear();
    echartsGetInstanceMock.mockClear();

    echartsGetInstanceMock.mockImplementation((el: HTMLDivElement) => {
      if (el === el2) return intanciaEl2;
      return intanciaEl3;
    });

    (
      component as unknown as {
        sincronizarGraficosBarraELinha: () => void;
      }
    ).sincronizarGraficosBarraELinha();

    expect(echartsGetInstanceMock).toHaveBeenCalledWith(el2);
    expect(echartsGetInstanceMock).toHaveBeenCalledWith(el3);
    expect(echartsInitMock).not.toHaveBeenCalled();
    expect(intanciaEl2.setOption).toHaveBeenCalled();
    expect(intanciaEl3.setOption).toHaveBeenCalled();
  });

  it('agregarReceitasPorCategorias deve ignorar valor zero e agrupar por categoria', () => {
    const listas = Array.from({ length: 12 }, () => []);

    listas[0] = [
      { valor: 1000, natureza: 'fixa', categoria: 'Salário' },
      { valor: 500, natureza: 'variavel', categoria: 'Freela' },
      { valor: 0, natureza: 'variavel', categoria: 'Ignorar' },
      { valor: 200, natureza: 'variavel', categoria: '' },
    ] as never[];

    (
      component as unknown as {
        agregarReceitasPorCategorias: (listas: unknown[][]) => void;
      }
    ).agregarReceitasPorCategorias(listas);

    expect(component.naturezaReceitaLinhas[0].total).toBe(1000);
    expect(component.naturezaReceitaLinhas[1].total).toBe(700);

    const tipos = component.receitasPorTipoLinhas;
    expect(
      tipos.find((c) => c.tipo === 'Freela' && c.total === 500),
    ).toBeTruthy();
    expect(
      tipos.find((c) => c.tipo === 'Outras' && c.total === 200),
    ).toBeTruthy();
    expect(
      tipos.find((c) => c.tipo === 'Salário' && c.total === 1000),
    ).toBeTruthy();
  });

  it('agregarDespesasPorCategorias deve ignorar valor zero e agrupar por categoria', () => {
    const listas = Array.from({ length: 12 }, () => [] as unknown[]);

    listas[0] = [
      {
        valor: 300,
        natureza: 'fixa',
        categoria: 'Moradia',
      },
      {
        valor: 150,
        natureza: 'variavel',
        categoria: 'Alimentação',
      },
      { valor: 0, natureza: 'variavel', categoria: 'Ignorar' },
      { valor: 50, natureza: 'variavel', categoria: '' },
    ];

    (
      component as unknown as {
        agregarDespesasPorCategorias: (listas: unknown[][]) => void;
      }
    ).agregarDespesasPorCategorias(listas as never[][]);

    expect(component.naturezaDespesaLinhas[0].total).toBe(300);
    expect(component.naturezaDespesaLinhas[1].total).toBe(200);

    const categorias = component.despesasPorCategoriaLinhas;
    expect(
      categorias.find((c) => c.categoria === 'Moradia' && c.total === 300),
    ).toBeTruthy();
    expect(
      categorias.find((c) => c.categoria === 'Alimentação' && c.total === 150),
    ).toBeTruthy();
    expect(
      categorias.find((c) => c.categoria === 'Outras' && c.total === 50),
    ).toBeTruthy();
  });

  it('carregarReceitasAno deve retornar quando ano não existe', () => {
    const callsAntes = receitasStub.getReceitas.mock.calls.length;

    (
      component as unknown as {
        carregarReceitasAno: (ano: number) => void;
      }
    ).carregarReceitasAno(1999);

    expect(receitasStub.getReceitas.mock.calls.length).toBe(callsAntes);
  });

  it('carregarDespesasAno deve retornar quando ano não existe', () => {
    const callsAntes = despesasStub.getDespesas.mock.calls.length;

    (
      component as unknown as {
        carregarDespesasAno: (ano: number) => void;
      }
    ).carregarDespesasAno(1999);

    expect(despesasStub.getDespesas.mock.calls.length).toBe(callsAntes);
  });

  it('carregarReceitasAno deve tratar erro da API e usar lista vazia', (done) => {
    receitasStub.getReceitas.mockReturnValueOnce(
      throwError(() => new Error('erro')),
    );

    (
      component as unknown as {
        carregarReceitasAno: (ano: number) => void;
      }
    ).carregarReceitasAno(2026);

    setTimeout(() => {
      expect(component.dadosPorAno[2026].receitas.length).toBe(12);
      done();
    }, 0);
  });

  it('carregarDespesasAno deve tratar erro da API e usar lista vazia', (done) => {
    despesasStub.getDespesas.mockReturnValueOnce(
      throwError(() => new Error('erro')),
    );

    (
      component as unknown as {
        carregarDespesasAno: (ano: number) => void;
      }
    ).carregarDespesasAno(2026);

    setTimeout(() => {
      expect(component.dadosPorAno[2026].despesas.every((v) => v === 0)).toBe(
        true,
      );
      done();
    }, 0);
  });
});
