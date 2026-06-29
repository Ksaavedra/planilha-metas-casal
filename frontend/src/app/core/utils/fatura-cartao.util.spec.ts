import {
  compraNoPeriodoFatura,
  diaFechamentoAPartirDoMelhorDia,
  diaFechamentoEfetivo,
  diaMelhorCompraAPartirDoVencimento,
  dataCompraPadraoNaFatura,
  dataInicioFatura,
  dataInicioParcelasDaCompra,
  labelFaturaMes,
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

  it('calcula fechamento a partir do melhor dia', () => {
    expect(diaFechamentoAPartirDoMelhorDia(28)).toBe(27);
    expect(diaFechamentoAPartirDoMelhorDia(1)).toBe(31);
  });

  it('calcula melhor dia a partir do vencimento (8 dias antes)', () => {
    expect(diaMelhorCompraAPartirDoVencimento(6)).toBe(28);
    expect(diaMelhorCompraAPartirDoVencimento(10)).toBe(2);
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

  it('monta período da fatura de julho com melhor dia 28 e vencimento 6', () => {
    const periodo = periodoFaturaCartao(cartaoC6, 2023, 7);

    expect(periodo?.titulo).toBe('Fatura Julho');
    expect(periodo?.periodoInicioLabel).toBe('28/05/2023');
    expect(periodo?.periodoFimLabel).toBe('27/06/2023');
    expect(periodo?.periodoLabel).toBe('28/05 até 27/06');
    expect(periodo?.vencimentoLabel).toBe('06/07/2023');
    expect(periodo?.textoAmigavel).toContain('28/05/2023');
    expect(periodo?.textoAmigavel).toContain('27/06/2023');
  });

  it('mapeia compras para o mês de vencimento correto', () => {
    const compra = (dia: number, mes: number) =>
      mesVencimentoDaCompra(new Date(2023, mes - 1, dia), cartaoC6);

    expect(compra(15, 6)).toEqual({ ano: 2023, mes: 7 });
    expect(compra(27, 6)).toEqual({ ano: 2023, mes: 7 });
    expect(compra(28, 6)).toEqual({ ano: 2023, mes: 8 });
    expect(compra(30, 6)).toEqual({ ano: 2023, mes: 8 });
    expect(compra(1, 7)).toEqual({ ano: 2023, mes: 8 });
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
  });

  it('alinha 1ª parcela ao mês da fatura quando a compra está no período', () => {
    expect(
      dataInicioParcelasDaCompra('2023-07-15', cartaoC6, { ano: 2023, mes: 8 }),
    ).toBe('2023-08-01');
    expect(
      dataInicioParcelasDaCompra('2023-07-27', cartaoC6, { ano: 2023, mes: 8 }),
    ).toBe('2023-08-01');
  });

  it('usa regra do melhor dia quando a compra está fora do período em contexto', () => {
    expect(
      dataInicioParcelasDaCompra('2023-06-20', cartaoC6, { ano: 2023, mes: 8 }),
    ).toBe('2023-07-01');
  });

  it('expõe limites ISO e validação do período da compra', () => {
    expect(periodoCompraLimitesIso(cartaoC6, 2023, 8)).toEqual({
      min: '2023-06-28',
      max: '2023-07-27',
    });
    expect(dataInicioFatura(2023, 8)).toBe('2023-08-01');
    expect(labelFaturaMes(2023, 8)).toBe('Agosto 2023');
    expect(
      compraNoPeriodoFatura('2023-07-15', cartaoC6, { ano: 2023, mes: 8 }),
    ).toBe(true);
    expect(
      compraNoPeriodoFatura('2023-10-15', cartaoC6, { ano: 2023, mes: 8 }),
    ).toBe(false);
  });
});
