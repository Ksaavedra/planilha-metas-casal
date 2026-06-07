import { Divida, DividaNoMes, StatusDivida, StatusParcelaMes } from '../interfaces/dividas/dividas';
import {
  agruparResumoCartoes,
  calcularParcelaMensal,
  calcularResumoDividas,
  calcularResumoDividasNoMes,
  calcularResumoLimiteCartoes,
  calcularTotaisTabelaDividas,
  calcularTotaisTabelaDividasNoMes,
  calcularValorPagoAcumulado,
  dividaVisivelNoMesReferencia,
  filtrarDividasPorMesReferencia,
  formatarMoedaGrafico,
  indiceParcelaNoMes,
  mesDataInicioDivida,
  parcelaAtrasadaNoMes,
  parcelaMensalDivida,
  parcelasPagasDivida,
  parcelasRestantesLabel,
  progressoDivida,
  projetarDividaNoMes,
  projetarDividasNoMes,
  projetarEvolucaoRestante,
  projetarPagamentosMensais,
  projetarParcelaMensalAno,
  projetarSaldoRestanteAno,
  statusDividaClasse,
  statusDividaLabel,
  statusParcelaMesClasse,
  statusParcelaMesLabel,
  totalParcelaMensalAtiva,
  totalParcelaMensalPendenteNoMes,
} from './dividas.util';

describe('dividas.util', () => {
  const divida = (partial: Partial<Divida> = {}): Divida => ({
    id: partial.id ?? 1,
    objetivo: partial.objetivo ?? 'Empréstimo',
    tipoDivida: partial.tipoDivida ?? 'emprestimo',
    valorTotal: partial.valorTotal ?? 300,
    valorPago: partial.valorPago ?? 100,
    valorRestante: partial.valorRestante ?? 200,
    parcelaMensal: partial.parcelaMensal ?? 100,
    quantidadeParcelas: partial.quantidadeParcelas ?? 3,
    parcelasRestantes: partial.parcelasRestantes ?? 2,
    percentualQuitado: partial.percentualQuitado ?? 33.33,
    statusDivida: partial.statusDivida ?? 'pagando',
    instituicao: partial.instituicao,
    limiteCartao: partial.limiteCartao,
    diaVencimento: partial.diaVencimento,
    diaMelhorCompra: partial.diaMelhorCompra,
    cartaoId: partial.cartaoId,
    cartaoNome: partial.cartaoNome,
    cartaoBanco: partial.cartaoBanco,
    ano: partial.ano ?? 2026,
    dataInicio: partial.dataInicio ?? '2026-05-01',
    observacoes: partial.observacoes,
    cartao: partial.cartao,
  });

  const dividaNoMes = (partial: Partial<DividaNoMes> = {}): DividaNoMes => ({
    ...divida(partial),
    indiceParcelaMes: partial.indiceParcelaMes ?? 1,
    valorPagoNoMes: partial.valorPagoNoMes ?? 100,
    parcelaMesPaga: partial.parcelaMesPaga ?? true,
    statusParcelaMes: partial.statusParcelaMes ?? 'paga',
  });

  it('calcula parcela mensal, progresso e totais básicos', () => {
    expect(calcularParcelaMensal(300, 3)).toBe(100);
    expect(calcularParcelaMensal(100, 3)).toBe(33.33);
    expect(calcularParcelaMensal(-300, 3)).toBe(0);
    expect(calcularParcelaMensal(300, 0)).toBe(0);

    expect(parcelaMensalDivida(divida({ valorTotal: 300, quantidadeParcelas: 3, parcelaMensal: 10 }))).toBe(100);
    expect(parcelaMensalDivida(divida({ valorTotal: 0, quantidadeParcelas: 0, parcelaMensal: 55 }))).toBe(55);
    expect(progressoDivida(divida({ valorTotal: 300, valorPago: 150 }))).toBe(50);
    expect(progressoDivida(divida({ valorTotal: 0, valorPago: 150 }))).toBe(0);
  });

  it('calcula resumos e totais de tabela', () => {
    const lista = [
      divida({ valorTotal: 300, valorPago: 100, valorRestante: 200, statusDivida: 'pagando' }),
      divida({ valorTotal: 600, valorPago: 600, valorRestante: 0, statusDivida: 'quitada', quantidadeParcelas: 6, parcelasRestantes: 0 }),
      divida({ valorTotal: 200, valorPago: 50, valorRestante: 150, statusDivida: 'atrasada', quantidadeParcelas: 2, parcelasRestantes: 2 }),
    ];

    expect(calcularResumoDividas(lista)).toEqual({
      totalDividas: 1100,
      totalPago: 750,
      valorRestante: 350,
      parcelasAtivas: 2,
      percentualQuitado: expect.any(Number),
    });

    const totais = calcularTotaisTabelaDividas(lista);
    expect(totais.valorTotal).toBe(1100);
    expect(totais.parcelaMensal).toBe(300);
    expect(totais.valorRestante).toBe(350);
    expect(totais.parcelasRestantes).toBe(4);

    const mes = [
      dividaNoMes({ valorPagoNoMes: 100 }),
      dividaNoMes({ valorPagoNoMes: 0, statusParcelaMes: 'pendente', parcelaMesPaga: false }),
    ];
    expect(calcularTotaisTabelaDividasNoMes(mes).valorPago).toBe(100);
    expect(calcularResumoDividasNoMes(mes).parcelasAtivas).toBe(1);
  });

  it('retorna labels e classes de status', () => {
    const statusDividas: StatusDivida[] = ['pagando', 'atrasada', 'quitada'];
    const statusParcelas: StatusParcelaMes[] = ['paga', 'pendente', 'atrasada', 'futura', 'quitada'];

    expect(statusDividas.map(statusDividaLabel)).toEqual(['Pagando 💳', 'Atrasada ⚠️', 'Quitada ✅']);
    expect(statusDividas.map(statusDividaClasse)).toEqual(['status--pagando', 'status--atrasada', 'status--quitada']);
    expect(statusParcelaMesLabel(statusParcelas[0])).toBe('Parcela paga ✅');
    expect(statusParcelas.map(statusParcelaMesClasse)).toEqual([
      'status--parcela-paga',
      'status--pendente',
      'status--atrasada',
      'status--futura',
      'status--quitada',
    ]);
    expect(statusDividaLabel('outro' as StatusDivida)).toBe('outro');
    expect(statusDividaClasse('outro' as StatusDivida)).toBe('');
    expect(statusParcelaMesLabel('outro' as StatusParcelaMes)).toBe('outro');
    expect(statusParcelaMesClasse('outro' as StatusParcelaMes)).toBe('');
  });

  it('projeta pagamentos e saldos para gráficos', () => {
    expect(projetarEvolucaoRestante(300, 100).slice(0, 4)).toEqual([300, 200, 100, 0]);
    expect(projetarEvolucaoRestante(-1, -1)).toEqual(Array(12).fill(0));
    expect(projetarPagamentosMensais(99.999)).toEqual(Array(12).fill(100));
    expect(formatarMoedaGrafico(1200)).toContain('R$');
  });

  it('interpreta dataInicio e visibilidade no mês', () => {
    expect(mesDataInicioDivida('2026-05-10')).toBe(5);
    expect(mesDataInicioDivida('')).toBeNull();
    expect(mesDataInicioDivida('2026-99-10')).toBeNull();

    expect(dividaVisivelNoMesReferencia(divida({ ano: 2026, dataInicio: '2026-05-01' }), 2026, 4)).toBe(false);
    expect(dividaVisivelNoMesReferencia(divida({ ano: 2025 }), 2026, 5)).toBe(false);
    expect(dividaVisivelNoMesReferencia(divida({ statusDivida: 'pagando' }), 2026, 12)).toBe(true);
    expect(dividaVisivelNoMesReferencia(divida({ statusDivida: 'quitada', dataInicio: '2026-05-01', quantidadeParcelas: 3 }), 2026, 7)).toBe(true);
    expect(dividaVisivelNoMesReferencia(divida({ statusDivida: 'quitada', dataInicio: '2026-05-01', quantidadeParcelas: 3 }), 2026, 8)).toBe(false);
    expect(filtrarDividasPorMesReferencia([divida({ id: 1 }), divida({ id: 2, ano: 2025 })], 2026, 5).map((d) => d.id)).toEqual([1]);
  });

  it('calcula labels, parcelas pagas e índice da parcela no mês', () => {
    expect(parcelasRestantesLabel(dividaNoMes({ indiceParcelaMes: 2, quantidadeParcelas: 3 }))).toBe('2/3');
    expect(parcelasRestantesLabel(divida({ parcelasRestantes: 2, quantidadeParcelas: 3 }))).toBe('2/3');
    expect(parcelasRestantesLabel(divida({ parcelasRestantes: 4, quantidadeParcelas: 0 }))).toBe('4');

    expect(parcelasPagasDivida(divida({ valorTotal: 300, quantidadeParcelas: 3, valorPago: 200 }))).toBe(2);
    expect(parcelasPagasDivida(divida({ valorTotal: 0, quantidadeParcelas: 3, valorPago: 200, parcelaMensal: 0 }))).toBe(0);
    expect(indiceParcelaNoMes(divida({ ano: 2026, dataInicio: '2026-05-01', quantidadeParcelas: 3 }), 2026, 5)).toBe(1);
    expect(indiceParcelaNoMes(divida({ ano: 2026, dataInicio: '2026-05-01', quantidadeParcelas: 3 }), 2026, 7)).toBe(3);
    expect(indiceParcelaNoMes(divida({ ano: 2026, dataInicio: '2026-05-01', quantidadeParcelas: 3 }), 2026, 8)).toBeNull();
    expect(indiceParcelaNoMes(divida({ ano: 2025 }), 2026, 5)).toBeNull();
  });

  it('detecta atraso considerando mês, vencimento e quitação', () => {
    expect(parcelaAtrasadaNoMes(divida({ statusDivida: 'quitada' }), 2026, 5, new Date(2026, 4, 20))).toBe(false);
    expect(parcelaAtrasadaNoMes(divida({ valorRestante: 0 }), 2026, 5, new Date(2026, 4, 20))).toBe(false);
    expect(parcelaAtrasadaNoMes(divida({ diaVencimento: 10 }), 2026, 5, new Date(2026, 4, 11))).toBe(true);
    expect(parcelaAtrasadaNoMes(divida({ diaVencimento: 20 }), 2026, 4, new Date(2026, 4, 1))).toBe(true);
    expect(parcelaAtrasadaNoMes(divida({ diaVencimento: 20 }), 2026, 5, new Date(2026, 4, 10))).toBe(false);
  });

  it('agrupa cartões e calcula limite disponível', () => {
    const lista = [
      divida({ instituicao: 'Nubank', limiteCartao: 1000, valorRestante: 200, diaVencimento: 10, diaMelhorCompra: 11 }),
      divida({ instituicao: 'Nubank', limiteCartao: 800, valorRestante: 100 }),
      divida({ instituicao: '', limiteCartao: 500, valorRestante: 50, statusDivida: 'quitada' }),
    ];

    const agrupado = agruparResumoCartoes(lista);
    expect(agrupado[0].instituicao).toBe('Nubank');
    expect(agrupado[0].limite).toBe(1000);
    expect(agrupado[0].utilizado).toBe(300);
    expect(agrupado[0].disponivel).toBe(700);

    const resumo = calcularResumoLimiteCartoes(lista, new Date(2026, 4, 1));
    expect(resumo.limiteTotal).toBe(1500);
    expect(resumo.utilizado).toBe(300);
    expect(resumo.proximoVencimentoLabel).toContain('Dia 10');
    expect(calcularResumoLimiteCartoes([], new Date(2026, 4, 1)).proximoVencimentoLabel).toBe('—');
  });

  it('calcula pagamento acumulado no mês selecionado', () => {
    expect(calcularValorPagoAcumulado(300, 3, '2026-05-01', 5, 100)).toBe(100);
    expect(calcularValorPagoAcumulado(300, 3, '2026-05-01', 6, 50)).toBe(150);
    expect(calcularValorPagoAcumulado(300, 3, '2026-05-01', 4, 100)).toBe(0);
    expect(calcularValorPagoAcumulado(300, 0, undefined, 5, 500)).toBe(300);
  });

  it('projeta dívida para o mês e classifica status da parcela', () => {
    expect(projetarDividaNoMes(divida({ dataInicio: '2026-06-01' }), 2026, 5, new Date(2026, 4, 1))).toBeNull();

    expect(projetarDividaNoMes(divida({ valorPago: 100, dataInicio: '2026-05-01' }), 2026, 5, new Date(2026, 4, 1))?.statusParcelaMes).toBe('paga');
    expect(projetarDividaNoMes(divida({ valorPago: 0, dataInicio: '2026-05-01', diaVencimento: 10 }), 2026, 5, new Date(2026, 4, 11))?.statusParcelaMes).toBe('atrasada');
    expect(projetarDividaNoMes(divida({ valorPago: 0, dataInicio: '2026-05-01' }), 2026, 6, new Date(2026, 4, 1))?.statusParcelaMes).toBe('futura');
    expect(projetarDividaNoMes(divida({ valorPago: 0, dataInicio: '2026-05-01' }), 2026, 5, new Date(2026, 4, 1))?.statusParcelaMes).toBe('pendente');
    expect(projetarDividaNoMes(divida({ statusDivida: 'quitada', valorRestante: 0, dataInicio: '2026-05-01' }), 2026, 5)?.statusParcelaMes).toBe('quitada');
    expect(projetarDividasNoMes([divida({ id: 1 }), divida({ id: 2, dataInicio: '2026-06-01' })], 2026, 5).map((d) => d.id)).toEqual([1]);
  });

  it('soma parcelas ativas, pendentes e projeções anuais', () => {
    const lista = [
      divida({ valorTotal: 300, quantidadeParcelas: 3, statusDivida: 'pagando', dataInicio: '2026-05-01' }),
      divida({ valorTotal: 600, quantidadeParcelas: 6, statusDivida: 'quitada', dataInicio: '2026-01-01' }),
    ];

    expect(totalParcelaMensalAtiva(lista)).toBe(100);
    expect(totalParcelaMensalPendenteNoMes([
      dividaNoMes({ statusParcelaMes: 'pendente', parcelaMesPaga: false, valorTotal: 300, quantidadeParcelas: 3 }),
      dividaNoMes({ statusParcelaMes: 'futura', parcelaMesPaga: false, valorTotal: 300, quantidadeParcelas: 3 }),
      dividaNoMes({ statusParcelaMes: 'paga', parcelaMesPaga: true, valorTotal: 300, quantidadeParcelas: 3 }),
    ])).toBe(100);

    expect(projetarParcelaMensalAno(lista, 2026)[4]).toBe(200);
    expect(projetarSaldoRestanteAno(lista, 2026)[4]).toBeGreaterThan(0);
  });

  it('cobre fallbacks de valores vazios, datas ausentes e cartões sem limite', () => {
    expect(calcularResumoDividas([]).percentualQuitado).toBe(0);
    expect(
      calcularResumoDividas([
        {
          ...divida(),
          valorTotal: undefined as any,
          valorPago: undefined as any,
          valorRestante: undefined as any,
        },
      ]),
    ).toEqual({
      totalDividas: 0,
      totalPago: 0,
      valorRestante: 0,
      parcelasAtivas: 1,
      percentualQuitado: 0,
    });

    expect(
      dividaVisivelNoMesReferencia(
        {
          ...divida({ statusDivida: 'quitada', quantidadeParcelas: 0, parcelasRestantes: 2 }),
          dataInicio: undefined,
        },
        2026,
        2,
      ),
    ).toBe(true);
    expect(parcelasRestantesLabel({
      ...divida({ quantidadeParcelas: 0 }),
      parcelasRestantes: undefined,
    } as any)).toBe('0');
    expect(parcelasPagasDivida({
      ...divida({ quantidadeParcelas: 0, valorPago: 200, parcelaMensal: 50 }),
      valorTotal: 0,
    })).toBe(4);
    expect(indiceParcelaNoMes({
      ...divida({ quantidadeParcelas: 0 }),
      dataInicio: undefined,
    }, 2026, 12)).toBe(12);

    expect(parcelaAtrasadaNoMes(divida({ percentualQuitado: 100, valorRestante: 100 }), 2026, 5)).toBe(false);
    expect(parcelaAtrasadaNoMes(divida({ valorRestante: 0.001 }), 2026, 5)).toBe(false);

    const cartoesSemLimite = [
      divida({ instituicao: 'Sem limite', limiteCartao: undefined, valorRestante: -10, statusDivida: 'pagando' }),
      divida({ instituicao: 'Sem limite', limiteCartao: -100, valorRestante: 50, diaVencimento: 15 }),
    ];
    const agrupado = agruparResumoCartoes(cartoesSemLimite);
    expect(agrupado[0].limite).toBe(0);
    expect(agrupado[0].utilizado).toBe(50);
    expect(agrupado[0].percentualUtilizado).toBe(0);
    expect(calcularResumoLimiteCartoes(cartoesSemLimite).proximoVencimentoLabel).toContain('Dia 15');

    expect(calcularValorPagoAcumulado(300, 3, undefined, 5, 100)).toBe(100);
    expect(projetarDividaNoMes(divida({ dataInicio: '2026-01-01', quantidadeParcelas: 1 }), 2026, 3)).toBeNull();
    expect(projetarSaldoRestanteAno([{
      ...divida({ quantidadeParcelas: 0 }),
      dataInicio: undefined,
    }], 2026)[0]).toBeGreaterThan(0);
  });
});
