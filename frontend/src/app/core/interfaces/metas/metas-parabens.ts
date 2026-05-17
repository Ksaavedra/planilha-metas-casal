import { MetaExtended } from './mes-meta';

export interface ParabensDialogData {
  metaNome: string;
  valorMeta: number;
  valorRealizado: number;
}

export interface MetaCompletaEvent {
  metaId: string | number;
  metaNome: string;
  valorMeta: number;
}

const STORAGE_KEY = 'metas_parabens_exibidos_v3';

export function getValorRealizadoMeta(meta: MetaExtended): number {
  const valorAtual = Number(meta.valorAtual) || 0;
  const valorPago = (meta.meses ?? [])
    .filter((x) => x.status === 'Pago')
    .reduce((s, x) => s + (Number(x.valor) || 0), 0);
  return valorAtual + valorPago;
}

export function getValorFaltanteMeta(meta: MetaExtended): number {
  const valorMeta = Number(meta.valorMeta) || 0;
  return Math.max(0, valorMeta - getValorRealizadoMeta(meta));
}

/** Realizado sem o mês em edição (só meses Pago + valorAtual). */
export function getValorRealizadoSemMes(
  meta: MetaExtended,
  mesId: number,
): number {
  const valorAtual = Number(meta.valorAtual) || 0;
  const valorPagoOutros = (meta.meses ?? [])
    .filter((x) => x.status === 'Pago' && x.id !== mesId)
    .reduce((s, x) => s + (Number(x.valor) || 0), 0);
  return valorAtual + valorPagoOutros;
}

/** Máximo que pode ser informado no mês em edição sem ultrapassar a meta. */
export function getValorMaximoPermitidoMes(
  meta: MetaExtended,
  mesId: number,
): number {
  const valorMeta = Number(meta.valorMeta) || 0;
  if (valorMeta <= 0) return 0;
  return Math.max(0, valorMeta - getValorRealizadoSemMes(meta, mesId));
}

export function metaEstaConcluida(meta: MetaExtended): boolean {
  const valorMeta = Number(meta.valorMeta) || 0;
  if (valorMeta <= 0) return false;
  return getValorFaltanteMeta(meta) === 0;
}

export function jaMostrouParabens(metaId: string | number): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const ids: string[] = stored ? JSON.parse(stored) : [];
    return ids.includes(String(metaId));
  } catch {
    return false;
  }
}

export function marcarParabensMostrado(metaId: string | number): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const ids: string[] = stored ? JSON.parse(stored) : [];
    if (!ids.includes(String(metaId))) {
      ids.push(String(metaId));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Na tabela Executando: bloqueia meses após a meta concluir (100%).
 * Mantém editáveis apenas os meses já pagos; os demais ficam só leitura.
 */
export function mesExecucaoDesabilitado(
  meta: MetaExtended,
  mesIndex: number,
): boolean {
  if (!metaEstaConcluida(meta)) return false;

  const meses = meta.meses ?? [];
  const mes = meses[mesIndex];
  if (!mes) return false;

  if (mes.status === 'Finalizado') return true;

  let ultimoMesPago = -1;
  for (let i = 0; i < meses.length; i++) {
    if (meses[i].status === 'Pago') {
      ultimoMesPago = i;
    }
  }

  if (ultimoMesPago < 0) {
    return mes.status !== 'Pago';
  }

  return mesIndex > ultimoMesPago;
}

/** Marca meses não pagos como Finalizado quando a meta atinge 100%. */
export function finalizarMesesRestantesDaMeta(meta: MetaExtended): boolean {
  if (!meta.meses?.length) return false;

  const mesesParaFinalizar = meta.meses.filter((mes) => mes.status !== 'Pago');
  if (mesesParaFinalizar.length === 0) return false;

  mesesParaFinalizar.forEach((mes) => {
    mes.status = 'Finalizado';
    mes.valor = 0;
  });

  meta.mesesNecessarios = 0;
  return true;
}
