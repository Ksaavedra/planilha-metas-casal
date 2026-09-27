import { Cartao, StatusCartao } from '../interfaces/cartoes/cartoes';
import {
  calcularResumoCartoes,
  dadosDisponivelPorCartao,
  dadosUsoLimite,
  percentualUtilizadoCartao,
  proximoVencimentoLabel,
  statusCartao,
  statusCartaoClasse,
  statusCartaoLabel,
  valorDisponivelCartao,
} from './cartoes.util';

describe('cartoes.util', () => {
  const cartao = (partial: Partial<Cartao> = {}): Cartao => ({
    id: partial.id ?? 1,
    nome: partial.nome ?? 'Nubank',
    banco: partial.banco ?? 'Nubank',
    limite: partial.limite ?? 1000,
    valorUtilizado: partial.valorUtilizado ?? 200,
    valorDisponivel: partial.valorDisponivel ?? 800,
    diaFechamento: partial.diaFechamento ?? 15,
    diaVencimento: partial.diaVencimento ?? 20,
    diaMelhorCompra: partial.diaMelhorCompra ?? 16,
    faturaPaga: partial.faturaPaga,
    valorFaturaPaga: partial.valorFaturaPaga,
    pessoa: partial.pessoa,
    observacoes: partial.observacoes,
    observacaoAtraso: partial.observacaoAtraso,
    previsaoPagamento: partial.previsaoPagamento,
  });

  it('calcula valor disponível sem permitir negativo', () => {
    expect(valorDisponivelCartao(cartao({ limite: 1000, valorUtilizado: 250.555 }))).toBe(749.45);
    expect(valorDisponivelCartao(cartao({ limite: 100, valorUtilizado: 250 }))).toBe(0);
    expect(valorDisponivelCartao(cartao({ limite: -100, valorUtilizado: -50 }))).toBe(0);
    expect(
      valorDisponivelCartao({
        ...cartao(),
        limite: undefined as any,
        valorUtilizado: undefined as any,
      }),
    ).toBe(0);
  });

  it('calcula percentual utilizado com limite válido e inválido', () => {
    expect(percentualUtilizadoCartao(cartao({ limite: 1000, valorUtilizado: 500 }))).toBe(50);
    expect(percentualUtilizadoCartao(cartao({ limite: 1000, valorUtilizado: 1500 }))).toBe(100);
    expect(percentualUtilizadoCartao(cartao({ limite: 0, valorUtilizado: 100 }))).toBe(0);
  });

  it('define status da fatura por prioridade', () => {
    const competencia = new Date(2026, 4, 1);

    expect(statusCartao(cartao({ valorUtilizado: 0 }))).toBeTruthy();
    expect(statusCartao(cartao({ faturaPaga: true }), new Date(2026, 4, 25), competencia)).toBe('fatura_paga');
    expect(statusCartao(cartao({ valorUtilizado: 100, diaVencimento: 10 }), new Date(2026, 4, 11), competencia)).toBe('atrasado');
    expect(statusCartao(cartao({ valorUtilizado: 100, diaFechamento: 10, diaVencimento: 20 }), new Date(2026, 4, 10), competencia)).toBe('fatura_fechada');
    expect(statusCartao(cartao({ limite: 1000, valorUtilizado: 850, diaFechamento: 20, diaVencimento: 25 }), new Date(2026, 4, 5), competencia)).toBe('proximo_limite');
    expect(statusCartao(cartao({ limite: 1000, valorUtilizado: 100 }), new Date(2026, 4, 5), competencia)).toBe('em_dia');
  });

  it('marca fatura atrasada ao consultar mês passado com saldo em aberto', () => {
    const competencia = new Date(2023, 9, 1);

    expect(
      statusCartao(
        cartao({ valorUtilizado: 130, diaVencimento: 6 }),
        new Date(2026, 5, 1),
        competencia,
      ),
    ).toBe('atrasado');
  });

  it('respeita o último dia do mês ao comparar vencimento e fechamento', () => {
    const competenciaFevereiro = new Date(2026, 1, 1);
    const base = cartao({ valorUtilizado: 100, diaFechamento: 31, diaVencimento: 31 });

    expect(statusCartao(base, new Date(2026, 1, 28), competenciaFevereiro)).toBe('fatura_fechada');
    expect(statusCartao(base, new Date(2026, 2, 1), competenciaFevereiro)).toBe('atrasado');
  });

  it('retorna labels e classes dos status', () => {
    const status: StatusCartao[] = [
      'em_dia',
      'proximo_limite',
      'fatura_fechada',
      'atrasado',
      'fatura_paga',
    ];

    expect(status.map(statusCartaoLabel)).toEqual([
      'Fatura em dia',
      'Próximo do limite',
      'Fatura fechada',
      'Fatura atrasada',
      'Fatura paga',
    ]);
    expect(status.map(statusCartaoClasse)).toEqual([
      'status--em-dia',
      'status--proximo-limite',
      'status--fatura-fechada',
      'status--atrasado',
      'status--fatura-paga',
    ]);
    expect(statusCartaoLabel('desconhecido' as StatusCartao)).toBe('desconhecido');
    expect(statusCartaoClasse('desconhecido' as StatusCartao)).toBe('');
  });

  it('calcula resumo total dos cartões', () => {
    const resumo = calcularResumoCartoes([
      cartao({ nome: 'Nubank', limite: 1000, valorUtilizado: 300, diaVencimento: 20 }),
      cartao({ nome: 'C6', limite: 500, valorUtilizado: 100, diaVencimento: 10 }),
      cartao({ nome: 'Sem uso', limite: -100, valorUtilizado: -50, diaVencimento: null }),
    ]);

    expect(resumo.limiteTotal).toBe(1500);
    expect(resumo.utilizado).toBe(400);
    expect(resumo.totalAPagarMes).toBe(400);
    expect(resumo.disponivel).toBe(1100);
    expect(resumo.percentualUtilizado).toBeCloseTo(26.666, 2);
    expect(typeof resumo.proximoVencimentoLabel).toBe('string');
  });

  it('calcula próximo vencimento por distância do dia atual', () => {
    expect(
      proximoVencimentoLabel(
        [
          cartao({ nome: 'Nubank', diaVencimento: 20 }),
          cartao({ nome: 'C6', diaVencimento: 5 }),
        ],
        new Date(2026, 4, 18),
      ),
    ).toBe('dia 20');

    expect(
      proximoVencimentoLabel(
        [{ ...cartao(), diaVencimento: null }],
        new Date(2026, 4, 1),
      ),
    ).toBe('-');
  });

  it('gera dados para gráficos', () => {
    const lista = [
      cartao({ nome: 'Nubank', limite: 1000, valorUtilizado: 300 }),
      cartao({ nome: 'C6', limite: 500, valorUtilizado: -20 }),
      { ...cartao({ nome: 'Sem valor', limite: 100 }), valorUtilizado: undefined as any },
    ];

    expect(dadosUsoLimite(lista)).toEqual([
      { name: 'Nubank', value: 300 },
      { name: 'C6', value: 0 },
      { name: 'Sem valor', value: 0 },
    ]);
    expect(dadosDisponivelPorCartao(lista)).toEqual([
      { name: 'Nubank', utilizado: 300, disponivel: 700 },
      { name: 'C6', utilizado: 0, disponivel: 500 },
      { name: 'Sem valor', utilizado: 0, disponivel: 100 },
    ]);
  });
});
