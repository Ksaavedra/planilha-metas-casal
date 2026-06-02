import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import * as echarts from 'echarts';

import { RelatorioGraficosComponent } from './relatorio-graficos.component';

jest.mock('echarts', () => ({
  init: jest.fn(),
  getInstanceByDom: jest.fn(),
}));

describe('RelatorioGraficosComponent', () => {
  let component: RelatorioGraficosComponent;
  let fixture: ComponentFixture<RelatorioGraficosComponent>;
  const chartMock = {
    setOption: jest.fn(),
    resize: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RelatorioGraficosComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (echarts.init as jest.Mock).mockReturnValue(chartMock);
    (echarts.getInstanceByDom as jest.Mock).mockReturnValue(null);
    chartMock.setOption.mockClear();
    chartMock.resize.mockClear();

    fixture = TestBed.createComponent(RelatorioGraficosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve renderizar gráficos quando recebe opções válidas', () => {
    component.chartOption = { series: [{ data: [1] }] };
    component.chartOptionReceitasDespesas = { series: [{ data: [2] }] };
    component.chartOptionReceitasFixasVariaveis = { series: [{ data: [3] }] };
    component.chartOptionDespesasCategoria = { series: [{ data: [4] }] };
    component.chartOptionFaturas = { series: [{ data: [5] }] };
    component.chartOptionInvestimentos = { series: [{ data: [6] }] };
    component.chartOptionDividasDonut = { series: [{ data: [7] }] };

    component.ngAfterViewInit();

    expect(echarts.init).toHaveBeenCalledTimes(7);
    expect(chartMock.setOption).toHaveBeenCalledTimes(7);
    expect(chartMock.resize).toHaveBeenCalledTimes(7);
  });

  it('deve reutilizar instância existente do echarts', () => {
    (echarts.getInstanceByDom as jest.Mock).mockReturnValue(chartMock);
    component.chartOption = { series: [{ data: [1] }] };

    component.ngAfterViewInit();

    expect(echarts.init).not.toHaveBeenCalled();
    expect(chartMock.setOption).toHaveBeenCalledWith(component.chartOption, {
      notMerge: true,
    });
  });

  it('deve ignorar renderização sem mudanças, elemento ou opções', () => {
    component.ngOnChanges({});
    expect(echarts.init).not.toHaveBeenCalled();

    (component as any).renderChart(undefined, { series: [] });
    (component as any).renderChart(component.chartSaldo, undefined);
    (component as any).renderChart(component.chartSaldo, {});

    expect(echarts.init).not.toHaveBeenCalled();
  });

  it('deve renderizar ao receber mudanças e emitir ações auxiliares', () => {
    const removerSpy = jest.spyOn(component.removerAnoDoGraficoSaldo, 'emit');
    const voltarSpy = jest.spyOn(component.voltarParaAnoAtual, 'emit');
    component.chartOption = { series: [{ data: [1] }] };

    component.ngOnChanges({
      chartOption: new SimpleChange(undefined, component.chartOption, true),
    });
    component.removerAno(2025);
    component.voltarAoAnoAtual();

    expect(echarts.init).toHaveBeenCalledTimes(1);
    expect(removerSpy).toHaveBeenCalledWith(2025);
    expect(voltarSpy).toHaveBeenCalled();
  });

  it('deve formatar rótulo do ano atual e de comparação', () => {
    component.anoAtual = 2026;

    expect(component.rotuloAnoGraficoSaldo(2026)).toBe('2026 (atual)');
    expect(component.rotuloAnoGraficoSaldo(2025)).toBe('2025');
  });
});
