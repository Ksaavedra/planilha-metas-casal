import { Cartao } from '../interfaces/cartoes/cartoes';

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

export interface PeriodoFaturaCartao {
  titulo: string;
  periodoInicioLabel: string;
  periodoFimLabel: string;
  periodoLabel: string;
  vencimentoLabel: string;
  textoAmigavel: string;
}

/** Fechamento = dia anterior ao melhor dia de compra. */
export function diaFechamentoAPartirDoMelhorDia(melhorDia: number): number {
  if (melhorDia <= 1) return 31;
  return melhorDia - 1;
}

/** Melhor dia = 8 dias antes do vencimento (regra bancária). */
export function diaMelhorCompraAPartirDoVencimento(diaVencimento: number): number {
  const ref = new Date(2024, 6, diaVencimento);
  ref.setDate(ref.getDate() - 8);
  return ref.getDate();
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

function deslocarMes(
  ano: number,
  mes: number,
  delta: number,
): { ano: number; mes: number } {
  const data = new Date(ano, mes - 1 + delta, 1);
  return { ano: data.getFullYear(), mes: data.getMonth() + 1 };
}

function dataNoMes(ano: number, mes: number, dia: number): Date {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return new Date(ano, mes - 1, Math.min(Math.max(1, dia), ultimoDia));
}

function formatarDataPtBr(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getFullYear()}`;
}

/** Período da fatura cujo vencimento cai no mês de referência (1–12). */
export function periodoFaturaCartao(
  cartao: Pick<Cartao, 'diaMelhorCompra' | 'diaVencimento' | 'diaFechamento'>,
  anoRef: number,
  mesRef: number,
): PeriodoFaturaCartao | null {
  const melhor = diaMelhorCompraEfetivo(cartao);
  const vencimentoDia = cartao.diaVencimento;
  const fechamento = diaFechamentoEfetivo(cartao);
  if (melhor == null || vencimentoDia == null || fechamento == null) {
    return null;
  }

  const inicioRef = deslocarMes(anoRef, mesRef, -2);
  const fimRef = deslocarMes(anoRef, mesRef, -1);
  const periodoInicio = dataNoMes(inicioRef.ano, inicioRef.mes, melhor);
  const periodoFim = dataNoMes(fimRef.ano, fimRef.mes, fechamento);
  const vencimento = dataNoMes(anoRef, mesRef, vencimentoDia);

  const inicioCurto = formatarDataPtBr(periodoInicio).slice(0, 5);
  const fimCurto = formatarDataPtBr(periodoFim).slice(0, 5);

  return {
    titulo: `Fatura ${MESES_FATURA[mesRef - 1]}`,
    periodoInicioLabel: formatarDataPtBr(periodoInicio),
    periodoFimLabel: formatarDataPtBr(periodoFim),
    periodoLabel: `${inicioCurto} até ${fimCurto}`,
    vencimentoLabel: formatarDataPtBr(vencimento),
    textoAmigavel: `Esta fatura contém compras realizadas entre ${formatarDataPtBr(periodoInicio)} e ${formatarDataPtBr(periodoFim)}.`,
  };
}

/** Mês/ano de vencimento da fatura em que a compra entra. */
export function mesVencimentoDaCompra(
  dataCompra: Date,
  cartao: Pick<Cartao, 'diaMelhorCompra' | 'diaVencimento' | 'diaFechamento'>,
): { ano: number; mes: number } {
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

export function labelFaturaMes(ano: number, mes: number): string {
  return `${MESES_FATURA[mes - 1]} ${ano}`;
}

function dataPtBrParaIso(valor: string): string | null {
  const data = parseDataPtBr(valor);
  if (!data) return null;
  return dataIso(data.getFullYear(), data.getMonth() + 1, data.getDate());
}

/** Limites ISO (min/max) para o campo data da compra na fatura do mês. */
export function periodoCompraLimitesIso(
  cartao: Pick<Cartao, 'diaMelhorCompra' | 'diaVencimento' | 'diaFechamento'>,
  anoFatura: number,
  mesFatura: number,
): { min: string; max: string } | null {
  const periodo = periodoFaturaCartao(cartao, anoFatura, mesFatura);
  if (!periodo) return null;

  const min = dataPtBrParaIso(periodo.periodoInicioLabel);
  const max = dataPtBrParaIso(periodo.periodoFimLabel);
  if (!min || !max) return null;

  return { min, max };
}

export function compraNoPeriodoFatura(
  dataCompraIso: string,
  cartao: Pick<Cartao, 'diaMelhorCompra' | 'diaVencimento' | 'diaFechamento'>,
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
  cartao: Pick<Cartao, 'diaMelhorCompra' | 'diaVencimento' | 'diaFechamento'>,
  anoFatura: number,
  mesFatura: number,
): string {
  const periodo = periodoFaturaCartao(cartao, anoFatura, mesFatura);
  if (periodo?.periodoFimLabel) {
    const [dia, mes, ano] = periodo.periodoFimLabel.split('/').map(Number);
    if (ano && mes && dia) {
      return dataIso(ano, mes, dia);
    }
  }

  const fechamento = diaFechamentoEfetivo(cartao);
  const ref = deslocarMes(anoFatura, mesFatura, -1);
  const dia = fechamento ?? 1;
  const ultimo = new Date(ref.ano, ref.mes, 0).getDate();
  return dataIso(ref.ano, ref.mes, Math.min(dia, ultimo));
}

/**
 * Converte data da compra em data de início das parcelas (1º dia do mês da 1ª fatura).
 * Se a compra estiver no período da fatura em contexto, usa esse mês de vencimento.
 */
export function dataInicioParcelasDaCompra(
  dataCompraIso: string,
  cartao: Pick<Cartao, 'diaMelhorCompra' | 'diaVencimento' | 'diaFechamento'>,
  faturaContexto?: { ano: number; mes: number },
): string {
  const compra = parseDataIso(dataCompraIso);
  if (!compra) return dataCompraIso.slice(0, 10);

  let venc = mesVencimentoDaCompra(compra, cartao);

  if (faturaContexto) {
    const periodo = periodoFaturaCartao(
      cartao,
      faturaContexto.ano,
      faturaContexto.mes,
    );

    if (periodo) {
      const inicio = parseDataPtBr(periodo.periodoInicioLabel);
      const fim = parseDataPtBr(periodo.periodoFimLabel);
      if (inicio && fim) {
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);
        if (compra >= inicio && compra <= fim) {
          venc = { ano: faturaContexto.ano, mes: faturaContexto.mes };
        }
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
  cartao: Pick<Cartao, 'diaMelhorCompra' | 'diaVencimento' | 'diaFechamento'>,
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
