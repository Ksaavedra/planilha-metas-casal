import { Cartao } from '../interfaces/cartoes/cartoes';
import { Divida, DividaNoMes } from '../interfaces/dividas/dividas';
import {
  calcularResumoFaturaCartao,
  isAjusteFatura,
  labelCategoriaAjuste,
  TIPO_DIVIDA_AJUSTE_FATURA,
} from './fatura-resumo.util';

describe('fatura-resumo.util', () => {
  const compra = (partial: Partial<DividaNoMes> = {}): DividaNoMes => ({
    id: partial.id ?? 1,
    objetivo: partial.objetivo ?? 'Compra',
    tipoDivida: 'parcelamento',
    valorTotal: partial.valorTotal ?? 1097.96,
    valorPago: partial.valorPago ?? 0,
    valorRestante: partial.valorRestante ?? 1097.96,
    parcelaMensal: partial.parcelaMensal ?? 1097.96,
    quantidadeParcelas: partial.quantidadeParcelas ?? 1,
    parcelasRestantes: partial.parcelasRestantes ?? 3,
    percentualQuitado: partial.percentualQuitado ?? 0,
    statusDivida: partial.statusDivida ?? 'pagando',
    ano: partial.ano ?? 2024,
    cartaoId: partial.cartaoId ?? 1,
    indiceParcelaMes: partial.indiceParcelaMes ?? 1,
    valorPagoNoMes: partial.valorPagoNoMes ?? 0,
    parcelaMesPaga: partial.parcelaMesPaga ?? false,
    statusParcelaMes: partial.statusParcelaMes ?? 'pendente',
  });

  const ajuste = (partial: Partial<Divida> = {}): Divida => ({
    id: partial.id ?? 10,
    objetivo: partial.objetivo ?? 'credito_fatura_anterior',
    tipoDivida: TIPO_DIVIDA_AJUSTE_FATURA,
    valorTotal: partial.valorTotal ?? -130,
    valorPago: 0,
    valorRestante: partial.valorTotal ?? -130,
    parcelaMensal: partial.valorTotal ?? -130,
    quantidadeParcelas: 1,
    parcelasRestantes: 0,
    percentualQuitado: 0,
    statusDivida: 'quitada',
    ano: partial.ano ?? 2024,
    cartaoId: partial.cartaoId ?? 1,
  });

  const cartao = (partial: Partial<Cartao> = {}): Cartao => ({
    id: 1,
    nome: 'C6',
    banco: 'C6',
    limite: 21000,
    valorUtilizado: 0,
    valorDisponivel: 21000,
    faturaPaga: partial.faturaPaga,
    valorFaturaPaga: partial.valorFaturaPaga,
  });

  it('identifica ajustes e rótulos', () => {
    expect(isAjusteFatura({ tipoDivida: TIPO_DIVIDA_AJUSTE_FATURA })).toBe(true);
    expect(labelCategoriaAjuste('juros')).toBe('Juros');
  });

  it('calcula fatura com crédito de R$ 130', () => {
    const compras = [
      compra({ parcelaMensal: 1097.96, valorTotal: 1097.96 }),
    ];
    const ajustes = [ajuste({ valorTotal: -130 })];

    const resumo = calcularResumoFaturaCartao(compras, ajustes, cartao());

    expect(resumo.totalCompras).toBe(1097.96);
    expect(resumo.totalAjustes).toBe(-130);
    expect(resumo.valorFatura).toBe(967.96);
    expect(resumo.valorAPagar).toBe(967.96);
  });

  it('zera valor a pagar quando fatura está paga', () => {
    const compras = [
      compra({
        parcelaMensal: 1097.96,
        valorTotal: 1097.96,
        parcelaMesPaga: true,
        statusParcelaMes: 'paga',
      }),
    ];
    const ajustes = [ajuste({ valorTotal: -130 })];

    const resumo = calcularResumoFaturaCartao(
      compras,
      ajustes,
      cartao({ faturaPaga: true, valorFaturaPaga: 967.96 }),
    );

    expect(resumo.valorAPagar).toBe(0);
    expect(resumo.pagamentosRealizados).toBe(967.96);
  });

  it('ignora faturaPaga global quando há compras pendentes no mês', () => {
    const compras = [
      compra({
        parcelaMensal: 100,
        valorTotal: 1200,
        quantidadeParcelas: 12,
        parcelaMesPaga: false,
        statusParcelaMes: 'pendente',
      }),
    ];

    const resumo = calcularResumoFaturaCartao(
      compras,
      [],
      cartao({ faturaPaga: true, valorFaturaPaga: 500 }),
    );

    expect(resumo.valorAPagar).toBe(100);
  });
});
