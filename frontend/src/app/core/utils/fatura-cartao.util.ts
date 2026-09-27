import { Cartao, CicloFaturaCartao } from '../interfaces/cartoes/cartoes';
import {
  CalendarioBancarioContexto,
  ajustarParaDiaUtilAnterior,
  ajustarParaProximoDiaUtil,
  dataIsoDeDate,
  dataNoMes,
  diasNoMes,
  isFimDeSemana,
} from './calendario-bancario.util';

const MESES_FATURA = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export type CartaoFaturaContexto = Pick<
  Cartao,
  | 'diaMelhorCompra'
  | 'diaVencimento'
  | 'diaFechamento'
  | 'ciclosFatura'
  | 'feriadosBancariosExtras'
>;

export interface PeriodoFaturaCartao {
  titulo: string;
  periodoInicioLabel: string;
  periodoFimLabel: string;
  periodoLabel: string;
  vencimentoLabel: string;
  textoAmigavel: string;
  usaCicloReal: boolean;
}

function calendarioDoCartao(cartao: CartaoFaturaContexto): CalendarioBancarioContexto {
  return { feriadosExtrasIso: cartao.feriadosBancariosExtras };
}

function deslocarDias(data: Date, dias: number): Date {
  const copia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  copia.setDate(copia.getDate() + dias);
  return copia;
}

/** Fechamento = dia anterior ao melhor dia de compra. */
export function diaFechamentoAPartirDoMelhorDia(melhorDia: number): number {
  if (melhorDia <= 1) return 31;
  return melhorDia - 1;
}

/**
 * Estimativa do melhor dia a partir do vencimento (8 dias antes no mesmo mês).
 * Usado apenas como fallback quando o cartão não tem melhor dia salvo.
 */
export function diaMelhorCompraAPartirDoVencimento(
  diaVencimento: number,
  ano = 2024,
  mes = 7,
): number {
  const vencimento = dataNoMes(ano, mes, diaVencimento);
  return deslocarDias(vencimento, -8).getDate();
}

export function diaMelhorCompraEfetivo(
  cartao: Pick<Cartao, 'diaMelhorCompra' | 'diaVencimento'>,
): number | null {
  if (cartao.diaMelhorCompra != null) return cartao.diaMelhorCompra;
  if (cartao.diaVencimento != null) {
    return diaMelhorCompraAPartirDoVencimento(cartao.diaVencimento);
  }
  return null;
}

export function diaFechamentoEfetivo(
  cartao: Pick<Cartao, 'diaFechamento' | 'diaMelhorCompra' | 'diaVencimento'>,
): number | null {
  if (cartao.diaFechamento != null) return cartao.diaFechamento;
  const melhor = diaMelhorCompraEfetivo(cartao);
  if (melhor != null) return diaFechamentoAPartirDoMelhorDia(melhor);
  return null;
}

export function diaVencimentoFaturaEfetivo(
  cartao: Pick<Cartao, 'diaVencimento'>,
): number {
  return cartao.diaVencimento ?? 5;
}

/** Melhor dia de compra no mês da fatura (limitado ao calendário do mês). */
export function melhorDiaDaFatura(
  ano: number,
  mes: number,
  melhorDiaNominal: number,
): Date {
  let dia = melhorDiaNominal;
  const diasMes = diasNoMes(ano, mes);

  // Meses com 30 dias: melhor dia 30 vira 29 (fechamento antecipa um dia).
  if (dia === 30 && diasMes === 30) {
    dia = 29;
  }

  // Dezembro: bancos antecipam o fechamento (melhor dia até 26).
  if (mes === 12) {
    dia = Math.min(dia, 26);
  }

  return dataNoMes(ano, mes, dia);
}

/**
 * Fechamento da fatura: dia útil anterior a (melhor dia - 1 no calendário).
 * Compras até o fechamento entram na fatura do mês de vencimento.
 */
export function fechamentoDaFatura(
  ano: number,
  mes: number,
  melhorDiaNominal: number,
  contexto: CalendarioBancarioContexto = {},
): Date {
  const melhor = melhorDiaDaFatura(ano, mes, melhorDiaNominal);

  // Dezembro: fecha no calendário (25/12) salvo fim de semana.
  if (mes === 12) {
    const fechamentoCalendario = deslocarDias(melhor, -1);
    if (!isFimDeSemana(fechamentoCalendario)) {
      return fechamentoCalendario;
    }
    return ajustarParaDiaUtilAnterior(fechamentoCalendario, contexto);
  }

  let fechamentoCalendario = deslocarDias(melhor, -1);

  if (isFimDeSemana(melhor)) {
    const melhorUtilAnterior = ajustarParaDiaUtilAnterior(melhor, contexto);
    fechamentoCalendario = deslocarDias(melhorUtilAnterior, -1);
  }

  return ajustarParaDiaUtilAnterior(fechamentoCalendario, contexto);
}

/** Vencimento: posterga para o próximo dia útil quando cair em fim de semana ou feriado. */
export function vencimentoDaFatura(
  ano: number,
  mes: number,
  diaVencimento: number,
  contexto: CalendarioBancarioContexto = {},
): Date {
  const vencimento = dataNoMes(ano, mes, diaVencimento);
  return ajustarParaProximoDiaUtil(vencimento, contexto);
}

/** Ciclos reais cadastrados manualmente no cartão. */
export function ciclosFaturaEfetivos(cartao: CartaoFaturaContexto): CicloFaturaCartao[] {
  return cartao.ciclosFatura ?? [];
}

export function buscarCicloFaturaReal(
  cartao: CartaoFaturaContexto,
  ano: number,
  mes: number,
): CicloFaturaCartao | null {
  return (
    ciclosFaturaEfetivos(cartao).find((c) => c.ano === ano && c.mes === mes) ??
    null
  );
}

export function buscarCicloFaturaRealPorData(
  cartao: CartaoFaturaContexto,
  dataIso: string,
): CicloFaturaCartao | null {
  const data = dataIso.slice(0, 10);
  return (
    ciclosFaturaEfetivos(cartao).find(
      (c) => data >= c.inicio && data <= c.fim,
    ) ?? null
  );
}

function deslocarMes(
  ano: number,
  mes: number,
  delta: number,
): { ano: number; mes: number } {
  const data = new Date(ano, mes - 1 + delta, 1);
  return { ano: data.getFullYear(), mes: data.getMonth() + 1 };
}

function formatarDataPtBr(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getFullYear()}`;
}

/** Fechamento (último dia do período) da fatura pelo mês de vencimento. */
function fimPeriodoFaturaVencimento(
  cartao: CartaoFaturaContexto,
  anoVencimento: number,
  mesVencimento: number,
): Date | null {
  const melhor = diaMelhorCompraEfetivo(cartao);
  if (melhor == null) return null;

  const mesFechamento = deslocarMes(anoVencimento, mesVencimento, -1);
  return fechamentoDaFatura(
    mesFechamento.ano,
    mesFechamento.mes,
    melhor,
    calendarioDoCartao(cartao),
  );
}

/**
 * Início do período: dia seguinte ao fim da fatura de vencimento anterior.
 * Garante que nenhuma data pertença a duas faturas consecutivas.
 */
function inicioPeriodoFaturaVencimento(
  cartao: CartaoFaturaContexto,
  anoVencimento: number,
  mesVencimento: number,
  inicioManual?: Date,
): Date | null {
  const vencimentoAnterior = deslocarMes(anoVencimento, mesVencimento, -1);
  const cicloAnterior = buscarCicloFaturaReal(
    cartao,
    vencimentoAnterior.ano,
    vencimentoAnterior.mes,
  );
  const fimAnterior = cicloAnterior
    ? parseDataIso(cicloAnterior.fim)
    : fimPeriodoFaturaVencimento(
        cartao,
        vencimentoAnterior.ano,
        vencimentoAnterior.mes,
      );

  if (!fimAnterior) return inicioManual ?? null;

  const inicioEncadeado = deslocarDias(fimAnterior, 1);
  if (!inicioManual) return inicioEncadeado;

  return inicioManual.getTime() <= fimAnterior.getTime()
    ? inicioEncadeado
    : inicioManual;
}

function montarPeriodoFatura(
  mesRef: number,
  periodoInicio: Date,
  periodoFim: Date,
  vencimento: Date,
  usaCicloReal: boolean,
): PeriodoFaturaCartao {
  const inicioLabel = formatarDataPtBr(periodoInicio);
  const fimLabel = formatarDataPtBr(periodoFim);
  const inicioCurto = inicioLabel.slice(0, 5);
  const fimCurto = fimLabel.slice(0, 5);

  return {
    titulo: `Fatura ${MESES_FATURA[mesRef - 1]}`,
    periodoInicioLabel: inicioLabel,
    periodoFimLabel: fimLabel,
    periodoLabel: `${inicioCurto} até ${fimCurto}`,
    vencimentoLabel: formatarDataPtBr(vencimento),
    textoAmigavel: `Esta fatura contém compras realizadas entre ${inicioLabel} e ${fimLabel}.`,
    usaCicloReal,
  };
}

function periodoFaturaCalculado(
  cartao: CartaoFaturaContexto,
  anoVencimento: number,
  mesVencimento: number,
): PeriodoFaturaCartao | null {
  const vencimentoDia = diaVencimentoFaturaEfetivo(cartao);
  const melhor = diaMelhorCompraEfetivo(cartao);
  if (melhor == null) return null;

  const contexto = calendarioDoCartao(cartao);
  const fim = fimPeriodoFaturaVencimento(cartao, anoVencimento, mesVencimento);
  const inicio = inicioPeriodoFaturaVencimento(
    cartao,
    anoVencimento,
    mesVencimento,
  );
  if (!fim || !inicio) return null;

  const vencimento = vencimentoDaFatura(
    anoVencimento,
    mesVencimento,
    vencimentoDia,
    contexto,
  );

  return montarPeriodoFatura(mesVencimento, inicio, fim, vencimento, false);
}

/**
 * Período da fatura identificada pelo mês/ano de vencimento (pagamento).
 * O fechamento ocorre no mês anterior; compras do período entram nesta fatura.
 */
export function periodoFaturaCartao(
  cartao: CartaoFaturaContexto,
  anoRef: number,
  mesRef: number,
): PeriodoFaturaCartao | null {
  const ciclo = buscarCicloFaturaReal(cartao, anoRef, mesRef);
  if (ciclo) {
    const periodoFim = parseDataIso(ciclo.fim);
    if (!periodoFim) return null;

    const periodoInicio = inicioPeriodoFaturaVencimento(
      cartao,
      anoRef,
      mesRef,
      parseDataIso(ciclo.inicio) ?? undefined,
    );
    if (!periodoInicio) return null;

    const vencimento = vencimentoDaFatura(
      anoRef,
      mesRef,
      diaVencimentoFaturaEfetivo(cartao),
      calendarioDoCartao(cartao),
    );

    return montarPeriodoFatura(
      mesRef,
      periodoInicio,
      periodoFim,
      vencimento,
      true,
    );
  }

  return periodoFaturaCalculado(cartao, anoRef, mesRef);
}

function mesVencimentoDaCompraCalculado(
  dataCompra: Date,
  cartao: CartaoFaturaContexto,
): { ano: number; mes: number } | null {
  const iso = dataIso(
    dataCompra.getFullYear(),
    dataCompra.getMonth() + 1,
    dataCompra.getDate(),
  );
  const base = deslocarMes(
    dataCompra.getFullYear(),
    dataCompra.getMonth() + 1,
    -2,
  );

  for (let offset = 0; offset < 16; offset++) {
    const ref = deslocarMes(base.ano, base.mes, offset);
    const limites = periodoCompraLimitesIso(cartao, ref.ano, ref.mes);
    if (limites && iso >= limites.min && iso <= limites.max) {
      return { ano: ref.ano, mes: ref.mes };
    }
  }

  return null;
}

/** Mês/ano de vencimento da fatura em que a compra entra. */
export function mesVencimentoDaCompra(
  dataCompra: Date,
  cartao: CartaoFaturaContexto,
): { ano: number; mes: number } {
  const dataIsoCompra = dataIso(
    dataCompra.getFullYear(),
    dataCompra.getMonth() + 1,
    dataCompra.getDate(),
  );
  const ciclo = buscarCicloFaturaRealPorData(cartao, dataIsoCompra);
  if (ciclo) {
    return { ano: ciclo.ano, mes: ciclo.mes };
  }

  const calculado = mesVencimentoDaCompraCalculado(dataCompra, cartao);
  if (calculado) return calculado;

  const melhor = diaMelhorCompraEfetivo(cartao) ?? 1;
  const mesCompra = dataCompra.getMonth() + 1;
  const dia = dataCompra.getDate();
  let mesVenc = mesCompra + (dia >= melhor ? 2 : 1);
  let anoVenc = dataCompra.getFullYear();

  while (mesVenc > 12) {
    mesVenc -= 12;
    anoVenc += 1;
  }

  return { ano: anoVenc, mes: mesVenc };
}

export function montarDiasCicloFatura(
  diaMelhorCompra?: number | null,
  diaVencimento?: number | null,
  diaFechamento?: number | null,
): {
  diaMelhorCompra: number | null;
  diaVencimento: number | null;
  diaFechamento: number | null;
} {
  const melhor = diaMelhorCompra ?? null;
  const venc = diaVencimento ?? null;
  let fech = diaFechamento ?? null;

  if (fech == null && melhor != null) {
    fech = diaFechamentoAPartirDoMelhorDia(melhor);
  }

  return {
    diaMelhorCompra: melhor,
    diaVencimento: venc,
    diaFechamento: fech,
  };
}

function parseDataPtBr(valor: string): Date | null {
  const partes = valor.split('/');
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes.map(Number);
  if (!ano || !mes || !dia) return null;
  return new Date(ano, mes - 1, dia);
}

export function dataIso(ano: number, mes: number, dia = 1): string {
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** 1º dia do mês de vencimento da fatura em contexto. */
export function dataInicioFatura(
  anoFatura: number,
  mesFatura: number,
): string {
  return dataIso(anoFatura, mesFatura, 1);
}

export function labelFaturaMes(ano: number, mesVencimento: number): string {
  return `${MESES_FATURA[mesVencimento - 1]} ${ano}`;
}

function dataPtBrParaIso(valor: string): string | null {
  const data = parseDataPtBr(valor);
  if (!data) return null;
  return dataIsoDeDate(data);
}

/** Limites ISO (min/max) para o campo data da compra na fatura do mês. */
export function periodoCompraLimitesIso(
  cartao: CartaoFaturaContexto,
  anoFatura: number,
  mesFatura: number,
): { min: string; max: string } | null {
  const ciclo = buscarCicloFaturaReal(cartao, anoFatura, mesFatura);
  if (ciclo) {
    return { min: ciclo.inicio, max: ciclo.fim };
  }

  const periodo = periodoFaturaCalculado(cartao, anoFatura, mesFatura);
  if (!periodo) return null;

  const min = dataPtBrParaIso(periodo.periodoInicioLabel);
  const max = dataPtBrParaIso(periodo.periodoFimLabel);
  if (!min || !max) return null;

  return { min, max };
}

export function compraNoPeriodoFatura(
  dataCompraIso: string,
  cartao: CartaoFaturaContexto,
  faturaContexto: { ano: number; mes: number },
): boolean {
  const limites = periodoCompraLimitesIso(
    cartao,
    faturaContexto.ano,
    faturaContexto.mes,
  );
  if (!limites) return true;

  const data = dataCompraIso.slice(0, 10);
  return data >= limites.min && data <= limites.max;
}

/** Data padrão de compra ao parcelar na fatura do mês (último dia do período). */
export function dataCompraPadraoNaFatura(
  cartao: CartaoFaturaContexto,
  anoFatura: number,
  mesFatura: number,
): string {
  const ciclo = buscarCicloFaturaReal(cartao, anoFatura, mesFatura);
  if (ciclo) return ciclo.fim;

  const periodo = periodoFaturaCalculado(cartao, anoFatura, mesFatura);
  if (periodo?.periodoFimLabel) {
    const iso = dataPtBrParaIso(periodo.periodoFimLabel);
    if (iso) return iso;
  }

  const melhor = diaMelhorCompraEfetivo(cartao);
  if (melhor == null) return dataIso(anoFatura, mesFatura, 1);

  const mesFechamento = deslocarMes(anoFatura, mesFatura, -1);
  return dataIsoDeDate(
    fechamentoDaFatura(
      mesFechamento.ano,
      mesFechamento.mes,
      melhor,
      calendarioDoCartao(cartao),
    ),
  );
}

/**
 * Converte data da compra em data de início das parcelas (1º dia do mês da 1ª fatura).
 * Se a compra estiver no período da fatura em contexto, usa esse mês de vencimento.
 */
export function dataInicioParcelasDaCompra(
  dataCompraIso: string,
  cartao: CartaoFaturaContexto,
  faturaContexto?: { ano: number; mes: number },
): string {
  const compra = parseDataIso(dataCompraIso);
  if (!compra) return dataCompraIso.slice(0, 10);

  let venc = mesVencimentoDaCompra(compra, cartao);

  if (faturaContexto) {
    const limites = periodoCompraLimitesIso(
      cartao,
      faturaContexto.ano,
      faturaContexto.mes,
    );

    if (limites) {
      const data = dataCompraIso.slice(0, 10);
      if (data >= limites.min && data <= limites.max) {
        venc = { ano: faturaContexto.ano, mes: faturaContexto.mes };
      }
    }
  }

  return dataIso(venc.ano, venc.mes, 1);
}

function parseDataIso(valor: string): Date | null {
  if (!valor || valor.length < 10) return null;
  const [ano, mes, dia] = valor.slice(0, 10).split('-').map(Number);
  if (!ano || !mes || !dia) return null;
  return new Date(ano, mes - 1, dia);
}

export function labelPrimeiraParcela(
  dataCompraIso: string,
  cartao: CartaoFaturaContexto,
  faturaContexto?: { ano: number; mes: number },
): string {
  const inicio = dataInicioParcelasDaCompra(
    dataCompraIso,
    cartao,
    faturaContexto,
  );
  const mesNum = Number(inicio.slice(5, 7));
  const anoNum = Number(inicio.slice(0, 4));
  return `${MESES_FATURA[mesNum - 1]} ${anoNum}`;
}
