import {
  Divida,
  DividaNoMes,
  ResumoCartaoView,
  ResumoDividasView,
  ResumoLimiteCartoesView,
  StatusDivida,
  StatusParcelaMes,
} from '../interfaces/dividas/dividas';
import { NOMES_MESES } from './metas-meses.util';

/** Rótulos dos 12 meses para gráficos (nomes completos em português). */
export const MESES_LABELS_GRAFICO: readonly string[] = [...NOMES_MESES];

/** Abreviações de 3 letras para telas compactas. */
export const MESES_ABREV_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const;

export interface TotaisTabelaDividas {
  valorTotal: number;
  parcelaMensal: number;
  valorPago: number;
  valorRestante: number;
  parcelasRestantes: number;
  percentualQuitado: number;
}

export function calcularTotaisTabelaDividas(
  lista: Divida[],
): TotaisTabelaDividas {
  const resumo = calcularResumoDividas(lista);
  const parcelaMensal = lista.reduce((s, d) => s + parcelaMensalDivida(d), 0);
  const parcelasRestantes = lista.reduce(
    (s, d) => s + (d.parcelasRestantes || 0),
    0,
  );
  return {
    valorTotal: resumo.totalDividas,
    parcelaMensal: Math.round(parcelaMensal * 100) / 100,
    valorPago: resumo.totalPago,
    valorRestante: resumo.valorRestante,
    parcelasRestantes,
    percentualQuitado: resumo.percentualQuitado,
  };
}

export function calcularTotaisTabelaDividasNoMes(
  lista: DividaNoMes[],
): TotaisTabelaDividas {
  const base = calcularTotaisTabelaDividas(lista);
  const valorPagoNoMes = lista.reduce((s, d) => s + d.valorPagoNoMes, 0);
  return {
    ...base,
    valorPago: Math.round(valorPagoNoMes * 100) / 100,
  };
}

export function calcularResumoDividas(lista: Divida[]): ResumoDividasView {
  const totalDividas = lista.reduce((s, d) => s + (d.valorTotal || 0), 0);
  const totalPago = lista.reduce((s, d) => s + (d.valorPago || 0), 0);
  const valorRestante = lista.reduce((s, d) => s + (d.valorRestante || 0), 0);
  const parcelasAtivas = lista.filter(
    (d) => d.statusDivida === 'pagando' || d.statusDivida === 'atrasada',
  ).length;
  const percentualQuitado =
    totalDividas > 0 ? (totalPago / totalDividas) * 100 : 0;

  return {
    totalDividas,
    totalPago,
    valorRestante,
    parcelasAtivas,
    percentualQuitado,
  };
}

export function statusDividaLabel(status: StatusDivida): string {
  const map: Record<StatusDivida, string> = {
    pagando: 'Pagando 💳',
    atrasada: 'Atrasada ⚠️',
    quitada: 'Quitada ✅',
  };
  return map[status] ?? status;
}

export function statusDividaClasse(status: StatusDivida): string {
  const map: Record<StatusDivida, string> = {
    pagando: 'status--pagando',
    atrasada: 'status--atrasada',
    quitada: 'status--quitada',
  };
  return map[status] ?? '';
}

export function progressoDivida(d: Divida): number {
  if (!d.valorTotal || d.valorTotal <= 0) return 0;
  return Math.min(100, (d.valorPago / d.valorTotal) * 100);
}

/** Parcela mensal = valor total ÷ quantidade de parcelas. */
export function calcularParcelaMensal(
  valorTotal: number,
  quantidadeParcelas: number,
): number {
  const total = Math.max(0, valorTotal);
  const qtd = Math.max(0, Math.floor(quantidadeParcelas));
  if (qtd <= 0 || total <= 0) return 0;
  return Math.round((total / qtd) * 100) / 100;
}

/** Valor da parcela para exibição (usa cálculo se o banco estiver desatualizado). */
export function parcelaMensalDivida(d: Divida): number {
  const calculada = calcularParcelaMensal(d.valorTotal, d.quantidadeParcelas);
  if (calculada > 0) return calculada;
  return Math.max(0, d.parcelaMensal || 0);
}

/** Soma das parcelas mensais das dívidas em aberto (pagando ou atrasada). */
export function totalParcelaMensalAtiva(lista: Divida[]): number {
  return lista
    .filter((d) => d.statusDivida !== 'quitada')
    .reduce((s, d) => s + parcelaMensalDivida(d), 0);
}

/** Parcelas a pagar no mês de referência (ainda não pagas). */
export function totalParcelaMensalPendenteNoMes(lista: DividaNoMes[]): number {
  return lista
    .filter((d) => !d.parcelaMesPaga && d.statusParcelaMes !== 'futura')
    .reduce((s, d) => s + parcelaMensalDivida(d), 0);
}

/** Projeção do saldo devedor mês a mês (12 pontos). */
export function projetarEvolucaoRestante(
  valorRestanteInicial: number,
  parcelaMensalTotal: number,
): number[] {
  let restante = Math.max(0, valorRestanteInicial);
  const parcela = Math.max(0, parcelaMensalTotal);
  return MESES_LABELS_GRAFICO.map((_, i) => {
    const valor = Math.round(restante * 100) / 100;
    if (i < 11) {
      restante = Math.max(0, restante - parcela);
    }
    return valor;
  });
}

/** Valor de pagamento previsto em cada mês do ano. */
export function projetarPagamentosMensais(
  parcelaMensalTotal: number,
): number[] {
  const v = Math.round(parcelaMensalTotal * 100) / 100;
  return MESES_LABELS_GRAFICO.map(() => v);
}

/** Mês (1–12) extraído de dataInicio (YYYY-MM-DD). */
export function mesDataInicioDivida(dataInicio?: string | null): number | null {
  if (!dataInicio || dataInicio.length < 7) return null;
  const m = parseInt(dataInicio.slice(5, 7), 10);
  return m >= 1 && m <= 12 ? m : null;
}

/**
 * Dívida visível no mês de referência:
 * - ainda não começou (antes de dataInicio) → oculta;
 * - pagando/atrasada → visível do mês de início até dezembro do ano;
 * - quitada → visível apenas nos meses da duração das parcelas.
 */
export function dividaVisivelNoMesReferencia(
  d: Divida,
  ano: number,
  mes: number,
): boolean {
  if (d.ano !== ano) return false;

  const mesInicio = mesDataInicioDivida(d.dataInicio);
  if (mesInicio != null && mes < mesInicio) return false;

  if (d.statusDivida === 'pagando' || d.statusDivida === 'atrasada') {
    return true;
  }

  const inicio = mesInicio ?? 1;
  const duracao = Math.max(1, d.quantidadeParcelas || d.parcelasRestantes || 1);
  const mesFim = Math.min(12, inicio + duracao - 1);
  return mes >= inicio && mes <= mesFim;
}

export function filtrarDividasPorMesReferencia(
  lista: Divida[],
  ano: number,
  mes: number,
): Divida[] {
  return lista.filter((d) => dividaVisivelNoMesReferencia(d, ano, mes));
}

/** Texto "1/3", "2/3" para a parcela do mês vs total. */
export function parcelasRestantesLabel(d: Divida | DividaNoMes): string {
  const total = d.quantidadeParcelas || 0;
  if ('indiceParcelaMes' in d && d.indiceParcelaMes > 0 && total > 0) {
    return `${d.indiceParcelaMes}/${total}`;
  }

  const restantes = d.parcelasRestantes ?? 0;
  if (total <= 0) return String(restantes);
  return `${restantes}/${total}`;
}

export function parcelasPagasDivida(d: Divida): number {
  const parcela = parcelaMensalDivida(d);
  if (parcela <= 0) return 0;
  const qtd = d.quantidadeParcelas || 0;
  const pagas = Math.floor((d.valorPago + 1e-9) / parcela);
  return qtd > 0 ? Math.min(qtd, pagas) : pagas;
}

/** Índice da parcela (1, 2, 3…) no mês de referência. */
export function indiceParcelaNoMes(
  d: Divida,
  ano: number,
  mes: number,
): number | null {
  if (d.ano !== ano) return null;
  const mesInicio = mesDataInicioDivida(d.dataInicio) ?? 1;
  if (mes < mesInicio) return null;
  const idx = mes - mesInicio + 1;
  const qtd = d.quantidadeParcelas || 0;
  if (qtd > 0 && idx > qtd) return null;
  return idx;
}

export function statusParcelaMesLabel(status: StatusParcelaMes): string {
  const map: Record<StatusParcelaMes, string> = {
    paga: 'Parcela paga ✅',
    pendente: 'Pendente ⏳',
    atrasada: 'Atrasada ⚠️',
    futura: 'A vencer 📅',
    quitada: 'Quitada ✅',
  };
  return map[status] ?? status;
}

export function statusParcelaMesClasse(status: StatusParcelaMes): string {
  const map: Record<StatusParcelaMes, string> = {
    paga: 'status--parcela-paga',
    pendente: 'status--pendente',
    atrasada: 'status--atrasada',
    futura: 'status--futura',
    quitada: 'status--quitada',
  };
  return map[status] ?? '';
}

function chaveInstituicao(nome?: string | null): string {
  const n = nome?.trim();
  return n && n.length > 0 ? n : 'Sem instituição';
}

function dividaQuitada(d: Divida): boolean {
  return (
    d.statusDivida === 'quitada' ||
    (d.valorRestante ?? 0) <= 0.009 ||
    (d.percentualQuitado ?? 0) >= 99.99
  );
}

/** Verifica atraso pela data de vencimento do cartão ou pelo mês calendário. */
export function parcelaAtrasadaNoMes(
  d: Divida,
  ano: number,
  mes: number,
  hoje: Date = new Date(),
): boolean {
  if (dividaQuitada(d)) return false;

  const anoHoje = hoje.getFullYear();
  const mesHoje = hoje.getMonth() + 1;
  const diaHoje = hoje.getDate();
  const diaVenc = d.diaVencimento;

  if (ano < anoHoje || (ano === anoHoje && mes < mesHoje)) return true;

  if (
    diaVenc != null &&
    diaVenc >= 1 &&
    diaVenc <= 31 &&
    ano === anoHoje &&
    mes === mesHoje &&
    diaHoje > diaVenc
  ) {
    return true;
  }

  return false;
}

export function agruparResumoCartoes(lista: Divida[]): ResumoCartaoView[] {
  const mapa = new Map<string, Divida[]>();
  for (const d of lista) {
    const k = chaveInstituicao(d.instituicao);
    const arr = mapa.get(k) ?? [];
    arr.push(d);
    mapa.set(k, arr);
  }

  return [...mapa.entries()]
    .map(([instituicao, itens]) => {
      const limite = Math.max(
        0,
        ...itens.map((d) => Math.max(0, d.limiteCartao ?? 0)),
      );
      const utilizado = itens
        .filter((d) => !dividaQuitada(d))
        .reduce((s, d) => s + Math.max(0, d.valorRestante ?? 0), 0);
      const disponivel = Math.max(0, limite - utilizado);
      const comVenc = itens.find((d) => d.diaVencimento != null);
      return {
        instituicao,
        limite: Math.round(limite * 100) / 100,
        utilizado: Math.round(utilizado * 100) / 100,
        disponivel: Math.round(disponivel * 100) / 100,
        diaVencimento: comVenc?.diaVencimento ?? null,
        diaMelhorCompra: comVenc?.diaMelhorCompra ?? null,
        percentualUtilizado:
          limite > 0 ? Math.min(100, (utilizado / limite) * 100) : 0,
      };
    })
    .sort((a, b) => a.instituicao.localeCompare(b.instituicao, 'pt-BR'));
}

export function calcularResumoLimiteCartoes(
  lista: Divida[],
  hoje: Date = new Date(),
): ResumoLimiteCartoesView {
  const cartoes = agruparResumoCartoes(lista);
  const limiteTotal = cartoes.reduce((s, c) => s + c.limite, 0);
  const utilizado = cartoes.reduce((s, c) => s + c.utilizado, 0);
  const disponivel = Math.max(0, limiteTotal - utilizado);

  const diaHoje = hoje.getDate();
  const comVenc = cartoes
    .filter((c) => c.diaVencimento != null && c.utilizado > 0)
    .map((c) => ({
      cartao: c,
      dias: (c.diaVencimento! - diaHoje + 31) % 31,
    }))
    .sort((a, b) => a.dias - b.dias);

  let proximoVencimentoLabel = '—';
  if (comVenc.length > 0) {
    const c = comVenc[0].cartao;
    proximoVencimentoLabel = `Dia ${c.diaVencimento}`;
    if (c.diaMelhorCompra != null) {
      proximoVencimentoLabel += ` · Melhor compra: dia ${c.diaMelhorCompra}`;
    }
  }

  return {
    limiteTotal: Math.round(limiteTotal * 100) / 100,
    utilizado: Math.round(utilizado * 100) / 100,
    disponivel: Math.round(disponivel * 100) / 100,
    proximoVencimentoLabel,
  };
}

/** Atualiza valor pago acumulado ao registrar pagamento só do mês de referência. */
export function calcularValorPagoAcumulado(
  valorTotal: number,
  quantidadeParcelas: number,
  dataInicio: string | undefined,
  mesReferencia: number,
  valorPagoNoMes: number,
): number {
  const parcela = calcularParcelaMensal(valorTotal, quantidadeParcelas);
  if (parcela <= 0) return Math.min(valorTotal, Math.max(0, valorPagoNoMes));

  const mesInicio = mesDataInicioDivida(dataInicio) ?? mesReferencia;
  const indice = mesReferencia - mesInicio + 1;
  if (indice < 1) return 0;

  const pagasAntes = Math.max(0, indice - 1);
  const pagoMes = Math.min(parcela, Math.max(0, valorPagoNoMes));
  const acumulado = pagasAntes * parcela + pagoMes;
  return Math.min(valorTotal, Math.round(acumulado * 100) / 100);
}

export function projetarDividaNoMes(
  d: Divida,
  ano: number,
  mes: number,
  hoje: Date = new Date(),
): DividaNoMes | null {
  if (!dividaVisivelNoMesReferencia(d, ano, mes)) return null;

  const indiceParcelaMes = indiceParcelaNoMes(d, ano, mes);
  if (indiceParcelaMes == null) return null;

  const parcela = parcelaMensalDivida(d);
  const pagas = parcelasPagasDivida(d);
  const parcelaMesPaga = indiceParcelaMes <= pagas;
  const valorPagoNoMes = parcelaMesPaga ? parcela : 0;

  let statusParcelaMes: StatusParcelaMes;
  if (dividaQuitada(d)) {
    statusParcelaMes = 'quitada';
  } else if (parcelaMesPaga || valorPagoNoMes > 0) {
    statusParcelaMes = 'paga';
  } else if (parcelaAtrasadaNoMes(d, ano, mes, hoje)) {
    statusParcelaMes = 'atrasada';
  } else {
    const anoHoje = hoje.getFullYear();
    const mesHoje = hoje.getMonth() + 1;
    if (ano > anoHoje || (ano === anoHoje && mes > mesHoje)) {
      statusParcelaMes = 'futura';
    } else {
      statusParcelaMes = 'pendente';
    }
  }

  return {
    ...d,
    indiceParcelaMes,
    valorPagoNoMes,
    parcelaMesPaga,
    statusParcelaMes,
  };
}

export function projetarDividasNoMes(
  lista: Divida[],
  ano: number,
  mes: number,
): DividaNoMes[] {
  return lista
    .map((d) => projetarDividaNoMes(d, ano, mes))
    .filter((d): d is DividaNoMes => d != null);
}

export function calcularResumoDividasNoMes(
  lista: DividaNoMes[],
): ResumoDividasView {
  const base = calcularResumoDividas(lista);
  const totalPagoNoMes = lista.reduce((s, d) => s + d.valorPagoNoMes, 0);
  const parcelasAtivas = lista.filter(
    (d) =>
      d.statusParcelaMes === 'pendente' || d.statusParcelaMes === 'atrasada',
  ).length;

  return {
    ...base,
    totalPago: Math.round(totalPagoNoMes * 100) / 100,
    parcelasAtivas,
  };
}

/**
 * Soma das parcelas devidas em cada mês do ano (ex.: mai R$225, jun R$225, jul R$100).
 */
export function projetarParcelaMensalAno(
  lista: Divida[],
  ano: number,
): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const total = lista
      .filter((d) => d.ano === ano)
      .reduce((s, d) => {
        if (indiceParcelaNoMes(d, ano, mes) == null) return s;
        return s + parcelaMensalDivida(d);
      }, 0);
    return Math.round(total * 100) / 100;
  });
}

/**
 * Saldo devedor total projetado ao fim de cada mês (considera pagamentos já registrados).
 */
export function projetarSaldoRestanteAno(
  lista: Divida[],
  ano: number,
): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const total = lista
      .filter((d) => d.ano === ano)
      .reduce((s, d) => {
        const mesInicio = mesDataInicioDivida(d.dataInicio) ?? 1;
        if (mes < mesInicio) return s;
        const qtd = d.quantidadeParcelas || 0;
        if (qtd > 0 && mes > mesInicio + qtd - 1) return s;
        const parcela = parcelaMensalDivida(d);
        const pagas = parcelasPagasDivida(d);
        const pagoAteMes = Math.min(d.valorTotal, pagas * parcela);
        return s + Math.max(0, d.valorTotal - pagoAteMes);
      }, 0);
    return Math.round(total * 100) / 100;
  });
}

export function formatarMoedaGrafico(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
