import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import * as echarts from 'echarts';
import { InvestimentosPageComponent } from './investimentos-page.component';
import { InvestimentosService } from '@core/services/investimentos/investimentos.service';
import { Investimento } from '@core/interfaces/investimentos/investimentos';

jest.mock('echarts', () => ({
  init: jest.fn(),
  getInstanceByDom: jest.fn(),
  graphic: {
    LinearGradient: jest.fn(function LinearGradientMock() {
      return {};
    }),
  },
}));

const TEMPLATE_GRAFICOS = `
  <div>
    <div #chartPatrimonio></div>
    <div #chartRendimento></div>
    <div #chartPizza></div>
  </div>
`;

describe('InvestimentosPageComponent', () => {
  let component: InvestimentosPageComponent;
  let fixture: ComponentFixture<InvestimentosPageComponent>;

  const investimentosServiceMock = {
    getAnoSelecionado: jest.fn(),
    setAnoSelecionado: jest.fn(),
    getInvestimentos: jest.fn(),
    deleteInvestimento: jest.fn(),
  };

  const dialogMock = { open: jest.fn() };

  const echartsInitMock = echarts.init as jest.Mock;
  const echartsGetInstanceMock = echarts.getInstanceByDom as jest.Mock;
  const chartMock = {
    setOption: jest.fn(),
    dispose: jest.fn(),
  };

  const criarInvestimento = (id: number): Investimento => ({
    id,
    descricao: `Inv ${id}`,
    tipoInvestimento: 'cdb',
    valorInvestido: 1000,
    valorAtual: 1100,
    aporteMensal: 100,
    rentabilidade: 100,
    rentabilidadePercentual: 10,
    statusInvestimento: 'crescendo',
    ano: 2026,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    echartsInitMock.mockReturnValue(chartMock);
    echartsGetInstanceMock.mockReturnValue(null);

    investimentosServiceMock.getAnoSelecionado.mockReturnValue(2026);
    investimentosServiceMock.getInvestimentos.mockReturnValue(of([]));
    investimentosServiceMock.deleteInvestimento.mockReturnValue(of(void 0));
    dialogMock.open.mockReturnValue({ afterClosed: () => of(false) });

    await TestBed.configureTestingModule({
      declarations: [InvestimentosPageComponent],
      imports: [FormsModule],
      providers: [
        { provide: InvestimentosService, useValue: investimentosServiceMock },
        { provide: MatDialog, useValue: dialogMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(InvestimentosPageComponent, {
        set: { template: TEMPLATE_GRAFICOS },
      })
      .compileComponents();

    fixture = TestBed.createComponent(InvestimentosPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    jest.runOnlyPendingTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve criar', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit carrega investimentos do ano selecionado', () => {
    expect(investimentosServiceMock.getAnoSelecionado).toHaveBeenCalled();
    expect(investimentosServiceMock.getInvestimentos).toHaveBeenCalledWith({
      ano: 2026,
      tipo: undefined,
    });
  });

  describe('paginação da tabela', () => {
    it('não exibe paginação com até 5 investimentos', () => {
      component.investimentos = Array.from({ length: 5 }, (_, i) =>
        criarInvestimento(i + 1),
      );
      component.paginaTabela = 1;

      expect(component.exibirPaginacaoTabela).toBe(false);
      expect(component.investimentosPaginados.length).toBe(5);
    });

    it('exibe paginação com 6 ou mais investimentos', () => {
      component.investimentos = Array.from({ length: 6 }, (_, i) =>
        criarInvestimento(i + 1),
      );
      component.paginaTabela = 1;

      expect(component.exibirPaginacaoTabela).toBe(true);
      expect(component.investimentosPaginados.length).toBe(5);
      expect(component.totalPaginasTabela).toBe(2);
    });

    it('paginaProximaTabela avança e paginaAnteriorTabela volta', () => {
      component.investimentos = Array.from({ length: 7 }, (_, i) =>
        criarInvestimento(i + 1),
      );
      component.paginaTabela = 1;

      component.paginaProximaTabela();
      expect(component.paginaTabela).toBe(2);
      expect(component.investimentosPaginados.length).toBe(2);

      component.paginaAnteriorTabela();
      expect(component.paginaTabela).toBe(1);
    });
  });

  describe('navegação de ano', () => {
    it('anoAnterior decrementa e persiste', () => {
      component.anoSelecionado = 2026;
      const carregarSpy = jest.spyOn(component, 'carregar');

      component.anoAnterior();

      expect(component.anoSelecionado).toBe(2025);
      expect(investimentosServiceMock.setAnoSelecionado).toHaveBeenCalledWith(
        2025,
      );
      expect(carregarSpy).toHaveBeenCalled();
    });

    it('anoAnterior não altera abaixo do mínimo', () => {
      component.anoSelecionado = 2020;
      component.anoAnterior();
      expect(component.anoSelecionado).toBe(2020);
    });

    it('voltarParaAnoAtual usa ano corrente', () => {
      const ano = new Date().getFullYear();
      component.anoSelecionado = 2019;
      component.voltarParaAnoAtual();
      expect(component.anoSelecionado).toBe(ano);
    });
  });

  describe('estado e resumo', () => {
    it('exibirAvisoVazio quando lista vazia e não carregando', () => {
      component.carregando = false;
      component.investimentos = [];
      expect(component.exibirAvisoVazio).toBe(true);
      expect(component.ocultarConteudo).toBe(true);
    });

    it('resumo calcula totais', () => {
      component.investimentos = [criarInvestimento(1)];
      expect(component.resumo.totalInvestido).toBe(1000);
      expect(component.resumo.patrimonioAtual).toBe(1100);
    });

    it('carregar trata erro HTTP', () => {
      investimentosServiceMock.getInvestimentos.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 })),
      );

      component.carregar();

      expect(component.erroCarregar).toContain('API de investimentos');
      expect(component.investimentos).toEqual([]);
    });
  });

  describe('ações', () => {
    it('onTipoFiltroChange recarrega', () => {
      const spy = jest.spyOn(component, 'carregar');
      component.onTipoFiltroChange();
      expect(spy).toHaveBeenCalled();
    });

    it('abrirModalAdicionar abre dialog', () => {
      component.abrirModalAdicionar();
      expect(dialogMock.open).toHaveBeenCalled();
    });

    it('confirmarExcluir chama delete quando confirmado', () => {
      dialogMock.open.mockReturnValueOnce({ afterClosed: () => of(true) });
      const inv = criarInvestimento(1);
      const carregarSpy = jest.spyOn(component, 'carregar');

      component.confirmarExcluir(inv);

      expect(investimentosServiceMock.deleteInvestimento).toHaveBeenCalledWith(
        1,
      );
      expect(carregarSpy).toHaveBeenCalled();
    });
  });

  it('progressoPatrimonio calcula percentual limitado a 100', () => {
    expect(
      component.progressoPatrimonio({
        ...criarInvestimento(1),
        valorInvestido: 1000,
        valorAtual: 500,
      }),
    ).toBe(50);

    expect(
      component.progressoPatrimonio({
        ...criarInvestimento(1),
        valorInvestido: 0,
        valorAtual: 500,
      }),
    ).toBe(0);
  });

  it('lucroPositivo retorna true para zero ou positivo', () => {
    expect(component.lucroPositivo(0)).toBe(true);
    expect(component.lucroPositivo(10)).toBe(true);
    expect(component.lucroPositivo(-1)).toBe(false);
  });

  it('ngOnDestroy dispõe gráficos registrados', () => {
    (component as unknown as { charts: typeof chartMock[] }).charts = [
      chartMock,
    ];
    component.ngOnDestroy();
    expect(chartMock.dispose).toHaveBeenCalled();
  });

  describe('getters auxiliares', () => {
    it('estaEmAnoFuturo e exibirBotaoVoltarAnoAtual', () => {
      component.anoSelecionado = component.anoAtual + 1;
      expect(component.estaEmAnoFuturo).toBe(true);

      component.carregando = false;
      component.investimentos = [];
      expect(component.exibirBotaoVoltarAnoAtual).toBe(true);
    });

    it('podeProximoAno retorna true', () => {
      expect(component.podeProximoAno).toBe(true);
    });

    it('exibindoDeTabela retorna 0 sem investimentos', () => {
      component.investimentos = [];
      expect(component.exibindoDeTabela).toBe(0);
    });

    it('exibindoDeTabela e exibindoAteTabela na segunda página', () => {
      component.investimentos = Array.from({ length: 6 }, (_, i) =>
        criarInvestimento(i + 1),
      );
      component.paginaTabela = 2;

      expect(component.exibindoDeTabela).toBe(6);
      expect(component.exibindoAteTabela).toBe(6);
    });

    it('paginaProximaTabela não avança na última página', () => {
      component.investimentos = Array.from({ length: 6 }, (_, i) =>
        criarInvestimento(i + 1),
      );
      component.paginaTabela = 2;
      component.paginaProximaTabela();
      expect(component.paginaTabela).toBe(2);
    });

    it('paginaAnteriorTabela não retrocede na primeira página', () => {
      component.paginaTabela = 1;
      component.paginaAnteriorTabela();
      expect(component.paginaTabela).toBe(1);
    });

    it('normalizarIndicePagina ajusta página maior que o total', () => {
      component.investimentos = Array.from({ length: 6 }, (_, i) =>
        criarInvestimento(i + 1),
      );
      component.paginaTabela = 10;

      (
        component as unknown as { normalizarIndicePagina: () => void }
      ).normalizarIndicePagina();

      expect(component.paginaTabela).toBe(2);
    });

    it('exibirBotaoVoltarAnoAtual é false no ano atual com lista vazia', () => {
      component.anoSelecionado = component.anoAtual;
      component.carregando = false;
      component.investimentos = [];
      expect(component.exibirBotaoVoltarAnoAtual).toBe(false);
    });

    it('estaEmAnoFuturo é false no ano atual', () => {
      component.anoSelecionado = component.anoAtual;
      expect(component.estaEmAnoFuturo).toBe(false);
    });

    it('podeAnoAnterior respeita limite mínimo', () => {
      component.anoSelecionado = 2020;
      expect(component.podeAnoAnterior).toBe(false);
      component.anoSelecionado = 2021;
      expect(component.podeAnoAnterior).toBe(true);
    });
  });

  describe('carregar e ano', () => {
    it('carregar com sucesso popula lista e agenda gráficos', () => {
      const lista = [criarInvestimento(1)];
      investimentosServiceMock.getInvestimentos.mockReturnValue(of(lista));

      component.carregar();

      expect(component.investimentos).toEqual(lista);
      expect(component.carregando).toBe(false);
      expect(component.paginaTabela).toBe(1);
      jest.runOnlyPendingTimers();
      expect(chartMock.setOption).toHaveBeenCalled();
    });

    it('carregar com filtro de tipo', () => {
      component.anoSelecionado = 2026;
      component.tipoFiltro = 'cdb';
      investimentosServiceMock.getInvestimentos.mockReturnValue(of([]));

      component.carregar();

      expect(investimentosServiceMock.getInvestimentos).toHaveBeenCalledWith({
        ano: 2026,
        tipo: 'cdb',
      });
    });

    it('carregar erro status 0', () => {
      investimentosServiceMock.getInvestimentos.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 0 })),
      );

      component.carregar();

      expect(component.erroCarregar).toContain('Servidor indisponível');
    });

    it('carregar erro genérico', () => {
      investimentosServiceMock.getInvestimentos.mockReturnValue(
        throwError(() => new Error('falha')),
      );

      component.carregar();

      expect(component.erroCarregar).toBe(
        'Não foi possível carregar os investimentos.',
      );
    });

    it('proximoAno incrementa e persiste', () => {
      component.anoSelecionado = 2025;
      const carregarSpy = jest.spyOn(component, 'carregar');

      component.proximoAno();

      expect(component.anoSelecionado).toBe(2026);
      expect(investimentosServiceMock.setAnoSelecionado).toHaveBeenCalledWith(
        2026,
      );
      expect(carregarSpy).toHaveBeenCalled();
    });
  });

  describe('dialog e edição', () => {
    it('editar abre dialog de edição', () => {
      component.editar(criarInvestimento(3));
      expect(dialogMock.open).toHaveBeenCalled();
    });

    it('abrirModalAdicionar recarrega e abre sucesso ao salvar', () => {
      dialogMock.open
        .mockReturnValueOnce({ afterClosed: () => of(true) })
        .mockReturnValueOnce({ afterClosed: () => of(undefined) });
      const carregarSpy = jest.spyOn(component, 'carregar');

      component.abrirModalAdicionar();

      expect(carregarSpy).toHaveBeenCalled();
      expect(dialogMock.open).toHaveBeenCalledTimes(2);
    });

    it('confirmarExcluir não exclui quando cancelado', () => {
      dialogMock.open.mockReturnValueOnce({ afterClosed: () => of(false) });
      component.confirmarExcluir(criarInvestimento(1));
      expect(investimentosServiceMock.deleteInvestimento).not.toHaveBeenCalled();
    });

    it('editar ao salvar exibe modal de investimento atualizado', () => {
      dialogMock.open
        .mockReturnValueOnce({ afterClosed: () => of(true) })
        .mockReturnValueOnce({ afterClosed: () => of(undefined) });

      component.editar(criarInvestimento(1));

      const modalSucesso = dialogMock.open.mock.calls[1][1] as {
        data: { title: string };
      };
      expect(modalSucesso.data.title).toContain('atualizado');
    });

    it('abrirModalAdicionar não abre sucesso quando dialog cancelado', () => {
      dialogMock.open.mockReturnValueOnce({ afterClosed: () => of(false) });
      const carregarSpy = jest.spyOn(component, 'carregar');

      component.abrirModalAdicionar();

      expect(carregarSpy).not.toHaveBeenCalled();
      expect(dialogMock.open).toHaveBeenCalledTimes(1);
    });
  });

  describe('gráficos ECharts', () => {
    type PagePrivate = {
      atualizarGraficos: () => void;
      initChart: (
        ref: { nativeElement: HTMLDivElement } | undefined,
        option: Record<string, unknown>,
      ) => void;
      opcaoGraficoPatrimonio: () => Record<string, unknown>;
      opcaoGraficoRendimento: () => Record<string, unknown>;
      opcaoGraficoPizza: () => Record<string, unknown>;
    };

    beforeEach(() => {
      component.investimentos = [
        criarInvestimento(1),
        { ...criarInvestimento(2), tipoInvestimento: 'fii', valorAtual: 2200 },
      ];
      component.carregando = false;
    });

    it('opcaoGraficoPatrimonio monta série de linha', () => {
      const priv = component as unknown as PagePrivate;
      const opt = priv.opcaoGraficoPatrimonio();
      const series = opt['series'] as { data: number[] }[];
      expect(series[0].data.length).toBe(12);
    });

    it('opcaoGraficoRendimento monta série de barras', () => {
      const priv = component as unknown as PagePrivate;
      const opt = priv.opcaoGraficoRendimento();
      const series = opt['series'] as { data: number[] }[];
      expect(series[0].data.length).toBe(12);
    });

    it('opcaoGraficoPizza agrupa por tipo', () => {
      const priv = component as unknown as PagePrivate;
      const opt = priv.opcaoGraficoPizza();
      const series = opt['series'] as { data: { name: string }[] }[];
      expect(series[0].data.length).toBeGreaterThanOrEqual(2);
    });

    it('atualizarGraficos inicializa os três gráficos', () => {
      chartMock.setOption.mockClear();
      (component as unknown as PagePrivate).atualizarGraficos();
      expect(chartMock.setOption).toHaveBeenCalled();
      expect(echartsInitMock).toHaveBeenCalled();
    });

    it('atualizarGraficos não roda quando conteúdo oculto', () => {
      component.investimentos = [];
      chartMock.setOption.mockClear();
      echartsInitMock.mockClear();
      (component as unknown as PagePrivate).atualizarGraficos();
      expect(chartMock.setOption).not.toHaveBeenCalled();
    });

    it('initChart usa instância existente do DOM', () => {
      const el = document.createElement('div');
      const existente = { setOption: jest.fn(), dispose: jest.fn() };
      echartsGetInstanceMock.mockReturnValue(existente);

      (component as unknown as PagePrivate).initChart(
        { nativeElement: el },
        { title: { text: 'Teste' } },
      );

      expect(echartsInitMock).not.toHaveBeenCalled();
      expect(existente.setOption).toHaveBeenCalled();
    });

    it('initChart ignora ref indefinida', () => {
      expect(() =>
        (component as unknown as PagePrivate).initChart(undefined, {}),
      ).not.toThrow();
    });

    it('ngAfterViewInit agenda atualização dos gráficos', () => {
      component.investimentos = [criarInvestimento(1)];
      chartMock.setOption.mockClear();
      component.ngAfterViewInit();
      jest.runOnlyPendingTimers();
      expect(chartMock.setOption).toHaveBeenCalled();
    });

    it('initChart não duplica instância na lista interna', () => {
      const el = document.createElement('div');
      echartsGetInstanceMock.mockReturnValue(chartMock);
      (component as unknown as { charts: unknown[] }).charts = [chartMock];

      (component as unknown as PagePrivate).initChart(
        { nativeElement: el },
        {},
      );

      expect((component as unknown as { charts: unknown[] }).charts).toHaveLength(
        1,
      );
    });

    it('opcaoGraficoPizza com lista vazia retorna dados vazios', () => {
      component.investimentos = [];
      const priv = component as unknown as PagePrivate;
      const opt = priv.opcaoGraficoPizza();
      const series = opt['series'] as { data: unknown[] }[];
      expect(series[0].data).toEqual([]);
    });

    it('gráficos tratam aporte e patrimônio ausentes', () => {
      component.investimentos = [
        {
          ...criarInvestimento(1),
          aporteMensal: undefined as unknown as number,
          valorAtual: null as unknown as number,
        },
      ];
      const priv = component as unknown as PagePrivate;

      expect(priv.opcaoGraficoPatrimonio()['series']).toBeDefined();
      expect(priv.opcaoGraficoRendimento()['series']).toBeDefined();

      const pizza = priv.opcaoGraficoPizza()['series'] as {
        data: { value: number }[];
      }[];
      expect(pizza[0].data[0].value).toBe(0);
    });
  });

  describe('mensagemErroHttp', () => {
    it('retorna mensagem padrão para erro HTTP não mapeado', () => {
      const msg = (
        component as unknown as { mensagemErroHttp: (e: unknown) => string }
      ).mensagemErroHttp(new HttpErrorResponse({ status: 500 }));

      expect(msg).toBe('Não foi possível carregar os investimentos.');
    });
  });
});
