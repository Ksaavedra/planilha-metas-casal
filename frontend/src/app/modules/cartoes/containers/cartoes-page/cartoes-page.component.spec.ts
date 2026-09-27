import { HttpErrorResponse } from '@angular/common/http';
import { ElementRef } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, NEVER } from 'rxjs';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { Divida, DividaNoMes } from '@core/interfaces/dividas/dividas';
import * as echarts from 'echarts';
import { ConfirmModalPaymentDetails } from 'shared/components/confirm-modal/confirm-modal.component';
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
    temGrupoFamiliarAtual: boolean;
  };
  let temGrupoFamiliarSubject: BehaviorSubject<boolean>;

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
    temGrupoFamiliarSubject = new BehaviorSubject(true);
    perfilService = {
      temGrupoFamiliar$: temGrupoFamiliarSubject.asObservable(),
      temGrupoFamiliarAtual: true,
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

  it('deve voltar para Minhas faturas ao desativar modo família', () => {
    component.ngOnInit();
    component.visaoFaturas = 'usuario';

    perfilService.temGrupoFamiliarAtual = false;
    temGrupoFamiliarSubject.next(false);

    expect(component.visaoFaturas).toBe('lista');
    expect(component.cartaoExpandidoId).toBeNull();
  });

  it('deve alternar visão e mês', () => {
    component.selecionarVisao('usuario');
    expect(component.visaoFaturas).toBe('usuario');

    perfilService.temGrupoFamiliarAtual = false;
    component.visaoFaturas = 'lista';
    component.selecionarVisao('usuario');
    expect(component.visaoFaturas).toBe('lista');

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
    expect(component.motivoParcelarCompraDesabilitado()).toBe(
      'Disponível somente para faturas não pagas.',
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

  it('deve permitir clicar em Pendente para pagar', () => {
    component.mesAtual = new Date(2026, 6, 1);
    const c = cartao({
      id: 7,
      valorUtilizado: 150,
      diaVencimento: 6,
      diaMelhorCompra: 28,
    });
    component.parcelamentos = [
      parcelaMes({ cartaoId: 7, statusParcelaMes: 'pendente' }),
    ];
    jest
      .spyOn(component as any, 'confirmarPagarFatura')
      .mockImplementation(() => undefined);

    expect(component.statusLinhaLabel(c)).toContain('Pendente');
    expect(component.statusFaturaClicavel(c)).toBe(true);
    expect(component.tituloAcaoPagamentoFatura(c)).toBe('Pagar fatura');
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
        valorTotal: 300,
        quantidadeParcelas: 3,
        valorPago: 100,
      }),
    ];
    component['parcelamentosAno'] = [
      {
        id: 11,
        objetivo: 'Compra',
        tipoDivida: 'parcelamento',
        valorTotal: 300,
        valorPago: 100,
        quantidadeParcelas: 3,
        cartaoId: 1,
        dataInicio: '2026-05-01',
      } as Divida,
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

  it('deve exibir loading e bloquear duplo clique ao pagar fatura pendente', () => {
    const c = cartao({ id: 10, valorUtilizado: 150, diaVencimento: 6 });
    component.parcelamentos = [
      parcelaMes({ cartaoId: 10, statusParcelaMes: 'pendente' }),
    ];
    cartoesService.registrarPagamentoFatura.mockReturnValue(NEVER);
    dividasService.updateDivida.mockReturnValue(NEVER);

    dialog.open.mockReturnValueOnce(afterClosed(true));
    component.confirmarPagarFatura(c);

    expect(component.statusFaturaClicavel(c)).toBe(true);
    expect(component.estaProcessandoAcaoFatura(c, 'pagar')).toBe(true);
    expect(component.tituloAcaoPagamentoFatura(c)).toBe(
      'Processando pagamento...',
    );

    const chamadasDialog = dialog.open.mock.calls.length;
    component.confirmarPagarFatura(c);
    expect(dialog.open).toHaveBeenCalledTimes(chamadasDialog);
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

  it('deve incluir data e valor na mensagem de confirmar pagamento', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 2, 12, 0, 0));
    component.mesAtual = new Date(2026, 6, 1);

    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 1,
        statusParcelaMes: 'pendente',
        valorTotal: 100,
        quantidadeParcelas: 1,
      }),
    ];
    component.confirmarPagarFatura(
      cartao({ id: 1, nome: 'C6', valorUtilizado: 100 }),
    );

    const dialogData = dialog.open.mock.calls[0][1]?.data as {
      title?: string;
      message?: string;
      paymentDetails?: ConfirmModalPaymentDetails;
      confirmText?: string;
      cancelText?: string;
      variant?: string;
    };
    expect(dialogData?.title).toBe('Confirmar pagamento da fatura');
    expect(dialogData?.confirmText).toBe('Pagar fatura');
    expect(dialogData?.cancelText).toBe('Cancelar');
    expect(dialogData?.variant).toBe('payment');
    expect(dialogData?.message).toContain(
      'Deseja confirmar o pagamento da fatura do cartão C6?',
    );
    expect(dialogData?.paymentDetails?.nomeCartao).toBe('C6');
    expect(dialogData?.paymentDetails?.dataPagamento).toBe('02/07/2026');
    expect(dialogData?.paymentDetails?.vencimento).toBeTruthy();
    expect(dialogData?.paymentDetails?.valor).toMatch(/R\$\s?100,00/);

    dialog.open.mockClear();
    dialog.open.mockReturnValueOnce(afterClosed(false));
    component.parcelamentos = [
      parcelaMes({
        cartaoId: 2,
        statusParcelaMes: 'pendente',
        valorTotal: 5071.65,
        quantidadeParcelas: 1,
      }),
    ];
    component.confirmarPagarFatura(
      cartao({
        id: 2,
        nome: 'C6 Bank',
        valorUtilizado: 5071.65,
        previsaoPagamento: '2026-07-05',
      }),
    );

    const comPrevisao = dialog.open.mock.calls[0][1]?.data as {
      message?: string;
      paymentDetails?: ConfirmModalPaymentDetails;
    };
    expect(comPrevisao?.message).toContain(
      'Deseja confirmar o pagamento da fatura do cartão C6 Bank?',
    );
    expect(comPrevisao?.paymentDetails?.dataPagamento).toBe('05/07/2026');
    expect(comPrevisao?.paymentDetails?.valor).toMatch(/R\$\s?5\.071,65/);

    jest.useRealTimers();
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
    component['parcelamentosAno'] = [
      {
        id: 102,
        objetivo: 'Compra',
        tipoDivida: 'parcelamento',
        valorTotal: 300,
        valorPago: 100,
        quantidadeParcelas: 3,
        cartaoId: 12,
        dataInicio: '2026-05-01',
      } as Divida,
    ];

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

  it('deve desfazer pagamento só do mês atual sem afetar parcelas pagas em outros meses', () => {
    component.mesAtual = new Date(2026, 5, 1);
    const c = cartao({ id: 13, valorUtilizado: 200, valorFaturaPaga: 100 });
    component['parcelamentosAno'] = [
      {
        id: 201,
        objetivo: 'Compra',
        tipoDivida: 'parcelamento',
        valorTotal: 300,
        valorPago: 200,
        valorRestante: 100,
        quantidadeParcelas: 3,
        cartaoId: 13,
        dataInicio: '2026-06-01',
        dataPagamento: '2026-07-02',
        statusDivida: 'pagando',
      } as Divida,
    ];
    component.parcelamentos = [
      parcelaMes({
        id: 201,
        cartaoId: 13,
        valorTotal: 300,
        quantidadeParcelas: 3,
        dataInicio: '2026-06-01',
        valorPago: 200,
        dataPagamento: '2026-07-02',
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
      }),
    ];

    const atualizacoes = (component as any).atualizacoesParcelasDesfeitas(c);

    expect(atualizacoes.length).toBe(0);
    expect(dividasService.updateDivida).not.toHaveBeenCalled();
  });

  describe('cobertura complementar', () => {
    const ajuste = (partial: Partial<Divida> = {}): Divida => ({
      ...divida({
        tipoDivida: 'ajuste_fatura',
        objetivo: 'juros',
        valorTotal: 50,
        quantidadeParcelas: 1,
        dataInicio: '2026-05-01',
        ...partial,
      }),
    });

    const cartaoPago = (partial: Partial<Cartao> = {}): Cartao =>
      cartao({
        id: 1,
        valorUtilizado: 0,
        faturaPaga: true,
        valorFaturaPaga: 100,
        ...partial,
      });

    it('deve carregar ajustes do mês e enriquecer lançamentos com dados do cartão', () => {
      const semDias = {
        ...cartao({ id: 2, banco: 'Inter' }),
        diaMelhorCompra: undefined,
        diaVencimento: undefined,
      } as Cartao;
      cartoesService.getCartoes.mockReturnValue(
        of([cartao({ id: 1, diaMelhorCompra: 21, diaVencimento: 25 }), semDias]),
      );
      dividasService.getDividas.mockImplementation((ano: number) =>
        ano === 2026
          ? of([
              ajuste({ id: 5, cartaoId: 1 }),
              ajuste({ id: 6, cartaoId: 1, dataInicio: '2026-01-01' }),
              ajuste({ id: 8, cartaoId: null }),
              { ...divida({ id: 10, cartaoId: 1 }), diaMelhorCompra: 3, diaVencimento: 9 },
              divida({ id: 11, cartaoId: 99 }),
              divida({ id: 12, cartaoId: 2 }),
              { ...divida({ id: 13, cartaoId: 1 }), diaMelhorCompra: 7 },
            ])
          : of([]),
      );

      component.carregar();

      expect(component.ajustes.map((a) => a.id)).toEqual([5]);
      expect(component.ajustes[0].diaMelhorCompra).toBe(21);
      expect(component.ajustes[0].diaVencimento).toBe(25);

      const ano = component['parcelamentosAno'] as Divida[];
      const porId = (id: number) => ano.find((d) => d.id === id)!;
      expect(porId(10).diaMelhorCompra).toBe(3);
      expect(porId(10).diaVencimento).toBe(9);
      expect(porId(11).diaMelhorCompra).toBeUndefined();
      expect(porId(12).diaMelhorCompra).toBeNull();
      expect(porId(12).diaVencimento).toBeNull();
      expect(porId(13).diaMelhorCompra).toBe(7);
      expect(porId(13).diaVencimento).toBe(25);

      jest.runOnlyPendingTimers();
    });

    it('deve consultar apenas anos positivos ao carregar dívidas', () => {
      const data = new Date(2026, 4, 1);
      data.setFullYear(1);
      component.mesAtual = data;

      component.carregar();

      expect(dividasService.getDividas).toHaveBeenCalledTimes(1);
      expect(dividasService.getDividas).toHaveBeenCalledWith(1);
    });

    it('deve identificar fatura paga sem lançamentos pelo cartão', () => {
      expect(component.isFaturaPaga(cartaoPago())).toBe(true);
      expect(
        component.isFaturaPaga(cartaoPago({ valorFaturaPaga: undefined })),
      ).toBe(false);
      expect(
        component.isFaturaPaga(cartao({ valorUtilizado: 0, faturaPaga: false })),
      ).toBe(false);
    });

    it('deve considerar ajustes como lançamentos da fatura', () => {
      const c = cartao({ id: 1, valorUtilizado: 0 });
      component.ajustes = [
        ajuste({ id: 1, cartaoId: 1, valorTotal: 80 }),
        ajuste({ id: 2, cartaoId: 2, valorTotal: 999 }),
      ];

      expect(component.ajustesDoCartao(c).map((a) => a.id)).toEqual([1]);
      expect(component.valorUtilizadoFatura(c)).toBe(80);
      expect(component.valorFaturaCartao(c)).toBe(80);
      expect(component.isFaturaPaga(c)).toBe(false);
      expect(component.labelAjuste(component.ajustes[0])).toBe('Juros');
      expect(component.labelAjuste(ajuste({ objetivo: 'livre' }))).toBe(
        'livre',
      );

      component.ajustes = [
        ajuste({
          id: 3,
          cartaoId: 1,
          objetivo: 'pagamento_realizado',
          valorTotal: -80,
        }),
      ];
      expect(component.valorUtilizadoFatura(c)).toBe(0);
      expect(component.isFaturaPaga(c)).toBe(false);
    });

    it('deve formatar melhor dia de compra e data da compra', () => {
      expect(component.melhorDiaCompraLabel(cartao({ diaMelhorCompra: 12 }))).toBe(
        'Dia 12',
      );
      expect(
        component.melhorDiaCompraLabel({
          ...cartao(),
          diaMelhorCompra: null,
          diaVencimento: undefined as any,
        }),
      ).toBe('-');

      expect(
        component.dataCompraExibicao({
          ...parcelaMes(),
          dataCompra: '2026-04-15',
        }),
      ).toBe('15/04/2026');
      expect(
        component.dataCompraExibicao(parcelaMes({ dataInicio: '2026-03-02' })),
      ).toBe('02/03/2026');
      expect(
        component.dataCompraExibicao({
          ...parcelaMes(),
          dataInicio: undefined as any,
        }),
      ).toBe('-');
    });

    it('não deve abrir ações de ajuste quando a fatura está paga', () => {
      const pago = cartaoPago();

      component.adicionarAjuste(pago);
      component.editarAjusteResumo(pago);

      expect(dialog.open).not.toHaveBeenCalled();
      expect(component.tituloEditarAjusteResumo(pago)).toBe(
        'Não é possível editar uma fatura já paga.',
      );
    });

    it('deve adicionar ajuste e exibir sucesso apenas quando salvo', () => {
      const c = cartao({ id: 1, valorUtilizado: 100 });

      dialog.open.mockReturnValueOnce(afterClosed(false));
      component.adicionarAjuste(c);
      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(dialog.open.mock.calls[0][1].data).toEqual({
        cartao: c,
        ano: 2026,
        mes: 5,
      });
      expect(cartoesService.getCartoes).not.toHaveBeenCalled();

      dialog.open
        .mockReturnValueOnce(afterClosed(true))
        .mockReturnValueOnce(afterClosed(undefined));
      component.adicionarAjuste(c);
      expect(cartoesService.getCartoes).toHaveBeenCalledTimes(1);
      expect(dialog.open.mock.calls[2][1].data.title).toBe(
        'Ajuste adicionado!',
      );
    });

    it('deve editar ajuste e recarregar apenas quando salvo', () => {
      const c = cartao({ id: 1 });
      const a = ajuste({ id: 7, cartaoId: 1 });

      dialog.open.mockReturnValueOnce(afterClosed(false));
      component.editarAjuste(c, a);
      expect(dialog.open.mock.calls[0][1].data.ajuste).toBe(a);
      expect(cartoesService.getCartoes).not.toHaveBeenCalled();

      dialog.open.mockReturnValueOnce(afterClosed(true));
      component.editarAjuste(c, a);
      expect(cartoesService.getCartoes).toHaveBeenCalledTimes(1);
      expect(dialog.open).toHaveBeenCalledTimes(2);
    });

    it('deve decidir entre editar ou adicionar ajuste no resumo', () => {
      const c = cartao({ id: 1, valorUtilizado: 100 });
      const editarSpy = jest
        .spyOn(component, 'editarAjuste')
        .mockImplementation(() => undefined);
      const adicionarSpy = jest
        .spyOn(component, 'adicionarAjuste')
        .mockImplementation(() => undefined);

      expect(component.tituloEditarAjusteResumo(c)).toBe(
        'Adicionar crédito ou ajuste',
      );
      component.editarAjusteResumo(c);
      expect(adicionarSpy).toHaveBeenCalledWith(c);

      const a1 = ajuste({ id: 1, cartaoId: 1, dataInicio: '2026-05-02' });
      component.ajustes = [a1];
      expect(component.tituloEditarAjusteResumo(c)).toBe(
        'Editar crédito ou ajuste',
      );
      component.editarAjusteResumo(c);
      expect(editarSpy).toHaveBeenCalledWith(c, a1);

      component.ajustes = [a1, ajuste({ id: 2, cartaoId: 1 })];
      expect(component.tituloEditarAjusteResumo(c)).toBe(
        'Editar ajuste (use a tabela para os demais)',
      );
    });

    it('deve excluir ajuste somente após confirmação', () => {
      const a = ajuste({ id: 9, objetivo: 'iof' });

      dialog.open.mockReturnValueOnce(afterClosed(false));
      component.confirmarExcluirAjuste(a);
      expect(dialog.open.mock.calls[0][1].data.message).toBe(
        'Deseja excluir "IOF"?',
      );
      expect(dividasService.deleteDivida).not.toHaveBeenCalled();

      dialog.open.mockReturnValueOnce(afterClosed(true));
      component.confirmarExcluirAjuste(a);
      expect(dividasService.deleteDivida).toHaveBeenCalledWith(9);
      expect(cartoesService.getCartoes).toHaveBeenCalledTimes(1);
    });

    it('deve montar títulos e tooltips conforme a fatura esteja paga ou não', () => {
      const pago = cartaoPago();
      const aberto = cartao({ id: 2, valorUtilizado: 100 });

      expect(component.tituloParcelarCompra(pago)).toBe(
        'Disponível somente para faturas não pagas.',
      );
      expect(component.tituloParcelarCompra(aberto)).toBe('Parcelar compra');
      expect(component.tituloJurosAjuste(pago)).toBe(
        'Disponível somente para faturas não pagas.',
      );
      expect(component.tituloJurosAjuste(aberto)).toBe(
        'Juros, crédito ou ajuste',
      );

      expect(component.tooltipDesfazerPagamento(pago)).toBe(
        'Desfazer pagamento',
      );
      expect(component.tooltipEditarFatura(pago)).toBe('Editar fatura');
      expect(component.tooltipExcluirFatura(pago)).toBe('Excluir fatura');

      expect(component.tooltipExpandirDetalhes(aberto)).toBe(
        'Expandir detalhes',
      );
      component.alternarCartao(aberto);
      expect(component.tooltipExpandirDetalhes(aberto)).toBe(
        'Recolher detalhes',
      );

      expect(component.tooltipEditarCompra(aberto)).toBe('Editar compra');
      expect(component.tooltipEditarCompra(pago)).toBe(
        'Não é possível editar uma fatura já paga.',
      );
      expect(component.tooltipExcluirCompra(aberto)).toBe('Excluir compra');
      expect(component.tooltipExcluirCompra(pago)).toBe(
        'Não é possível excluir uma fatura já paga.',
      );
      expect(component.tooltipEditarAjuste(aberto)).toBe('Editar ajuste');
      expect(component.tooltipEditarAjuste(pago)).toBe(
        'Não é possível editar uma fatura já paga.',
      );
      expect(component.tooltipExcluirAjuste(aberto)).toBe('Excluir ajuste');
      expect(component.tooltipExcluirAjuste(pago)).toBe(
        'Não é possível excluir uma fatura já paga.',
      );
    });

    it('deve abrir resolução de fatura atrasada ou ignorar enquanto processa', () => {
      const c = cartao({ id: 1, valorUtilizado: 200, diaVencimento: 5 });
      const atrasadaSpy = jest
        .spyOn(component, 'abrirAcaoFaturaAtrasada')
        .mockImplementation(() => undefined);
      const pagarSpy = jest
        .spyOn(component, 'confirmarPagarFatura')
        .mockImplementation(() => undefined);

      component.acaoFaturaProcessando = { cartaoId: 1, tipo: 'desfazer' };
      component.abrirAcaoPagamentoFatura(c);
      expect(atrasadaSpy).not.toHaveBeenCalled();
      expect(pagarSpy).not.toHaveBeenCalled();

      component.acaoFaturaProcessando = null;
      component.abrirAcaoPagamentoFatura(c);
      expect(atrasadaSpy).toHaveBeenCalledWith(c);
      expect(pagarSpy).not.toHaveBeenCalled();
    });

    it('deve usar null ao combinar pagamento posterior sem observação e previsão', () => {
      const c = cartao({ id: 3, valorUtilizado: 200, diaVencimento: 5 });
      dialog.open
        .mockReturnValueOnce(afterClosed({ acao: 'depois' }))
        .mockReturnValueOnce(afterClosed(undefined));

      component.abrirAcaoFaturaAtrasada(c);

      expect(cartoesService.updateCartao).toHaveBeenCalledWith(3, {
        observacaoAtraso: null,
        previsaoPagamento: null,
        faturaPaga: false,
      });
      expect(dialog.open.mock.calls[1][1].data.title).toBe('Combinado!');
    });

    it('deve verificar se uma ação de fatura está em processamento', () => {
      const c = cartao({ id: 1 });

      expect(component.estaProcessandoAcaoFatura(c)).toBe(false);

      component.acaoFaturaProcessando = { cartaoId: 2, tipo: 'pagar' };
      expect(component.estaProcessandoAcaoFatura(c)).toBe(false);

      component.acaoFaturaProcessando = { cartaoId: 1, tipo: 'pagar' };
      expect(component.estaProcessandoAcaoFatura(c)).toBe(true);
      expect(component.estaProcessandoAcaoFatura(c, 'pagar')).toBe(true);
      expect(component.estaProcessandoAcaoFatura(c, 'desfazer')).toBe(false);
    });

    it('deve cobrir cenários não clicáveis do status da fatura', () => {
      const aberto = cartao({ id: 1, valorUtilizado: 100 });

      component.carregando = true;
      expect(component.statusFaturaClicavel(aberto)).toBe(false);
      component.carregando = false;

      component.acaoFaturaProcessando = { cartaoId: 1, tipo: 'desfazer' };
      expect(component.statusFaturaClicavel(aberto)).toBe(false);
      component.acaoFaturaProcessando = null;

      expect(
        component.statusFaturaClicavel(cartao({ id: 1, valorUtilizado: 0 })),
      ).toBe(false);

      expect(component.statusFaturaClicavel(aberto)).toBe(false);

      const pagoComSaldo = cartao({
        id: 1,
        valorUtilizado: 200,
        faturaPaga: true,
        valorFaturaPaga: 100,
      });
      expect(component.statusFaturaClicavel(pagoComSaldo)).toBe(false);

      component.parcelamentos = [
        parcelaMes({ cartaoId: 1, statusParcelaMes: 'futura' }),
      ];
      component.ajustes = [ajuste({ cartaoId: 1, valorTotal: 30 })];
      expect(component.faturaAtrasada(aberto)).toBe(false);
      expect(component.statusFaturaClicavel(aberto)).toBe(false);
    });

    it('deve cobrir alertas e ícones de pagamento', () => {
      const atrasado = cartao({ id: 1, valorUtilizado: 200, diaVencimento: 5 });
      component.parcelamentos = [
        parcelaMes({ cartaoId: 1, statusParcelaMes: 'atrasada' }),
      ];
      expect(component.mostrarAlertaPagamento(atrasado)).toBe(false);

      component.parcelamentos = [];
      const emDia = cartao({ id: 2, valorUtilizado: 100 });
      expect(component.mostrarAlertaPagamento(emDia)).toBe(false);
      expect(component.textoAlertaPagamento(emDia)).toBe('');
      expect(component.mostrarIconePagoStatus(emDia)).toBe(false);
      expect(component.mostrarIconePagoStatus(cartaoPago())).toBe(true);

      component.parcelamentos = [
        parcelaMes({ cartaoId: 3, statusParcelaMes: 'paga' }),
      ];
      expect(
        component.mostrarIconePagoStatus(cartao({ id: 3, valorUtilizado: 0 })),
      ).toBe(true);
    });

    it('deve avaliar pagar e desfazer sem parcelamentos', () => {
      expect(component.podePagarFatura(cartao({ valorUtilizado: 100 }))).toBe(
        true,
      );
      expect(component.podePagarFatura(cartao({ valorUtilizado: 0 }))).toBe(
        false,
      );
      expect(
        component.podePagarFatura(
          cartao({ valorUtilizado: 100, faturaPaga: true }),
        ),
      ).toBe(false);

      expect(component.mostrarBotaoDesfazer(cartaoPago())).toBe(true);
      expect(component.mostrarBotaoDesfazer(cartao({ valorUtilizado: 0 }))).toBe(
        false,
      );
    });

    it('deve montar título e mensagem de desfazer para todos os cenários', () => {
      expect(component.tituloDesfazerPagamento(cartao({ id: 1 }))).toBe('');

      expect(component.tituloDesfazerPagamento(cartaoPago())).toBe(
        'Fatura paga. Clique para desfazer.',
      );
      expect(component.mensagemConfirmarDesfazerPagamento(cartaoPago())).toBe(
        'Deseja desfazer este pagamento?',
      );

      component.parcelamentos = [
        parcelaMes({
          cartaoId: 4,
          statusParcelaMes: 'quitada',
          dataPagamento: undefined,
        }),
      ];
      expect(
        component.tituloDesfazerPagamento(
          cartao({ id: 4, faturaPaga: true, valorFaturaPaga: undefined }),
        ),
      ).toBe('Desfazer pagamento');
      expect(component.tituloDesfazerPagamento(cartao({ id: 4 }))).toBe(
        'Desfazer pagamento',
      );
    });

    it('deve retornar null no resumo de parcelas com status desconhecido', () => {
      component.parcelamentos = [
        parcelaMes({ cartaoId: 1, statusParcelaMes: 'desconhecido' as any }),
      ];

      expect(
        (component as any).statusResumoParcelasCartao(cartao({ id: 1 })),
      ).toBeNull();
    });

    it('deve liberar processamento quando o registro de pagamento falha', () => {
      const c = cartao({ id: 1, valorUtilizado: 100 });
      component.parcelamentos = [
        parcelaMes({ cartaoId: 1, statusParcelaMes: 'pendente' }),
      ];
      cartoesService.registrarPagamentoFatura.mockReturnValue(
        throwError(() => new Error('falha')),
      );

      dialog.open.mockReturnValueOnce(afterClosed(true));
      component.confirmarPagarFatura(c);

      expect(cartoesService.registrarPagamentoFatura).toHaveBeenCalled();
      expect(component.acaoFaturaProcessando).toBeNull();
      expect(dialog.open).toHaveBeenCalledTimes(1);
    });

    it('não deve executar pagamento durante carregamento ou processamento', () => {
      const c = cartao({ id: 1, valorUtilizado: 100 });
      const opcoes = {
        valorFatura: 100,
        valorPago: 100,
        tituloSucesso: 't',
        mensagemSucesso: 'm',
      };

      component.carregando = true;
      component['executarPagamentoFatura'](c, opcoes);
      expect(cartoesService.registrarPagamentoFatura).not.toHaveBeenCalled();
      expect(component.acaoFaturaProcessando).toBeNull();

      component.carregando = false;
      component.acaoFaturaProcessando = { cartaoId: 1, tipo: 'pagar' };
      component['executarPagamentoFatura'](c, opcoes);
      component['registrarPagamentoAtrasado'](c, 50);
      component['executarDesfazerPagamentoFatura'](c);
      expect(cartoesService.registrarPagamentoFatura).not.toHaveBeenCalled();
      expect(cartoesService.desfazerPagamentoFatura).not.toHaveBeenCalled();
    });

    it('deve manter observação e previsão em pagamento atrasado parcial', () => {
      const c = cartao({
        id: 1,
        valorUtilizado: 300,
        observacaoAtraso: 'Pago metade',
        previsaoPagamento: '2026-05-20',
      });
      component.parcelamentos = [
        parcelaMes({
          cartaoId: 1,
          statusParcelaMes: 'pendente',
          valorTotal: 300,
          quantidadeParcelas: 3,
        }),
      ];

      component['registrarPagamentoAtrasado'](c, 50);

      const [, payload] = cartoesService.registrarPagamentoFatura.mock.calls[0];
      expect(payload.valorPago).toBe(50);
      expect(payload.observacaoAtraso).toBe('Pago metade');
      expect(payload.previsaoPagamento).toBe('2026-05-20');
      expect(payload.dataPagamento).toBe('2026-05-20');

      cartoesService.registrarPagamentoFatura.mockClear();
      component['registrarPagamentoAtrasado'](
        cartao({ id: 1, valorUtilizado: 300 }),
        50,
        '2026-05-08T10:00:00',
      );
      const [, semObs] = cartoesService.registrarPagamentoFatura.mock.calls[0];
      expect(semObs.observacaoAtraso).toBeNull();
      expect(semObs.previsaoPagamento).toBeNull();
      expect(semObs.dataPagamento).toBe('2026-05-08');
    });

    it('deve liberar processamento quando desfazer pagamento falha', () => {
      const c = cartaoPago({ id: 1 });
      cartoesService.desfazerPagamentoFatura.mockReturnValue(
        throwError(() => new Error('falha')),
      );

      dialog.open.mockReturnValueOnce(afterClosed(true));
      component.confirmarDesfazerPagamento(c);

      expect(cartoesService.desfazerPagamentoFatura).toHaveBeenCalledWith(
        1,
        2026,
        5,
      );
      expect(component.acaoFaturaProcessando).toBeNull();
    });

    it('deve sincronizar estado local após desfazer pagamento', () => {
      const c = cartao({
        id: 1,
        faturaPaga: true,
        valorFaturaPaga: 100,
        observacaoAtraso: 'obs',
        previsaoPagamento: '2026-05-20',
      });
      component.cartoes = [c];
      const semDivida = parcelaMes({
        id: 301,
        cartaoId: 1,
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
      });
      const semValor = parcelaMes({
        id: 302,
        cartaoId: 1,
        statusParcelaMes: 'quitada',
      });
      const desfazivel = parcelaMes({
        id: 303,
        cartaoId: 1,
        statusParcelaMes: 'paga',
        parcelaMesPaga: true,
      });
      component.parcelamentos = [semDivida, semValor, desfazivel];
      const dividaSemValor = divida({
        id: 302,
        cartaoId: 1,
        valorPago: 0,
        valorTotal: 300,
        quantidadeParcelas: 3,
      });
      const dividaDesfazivel = divida({
        id: 303,
        cartaoId: 1,
        valorPago: 100,
        valorTotal: 300,
        quantidadeParcelas: 3,
        dataPagamento: '2026-05-05',
        statusDivida: 'quitada',
      });
      component['parcelamentosAno'] = [dividaSemValor, dividaDesfazivel];

      component['sincronizarEstadoLocalAposDesfazer'](c);

      expect(component.cartoes[0]).toEqual({
        ...c,
        faturaPaga: false,
        valorFaturaPaga: 0,
        observacaoAtraso: null,
        previsaoPagamento: null,
      });
      expect(dividaSemValor.valorPago).toBe(0);
      expect(dividaSemValor.statusDivida).toBe('pagando');
      expect(dividaDesfazivel.valorPago).toBe(0);
      expect(dividaDesfazivel.statusDivida).toBe('pagando');
      expect(component.parcelamentos.map((p) => p.id).sort()).toEqual([
        302, 303,
      ]);
    });

    it('deve usar a própria parcela quando não há dívida anual ao desfazer', () => {
      component['parcelamentosAno'] = [];
      component.parcelamentos = [
        parcelaMes({
          id: 401,
          cartaoId: 1,
          statusParcelaMes: 'paga',
          parcelaMesPaga: true,
          valorPago: 100,
          valorTotal: 300,
          quantidadeParcelas: 3,
        }),
      ];

      const atualizacoes = (component as any).atualizacoesParcelasDesfeitas(
        cartao({ id: 1 }),
      );

      expect(atualizacoes.length).toBe(1);
      expect(dividasService.updateDivida).toHaveBeenCalledWith(401, {
        valorPago: 0,
        dataPagamento: null,
        statusDivida: 'pagando',
      });
    });

    it('deve liberar processamento quando o recarregamento após ação falha', () => {
      cartoesService.getCartoes.mockReturnValue(
        throwError(() => new Error('falha')),
      );
      component.acaoFaturaProcessando = { cartaoId: 1, tipo: 'pagar' };

      component['finalizarAcaoFatura']('Título', 'Mensagem');

      expect(component.acaoFaturaProcessando).toBeNull();
      expect(dialog.open).not.toHaveBeenCalled();
      expect(component.carregando).toBe(false);
    });

    it('deve calcular data de pagamento ao registrar conforme o mês de referência', () => {
      const dataPagamento = (c: Cartao, ref?: string) =>
        component['dataPagamentoAoRegistrarCartao'](c, ref);

      expect(dataPagamento(cartao(), '2026-05-15T12:00:00')).toBe('2026-05-15');
      expect(dataPagamento(cartao(), '2026-05')).toBe('2026-05-10');
      expect(
        dataPagamento(cartao({ previsaoPagamento: '2026-05' })),
      ).toBe('2026-05-10');

      component.mesAtual = new Date(2026, 1, 1);
      expect(dataPagamento(cartao({ diaVencimento: 10 }))).toBe('2026-02-10');
      expect(dataPagamento(cartao({ diaVencimento: 31 }))).toBe('2026-02-28');
      expect(
        dataPagamento({ ...cartao(), diaVencimento: undefined as any }),
      ).toBe('2026-02-28');
    });

    it('deve usar vencimento calculado quando o período da fatura não existe', () => {
      jest.spyOn(component, 'periodoFatura').mockReturnValue(null);
      const detalhes = (c: Cartao) =>
        component['dadosConfirmarPagarFatura'](c, 10) as ConfirmModalPaymentDetails;

      expect(detalhes(cartao({ diaVencimento: 10 })).vencimento).toBe(
        '10/05/2026',
      );
      expect(
        detalhes({ ...cartao(), diaVencimento: undefined as any }).vencimento,
      ).toBe('31/05/2026');
      expect(
        detalhes(cartao({ previsaoPagamento: '----------' })).dataPagamento,
      ).toBe('----------');
    });

    it('deve interpretar datas locais incompletas como inválidas', () => {
      expect((component as any).dataLocal('2026-05')).toBeNull();
      expect((component as any).dataLocal('0-05-10')).toBeNull();
      expect((component as any).dataLocal('2026-05-10')).toEqual(
        new Date(2026, 4, 10),
      );
    });

    it('não deve recarregar ao voltar para o mês atual já selecionado', () => {
      component.voltarParaMesAtual();

      expect(cartoesService.getCartoes).not.toHaveBeenCalled();
    });

    it('deve manter visão do usuário quando o grupo familiar continua ativo', () => {
      component.ngOnInit();
      component.visaoFaturas = 'usuario';
      component.cartaoExpandidoId = 3;

      temGrupoFamiliarSubject.next(true);
      expect(component.visaoFaturas).toBe('usuario');

      component.visaoFaturas = 'exemplos';
      temGrupoFamiliarSubject.next(false);
      expect(component.visaoFaturas).toBe('exemplos');
      expect(component.cartaoExpandidoId).toBe(3);

      component.ngOnDestroy();
    });

    it('deve destruir com segurança sem inscrição ativa', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('deve agrupar gastos do mesmo banco e formatar valores dos gráficos', () => {
      component.cartoes = [
        cartao({ id: 1, banco: 'Nubank', valorUtilizado: 100 }),
        cartao({ id: 2, banco: 'Nubank', valorUtilizado: 50 }),
        cartao({ id: 3, banco: 'Inter', valorUtilizado: 30 }),
      ];

      const porBanco: any = component['opcaoGraficoPorBanco']();
      expect(porBanco.series[0].data).toEqual([
        { name: 'Nubank', value: 150 },
        { name: 'Inter', value: 30 },
      ]);
      expect(porBanco.tooltip.valueFormatter(150)).toContain('R$');

      const usoLimite: any = component['opcaoGraficoUsoLimite']();
      expect(usoLimite.tooltip.valueFormatter(150)).toContain('R$');
      expect(component['tooltipEixoValor']().valueFormatter(10)).toContain(
        'R$',
      );
    });

    it('deve reaproveitar gráfico já registrado ao atualizar', () => {
      component.cartoes = [cartao({ id: 1 })];
      const el = document.createElement('div');
      const chart = { setOption: jest.fn(), dispose: jest.fn() };
      jest.spyOn(echarts, 'getInstanceByDom').mockReturnValue(chart as any);
      const initSpy = jest.spyOn(echarts, 'init');
      initSpy.mockClear();
      const ref = { nativeElement: el } as ElementRef<HTMLDivElement>;
      component.chartUsoLimite = ref;
      component.chartEvolucaoFatura = ref;
      component.chartPorBanco = ref;
      component.chartComparacao = ref;

      component['atualizarGraficos']();

      expect(initSpy).not.toHaveBeenCalled();
      expect(chart.setOption).toHaveBeenCalledTimes(4);
      expect(component['charts'] as unknown[]).toEqual([chart]);
      jest.restoreAllMocks();
    });

    it('deve tratar valor restante zerado no limite utilizado', () => {
      const c = cartao({ id: 1, limite: 500 });
      component.parcelamentos = [
        { ...parcelaMes({ cartaoId: 1 }), valorRestante: 0 },
        parcelaMes({ cartaoId: 1, valorRestante: 120 }),
      ];

      expect(component.valorUtilizadoLimite(c)).toBe(120);
      expect(component.valorDisponivelFatura(c)).toBe(380);
    });

    it('não deve recarregar quando o dialog de cartão é cancelado', () => {
      dialog.open.mockReturnValueOnce(afterClosed(false));

      component.abrirModalAdicionar();

      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(cartoesService.getCartoes).not.toHaveBeenCalled();
    });

    it('deve manter rótulo ISO de vencimento quando não é possível formatar', () => {
      const data = new Date(2026, 4, 1);
      data.setFullYear(0);
      component.mesAtual = data;

      expect(component['vencimentoFaturaLabel'](cartao({ diaVencimento: 7 }))).toBe(
        '0-05-07',
      );
    });

    it('deve usar mensagem genérica para outros erros HTTP', () => {
      expect(
        component['mensagemErroHttp'](new HttpErrorResponse({ status: 500 })),
      ).toBe('Não foi possível carregar as faturas.');
    });
  });
});
