import { HttpErrorResponse } from '@angular/common/http';
import { ElementRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { Divida, DividaNoMes } from '@core/interfaces/dividas/dividas';
import * as echarts from 'echarts';
import { CartoesPageComponent } from './cartoes-page.component';

describe('CartoesPageComponent', () => {
  let component: CartoesPageComponent;
  let cartoesService: {
    getCartoes: jest.Mock;
    updateCartao: jest.Mock;
    deleteCartao: jest.Mock;
  };
  let dividasService: {
    getDividas: jest.Mock;
    updateDivida: jest.Mock;
    deleteDivida: jest.Mock;
  };
  let dialog: { open: jest.Mock };

  const cartao = (partial: Partial<Cartao> = {}): Cartao => ({
    id: partial.id ?? 1,
    nome: partial.nome ?? 'Roxo',
    banco: partial.banco ?? 'Nubank',
    limite: partial.limite ?? 1000,
    valorUtilizado: partial.valorUtilizado ?? 200,
    valorDisponivel: partial.valorDisponivel ?? 800,
    faturaPaga: partial.faturaPaga,
    valorFaturaPaga: partial.valorFaturaPaga,
    diaFechamento: partial.diaFechamento ?? 20,
    diaVencimento: partial.diaVencimento ?? 25,
    diaMelhorCompra: partial.diaMelhorCompra ?? 21,
    pessoa: partial.pessoa,
    observacaoAtraso: partial.observacaoAtraso,
    previsaoPagamento: partial.previsaoPagamento,
  });

  const divida = (partial: Partial<Divida> = {}): Divida => ({
    id: partial.id ?? 1,
    objetivo: partial.objetivo ?? 'Compra',
    tipoDivida: partial.tipoDivida ?? 'parcelamento',
    valorTotal: partial.valorTotal ?? 300,
    valorPago: partial.valorPago ?? 0,
    valorRestante: partial.valorRestante ?? 300,
    parcelaMensal: partial.parcelaMensal ?? 100,
    quantidadeParcelas: partial.quantidadeParcelas ?? 3,
    parcelasRestantes: partial.parcelasRestantes ?? 3,
    percentualQuitado: partial.percentualQuitado ?? 0,
    statusDivida: partial.statusDivida ?? 'pagando',
    cartaoId: partial.cartaoId === undefined ? 1 : partial.cartaoId,
    ano: partial.ano ?? 2026,
    dataInicio: partial.dataInicio ?? '2026-05-01',
    diaVencimento: partial.diaVencimento,
  });

  const parcelaMes = (partial: Partial<DividaNoMes> = {}): DividaNoMes => ({
    ...divida(partial),
    indiceParcelaMes: partial.indiceParcelaMes ?? 1,
    valorPagoNoMes: partial.valorPagoNoMes ?? 0,
    parcelaMesPaga: partial.parcelaMesPaga ?? false,
    statusParcelaMes: partial.statusParcelaMes ?? 'pendente',
  });

  const afterClosed = (value: unknown) => ({ afterClosed: () => of(value) });

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 4, 10));
    cartoesService = {
      getCartoes: jest.fn().mockReturnValue(of([])),
      updateCartao: jest.fn().mockReturnValue(of({})),
      deleteCartao: jest.fn().mockReturnValue(of(null)),
    };
    dividasService = {
      getDividas: jest.fn().mockReturnValue(of([])),
      updateDivida: jest.fn().mockReturnValue(of({})),
      deleteDivida: jest.fn().mockReturnValue(of(null)),
    };
    dialog = {
      open: jest.fn().mockReturnValue(afterClosed(false)),
    };

    component = new CartoesPageComponent(
      cartoesService as any,
      dividasService as any,
      dialog as any,
    );
    component.mesAtual = new Date(2026, 4, 1);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve carregar cartões e parcelamentos de fatura', () => {
    cartoesService.getCartoes.mockReturnValue(of([cartao({ id: 1 })]));
    dividasService.getDividas.mockReturnValue(
      of([
        divida({ id: 1, cartaoId: 1, tipoDivida: 'parcelamento' }),
        divida({ id: 2, cartaoId: 1, tipoDivida: 'emprestimo' }),
        divida({ id: 3, cartaoId: null, tipoDivida: 'parcelamento' }),
      ]),
    );

    component.carregar();

    expect(component.carregando).toBe(false);
    expect(component.cartoes.length).toBe(1);
    expect(component.parcelamentos.map((p) => p.id)).toEqual([1]);
    expect(component.paginaTabela).toBe(1);
  });

  it('deve tratar erro de carregamento', () => {
    cartoesService.getCartoes.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );

    component.carregar();

    expect(component.carregando).toBe(false);
    expect(component.erroCarregar).toContain('API de faturas');
    expect(component.cartoes).toEqual([]);
    expect(component.parcelamentos).toEqual([]);
  });

  it('deve calcular resumo, mês e paginação', () => {
    component.cartoes = [
      ...Array.from({ length: 8 }, (_, i) =>
        cartao({ id: i + 1, limite: 1000, valorUtilizado: 100 }),
      ),
      cartao({ id: 99, limite: 3500, valorUtilizado: 0, totalAPagarMes: 0 }),
    ];
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 1,
        valorTotal: 750,
        quantidadeParcelas: 3,
        valorRestante: 250,
      }),
    ];
    component.paginaTabela = 2;

    expect(component.resumo.limiteTotal).toBe(8000);
    expect(component.resumo.utilizado).toBe(950);
    expect(component.resumo.totalAPagarMes).toBe(950);
    expect(component.exibirAvisoVazio).toBe(false);
    expect(component.totalPaginasTabela).toBe(2);
    expect(component.exibirPaginacaoTabela).toBe(true);
    expect(component.cartoesComFaturaMes.length).toBe(8);
    expect(component.cartoesPaginados.length).toBe(2);
    expect(component.exibindoDeTabela).toBe(7);
    expect(component.exibindoAteTabela).toBe(8);
    expect(component.nomeMesAtual).toBe('Maio 2026');
    expect(component.anoRef).toBe(2026);
    expect(component.mesRef).toBe(5);

    component.paginaAnteriorTabela();
    expect(component.paginaTabela).toBe(1);
    component.paginaProximaTabela();
    expect(component.paginaTabela).toBe(2);
  });

  it('deve cobrir fallback de resumo vazio e limites de paginação', () => {
    component.cartoes = [];
    component.paginaTabela = 1;

    expect(component.resumo).toEqual({
      limiteTotal: 0,
      utilizado: 0,
      totalAPagarMes: 0,
      disponivel: 0,
      percentualUtilizado: 0,
      proximoVencimentoLabel: '-',
    });
    expect(component.exibirAvisoVazio).toBe(true);
    expect(component.totalPaginasTabela).toBe(0);
    expect(component.exibindoDeTabela).toBe(0);

    component.paginaAnteriorTabela();
    component.paginaProximaTabela();
    expect(component.paginaTabela).toBe(1);

    component.cartoes = [{ ...cartao({ id: 1 }), limite: undefined as any, valorUtilizado: undefined as any }];
    expect(component.resumo.limiteTotal).toBe(0);
  });

  it('deve alternar visão e mês', () => {
    component.selecionarVisao('usuario');
    expect(component.visaoFaturas).toBe('usuario');

    component.mesAnterior();
    expect(component.mesAtual.getMonth()).toBe(3);
    expect(cartoesService.getCartoes).toHaveBeenCalled();
    expect(component.estaForaDoMesAtual).toBe(true);

    component.proximoMes();
    expect(component.mesAtual.getMonth()).toBe(4);
    expect(component.estaForaDoMesAtual).toBe(false);

    component.mesAnterior();
    component.voltarParaMesAtual();
    expect(component.mesAtual.getMonth()).toBe(4);
    expect(component.nomeMesHoje).toBe('Maio 2026');
  });

  it('deve validar se pode parcelar conforme fechamento', () => {
    expect(component.podeParcelarCompra({ ...cartao(), diaFechamento: null })).toBe(true);
    expect(component.podeParcelarCompra(cartao({ diaFechamento: 11 }))).toBe(true);
    expect(component.podeParcelarCompra(cartao({ diaFechamento: 10 }))).toBe(false);

    component.mesAtual = new Date(2026, 5, 1);
    expect(component.podeParcelarCompra(cartao({ diaFechamento: 1 }))).toBe(true);

    component.mesAtual = new Date(2026, 3, 1);
    expect(component.podeParcelarCompra(cartao({ diaFechamento: 30 }))).toBe(false);
  });

  it('deve abrir modal para parcelar, editar e excluir parcelamento', () => {
    dialog.open.mockReturnValueOnce(afterClosed(true)).mockReturnValueOnce(afterClosed(undefined));
    const c = cartao({ id: 1 });

    component.parcelar(c);
    expect(dialog.open).toHaveBeenCalledTimes(2);
    expect(cartoesService.getCartoes).toHaveBeenCalled();

    dialog.open.mockReturnValueOnce(afterClosed(true)).mockReturnValueOnce(afterClosed(undefined));
    component.editarParcelamento(c, parcelaMes({ id: 2, cartaoId: 1 }));
    expect(dialog.open).toHaveBeenCalledTimes(4);

    dialog.open.mockReturnValueOnce(afterClosed(true)).mockReturnValueOnce(afterClosed(undefined));
    component.confirmarExcluirParcelamento(parcelaMes({ id: 3 }));
    expect(dividasService.deleteDivida).toHaveBeenCalledWith(3);
  });

  it('deve ignorar ações canceladas nos dialogs', () => {
    const c = cartao({ id: 1 });
    const p = parcelaMes({ id: 2, cartaoId: 1 });

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.parcelar(c);
    expect(cartoesService.getCartoes).not.toHaveBeenCalled();

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.editarParcelamento(c, p);
    expect(cartoesService.getCartoes).not.toHaveBeenCalled();

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.confirmarExcluirParcelamento(p);
    expect(dividasService.deleteDivida).not.toHaveBeenCalled();

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.confirmarExcluir(c);
    expect(cartoesService.deleteCartao).not.toHaveBeenCalled();
  });

  it('não deve parcelar quando botão está desabilitado', () => {
    component.mesAtual = new Date(2026, 3, 1);

    component.parcelar(cartao({ diaFechamento: 30 }));

    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('deve alternar expansão e calcular valores da fatura', () => {
    const c = cartao({ id: 1, limite: 3500, valorUtilizado: 300 });
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 1,
        valorTotal: 3000,
        quantidadeParcelas: 10,
        valorRestante: 3000,
      }),
      parcelaMes({ cartaoId: 2, valorRestante: 999 }),
    ];

    component.alternarCartao(c);
    expect(component.cartaoExpandido(c)).toBe(true);
    expect(component.parcelamentosDoCartao(c).length).toBe(1);
    expect(component.valorUtilizadoFatura(c)).toBe(300);
    expect(component.valorPagarFatura(c)).toBe(300);
    expect(component.valorUtilizadoLimite(c)).toBe(3000);
    expect(component.valorDisponivelFatura(c)).toBe(500);

    component.alternarCartao(c);
    expect(component.cartaoExpandido(c)).toBe(false);

    component.parcelamentos = [];
    expect(component.valorUtilizadoFatura(c)).toBe(300);

    const semValores = { ...cartao({ id: 5 }), limite: undefined as any, valorUtilizado: undefined as any };
    expect(component.valorUtilizadoFatura(semValores)).toBe(0);
    expect(component.valorDisponivelFatura(semValores)).toBe(0);
  });

  it('deve calcular status, alertas e botões de pagamento', () => {
    const atrasado = cartao({ id: 1, valorUtilizado: 200, diaVencimento: 5, previsaoPagamento: '2026-05-10' });
    component.parcelamentos = [parcelaMes({ cartaoId: 1, statusParcelaMes: 'atrasada' })];

    expect(component.statusDoCartao(atrasado)).toBe('atrasado');
    expect(component.faturaAtrasada(atrasado)).toBe(true);
    expect(component.previsaoPagamentoVencida(atrasado)).toBe(true);
    expect(component.mostrarAlertaPrevisao(atrasado)).toBe(true);
    expect(component.textoAlertaPrevisao(atrasado)).toBe('Pagar hoje');
    expect(component.statusLinhaLabel(atrasado)).toContain('Atrasada');
    expect(component.statusLinhaClasse(atrasado)).toContain('atrasada');
    expect(component.podePagarFatura(atrasado)).toBe(true);
    expect(component.podeDesfazerPagamento(atrasado)).toBe(false);
    expect(component.mostrarBotaoPagar(atrasado)).toBe(true);

    const pago = cartao({ id: 2, faturaPaga: true, valorFaturaPaga: 200, valorUtilizado: 0 });
    expect(component.podeDesfazerPagamento(pago)).toBe(true);
    expect(component.mostrarBotaoPagar(pago)).toBe(false);
  });

  it('deve cobrir status sem parcelas, fatura paga e parcelas pagas', () => {
    const emDia = cartao({ id: 1, valorUtilizado: 0, diaVencimento: 25 });
    expect(component.faturaAtrasada(emDia)).toBe(false);
    expect(component.statusLinhaLabel(emDia)).toContain('Fatura em dia');
    expect(component.statusLinhaClasse(emDia)).toBe('status--em-dia');

    const pago = cartao({ id: 2, faturaPaga: true, valorUtilizado: 0 });
    expect(component.statusLinhaLabel(pago)).toContain('Fatura paga');
    expect(component.statusLinhaClasse(pago)).toBe('status--fatura-paga');

    const comParcelasPagas = cartao({ id: 3, valorUtilizado: 100 });
    component.parcelamentos = [
      parcelaMes({ cartaoId: 3, statusParcelaMes: 'paga' }),
      parcelaMes({ cartaoId: 3, statusParcelaMes: 'quitada' }),
    ];
    expect(component.statusLinhaLabel(comParcelasPagas)).toContain('Parcela paga');
    expect(component.statusLinhaClasse(comParcelasPagas)).toBe('status--parcela-paga');
  });

  it('deve formatar alertas de previsão', () => {
    expect(component.textoAlertaPrevisao(cartao({ previsaoPagamento: null }))).toBe('Sem previsão');
    expect(component.textoAlertaPrevisao(cartao({ previsaoPagamento: '2026-05-09' }))).toBe('Previsão vencida');
    expect(component.textoAlertaPrevisao(cartao({ previsaoPagamento: '2026-05-20' }))).toContain('Previsão');
    expect(component.previsaoPagamentoVencida(cartao({ valorUtilizado: 0, previsaoPagamento: '2026-05-09' }))).toBe(false);
    expect(component['dataLocal']('invalid')).toBeNull();
  });

  it('deve abrir ação de fatura atrasada para pagar agora e para pagar depois', () => {
    const c = cartao({ id: 1, valorUtilizado: 200, diaVencimento: 5 });
    jest.spyOn(component as any, 'registrarPagamentoAtrasado').mockImplementation(() => undefined);
    dialog.open.mockReturnValueOnce(afterClosed({ acao: 'pagar', valorPago: 200 }));

    component.abrirAcaoFaturaAtrasada(c);
    expect(component['registrarPagamentoAtrasado']).toHaveBeenCalledWith(c, 200);

    dialog.open.mockReturnValueOnce(
      afterClosed({
        acao: 'depois',
        observacaoAtraso: 'Pagar depois',
        previsaoPagamento: '2026-05-20',
      }),
    ).mockReturnValueOnce(afterClosed(undefined));
    component.abrirAcaoFaturaAtrasada(c);
    expect(cartoesService.updateCartao).toHaveBeenCalledWith(1, {
      observacaoAtraso: 'Pagar depois',
      previsaoPagamento: '2026-05-20',
      faturaPaga: false,
    });

    dialog.open.mockReturnValueOnce(afterClosed(undefined));
    component.abrirAcaoFaturaAtrasada(c);
    expect(cartoesService.updateCartao).toHaveBeenCalledTimes(1);
  });

  it('deve ignorar pagamento/desfazer cancelados e usar fallbacks de payload', () => {
    const c = cartao({ id: 1, valorUtilizado: 100, valorFaturaPaga: undefined });

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.confirmarPagarFatura(c);
    expect(cartoesService.updateCartao).not.toHaveBeenCalled();

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.confirmarDesfazerPagamento(c);
    expect(cartoesService.updateCartao).not.toHaveBeenCalled();

    component['registrarPagamentoAtrasado'](c, -10);
    expect(cartoesService.updateCartao).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        valorUtilizado: 100,
        valorFaturaPaga: 0,
      }),
    );
  });

  it('deve pagar, desfazer pagamento e excluir cartão', () => {
    const c = cartao({ id: 1, valorUtilizado: 300, valorFaturaPaga: 300 });
    component.parcelamentos = [
      parcelaMes({ id: 10, cartaoId: 1, statusParcelaMes: 'pendente', parcelaMesPaga: false }),
      parcelaMes({ id: 11, cartaoId: 1, statusParcelaMes: 'paga', parcelaMesPaga: true }),
    ];

    dialog.open.mockReturnValueOnce(afterClosed(true)).mockReturnValueOnce(afterClosed(undefined));
    component.confirmarPagarFatura(c);
    expect(cartoesService.updateCartao).toHaveBeenCalledWith(1, expect.objectContaining({ valorUtilizado: 0 }));
    expect(dividasService.updateDivida).toHaveBeenCalledWith(10, expect.any(Object));

    component.parcelamentos = [
      parcelaMes({ id: 11, cartaoId: 1, statusParcelaMes: 'paga', parcelaMesPaga: true }),
    ];
    dialog.open.mockReturnValueOnce(afterClosed(true)).mockReturnValueOnce(afterClosed(undefined));
    component.confirmarDesfazerPagamento(c);
    expect(cartoesService.updateCartao).toHaveBeenCalledWith(1, expect.objectContaining({ faturaPaga: false, valorFaturaPaga: 0 }));
    expect(dividasService.updateDivida).toHaveBeenCalledWith(11, expect.any(Object));

    dialog.open.mockReturnValueOnce(afterClosed(true));
    component.confirmarExcluir(c);
    expect(cartoesService.deleteCartao).toHaveBeenCalledWith(1);
  });

  it('deve registrar pagamento atrasado normalizando valor', () => {
    const c = cartao({ id: 1, valorUtilizado: 300, valorFaturaPaga: 50 });
    component.parcelamentos = [parcelaMes({ id: 10, cartaoId: 1, statusParcelaMes: 'pendente' })];

    component['registrarPagamentoAtrasado'](c, 999);

    expect(cartoesService.updateCartao).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        valorUtilizado: 0,
        faturaPaga: false,
        valorFaturaPaga: 150,
        observacaoAtraso: null,
        previsaoPagamento: null,
      }),
    );
  });

  it('deve abrir dialog de adicionar e editar cartão', () => {
    dialog.open.mockReturnValueOnce(afterClosed(true)).mockReturnValueOnce(afterClosed(undefined));
    component.abrirModalAdicionar();
    expect(dialog.open).toHaveBeenCalledTimes(2);

    dialog.open.mockReturnValueOnce(afterClosed(true)).mockReturnValueOnce(afterClosed(undefined));
    component.editar(cartao({ id: 1 }));
    expect(dialog.open).toHaveBeenCalledTimes(4);
  });

  it('deve normalizar página, aplicar parcelamentos e montar opções de gráfico', () => {
    component.cartoes = [cartao({ id: 1, nome: 'Roxo' })];
    component.paginaTabela = 10;
    component['normalizarIndicePagina']();
    expect(component.paginaTabela).toBe(1);

    component['parcelamentosAno'] = [divida({ id: 1, cartaoId: 1 })];
    component['aplicarParcelamentosMes']();
    expect(component.parcelamentos.length).toBe(1);

    expect(component['formatarMoeda'](1200)).toContain('R$');
    expect(component['eixoValorGrafico']().type).toBe('value');
    expect(component['tooltipEixoValor']().trigger).toBe('axis');
    const usoLimite: any = component['opcaoGraficoUsoLimite']();
    expect(usoLimite.series).toBeTruthy();
    expect(usoLimite.tooltip.valueFormatter('abc')).toContain('R$');
    const evolucao: any = component['opcaoGraficoEvolucao']();
    const porBanco: any = component['opcaoGraficoPorBanco']();
    const comparacao: any = component['opcaoGraficoComparacao']();
    expect(evolucao.series).toBeTruthy();
    expect(porBanco.series).toBeTruthy();
    expect(comparacao.series).toBeTruthy();
    expect(evolucao.tooltip.valueFormatter('abc')).toContain('R$');
    expect(porBanco.tooltip.valueFormatter('abc')).toContain('R$');
    expect(comparacao.tooltip.valueFormatter(1200)).toContain('R$');
    expect(comparacao.yAxis.axisLabel.formatter(1200)).toContain('R$');
    expect(component['mensagemErroHttp'](new HttpErrorResponse({ status: 0 }))).toContain('Servidor indisponível');
    expect(component['mensagemErroHttp'](new HttpErrorResponse({ status: 404 }))).toContain('API de faturas');
    expect(component['mensagemErroHttp'](new Error('x'))).toBe('Não foi possível carregar as faturas.');
  });

  it('deve inicializar e descartar gráficos com segurança', () => {
    const chart = { dispose: jest.fn() };
    component['charts'] = [chart as any];
    component.ngOnDestroy();

    expect(chart.dispose).toHaveBeenCalled();
    expect(component['charts']).toEqual([]);

    component.cartoes = [];
    component['atualizarGraficos']();

    component['initChart'](undefined, {});
    component['initChart']({ nativeElement: null } as unknown as ElementRef<HTMLDivElement>, {});
  });

  it('deve chamar atualização de gráficos no ciclo de vida e inicializar charts existentes ou novos', () => {
    const atualizarSpy = jest.spyOn(component as any, 'atualizarGraficos').mockImplementation(() => undefined);
    component.ngOnInit();
    component.ngAfterViewInit();
    jest.runOnlyPendingTimers();
    expect(atualizarSpy).toHaveBeenCalled();
    atualizarSpy.mockRestore();

    component.cartoes = [cartao({ id: 1 })];
    const el = document.createElement('div');
    const chart = {
      setOption: jest.fn(),
    };
    jest.spyOn(echarts, 'getInstanceByDom').mockReturnValueOnce(chart as any);
    const initSpy = jest.spyOn(echarts, 'init').mockReturnValue(chart as any);

    component.chartUsoLimite = { nativeElement: el } as ElementRef<HTMLDivElement>;
    component.chartEvolucaoFatura = { nativeElement: el } as ElementRef<HTMLDivElement>;
    component.chartPorBanco = { nativeElement: el } as ElementRef<HTMLDivElement>;
    component.chartComparacao = { nativeElement: el } as ElementRef<HTMLDivElement>;

    component['atualizarGraficos']();

    expect(chart.setOption).toHaveBeenCalled();
    expect(initSpy).toHaveBeenCalled();
    expect(component['charts']).toContain(chart);
  });

  it('deve cobrir fallbacks de valores de fatura, limite e resumo', () => {
    const c = {
      ...cartao({ id: 10, totalAPagarMes: null as any, valorUtilizado: undefined as any }),
      limite: undefined as any,
    };
    component.cartoes = [c];
    component.parcelamentos = [
      parcelaMes({ cartaoId: 10, valorRestante: undefined as any, valorTotal: 300, quantidadeParcelas: 3 }),
      parcelaMes({ cartaoId: 10, valorRestante: -50, valorTotal: 300, quantidadeParcelas: 3 }),
    ];

    expect(component.valorUtilizadoFatura(c)).toBe(200);
    expect(component.valorUtilizadoLimite(c)).toBe(300);
    expect(component.valorDisponivelFatura(c)).toBe(0);
    expect(component.resumo.limiteTotal).toBe(0);
  });

  it('deve cobrir status de fatura com parcelas pagas, quitadas e pendentes', () => {
    const c = cartao({ id: 11, valorUtilizado: 100, diaVencimento: 1 });

    component.parcelamentos = [parcelaMes({ cartaoId: 11, statusParcelaMes: 'paga' })];
    expect(component.faturaAtrasada(c)).toBe(false);

    component.parcelamentos = [parcelaMes({ cartaoId: 11, statusParcelaMes: 'quitada' })];
    expect(component.faturaAtrasada(c)).toBe(false);

    component.parcelamentos = [parcelaMes({ cartaoId: 11, statusParcelaMes: 'pendente' })];
    expect(component.faturaAtrasada(c)).toBe(true);

    component.parcelamentos = [];
    expect((component as any).statusResumoParcelasCartao(c)).toBeNull();
  });

  it('deve cobrir datas de previsão inválidas e vencidas', () => {
    expect(component.previsaoPagamentoVencida(cartao({ previsaoPagamento: undefined, valorUtilizado: 100 }))).toBe(false);
    expect(component.previsaoPagamentoVencida(cartao({ previsaoPagamento: 'data-invalida', valorUtilizado: 100 }))).toBe(false);
    expect(component.previsaoPagamentoVencida(cartao({ previsaoPagamento: '2026-05-10', valorUtilizado: 100 }))).toBe(true);

    expect((component as any).dataLocal(null)).toBeNull();
    expect((component as any).dataLocal('2026-00-10')).toBeNull();
  });

  it('deve cobrir atualizações de parcelas pagas e desfeitas com dataInicio ausente', () => {
    const c = cartao({ id: 12 });
    const pendente = {
      ...parcelaMes({
        id: 101,
        cartaoId: 12,
        statusParcelaMes: 'pendente',
        parcelaMesPaga: false,
        valorTotal: 300,
        quantidadeParcelas: 3,
      }),
      dataInicio: undefined,
    } as DividaNoMes;
    const paga = {
      ...parcelaMes({
        id: 102,
        cartaoId: 12,
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
        valorTotal: 300,
        quantidadeParcelas: 3,
      }),
      dataInicio: undefined,
    } as DividaNoMes;
    component.parcelamentos = [pendente, paga];

    const pagar = (component as any).atualizacoesParcelasPagas(c);
    const desfazer = (component as any).atualizacoesParcelasDesfeitas(c);

    expect(pagar.length).toBe(1);
    expect(desfazer.length).toBe(1);
    expect(dividasService.updateDivida).toHaveBeenCalledWith(101, { valorPago: 100 });
    expect(dividasService.updateDivida).toHaveBeenCalledWith(102, { valorPago: 0 });
  });
});
