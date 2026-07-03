import {
  buscarCicloFaturaReal,
  compraNoPeriodoFatura,
  diaFechamentoAPartirDoMelhorDia,
  diaFechamentoEfetivo,
  diaMelhorCompraAPartirDoVencimento,
  dataCompraPadraoNaFatura,
  dataInicioFatura,
  dataInicioParcelasDaCompra,
  fechamentoDaFatura,
  labelFaturaMes,
  labelPrimeiraParcela,
  mesVencimentoDaCompra,
  montarDiasCicloFatura,
  periodoCompraLimitesIso,
  periodoFaturaCartao,
} from './fatura-cartao.util';

describe('fatura-cartao.util', () => {
  const cartaoC6 = {
    diaMelhorCompra: 28,
    diaVencimento: 6,
    diaFechamento: 27,
  };

  const cartaoVenc05Melhor30 = {
    diaVencimento: 5,
    diaMelhorCompra: 30,
  };

  const cartaoComCicloManual = {
    diaVencimento: 5,
    diaMelhorCompra: 30,
    ciclosFatura: [
      {
        ano: 2026,
        mes: 7,
        inicio: '2026-06-27',
        fim: '2026-07-30',
      },
      {
        ano: 2026,
        mes: 8,
        inicio: '2026-07-31',
        fim: '2026-08-29',
      },
    ],
  };

  it('calcula fechamento a partir do melhor dia', () => {
    expect(diaFechamentoAPartirDoMelhorDia(28)).toBe(27);
    expect(diaFechamentoAPartirDoMelhorDia(1)).toBe(31);
  });

  it('estima melhor dia a partir do vencimento no mês de referência', () => {
    expect(diaMelhorCompraAPartirDoVencimento(6, 2023, 7)).toBe(28);
    expect(diaMelhorCompraAPartirDoVencimento(5, 2026, 3)).toBe(25);
  });

  it('usa melhor dia para derivar fechamento quando não houver fechamento salvo', () => {
    expect(
      diaFechamentoEfetivo({
        diaFechamento: null,
        diaMelhorCompra: 28,
        diaVencimento: 6,
      }),
    ).toBe(27);
  });

  it('posterga vencimento conforme calendário bancário (exemplos 2026)', () => {
    const casos: Array<{ mes: number; dia: number; esperado: string }> = [
      { mes: 7, dia: 5, esperado: '06/07/2026' },
      { mes: 9, dia: 7, esperado: '08/09/2026' },
      { mes: 10, dia: 12, esperado: '13/10/2026' },
      { mes: 11, dia: 15, esperado: '16/11/2026' },
      { mes: 12, dia: 25, esperado: '28/12/2026' },
    ];

    for (const { mes, dia, esperado } of casos) {
      const periodo = periodoFaturaCartao(
        { diaVencimento: dia, diaMelhorCompra: 30 },
        2026,
        mes,
      );
      expect(periodo?.vencimentoLabel).toBe(esperado);
    }
  });

  it('nomeia fatura pelo mês de vencimento, não pelo mês das compras', () => {
    const periodo = periodoFaturaCartao(cartaoC6, 2023, 12);

    expect(periodo?.titulo).toBe('Fatura Dezembro');
    expect(periodo?.periodoInicioLabel).toBe('27/10/2023');
    expect(periodo?.periodoFimLabel).toBe('27/11/2023');
    expect(periodo?.vencimentoLabel).toBe('06/12/2023');
    expect(labelFaturaMes(2023, 12)).toBe('Dezembro 2023');
    expect(mesVencimentoDaCompra(new Date(2023, 10, 2), cartaoC6)).toEqual({
      ano: 2023,
      mes: 12,
    });
    expect(mesVencimentoDaCompra(new Date(2023, 10, 22), cartaoC6)).toEqual({
      ano: 2023,
      mes: 12,
    });
    expect(mesVencimentoDaCompra(new Date(2023, 9, 30), cartaoC6)).toEqual({
      ano: 2023,
      mes: 12,
    });
  });

  it('monta período da fatura de julho com melhor dia 28 e vencimento 6', () => {
    const periodo = periodoFaturaCartao(cartaoC6, 2023, 7);

    expect(periodo?.titulo).toBe('Fatura Julho');
    expect(periodo?.periodoInicioLabel).toBe('26/05/2023');
    expect(periodo?.periodoFimLabel).toBe('27/06/2023');
    expect(periodo?.vencimentoLabel).toBe('06/07/2023');
    expect(periodo?.usaCicloReal).toBe(false);
  });

  it('calcula ciclos bancários com vencimento 05 e melhor dia 30 em 2026', () => {
    const mar = periodoFaturaCartao(cartaoVenc05Melhor30, 2026, 3);
    const abr = periodoFaturaCartao(cartaoVenc05Melhor30, 2026, 4);
    const mai = periodoFaturaCartao(cartaoVenc05Melhor30, 2026, 5);
    const jun = periodoFaturaCartao(cartaoVenc05Melhor30, 2026, 6);
    const jul = periodoFaturaCartao(cartaoVenc05Melhor30, 2026, 7);
    const dez = periodoFaturaCartao(cartaoVenc05Melhor30, 2026, 12);

    expect(mar?.periodoInicioLabel).toBe('30/01/2026');
    expect(mar?.periodoFimLabel).toBe('26/02/2026');
    expect(abr?.periodoInicioLabel).toBe('27/02/2026');
    expect(abr?.periodoFimLabel).toBe('27/03/2026');
    expect(mai?.periodoInicioLabel).toBe('28/03/2026');
    expect(mai?.periodoFimLabel).toBe('28/04/2026');
    expect(jun?.periodoInicioLabel).toBe('29/04/2026');
    expect(jun?.periodoFimLabel).toBe('28/05/2026');
    expect(jul?.periodoInicioLabel).toBe('29/05/2026');
    expect(jul?.periodoFimLabel).toBe('26/06/2026');
    expect(dez?.periodoFimLabel).toBe('26/11/2026');
  });

  it('não sobrepõe períodos consecutivos em março/abril 2024 (ano bissexto)', () => {
    const faturaFechamentoMarco = periodoFaturaCartao(cartaoVenc05Melhor30, 2024, 4);
    const faturaFechamentoAbril = periodoFaturaCartao(cartaoVenc05Melhor30, 2024, 5);

    expect(faturaFechamentoMarco?.periodoInicioLabel).toBe('29/02/2024');
    expect(faturaFechamentoMarco?.periodoFimLabel).toBe('27/03/2024');
    expect(faturaFechamentoAbril?.periodoInicioLabel).toBe('28/03/2024');
    expect(faturaFechamentoAbril?.periodoFimLabel).toBe('26/04/2024');

    expect(
      compraNoPeriodoFatura('2024-03-27', cartaoVenc05Melhor30, {
        ano: 2024,
        mes: 4,
      }),
    ).toBe(true);
    expect(
      compraNoPeriodoFatura('2024-03-27', cartaoVenc05Melhor30, {
        ano: 2024,
        mes: 5,
      }),
    ).toBe(false);
    expect(
      compraNoPeriodoFatura('2024-03-28', cartaoVenc05Melhor30, {
        ano: 2024,
        mes: 5,
      }),
    ).toBe(true);
    expect(mesVencimentoDaCompra(new Date(2024, 2, 27), cartaoVenc05Melhor30)).toEqual({
      ano: 2024,
      mes: 4,
    });
    expect(mesVencimentoDaCompra(new Date(2024, 2, 28), cartaoVenc05Melhor30)).toEqual({
      ano: 2024,
      mes: 5,
    });
    expect(
      dataInicioParcelasDaCompra('2024-03-27', cartaoVenc05Melhor30, {
        ano: 2024,
        mes: 4,
      }),
    ).toBe('2024-04-01');
    expect(
      dataInicioParcelasDaCompra('2024-03-28', cartaoVenc05Melhor30, {
        ano: 2024,
        mes: 5,
      }),
    ).toBe('2024-05-01');
    expect(
      labelPrimeiraParcela('2024-03-27', cartaoVenc05Melhor30, {
        ano: 2024,
        mes: 4,
      }),
    ).toBe('Abril 2024');
    expect(
      labelPrimeiraParcela('2024-03-28', cartaoVenc05Melhor30, {
        ano: 2024,
        mes: 5,
      }),
    ).toBe('Maio 2024');
  });

  it('usa ciclo real apenas quando cadastrado manualmente no cartão', () => {
    const periodo = periodoFaturaCartao(cartaoComCicloManual, 2026, 7);

    expect(periodo?.usaCicloReal).toBe(true);
    expect(periodo?.periodoInicioLabel).toBe('27/06/2026');
    expect(periodo?.periodoFimLabel).toBe('30/07/2026');
    expect(buscarCicloFaturaReal(cartaoComCicloManual, 2026, 7)).toEqual({
      ano: 2026,
      mes: 7,
      inicio: '2026-06-27',
      fim: '2026-07-30',
    });
  });

  it('mapeia compras para o mês de vencimento pelo período calculado', () => {
    expect(
      mesVencimentoDaCompra(new Date(2023, 6, 15), cartaoC6),
    ).toEqual({ ano: 2023, mes: 8 });
    expect(
      mesVencimentoDaCompra(new Date(2023, 6, 28), cartaoC6),
    ).toEqual({ ano: 2023, mes: 9 });
    expect(
      mesVencimentoDaCompra(new Date(2026, 1, 20), cartaoVenc05Melhor30),
    ).toEqual({ ano: 2026, mes: 3 });
    expect(
      mesVencimentoDaCompra(new Date(2026, 2, 10), cartaoVenc05Melhor30),
    ).toEqual({ ano: 2026, mes: 4 });
  });

  it('mapeia compras pelo ciclo real manual quando existir', () => {
    expect(
      mesVencimentoDaCompra(new Date(2026, 6, 15), cartaoComCicloManual),
    ).toEqual({ ano: 2026, mes: 7 });
    expect(
      mesVencimentoDaCompra(new Date(2026, 7, 10), cartaoComCicloManual),
    ).toEqual({ ano: 2026, mes: 8 });
  });

  it('monta dias do ciclo ao salvar cartão', () => {
    expect(montarDiasCicloFatura(28, 6, null)).toEqual({
      diaMelhorCompra: 28,
      diaVencimento: 6,
      diaFechamento: 27,
    });
  });

  it('define data padrão de compra no fim do período da fatura', () => {
    expect(dataCompraPadraoNaFatura(cartaoC6, 2023, 8)).toBe('2023-07-27');
    expect(dataCompraPadraoNaFatura(cartaoVenc05Melhor30, 2026, 3)).toBe(
      '2026-02-26',
    );
    expect(dataCompraPadraoNaFatura(cartaoComCicloManual, 2026, 8)).toBe(
      '2026-08-29',
    );
  });

  it('alinha 1ª parcela ao mês da fatura quando a compra está no período', () => {
    expect(
      dataInicioParcelasDaCompra('2023-07-15', cartaoC6, { ano: 2023, mes: 8 }),
    ).toBe('2023-08-01');
    expect(
      dataInicioParcelasDaCompra('2026-03-10', cartaoVenc05Melhor30, {
        ano: 2026,
        mes: 4,
      }),
    ).toBe('2026-04-01');
    expect(
      dataInicioParcelasDaCompra('2026-08-10', cartaoComCicloManual, {
        ano: 2026,
        mes: 8,
      }),
    ).toBe('2026-08-01');
  });

  it('expõe limites ISO e validação do período da compra', () => {
    expect(periodoCompraLimitesIso(cartaoC6, 2023, 8)).toEqual({
      min: '2023-06-28',
      max: '2023-07-27',
    });
    expect(periodoCompraLimitesIso(cartaoVenc05Melhor30, 2026, 4)).toEqual({
      min: '2026-02-27',
      max: '2026-03-27',
    });
    expect(dataInicioFatura(2023, 8)).toBe('2023-08-01');
    expect(labelFaturaMes(2023, 8)).toBe('Agosto 2023');
    expect(
      compraNoPeriodoFatura('2023-07-15', cartaoC6, { ano: 2023, mes: 8 }),
    ).toBe(true);
    expect(
      compraNoPeriodoFatura('2026-03-10', cartaoVenc05Melhor30, {
        ano: 2026,
        mes: 4,
      }),
    ).toBe(true);
    expect(fechamentoDaFatura(2026, 2, 30).getDate()).toBe(26);
  });
});
