import {
  Divida,
  DividaNoMes,
  ResumoCartaoView,
  ResumoDividasView,
  ResumoLimiteCartoesView,
  StatusDivida,
  StatusParcelaMes,
} from '../interfaces/dividas/dividas';
import {
  diaFechamentoEfetivo,
  diaMelhorCompraEfetivo,
  mesVencimentoDaCompra,
} from './fatura-cartao.util';
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

function parseDataIsoDivida(valor?: string | null): Date | null {
  if (!valor || valor.length < 10) return null;
  const [ano, mes, dia] = valor.slice(0, 10).split('-').map(Number);
  if (!ano || !mes || !dia) return null;
  return new Date(ano, mes - 1, dia);
}

/** Mês/ano da 1ª parcela: prioriza dataInicio quando a compra cai em fatura posterior (ex.: encargos). */
function isPrimeiroDiaMes(dataInicio?: string | null): boolean {
  return !!dataInicio && dataInicio.length >= 10 && dataInicio.slice(8, 10) === '01';
}

function mesAnoFromDataInicio(d: Divida): { ano: number; mes: number } | null {
  const mes = mesDataInicioDivida(d.dataInicio);
  if (mes == null) return null;
  const ano =
    d.dataInicio && d.dataInicio.length >= 4
      ? parseInt(d.dataInicio.slice(0, 4), 10)
      : d.ano;
  if (!ano) return null;
  return { ano, mes };
}

function inicioParcelaDivida(d: Divida): { ano: number; mes: number } {
  const fromDataInicio = mesAnoFromDataInicio(d);

  if (d.cartaoId && d.dataCompra) {
    const compra = parseDataIsoDivida(d.dataCompra);
    const cartao = {
      diaMelhorCompra: d.diaMelhorCompra,
      diaVencimento: d.diaVencimento,
      diaFechamento: diaFechamentoEfetivo({
        diaFechamento: null,
        diaMelhorCompra: d.diaMelhorCompra ?? null,
        diaVencimento: d.diaVencimento ?? null,
      }),
    };

    if (compra && diaMelhorCompraEfetivo(cartao) != null) {
      const venc = mesVencimentoDaCompra(compra, cartao);

      if (fromDataInicio && isPrimeiroDiaMes(d.dataInicio)) {
        const dataInicioAntesDoVencCompra =
          fromDataInicio.ano < venc.ano ||
          (fromDataInicio.ano === venc.ano && fromDataInicio.mes < venc.mes);
        if (dataInicioAntesDoVencCompra) {
          return fromDataInicio;
        }
      }

      return venc;
    }
  }

  if (fromDataInicio) return fromDataInicio;

  const mes = mesDataInicioDivida(d.dataInicio) ?? 1;
  const ano =
    d.dataInicio && d.dataInicio.length >= 4
      ? parseInt(d.dataInicio.slice(0, 4), 10)
      : d.ano;
  return { ano, mes };
}

function mesAbsoluto(ano: number, mes: number): number {
  return ano * 12 + (mes - 1);
}

function duracaoParcelasDivida(d: Divida): number {
  return Math.max(1, d.quantidadeParcelas || d.parcelasRestantes || 1);
}

function parcelaVisivelNoMesReferencia(
  d: Divida,
  ano: number,
  mes: number,
): boolean {
  const inicio = inicioParcelaDivida(d);
  const refAbs = mesAbsoluto(ano, mes);
  const inicioAbs = mesAbsoluto(inicio.ano, inicio.mes);
  if (refAbs < inicioAbs) return false;
  const fimAbs = inicioAbs + duracaoParcelasDivida(d) - 1;
  return refAbs <= fimAbs;
}

/**
 * Dívida visível no mês de referência da fatura (suporta parcelas que cruzam anos).
 */
export function dividaVisivelNoMesReferencia(
  d: Divida,
  ano: number,
  mes: number,
): boolean {
  return parcelaVisivelNoMesReferencia(d, ano, mes);
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
  if (!parcelaVisivelNoMesReferencia(d, ano, mes)) return null;

  const inicio = inicioParcelaDivida(d);
  const refAbs = mesAbsoluto(ano, mes);
  const inicioAbs = mesAbsoluto(inicio.ano, inicio.mes);
  const idx = refAbs - inicioAbs + 1;
  const qtd = d.quantidadeParcelas || 0;
  if (qtd > 0 && idx > qtd) return null;
  return idx;
}

export function formatarDataIsoPtBr(valor?: string | null): string | null {
  if (!valor || valor.length < 10) return null;
  const [ano, mes, dia] = valor.slice(0, 10).split('-');
  if (!ano || !mes || !dia) return null;
  return `${dia}/${mes}/${ano}`;
}

/** ISO (aaaa-mm-dd) para ordenar compras da fatura: data da compra, senão data de início. */
export function dataIsoOrdenacaoLancamentoFatura(
  d: Pick<Divida, 'dataCompra' | 'dataInicio'>,
): string {
  return d.dataCompra?.slice(0, 10) ?? d.dataInicio?.slice(0, 10) ?? '';
}

/** Ordem por data da compra: mais recente primeiro (ex.: março → janeiro). */
export function compararLancamentosFaturaPorData(
  a: Pick<Divida, 'id' | 'objetivo' | 'dataCompra' | 'dataInicio'>,
  b: Pick<Divida, 'id' | 'objetivo' | 'dataCompra' | 'dataInicio'>,
): number {
  const diff = dataIsoOrdenacaoLancamentoFatura(b).localeCompare(
    dataIsoOrdenacaoLancamentoFatura(a),
  );
  if (diff !== 0) return diff;
  const nome = (a.objetivo ?? '').localeCompare(b.objetivo ?? '', 'pt-BR');
  if (nome !== 0) return nome;
  return (a.id ?? 0) - (b.id ?? 0);
}

/** Data exibida no tooltip de parcela paga (campo salvo ou data de início). */
export function resolverDataPagamentoParcela(d: DividaNoMes): string | null {
  const paga =
    d.parcelaMesPaga ||
    d.statusParcelaMes === 'paga' ||
    d.statusParcelaMes === 'quitada';
  if (!paga) return null;

  return (
    formatarDataIsoPtBr(d.dataPagamento) ?? formatarDataIsoPtBr(d.dataInicio)
  );
}

/** Uma data de pagamento para exibição (a mais antiga registrada quando houver várias). */
export function resolverDataPagamentoCartao(
  parcelas: DividaNoMes[],
): string | null {
  const isos = parcelas
    .filter(
      (p) =>
        p.parcelaMesPaga ||
        p.statusParcelaMes === 'paga' ||
        p.statusParcelaMes === 'quitada',
    )
    .map((p) => p.dataPagamento || '')
    .filter((iso) => iso.length >= 10)
    .map((iso) => iso.slice(0, 10));

  if (!isos.length) return null;

  const maisAntiga = [...new Set(isos)].sort((a, b) => a.localeCompare(b))[0];
  return formatarDataIsoPtBr(maisAntiga);
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
  const restante = Math.max(0, d.valorRestante ?? 0);
  const pct = d.percentualQuitado ?? 0;
  return restante <= 0.009 || pct >= 99.99;
}

/** Mês de referência já encerrado em relação à data atual. */
export function mesReferenciaAnteriorAoAtual(
  ano: number,
  mes: number,
  hoje: Date = new Date(),
): boolean {
  const anoHoje = hoje.getFullYear();
  const mesHoje = hoje.getMonth() + 1;
  return ano < anoHoje || (ano === anoHoje && mes < mesHoje);
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

export type ContextoMesReferenciaPagamento = Pick<
  Divida,
  'ano' | 'dataCompra' | 'dataInicio' | 'valorTotal' | 'quantidadeParcelas'
>;

/** Atualiza valor pago acumulado ao registrar pagamento só do mês de referência. */
export function calcularValorPagoAcumulado(
  valorTotal: number,
  quantidadeParcelas: number,
  dataInicio: string | undefined,
  mesReferencia: number,
  valorPagoNoMes: number,
  anoReferencia?: number,
  divida?: ContextoMesReferenciaPagamento,
): number {
  const parcela = calcularParcelaMensal(valorTotal, quantidadeParcelas);
  if (parcela <= 0) return Math.min(valorTotal, Math.max(0, valorPagoNoMes));

  let indice: number | null;
  if (anoReferencia != null && divida != null) {
    indice = indiceParcelaNoMes(
      {
        ...divida,
        valorTotal,
        quantidadeParcelas,
        dataInicio: dataInicio ?? divida.dataInicio,
      } as Divida,
      anoReferencia,
      mesReferencia,
    );
  } else {
    indice = null;
  }

  if (indice == null) {
    const mesInicio =
      mesDataInicioDivida(dataInicio ?? divida?.dataInicio ?? undefined) ??
      mesReferencia;
    indice = mesReferencia - mesInicio + 1;
  }

  if (indice == null || indice < 1) return 0;

  const pagasAntes = Math.max(0, indice - 1);
  const pagoMes = Math.min(parcela, Math.max(0, valorPagoNoMes));
  const acumulado = pagasAntes * parcela + pagoMes;
  return Math.min(valorTotal, Math.round(acumulado * 100) / 100);
}

/**
 * Remove o pagamento apenas da parcela do mês de referência,
 * quando ela for a última parcela paga (efeito do pagamento desta fatura).
 * Preserva parcelas de meses posteriores já quitados.
 */
export function calcularValorPagoAposDesfazerMes(
  divida: ContextoMesReferenciaPagamento & Pick<Divida, 'valorPago'>,
  anoReferencia: number,
  mesReferencia: number,
): number | null {
  const valorPagoAtual = Math.max(0, divida.valorPago ?? 0);
  const parcela = calcularParcelaMensal(
    divida.valorTotal,
    divida.quantidadeParcelas,
  );
  if (parcela <= 0) return 0;

  const indice = indiceParcelaNoMes(
    {
      ...divida,
      valorTotal: divida.valorTotal,
      quantidadeParcelas: divida.quantidadeParcelas,
      dataInicio: divida.dataInicio,
    } as Divida,
    anoReferencia,
    mesReferencia,
  );
  if (indice == null || indice < 1) return null;

  const parcelasPagas = parcelasPagasDivida({
    ...divida,
    valorPago: valorPagoAtual,
  } as Divida);
  if (indice > parcelasPagas) return null;

  // Parcelas de meses posteriores já pagas: não altera a dívida neste desfazer.
  if (indice < parcelasPagas) return null;

  const novoValor = Math.max(0, valorPagoAtual - parcela);
  return Math.min(
    divida.valorTotal,
    Math.round(novoValor * 100) / 100,
  );
}

export function dataPagamentoAposDesfazerMes(
  divida: Pick<Divida, 'dataPagamento'>,
  novoValorPago: number,
): string | null {
  if (novoValorPago <= 0) return null;
  return divida.dataPagamento ?? null;
}

export function projetarDividaNoMes(
  d: Divida,
  ano: number,
  mes: number,
  hoje: Date = new Date(),
  preservarPendenteEmMesPassado = false,
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
  } else if (
    !(
      preservarPendenteEmMesPassado &&
      mesReferenciaAnteriorAoAtual(ano, mes, hoje)
    ) &&
    parcelaAtrasadaNoMes(d, ano, mes, hoje)
  ) {
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
  hoje: Date = new Date(),
  preservarPendenteEmMesPassado = false,
): DividaNoMes[] {
  return lista
    .map((d) =>
      projetarDividaNoMes(d, ano, mes, hoje, preservarPendenteEmMesPassado),
    )
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

export const LIMITE_SUGESTOES_COMPRA = 8;

export interface SugestaoObjetivoCompra {
  label: string;
  value: string;
  criar: boolean;
}

/** Catálogo único de nomes de compra parcelada, ordenado alfabeticamente. */
export function catalogoObjetivosCompraParcelamento(
  dividas: Pick<Divida, 'objetivo' | 'tipoDivida' | 'cartaoId'>[],
  cartaoId?: number | null,
): string[] {
  const vistos = new Map<string, string>();

  for (const divida of dividas) {
    if (divida.tipoDivida !== 'parcelamento') continue;
    if (cartaoId != null && divida.cartaoId !== cartaoId) continue;

    const texto = (divida.objetivo || '').trim();
    if (!texto) continue;

    const chave = texto.toLowerCase();
    if (!vistos.has(chave)) {
      vistos.set(chave, texto);
    }
  }

  return [...vistos.values()].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
  );
}

export function filtrarSugestoesObjetivoCompra(
  catalogo: string[],
  termo: string,
  limite = LIMITE_SUGESTOES_COMPRA,
): SugestaoObjetivoCompra[] {
  const busca = termo.trim();
  const buscaLower = busca.toLowerCase();

  const filtradas = buscaLower
    ? catalogo.filter((nome) => nome.toLowerCase().includes(buscaLower))
    : [...catalogo];

  const sugestoes = filtradas.slice(0, limite).map((valor) => ({
    label: valor,
    value: valor,
    criar: false,
  }));

  if (
    busca &&
    !catalogo.some((nome) => nome.toLowerCase() === buscaLower) &&
    sugestoes.length === 0
  ) {
    return [
      {
        label: `+ Criar '${busca}'`,
        value: busca,
        criar: true,
      },
    ];
  }

  return sugestoes;
}

/** Evita duplicar nomes por diferença apenas de maiúsculas/minúsculas. */
export function resolverObjetivoCompraSalvo(
  texto: string,
  catalogo: string[],
): string {
  const normalizado = texto.trim();
  if (!normalizado) return normalizado;

  const chave = normalizado.toLowerCase();
  const existente = catalogo.find((nome) => nome.toLowerCase() === chave);
  return existente ?? normalizado;
}
