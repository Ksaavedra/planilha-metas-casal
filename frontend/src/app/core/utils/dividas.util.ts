import {
  Divida,
  DividaNoMes,
  ResumoDividasView,
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

export function calcularTotaisTabelaDividas(lista: Divida[]): TotaisTabelaDividas {
  const resumo = calcularResumoDividas(lista);
  const parcelaMensal = lista.reduce(
    (s, d) => s + parcelaMensalDivida(d),
    0,
  );
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
  const calculada = calcularParcelaMensal(
    d.valorTotal,
    d.quantidadeParcelas,
  );
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
export function projetarPagamentosMensais(parcelaMensalTotal: number): number[] {
  const v = Math.round(parcelaMensalTotal * 100) / 100;
  return MESES_LABELS_GRAFICO.map(() => v);
}

/** Mês (1–12) extraído de dataInicio (YYYY-MM-DD). */
export function mesDataInicioDivida(
  dataInicio?: string | null,
): number | null {
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
  const duracao = Math.max(
    1,
    d.quantidadeParcelas || d.parcelasRestantes || 1,
  );
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

/** Quantas parcelas já foram pagas (pelo valor acumulado). */
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
  };
  return map[status] ?? status;
}

export function statusParcelaMesClasse(status: StatusParcelaMes): string {
  const map: Record<StatusParcelaMes, string> = {
    paga: 'status--parcela-paga',
    pendente: 'status--pendente',
    atrasada: 'status--atrasada',
    futura: 'status--futura',
  };
  return map[status] ?? '';
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
  if (parcelaMesPaga) {
    statusParcelaMes = 'paga';
  } else {
    const anoHoje = hoje.getFullYear();
    const mesHoje = hoje.getMonth() + 1;
    if (ano < anoHoje || (ano === anoHoje && mes < mesHoje)) {
      statusParcelaMes = 'atrasada';
    } else if (ano > anoHoje || (ano === anoHoje && mes > mesHoje)) {
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
      d.statusParcelaMes === 'pendente' ||
      d.statusParcelaMes === 'atrasada',
  ).length;

  return {
    ...base,
    totalPago: Math.round(totalPagoNoMes * 100) / 100,
    parcelasAtivas,
  };
}

export function formatarMoedaGrafico(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
