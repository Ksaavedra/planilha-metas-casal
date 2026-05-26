import {
  Cartao,
  ResumoCartoesView,
  StatusCartao,
} from '../interfaces/cartoes/cartoes';

export function valorDisponivelCartao(cartao: Cartao): number {
  const limite = Math.max(0, cartao.limite || 0);
  const utilizado = Math.max(0, cartao.valorUtilizado || 0);
  return Math.max(0, Math.round((limite - utilizado) * 100) / 100);
}

export function percentualUtilizadoCartao(cartao: Cartao): number {
  const limite = Math.max(0, cartao.limite || 0);
  if (limite <= 0) return 0;
  return Math.min(100, ((cartao.valorUtilizado || 0) / limite) * 100);
}

function dataNoMes(competencia: Date, dia: number): Date {
  const ano = competencia.getFullYear();
  const mes = competencia.getMonth();
  const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();
  return new Date(ano, mes, Math.min(dia, ultimoDiaMes));
}

export function statusCartao(
  cartao: Cartao,
  hoje = new Date(),
  competencia = hoje,
): StatusCartao {
  if (cartao.faturaPaga) {
    return 'fatura_paga';
  }

  const percentual = percentualUtilizadoCartao(cartao);
  const hojeNormalizado = new Date(hoje);
  hojeNormalizado.setHours(0, 0, 0, 0);

  if (
    cartao.diaVencimento != null &&
    cartao.valorUtilizado > 0 &&
    hojeNormalizado.getTime() >
      dataNoMes(competencia, cartao.diaVencimento).getTime()
  ) {
    return 'atrasado';
  }

  if (
    cartao.diaFechamento != null &&
    cartao.valorUtilizado > 0 &&
    hojeNormalizado.getTime() >=
      dataNoMes(competencia, cartao.diaFechamento).getTime()
  ) {
    return 'fatura_fechada';
  }

  if (percentual >= 80) {
    return 'proximo_limite';
  }

  return 'em_dia';
}

export function statusCartaoLabel(status: StatusCartao): string {
  const map: Record<StatusCartao, string> = {
    em_dia: 'Fatura em dia',
    proximo_limite: 'Próximo do limite',
    fatura_fechada: 'Fatura fechada',
    atrasado: 'Fatura atrasada',
    fatura_paga: 'Fatura paga',
  };
  return map[status] ?? status;
}

export function statusCartaoClasse(status: StatusCartao): string {
  const map: Record<StatusCartao, string> = {
    em_dia: 'status--em-dia',
    proximo_limite: 'status--proximo-limite',
    fatura_fechada: 'status--fatura-fechada',
    atrasado: 'status--atrasado',
    fatura_paga: 'status--fatura-paga',
  };
  return map[status] ?? '';
}

export function calcularResumoCartoes(lista: Cartao[]): ResumoCartoesView {
  const limiteTotal = lista.reduce((s, c) => s + Math.max(0, c.limite || 0), 0);
  const utilizado = lista.reduce(
    (s, c) => s + Math.max(0, c.valorUtilizado || 0),
    0,
  );
  const disponivel = Math.max(0, limiteTotal - utilizado);
  const percentualUtilizado =
    limiteTotal > 0 ? Math.min(100, (utilizado / limiteTotal) * 100) : 0;

  return {
    limiteTotal: Math.round(limiteTotal * 100) / 100,
    utilizado: Math.round(utilizado * 100) / 100,
    disponivel: Math.round(disponivel * 100) / 100,
    percentualUtilizado,
    proximoVencimentoLabel: proximoVencimentoLabel(lista),
  };
}

export function proximoVencimentoLabel(
  lista: Cartao[],
  hoje = new Date(),
): string {
  const diaHoje = hoje.getDate();
  const proximos = lista
    .filter((c) => c.diaVencimento != null)
    .map((c) => ({
      cartao: c,
      distancia: (c.diaVencimento! - diaHoje + 31) % 31,
    }))
    .sort((a, b) => a.distancia - b.distancia);

  if (!proximos.length) return '-';

  const c = proximos[0].cartao;
  return `dia ${c.diaVencimento}`;
}

export function dadosUsoLimite(lista: Cartao[]) {
  return lista.map((c) => ({
    name: c.nome,
    value: Math.max(0, c.valorUtilizado || 0),
  }));
}

export function dadosDisponivelPorCartao(lista: Cartao[]) {
  return lista.map((c) => ({
    name: c.nome,
    utilizado: Math.max(0, c.valorUtilizado || 0),
    disponivel: valorDisponivelCartao(c),
  }));
}
