import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RelatorioPageComponent } from './relatorio-page.component';
import { NGX_ECHARTS_CONFIG } from 'ngx-echarts';

describe('RelatorioPageComponent', () => {
  let component: RelatorioPageComponent;
  let fixture: ComponentFixture<RelatorioPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioPageComponent],
    })
      .overrideComponent(RelatorioPageComponent, {
        set: {
          template: '<div data-testid="stub"></div>',
          providers: [
            {
              provide: NGX_ECHARTS_CONFIG,
              useValue: {
                echarts: () => Promise.resolve({ _mock: true }),
              },
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RelatorioPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('inicia no ano 2024 com 12 valores em cada série', () => {
    expect(component.anoSelecionado).toBe(2024);
    expect(component.dadosReceitas.length).toBe(12);
    expect(component.dadosDespesas.length).toBe(12);
    expect(component.dadosDividas.length).toBe(12);
    expect(component.dadosInvestimentos.length).toBe(12);
  });

  it('dadosTotal (Jan/2024) = receitas - despesas - dívidas - investimentos', () => {
    const i = 0;
    const ds = component.dadosPorAno[2024];
    const esperado =
      ds.receitas[i] - ds.despesas[i] - ds.dividas[i] - ds.investimentos[i];
    expect(component.dadosTotal[i]).toBeCloseTo(esperado, 6);
  });

  it('totais e saldoTotal fecham a conta', () => {
    const r = component.dadosReceitas.reduce((s, v) => s + v, 0);
    const d = component.dadosDespesas.reduce((s, v) => s + v, 0);
    const di = component.dadosDividas.reduce((s, v) => s + v, 0);
    const inv = component.dadosInvestimentos.reduce((s, v) => s + v, 0);

    expect(component.totalReceitas).toBeCloseTo(r, 6);
    expect(component.totalDespesas).toBeCloseTo(d, 6);
    expect(component.totalDividas).toBeCloseTo(di, 6);
    expect(component.totalInvestimentos).toBeCloseTo(inv, 6);
    expect(component.saldoTotal).toBeCloseTo(r - d - di - inv, 6);
  });

  it('dataset do gráfico principal: 13 linhas (header + 12) e 7 colunas', () => {
    const src = (component.chartOption.dataset as any).source as any[];
    expect(src.length).toBe(component.meses.length + 1);
    expect(src[0]).toEqual([
      'Mês',
      '2020',
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
    ]);
    src.slice(1).forEach((row) => expect(row.length).toBe(7));
  });

  it('getDatasetSource calcula saldos por ano (linha de Janeiro)', () => {
    const source = (component as any).getDatasetSource() as any[];
    const header = source[0];
    const janeiro = source[1];

    expect(header).toEqual([
      'Mês',
      '2020',
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
    ]);
    expect(janeiro[0]).toBe('Janeiro');

    for (let col = 1, ano = 2020; ano <= 2025; ano++, col++) {
      const ds = component.dadosPorAno[ano];
      const esperado =
        ds.receitas[0] - ds.despesas[0] - ds.dividas[0] - ds.investimentos[0];
      expect(janeiro[col]).toBeCloseTo(esperado, 6);
    }
  });

  it('onAnoChange atualiza séries de Receitas/Despesas com o ano selecionado', () => {
    component.anoSelecionado = 2025;
    component.onAnoChange();

    const opt: any = component.chartOptionReceitasDespesas;
    expect(opt.series[0].data).toEqual(component.dadosReceitas);
    expect(opt.series[1].data).toEqual(component.dadosDespesas);

    // yAxis formatter deve conter "R$"
    const fmt: (n: number) => string = opt.yAxis.axisLabel.formatter;
    expect(fmt(1234)).toContain('R$');
  });

  it('randomDataset gera mergeOptions.dataset.source com 13x7', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // determinístico
    component.randomDataset();

    const ds = (component.mergeOptions.dataset as any).source as any[];
    expect(ds.length).toBe(13);
    expect(ds[0]).toEqual([
      'Mês',
      '2020',
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
    ]);
    ds.slice(1).forEach((row) => {
      expect(row.length).toBe(7);
      expect(row.slice(1)).toEqual([0, 0, 0, 0, 0, 0]); // com random=0.5 cai em 0
    });
  });

  // ---------- Formatters ----------

  it('tooltip do gráfico principal formata HTML contendo mês, ano e "R$"', () => {
    const fmt: (p: any) => string = (component.chartOption.tooltip as any)
      .formatter;
    const html = fmt({
      value: ['Janeiro', 1234], // value[seriesIndex+1]
      seriesIndex: 0, // pega value[1]
      seriesName: '2020',
      name: 'Janeiro',
      color: '#000',
    });
    expect(html).toContain('Janeiro - 2020');
    expect(html).toContain('R$');
  });

  it('tooltip de Receitas/Despesas inclui tipo, mês e "R$"', () => {
    const fmt: (p: any) => string = (
      component.chartOptionReceitasDespesas.tooltip as any
    ).formatter;
    const html = fmt({
      value: 9876.54,
      seriesName: 'Receitas',
      name: 'Fevereiro',
      color: '#4CAF50',
    });
    expect(html).toContain('Fevereiro - Receitas');
    expect(html).toContain('R$');
  });

  it('tooltip de Dívidas x Investimentos usa formato por série e inclui "R$"', () => {
    const fmt: (p: any[]) => string = (
      component.chartOptionDividasInvestimentos.tooltip as any
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

  it('yAxis do gráfico principal formata valores com "R$"', () => {
    const fmt: (n: number) => string = (component.chartOption.yAxis as any)
      .axisLabel.formatter;
    expect(fmt(4321)).toContain('R$');
  });

  it('yAxis formatter do gráfico Receitas/Despesas formata com "R$"', () => {
    const fmt: (n: number) => string = (
      component.chartOptionReceitasDespesas.yAxis as any
    ).axisLabel.formatter;
    expect(fmt(1234567)).toContain('R$');
  });

  it('label.formatter de Receitas e Despesas inclui "R$"', () => {
    const series = component.chartOptionReceitasDespesas.series as any[];
    const fmtR: (p: any) => string = series[0].label.formatter;
    const fmtD: (p: any) => string = series[1].label.formatter;
    expect(fmtR({ value: 1000 })).toContain('R$');
    expect(fmtD({ value: 2000 })).toContain('R$');
  });

  it('yAxis formatter do gráfico Dívidas x Investimentos formata com "R$"', () => {
    const fmt: (n: number) => string = (
      component.chartOptionDividasInvestimentos.yAxis as any
    ).axisLabel.formatter;
    expect(fmt(4321)).toContain('R$');
  });

  it('label.formatter da série Dívidas inclui "R$"', () => {
    const s = (component.chartOptionDividasInvestimentos.series as any[])[0];
    const fmt: (p: any) => string = s.label.formatter;
    expect(fmt({ value: 3456 })).toContain('R$');
  });

  it('testeAno() dispara alert com o ano selecionado', () => {
    const spy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    component.anoSelecionado = 2024;
    component.testeAno();
    expect(spy).toHaveBeenCalledWith('Ano selecionado: 2024');
    spy.mockRestore();
  });

  it('getDatasetSource usa 0 quando um ano não existe (cobre o ramo "else")', () => {
    delete (component.dadosPorAno as any)[2025]; // força o else
    const src = (component as any).getDatasetSource() as any[];
    const header = src[0];
    const col2025 = header.indexOf('2025');
    expect(col2025).toBeGreaterThan(0);
    for (let i = 1; i < src.length; i++) {
      expect(src[i][col2025]).toBe(0);
    }
  });

  it('getters retornam [] quando o ano não existe (fallback)', () => {
    component.anoSelecionado = 1999; // ano inexistente
    expect(component.dadosReceitas).toEqual([]);
    expect(component.dadosDespesas).toEqual([]);
    expect(component.dadosDividas).toEqual([]);
    expect(component.dadosInvestimentos).toEqual([]);
  });

  it('provider NGX_ECHARTS_CONFIG.echarts é chamável', async () => {
    const cfg = fixture.debugElement.injector.get(NGX_ECHARTS_CONFIG) as {
      echarts: () => Promise<any>;
    };
    const mod = await cfg.echarts(); // <- await direto
    expect(mod).toBeDefined();
  });
});
