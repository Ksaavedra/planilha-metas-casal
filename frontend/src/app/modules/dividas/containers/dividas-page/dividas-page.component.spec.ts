import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ElementRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Divida, DividaNoMes } from '@core/interfaces/dividas/dividas';
import * as echarts from 'echarts';
import { DividasPageComponent } from './dividas-page.component';

describe('DividasPageComponent', () => {
  let component: DividasPageComponent;
  let fixture: ComponentFixture<DividasPageComponent>;
  let dialog: { open: jest.Mock };

  beforeEach(async () => {
    dialog = {
      open: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [DividasPageComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MatDialog, useValue: dialog },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              pathFromRoot: [{ data: { contextoDividas: 'emprestimos' } }],
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DividasPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();
  });
});

describe('DividasPageComponent - lógica da tela', () => {
  let component: DividasPageComponent;
  let dividasService: {
    getMesReferencia: jest.Mock;
    setMesReferencia: jest.Mock;
    getDividas: jest.Mock;
    updateDivida: jest.Mock;
    deleteDivida: jest.Mock;
  };
  let dialog: { open: jest.Mock };
  let route: { snapshot: { pathFromRoot: Array<{ data: Record<string, string> }> } };

  const afterClosed = (value: unknown) => ({ afterClosed: () => of(value) });

  const divida = (partial: Partial<Divida> = {}): Divida => ({
    id: partial.id ?? 1,
    objetivo: partial.objetivo ?? 'Empréstimo',
    tipoDivida: partial.tipoDivida ?? 'emprestimo',
    valorTotal: partial.valorTotal ?? 300,
    valorPago: partial.valorPago ?? 0,
    valorRestante: partial.valorRestante ?? 300,
    parcelaMensal: partial.parcelaMensal ?? 100,
    quantidadeParcelas: partial.quantidadeParcelas ?? 3,
    parcelasRestantes: partial.parcelasRestantes ?? 3,
    percentualQuitado: partial.percentualQuitado ?? 0,
    statusDivida: partial.statusDivida ?? 'pagando',
    instituicao: partial.instituicao,
    cartaoId: partial.cartaoId,
    cartaoBanco: partial.cartaoBanco,
    ano: partial.ano ?? 2026,
    dataInicio: partial.dataInicio ?? '2026-05-01',
    diaVencimento: partial.diaVencimento,
  });

  const dividaMes = (partial: Partial<DividaNoMes> = {}): DividaNoMes => ({
    ...divida(partial),
    indiceParcelaMes: partial.indiceParcelaMes ?? 1,
    valorPagoNoMes: partial.valorPagoNoMes ?? 0,
    parcelaMesPaga: partial.parcelaMesPaga ?? false,
    statusParcelaMes: partial.statusParcelaMes ?? 'pendente',
  });

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 4, 10));
    dividasService = {
      getMesReferencia: jest.fn().mockReturnValue(new Date(2026, 4, 1)),
      setMesReferencia: jest.fn(),
      getDividas: jest.fn().mockReturnValue(of([])),
      updateDivida: jest.fn().mockReturnValue(of({})),
      deleteDivida: jest.fn().mockReturnValue(of(null)),
    };
    dialog = {
      open: jest.fn().mockReturnValue(afterClosed(false)),
    };
    route = {
      snapshot: {
        pathFromRoot: [{ data: { contextoDividas: 'emprestimos' } }],
      },
    };

    component = new DividasPageComponent(
      dividasService as any,
      dialog as any,
      route as any,
    );
    component.mesAtual = new Date(2026, 4, 1);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve carregar empréstimos conforme contexto da rota', () => {
    dividasService.getDividas.mockReturnValue(
      of([
        divida({ id: 1, tipoDivida: 'emprestimo' }),
        divida({ id: 2, tipoDivida: 'financiamento' }),
      ]),
    );

    component.ngOnInit();

    expect(component.contextoDividas).toBe('emprestimos');
    expect(component.dividas.map((d) => d.id)).toEqual([1]);
    expect(component.carregando).toBe(false);
    expect(component.tituloPagina).toBe('Empréstimos do casal');
    expect(component.labelAdicionar).toBe('Adicionar empréstimo');
    expect(component.subtituloPagina).toContain('empréstimos');
    expect(component.tituloEvolucao).toContain('empréstimos');
    expect(component.tituloTabela).toContain('empréstimos');
    expect(component.labelTotalResumo).toBe('Total emprestado');
    expect(component.labelRestanteResumo).toBe('Saldo restante');
    expect(component.labelVazio).toBe('Nenhum empréstimo cadastrado');
  });

  it('deve carregar financiamentos quando contexto for financiamento', () => {
    route.snapshot.pathFromRoot = [{ data: { contextoDividas: 'financiamentos' } }];
    dividasService.getDividas.mockReturnValue(
      of([
        divida({ id: 1, tipoDivida: 'emprestimo' }),
        divida({ id: 2, tipoDivida: 'financiamento' }),
      ]),
    );

    component.ngOnInit();

    expect(component.contextoDividas).toBe('financiamentos');
    expect(component.dividas.map((d) => d.id)).toEqual([2]);
    expect(component.tituloPagina).toBe('Financiamentos do casal');
    expect(component.subtituloPagina).toContain('financiamentos');
    expect(component.tituloEvolucao).toContain('financiamentos');
    expect(component.tituloTabela).toContain('financiamentos');
    expect(component.labelTotalResumo).toBe('Valor financiado');
    expect(component.labelRestanteResumo).toBe('Saldo devedor');
    expect(component.labelVazio).toBe('Nenhum financiamento cadastrado');
  });

  it('deve tratar erro de carregamento', () => {
    dividasService.getDividas.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0 })),
    );

    component.carregar();

    expect(component.erroCarregar).toContain('Servidor indisponível');
    expect(component.dividas).toEqual([]);
    expect(component.paginaTabela).toBe(1);
    expect(component['mensagemErroHttp'](new HttpErrorResponse({ status: 404 }))).toContain('API de dívidas');
    expect(component['mensagemErroHttp'](new Error('x'))).toBe('Não foi possível carregar as dívidas.');
  });

  it('deve calcular getters de mês, resumo, vazio e paginação', () => {
    component.dividas = Array.from({ length: 7 }, (_, i) =>
      dividaMes({ id: i + 1, valorTotal: 300, valorPago: 100, valorRestante: 200 }),
    );
    component.paginaTabela = 2;

    expect(component.resumo.totalDividas).toBe(2100);
    expect(component.totaisTabela.valorTotal).toBe(2100);
    expect(component.exibirAvisoVazio).toBe(false);
    expect(component.ocultarConteudo).toBe(false);
    expect(component.nomeMesAtual).toBe('Maio 2026');
    expect(component.anoRef).toBe(2026);
    expect(component.mesRef).toBe(5);
    expect(component.exibirPaginacaoTabela).toBe(true);
    expect(component.totalPaginasTabela).toBe(2);
    expect(component.dividasPaginadas.length).toBe(2);
    expect(component.exibindoDeTabela).toBe(6);
    expect(component.exibindoAteTabela).toBe(7);

    component.paginaAnteriorTabela();
    expect(component.paginaTabela).toBe(1);
    component.paginaProximaTabela();
    expect(component.paginaTabela).toBe(2);

    component.dividas = [];
    component.paginaTabela = 1;
    expect(component.totalPaginasTabela).toBe(0);
    expect(component.exibindoDeTabela).toBe(0);
    component.paginaAnteriorTabela();
    component.paginaProximaTabela();
    expect(component.paginaTabela).toBe(1);
  });

  it('deve cobrir banco, estado vazio e mês futuro/atual', () => {
    expect(component.bancoLabel(dividaMes({ cartaoBanco: 'Nubank', instituicao: 'Banco' }))).toBe('Nubank');
    expect(component.bancoLabel(dividaMes({ cartaoBanco: '', instituicao: 'Banco' }))).toBe('Banco');
    expect(component.bancoLabel(dividaMes({ cartaoBanco: '', instituicao: '' }))).toBe('Sem cartão');
    expect(component.mesAtualLabel).toContain(String(new Date().getFullYear()));

    component.dividas = [];
    component.carregando = false;
    component.mesAtual = new Date(2026, 6, 1);
    expect(component.exibirAvisoVazio).toBe(true);
    expect(component.ocultarConteudo).toBe(true);
    expect(component.estaEmMesFuturo).toBe(true);
    expect(component.exibirBotaoVoltarMesAtual).toBe(true);

    component.carregando = true;
    expect(component.exibirAvisoVazio).toBe(false);
    expect(component.exibirBotaoVoltarMesAtual).toBe(false);

    component.carregando = false;
    component.dividas = [dividaMes({ id: 1 })];
    expect(component.exibirBotaoVoltarMesAtual).toBe(false);
  });

  it('deve alternar visão e navegar entre meses', () => {
    component.selecionarVisao('exemplos');
    expect(component.visaoDividas).toBe('exemplos');

    component.mesAnterior();
    expect(component.mesAtual.getMonth()).toBe(3);
    expect(dividasService.setMesReferencia).toHaveBeenCalled();

    component.proximoMes();
    expect(component.mesAtual.getMonth()).toBe(4);

    component.voltarParaMesAtual();
    expect(component.mesAtual.getDate()).toBe(1);
  });

  it('deve identificar botões de pagar e desfazer', () => {
    expect(component.podePagarParcela(dividaMes({ parcelaMesPaga: false, statusParcelaMes: 'pendente' }))).toBe(true);
    expect(component.podePagarParcela(dividaMes({ parcelaMesPaga: false, statusParcelaMes: 'futura' }))).toBe(false);
    expect(component.podePagarParcela(dividaMes({ parcelaMesPaga: true, statusParcelaMes: 'paga' }))).toBe(false);
    expect(component.podeDesfazerPagamento(dividaMes({ parcelaMesPaga: true, valorPagoNoMes: 100 }))).toBe(true);
    expect(component.podeDesfazerPagamento(dividaMes({ parcelaMesPaga: true, valorPagoNoMes: 0 }))).toBe(false);
  });

  it('deve pagar, desfazer e excluir dívida com confirmação', () => {
    const d = dividaMes({ id: 10, valorTotal: 300, quantidadeParcelas: 3, dataInicio: '2026-05-01' });

    dialog.open.mockReturnValueOnce(afterClosed(true)).mockReturnValueOnce(afterClosed(undefined));
    component.confirmarPagar(d);
    expect(dividasService.updateDivida).toHaveBeenCalledWith(10, { valorPago: 100 });

    dialog.open.mockReturnValueOnce(afterClosed(true)).mockReturnValueOnce(afterClosed(undefined));
    component.confirmarDesfazerPagamento(d);
    expect(dividasService.updateDivida).toHaveBeenCalledWith(10, { valorPago: 0 });

    dialog.open.mockReturnValueOnce(afterClosed(true));
    component.confirmarExcluir(d);
    expect(dividasService.deleteDivida).toHaveBeenCalledWith(10);
  });

  it('deve ignorar confirmações canceladas', () => {
    const d = dividaMes({ id: 10 });

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.confirmarPagar(d);
    expect(dividasService.updateDivida).not.toHaveBeenCalled();

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.confirmarDesfazerPagamento(d);
    expect(dividasService.updateDivida).not.toHaveBeenCalled();

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.confirmarExcluir(d);
    expect(dividasService.deleteDivida).not.toHaveBeenCalled();
  });

  it('deve abrir modal de adicionar e editar dívida', () => {
    dialog.open.mockReturnValueOnce(afterClosed(true)).mockReturnValueOnce(afterClosed(undefined));
    component.abrirModalAdicionar();
    expect(dialog.open).toHaveBeenCalledTimes(2);

    dialog.open.mockReturnValueOnce(afterClosed(true)).mockReturnValueOnce(afterClosed(undefined));
    component.editar(dividaMes({ id: 10 }));
    expect(dialog.open).toHaveBeenCalledTimes(4);

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.abrirModalAdicionar();
    expect(dialog.open).toHaveBeenCalledTimes(5);
  });

  it('deve normalizar página, montar gráficos e descartar charts', () => {
    component.dividas = [dividaMes({ id: 1, tipoDivida: 'emprestimo' })];
    component['dividasAno'] = [divida({ id: 1, tipoDivida: 'emprestimo' })];
    component.paginaTabela = 99;

    component['normalizarIndicePagina']();
    expect(component.paginaTabela).toBe(1);
    expect(component['eixoMesesGrafico']().type).toBe('category');
    expect(component['eixoValorGrafico']().type).toBe('value');
    const tooltip: any = component['tooltipEixoValor']();
    const evolucao: any = component['opcaoGraficoEvolucao']();
    const pagoRestante: any = component['opcaoGraficoPagoRestante']();
    const categoria: any = component['opcaoGraficoCategoria']();
    const pagamentos: any = component['opcaoGraficoPagamentos']();
    expect(tooltip.trigger).toBe('axis');
    expect(tooltip.valueFormatter('abc')).toContain('R$');
    expect(component['eixoValorGrafico']().axisLabel.formatter(1200)).toContain('R$');
    expect(evolucao.series).toBeTruthy();
    expect(pagoRestante.series).toBeTruthy();
    expect(pagoRestante.tooltip.valueFormatter('abc')).toContain('R$');
    expect(categoria.series).toBeTruthy();
    expect(categoria.tooltip.valueFormatter('abc')).toContain('R$');
    expect(pagamentos.series).toBeTruthy();

    component['initChart'](undefined, {});
    component['initChart']({ nativeElement: null } as unknown as ElementRef<HTMLDivElement>, {});

    component.dividas = [];
    component.carregando = false;
    component['atualizarGraficos']();

    const chart = { dispose: jest.fn() };
    component['charts'] = [chart as any];
    component.ngOnDestroy();
    expect(chart.dispose).toHaveBeenCalled();
    expect(component['charts']).toEqual([]);
  });

  it('deve atualizar gráficos no ciclo de vida e reutilizar/criar instâncias', () => {
    const atualizarSpy = jest.spyOn(component as any, 'atualizarGraficos').mockImplementation(() => undefined);
    component.ngAfterViewInit();
    jest.runOnlyPendingTimers();
    expect(atualizarSpy).toHaveBeenCalled();
    atualizarSpy.mockRestore();

    component.dividas = [dividaMes({ id: 1 })];
    component['dividasAno'] = [divida({ id: 1 })];
    const el = document.createElement('div');
    const chart = {
      setOption: jest.fn(),
    };
    jest.spyOn(echarts, 'getInstanceByDom').mockReturnValueOnce(chart as any);
    const initSpy = jest.spyOn(echarts, 'init').mockReturnValue(chart as any);
    component.chartEvolucao = { nativeElement: el } as ElementRef<HTMLDivElement>;
    component.chartPagoRestante = { nativeElement: el } as ElementRef<HTMLDivElement>;
    component.chartCategoria = { nativeElement: el } as ElementRef<HTMLDivElement>;
    component.chartPagamentos = { nativeElement: el } as ElementRef<HTMLDivElement>;

    component['atualizarGraficos']();

    expect(chart.setOption).toHaveBeenCalled();
    expect(initSpy).toHaveBeenCalled();
    expect(component['charts']).toContain(chart);
  });
});
