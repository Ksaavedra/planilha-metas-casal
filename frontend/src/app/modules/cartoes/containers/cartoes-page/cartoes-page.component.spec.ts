import { HttpErrorResponse } from '@angular/common/http';
import { ElementRef } from '@angular/core';
import { Observable, of, throwError, NEVER } from 'rxjs';
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
    registrarPagamentoFatura: jest.Mock;
    desfazerPagamentoFatura: jest.Mock;
  };
  let dividasService: {
    getDividas: jest.Mock;
    updateDivida: jest.Mock;
    deleteDivida: jest.Mock;
  };
  let dialog: { open: jest.Mock };
  let perfilService: {
    temGrupoFamiliar$: Observable<boolean>;
  };

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
    dataPagamento: partial.dataPagamento,
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
      registrarPagamentoFatura: jest
        .fn()
        .mockReturnValue(of({ faturaPaga: true })),
      desfazerPagamentoFatura: jest.fn().mockReturnValue(of(null)),
    };
    dividasService = {
      getDividas: jest.fn().mockReturnValue(of([])),
      updateDivida: jest.fn().mockReturnValue(of({})),
      deleteDivida: jest.fn().mockReturnValue(of(null)),
    };
    dialog = {
      open: jest.fn().mockReturnValue(afterClosed(false)),
    };
    perfilService = {
      temGrupoFamiliar$: of(true),
    };

    component = new CartoesPageComponent(
      cartoesService as any,
      dividasService as any,
      dialog as any,
      perfilService as any,
    );
    component.mesAtual = new Date(2026, 4, 1);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve carregar cartões e parcelamentos de fatura', () => {
    cartoesService.getCartoes.mockReturnValue(of([cartao({ id: 1 })]));
    dividasService.getDividas.mockImplementation((ano: number) =>
      ano === 2026
        ? of([
            divida({ id: 1, cartaoId: 1, tipoDivida: 'parcelamento' }),
            divida({ id: 2, cartaoId: 1, tipoDivida: 'emprestimo' }),
            divida({ id: 3, cartaoId: null, tipoDivida: 'parcelamento' }),
          ])
        : of([]),
    );

    component.carregar();

    expect(dividasService.getDividas).toHaveBeenCalledWith(2025);
    expect(dividasService.getDividas).toHaveBeenCalledWith(2026);

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

    expect(component.resumo.limiteTotal).toBe(11500);
    expect(component.resumo.utilizado).toBe(950);
    expect(component.resumo.totalValorFaturas).toBe(250);
    expect(component.resumo.totalAPagarMes).toBe(950);
    expect(component.exibirAvisoVazio).toBe(false);
    expect(component.totalPaginasTabela).toBe(2);
    expect(component.exibirPaginacaoTabela).toBe(true);
    expect(component.cartoesComFaturaMes.length).toBe(9);
    expect(component.cartoesPaginados.length).toBe(3);
    expect(component.exibindoDeTabela).toBe(7);
    expect(component.exibindoAteTabela).toBe(9);
    expect(component.nomeMesAtual).toBe('Maio 2026');
    expect(component.anoRef).toBe(2026);
    expect(component.mesRef).toBe(5);

    component.paginaAnteriorTabela();
    expect(component.paginaTabela).toBe(1);
    component.paginaProximaTabela();
    expect(component.paginaTabela).toBe(2);
  });

  it('deve calcular valor a pagar só com parcelas pendentes no mês', () => {
    const c = cartao({ id: 1, totalAPagarMes: 0, valorUtilizado: 0 });
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 1,
        valorTotal: 45,
        quantidadeParcelas: 1,
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
      }),
      parcelaMes({
        cartaoId: 1,
        valorTotal: 85,
        quantidadeParcelas: 1,
        statusParcelaMes: 'pendente',
        parcelaMesPaga: false,
      }),
    ];

    expect(component.valorPagarFatura(c)).toBe(85);
  });

  it('deve priorizar totalAPagarMes sem parcelamentos e nunca retornar valor negativo na fatura', () => {
    const c = {
      ...cartao({ valorUtilizado: 500 }),
      totalAPagarMes: -10,
    } as Cartao;

    expect(component.valorUtilizadoFatura(c)).toBe(0);
    expect(component.valorPagarFatura(c)).toBe(0);
  });

  it('deve cobrir fallback de resumo vazio e limites de paginação', () => {
    component.cartoes = [];
    component.paginaTabela = 1;

    expect(component.resumo).toEqual({
      limiteTotal: 0,
      utilizado: 0,
      totalValorFaturas: 0,
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

    component.cartoes = [
      {
        ...cartao({ id: 1 }),
        limite: undefined as any,
        valorUtilizado: undefined as any,
      },
    ];
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

  it('deve permitir parcelar quando fatura não está paga, mesmo após fechamento', () => {
    component.mesAtual = new Date(2026, 5, 1);
    const c = cartao({
      id: 6,
      valorUtilizado: 4444.54,
      diaFechamento: 26,
      diaVencimento: 6,
      diaMelhorCompra: 27,
    });
    component.parcelamentos = [
      parcelaMes({ cartaoId: 6, statusParcelaMes: 'atrasada' }),
    ];

    expect(component.isFaturaPaga(c)).toBe(false);
    expect(component.podeParcelarCompra(c)).toBe(true);
    expect(component.faturaAtrasada(c)).toBe(true);

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.parcelar(c);
    expect(dialog.open).toHaveBeenCalled();
  });

  it('deve bloquear parcelar em mês passado quando a fatura está paga', () => {
    const c = cartao({ id: 3, valorUtilizado: 0 });
    component.mesAtual = new Date(2023, 9, 1);
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 3,
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
        dataPagamento: '2023-10-04',
      }),
    ];

    expect(component.podeDesfazerPagamento(c)).toBe(true);
    expect(component.podeParcelarCompra(c)).toBe(false);
  });

  it('deve bloquear parcelar no mês atual quando a fatura está paga', () => {
    const c = cartao({ id: 3, valorUtilizado: 0 });
    component.mesAtual = new Date(2026, 4, 1);
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 3,
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
        dataPagamento: '2026-05-04',
      }),
    ];

    expect(component.podeParcelarCompra(c)).toBe(false);
    expect(component.motivoParcelarCompraDesabilitado()).toContain(
      'Fatura paga',
    );
    expect(component.isFaturaPaga(c)).toBe(true);
    expect(component.podeEditarLancamentosFatura(c)).toBe(false);
  });

  it('deve habilitar edição e ajustes em fatura atrasada com pagamento parcial no mês atual', () => {
    component.mesAtual = new Date(2026, 4, 1);
    const c = cartao({
      id: 7,
      valorUtilizado: 200.62,
      diaFechamento: 27,
      diaVencimento: 6,
    });
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 7,
        valorTotal: 100,
        quantidadeParcelas: 1,
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
        dataPagamento: '2026-05-10',
      }),
      parcelaMes({
        cartaoId: 7,
        valorTotal: 200.62,
        quantidadeParcelas: 1,
        statusParcelaMes: 'atrasada',
        parcelaMesPaga: false,
      }),
    ];

    expect(component.faturaAtrasada(c)).toBe(true);
    expect(component.isFaturaPaga(c)).toBe(false);
    expect(component.podeEditarLancamentosFatura(c)).toBe(true);
    expect(component.podeParcelarCompra(c)).toBe(true);
  });

  it('deve habilitar juros e parcelar em fatura aberta sem pagamento', () => {
    component.mesAtual = new Date(2026, 4, 1);
    const c = cartao({ id: 8, valorUtilizado: 300, diaFechamento: 27 });
    component.parcelamentos = [
      parcelaMes({ cartaoId: 8, statusParcelaMes: 'pendente' }),
    ];

    expect(component.faturaAtrasada(c)).toBe(false);
    expect(component.isFaturaPaga(c)).toBe(false);
    expect(component.podeEditarLancamentosFatura(c)).toBe(true);
    expect(component.podeParcelarCompra(c)).toBe(true);
  });

  it('deve permitir clicar em fatura fechada para pagar', () => {
    const c = cartao({
      id: 4,
      valorUtilizado: 200,
      diaFechamento: 10,
      diaVencimento: 20,
    });
    jest
      .spyOn(component as any, 'confirmarPagarFatura')
      .mockImplementation(() => undefined);

    expect(component.statusFaturaClicavel(c)).toBe(true);
    component.abrirAcaoPagamentoFatura(c);
    expect(component['confirmarPagarFatura']).toHaveBeenCalledWith(c);
  });

  it('deve abrir modal para parcelar, editar e excluir parcelamento', () => {
    dialog.open
      .mockReturnValueOnce(afterClosed(true))
      .mockReturnValueOnce(afterClosed(undefined));
    const c = cartao({ id: 1 });

    component.parcelar(c);
    expect(dialog.open).toHaveBeenCalledTimes(2);
    expect(cartoesService.getCartoes).toHaveBeenCalled();

    dialog.open
      .mockReturnValueOnce(afterClosed(true))
      .mockReturnValueOnce(afterClosed(undefined));
    component.editarParcelamento(c, parcelaMes({ id: 2, cartaoId: 1 }));
    expect(dialog.open).toHaveBeenCalledTimes(4);

    dialog.open
      .mockReturnValueOnce(afterClosed(true))
      .mockReturnValueOnce(afterClosed(undefined));
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

  it('não deve parcelar quando fatura está paga', () => {
    component.mesAtual = new Date(2026, 4, 1);
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 1,
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
      }),
    ];

    component.parcelar(cartao({ id: 1, valorUtilizado: 0 }));

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

    const semValores = {
      ...cartao({ id: 5 }),
      limite: undefined as any,
      valorUtilizado: undefined as any,
    };
    expect(component.valorUtilizadoFatura(semValores)).toBe(0);
    expect(component.valorDisponivelFatura(semValores)).toBe(0);
  });

  it('deve calcular status, alertas e botões de pagamento', () => {
    const atrasado = cartao({
      id: 1,
      valorUtilizado: 200,
      diaVencimento: 5,
      previsaoPagamento: '2026-05-10',
    });
    component.parcelamentos = [
      parcelaMes({ cartaoId: 1, statusParcelaMes: 'atrasada' }),
    ];

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

    const pago = cartao({
      id: 2,
      faturaPaga: true,
      valorFaturaPaga: 200,
      valorUtilizado: 0,
    });
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
    expect(component.statusLinhaLabel(comParcelasPagas)).toContain(
      'Parcela paga',
    );
    expect(component.statusLinhaClasse(comParcelasPagas)).toBe(
      'status--parcela-paga',
    );
    expect(component.podeDesfazerPagamento(comParcelasPagas)).toBe(true);
  });

  it('deve exibir tooltip e mensagem de desfazer com data de pagamento', () => {
    const c = cartao({ id: 3, valorUtilizado: 130 });
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 3,
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
        dataPagamento: '2023-10-04',
        dataInicio: '2023-10-04',
      }),
    ];

    expect(component.tituloDesfazerPagamento(c)).toBe(
      'Pagamento de 04/10/2023. Clique para desfazer.',
    );
    expect(component.textoAlertaPagamento(c)).toBe('04/10/2023 foi pago');
    expect(component.mostrarAlertaPagamento(c)).toBe(true);
    expect(component.mensagemConfirmarDesfazerPagamento(c)).toBe(
      'Deseja desfazer o pagamento de 04/10/2023?',
    );
  });

  it('deve exibir fatura atrasada ao consultar mês passado com parcelas em aberto', () => {
    component.mesAtual = new Date(2023, 9, 1);
    const c = cartao({ id: 3, valorUtilizado: 130, diaVencimento: 6 });
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 3,
        valorTotal: 45,
        quantidadeParcelas: 1,
        statusParcelaMes: 'atrasada',
        parcelaMesPaga: false,
      }),
      parcelaMes({
        cartaoId: 3,
        valorTotal: 85,
        quantidadeParcelas: 1,
        statusParcelaMes: 'atrasada',
        parcelaMesPaga: false,
      }),
    ];

    expect(component.faturaAtrasada(c)).toBe(true);
    expect(component.mostrarAlertaPrevisao(c)).toBe(false);
    expect(component.statusLinhaLabel(c)).toContain('Atrasada');
    expect(component.valorPagarFatura(c)).toBe(130);
  });

  it('deve permitir clicar em Atrasada quando há parcela paga e outra em aberto', () => {
    component.mesAtual = new Date(2024, 3, 1);
    const c = cartao({ id: 6, valorUtilizado: 300.62, diaVencimento: 6 });
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 6,
        valorTotal: 100,
        quantidadeParcelas: 1,
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
        dataPagamento: '2024-04-10',
      }),
      parcelaMes({
        cartaoId: 6,
        valorTotal: 200.62,
        quantidadeParcelas: 1,
        statusParcelaMes: 'atrasada',
        parcelaMesPaga: false,
      }),
    ];

    expect(component.faturaAtrasada(c)).toBe(true);
    expect(component.podeDesfazerPagamento(c)).toBe(true);
    expect(component.isFaturaPaga(c)).toBe(false);
    expect(component.podeEditarLancamentosFatura(c)).toBe(true);
    expect(component.mostrarBotaoDesfazer(c)).toBe(false);
    expect(component.statusFaturaClicavel(c)).toBe(true);
    expect(component.statusLinhaLabel(c)).toContain('Atrasada');
    expect(component.tituloAcaoPagamentoFatura(c)).toBe(
      'Resolver fatura atrasada',
    );
  });

  it('deve formatar alertas de previsão', () => {
    expect(
      component.textoAlertaPrevisao(cartao({ previsaoPagamento: null })),
    ).toBe('Sem previsão');
    expect(
      component.textoAlertaPrevisao(
        cartao({ previsaoPagamento: '2026-05-09' }),
      ),
    ).toBe('Previsão vencida');
    expect(
      component.textoAlertaPrevisao(
        cartao({ previsaoPagamento: '2026-05-20' }),
      ),
    ).toContain('Previsão');
    expect(
      component.previsaoPagamentoVencida(
        cartao({ valorUtilizado: 0, previsaoPagamento: '2026-05-09' }),
      ),
    ).toBe(false);
    expect(component['dataLocal']('invalid')).toBeNull();
  });

  it('deve abrir ação de fatura atrasada para pagar agora e para pagar depois', () => {
    const c = cartao({ id: 1, valorUtilizado: 200, diaVencimento: 5 });
    jest
      .spyOn(component as any, 'registrarPagamentoAtrasado')
      .mockImplementation(() => undefined);
    dialog.open.mockReturnValueOnce(
      afterClosed({
        acao: 'pagar',
        valorPago: 200,
        previsaoPagamento: '2026-05-20',
      }),
    );

    component.abrirAcaoFaturaAtrasada(c);
    expect(component['registrarPagamentoAtrasado']).toHaveBeenCalledWith(
      c,
      200,
      '2026-05-20',
    );

    dialog.open
      .mockReturnValueOnce(
        afterClosed({
          acao: 'depois',
          observacaoAtraso: 'Pagar depois',
          previsaoPagamento: '2026-05-20',
        }),
      )
      .mockReturnValueOnce(afterClosed(undefined));
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
    const c = cartao({
      id: 1,
      valorUtilizado: 100,
      valorFaturaPaga: undefined,
    });
    component.parcelamentos = [
      parcelaMes({ cartaoId: 1, statusParcelaMes: 'pendente' }),
    ];

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.confirmarPagarFatura(c);
    expect(cartoesService.registrarPagamentoFatura).not.toHaveBeenCalled();

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.confirmarDesfazerPagamento(c);
    expect(cartoesService.desfazerPagamentoFatura).not.toHaveBeenCalled();

    component['registrarPagamentoAtrasado'](c, -10);
    const [cartaoId, payload] =
      cartoesService.registrarPagamentoFatura.mock.calls[0];
    expect(cartaoId).toBe(1);
    expect(payload.valorPago).toBe(0);
    expect(payload.ano).toBe(2026);
    expect(payload.mes).toBe(5);
  });

  it('deve pagar, desfazer pagamento e excluir cartão', () => {
    const c = cartao({ id: 1, valorUtilizado: 300, valorFaturaPaga: 300 });
    component.parcelamentos = [
      parcelaMes({
        id: 10,
        cartaoId: 1,
        statusParcelaMes: 'pendente',
        parcelaMesPaga: false,
      }),
      parcelaMes({
        id: 11,
        cartaoId: 1,
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
      }),
    ];

    dialog.open
      .mockReturnValueOnce(afterClosed(true))
      .mockReturnValueOnce(afterClosed(undefined));
    component.confirmarPagarFatura(c);
    const [cartaoPagoId, payloadPagamento] =
      cartoesService.registrarPagamentoFatura.mock.calls[0];
    expect(cartaoPagoId).toBe(1);
    expect(payloadPagamento.valorPago).toBeGreaterThan(0);
    expect(payloadPagamento.ano).toBe(2026);
    expect(payloadPagamento.mes).toBe(5);
    const [dividaPagaId, payloadDividaPaga] =
      dividasService.updateDivida.mock.calls[0];
    expect(dividaPagaId).toBe(10);
    expect(typeof payloadDividaPaga).toBe('object');

    component.parcelamentos = [
      parcelaMes({
        id: 11,
        cartaoId: 1,
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
      }),
    ];
    dialog.open
      .mockReturnValueOnce(afterClosed(true))
      .mockReturnValueOnce(afterClosed(undefined));
    component.confirmarDesfazerPagamento(c);
    const [cartaoDesfeitoId, anoDesfeito, mesDesfeito] =
      cartoesService.desfazerPagamentoFatura.mock.calls[0];
    expect(cartaoDesfeitoId).toBe(1);
    expect(anoDesfeito).toBe(2026);
    expect(mesDesfeito).toBe(5);
    const [dividaDesfeitaId, payloadDividaDesfeita] =
      dividasService.updateDivida.mock.calls[1];
    expect(dividaDesfeitaId).toBe(11);
    expect(typeof payloadDividaDesfeita).toBe('object');
    expect(payloadDividaDesfeita.dataPagamento).toBeNull();
    expect(payloadDividaDesfeita.statusDivida).toBe('pagando');

    dialog.open.mockReturnValueOnce(afterClosed(true));
    component.confirmarExcluir(c);
    expect(cartoesService.deleteCartao).toHaveBeenCalledWith(1);
  });

  it('deve registrar pagamento atrasado normalizando valor', () => {
    const c = cartao({ id: 1, valorUtilizado: 300, valorFaturaPaga: 50 });
    component.parcelamentos = [
      parcelaMes({ id: 10, cartaoId: 1, statusParcelaMes: 'pendente' }),
    ];

    component['registrarPagamentoAtrasado'](c, 999);

    const [cartaoId, payload] =
      cartoesService.registrarPagamentoFatura.mock.calls[0];
    expect(cartaoId).toBe(1);
    expect(payload.valorPago).toBe(100);
    expect(payload.ano).toBe(2026);
    expect(payload.mes).toBe(5);
    expect(payload.observacaoAtraso).toBeNull();
    expect(payload.previsaoPagamento).toBeNull();
  });

  it('deve enviar valor correto ao pagar após desfazer sem recarregar a página', () => {
    const c = cartao({
      id: 6,
      valorUtilizado: 2995.1,
      valorFaturaPaga: 6089.91,
    });
    component.mesAtual = new Date(2026, 5, 1);
    component.cartoes = [c];
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 6,
        valorTotal: 2995.1,
        quantidadeParcelas: 1,
        statusParcelaMes: 'atrasada',
        parcelaMesPaga: false,
      }),
    ];
    component['parcelamentosAno'] = [...component.parcelamentos];

    component['registrarPagamentoAtrasado'](c, 2995.1);

    const [, payload] = cartoesService.registrarPagamentoFatura.mock.calls[0];
    expect(payload.valorFatura).toBe(2995.1);
    expect(payload.valorPago).toBe(2995.1);
  });

  it('deve exibir loading e bloquear duplo clique ao desfazer pagamento', () => {
    const c = cartao({ id: 9, valorUtilizado: 0, valorFaturaPaga: 200 });
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 9,
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
        dataPagamento: '2026-05-10',
      }),
    ];
    cartoesService.desfazerPagamentoFatura.mockReturnValue(NEVER);
    dividasService.updateDivida.mockReturnValue(NEVER);

    dialog.open.mockReturnValueOnce(afterClosed(true));
    component.confirmarDesfazerPagamento(c);

    expect(component.estaProcessandoAcaoFatura(c, 'desfazer')).toBe(true);
    expect(cartoesService.desfazerPagamentoFatura).toHaveBeenCalledWith(
      9,
      2026,
      5,
    );

    const chamadasDialog = dialog.open.mock.calls.length;
    component.confirmarDesfazerPagamento(c);
    expect(dialog.open).toHaveBeenCalledTimes(chamadasDialog);
  });

  it('deve abrir dialog de adicionar e editar cartão', () => {
    dialog.open
      .mockReturnValueOnce(afterClosed(true))
      .mockReturnValueOnce(afterClosed(undefined));
    component.abrirModalAdicionar();
    expect(dialog.open).toHaveBeenCalledTimes(2);

    dialog.open
      .mockReturnValueOnce(afterClosed(true))
      .mockReturnValueOnce(afterClosed(undefined));
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
    expect(
      component['mensagemErroHttp'](new HttpErrorResponse({ status: 0 })),
    ).toContain('Servidor indisponível');
    expect(
      component['mensagemErroHttp'](new HttpErrorResponse({ status: 404 })),
    ).toContain('API de faturas');
    expect(component['mensagemErroHttp'](new Error('x'))).toBe(
      'Não foi possível carregar as faturas.',
    );
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
    component['initChart'](
      { nativeElement: null } as unknown as ElementRef<HTMLDivElement>,
      {},
    );
  });

  it('deve chamar atualização de gráficos no ciclo de vida e inicializar charts existentes ou novos', () => {
    const atualizarSpy = jest
      .spyOn(component as any, 'atualizarGraficos')
      .mockImplementation(() => undefined);
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

    component.chartUsoLimite = {
      nativeElement: el,
    } as ElementRef<HTMLDivElement>;
    component.chartEvolucaoFatura = {
      nativeElement: el,
    } as ElementRef<HTMLDivElement>;
    component.chartPorBanco = {
      nativeElement: el,
    } as ElementRef<HTMLDivElement>;
    component.chartComparacao = {
      nativeElement: el,
    } as ElementRef<HTMLDivElement>;

    component['atualizarGraficos']();

    expect(chart.setOption).toHaveBeenCalled();
    expect(initSpy).toHaveBeenCalled();
    expect((component['charts'] as any[]).includes(chart)).toBe(true);
  });

  it('deve cobrir fallbacks de valores de fatura, limite e resumo', () => {
    const c = {
      ...cartao({
        id: 10,
        totalAPagarMes: null as any,
        valorUtilizado: undefined as any,
      }),
      limite: undefined as any,
    };
    component.cartoes = [c];
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 10,
        valorRestante: undefined as any,
        valorTotal: 300,
        quantidadeParcelas: 3,
      }),
      parcelaMes({
        cartaoId: 10,
        valorRestante: -50,
        valorTotal: 300,
        quantidadeParcelas: 3,
      }),
    ];

    expect(component.valorUtilizadoFatura(c)).toBe(200);
    expect(component.valorUtilizadoLimite(c)).toBe(300);
    expect(component.valorDisponivelFatura(c)).toBe(0);
    expect(component.resumo.limiteTotal).toBe(0);
  });

  it('deve cobrir status de fatura com parcelas pagas, quitadas e pendentes', () => {
    const c = cartao({ id: 11, valorUtilizado: 100, diaVencimento: 1 });

    component.parcelamentos = [
      parcelaMes({ cartaoId: 11, statusParcelaMes: 'paga' }),
    ];
    expect(component.faturaAtrasada(c)).toBe(false);

    component.parcelamentos = [
      parcelaMes({ cartaoId: 11, statusParcelaMes: 'quitada' }),
    ];
    expect(component.faturaAtrasada(c)).toBe(false);

    component.parcelamentos = [
      parcelaMes({ cartaoId: 11, statusParcelaMes: 'pendente' }),
    ];
    expect(component.faturaAtrasada(c)).toBe(true);

    component.parcelamentos = [];
    expect((component as any).statusResumoParcelasCartao(c)).toBeNull();
  });

  it('deve cobrir datas de previsão inválidas e vencidas', () => {
    expect(
      component.previsaoPagamentoVencida(
        cartao({ previsaoPagamento: undefined, valorUtilizado: 100 }),
      ),
    ).toBe(false);
    expect(
      component.previsaoPagamentoVencida(
        cartao({ previsaoPagamento: 'data-invalida', valorUtilizado: 100 }),
      ),
    ).toBe(false);
    expect(
      component.previsaoPagamentoVencida(
        cartao({ previsaoPagamento: '2026-05-10', valorUtilizado: 100 }),
      ),
    ).toBe(true);

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
    expect(dividasService.updateDivida).toHaveBeenCalledWith(101, {
      valorPago: 100,
      dataPagamento: expect.any(String),
    });
    expect(dividasService.updateDivida).toHaveBeenCalledWith(102, {
      valorPago: 0,
      dataPagamento: null,
      statusDivida: 'pagando',
    });
  });
});
