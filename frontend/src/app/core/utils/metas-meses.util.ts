import { MesMeta, StatusMeta } from '@core/interfaces/metas/mes-meta';

export const NOMES_MESES = [
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
] as const;

export function formatMesAno(indiceMes: number, ano: number): string {
  const nome = NOMES_MESES[indiceMes % 12];
  return `${nome}/${ano}`;
}

export function parseMesAno(
  nome: string,
): { indiceMes: number; ano: number } | null {
  const slash = nome.lastIndexOf('/');
  if (slash === -1) {
    const idx = NOMES_MESES.findIndex((m) => m === nome.trim());
    if (idx === -1) return null;
    return { indiceMes: idx, ano: NaN };
  }

  const mesPart = nome.slice(0, slash).trim();
  const anoPart = parseInt(nome.slice(slash + 1), 10);
  const idx = NOMES_MESES.findIndex((m) => m === mesPart);
  if (idx === -1 || !Number.isFinite(anoPart)) return null;
  return { indiceMes: idx, ano: anoPart };
}

export function anoDoMes(nome: string, anoFallback: number): number {
  const parsed = parseMesAno(nome);
  return parsed && Number.isFinite(parsed.ano) ? parsed.ano : anoFallback;
}

export function ordenarNomesMeses(
  nomes: string[],
  anoFallback = new Date().getFullYear(),
): string[] {
  const unicos = Array.from(new Set(nomes));
  return unicos.sort((a, b) => {
    const pa = parseMesAno(a);
    const pb = parseMesAno(b);
    const anoA = pa && Number.isFinite(pa.ano) ? pa.ano : anoFallback;
    const anoB = pb && Number.isFinite(pb.ano) ? pb.ano : anoFallback;
    if (anoA !== anoB) return anoA - anoB;
    return (pa?.indiceMes ?? 0) - (pb?.indiceMes ?? 0);
  });
}

export function filtrarMesesPorAno(
  nomes: string[],
  ano: number,
  anoFallback?: number,
): string[] {
  const fb = anoFallback ?? ano;
  return nomes.filter((n) => anoDoMes(n, fb) === ano);
}

/** Meta tem ao menos um mês de contribuição no ano do calendário (nome com /ano). */
export function metaTemMesesNoAno(
  meta: { meses?: { nome: string }[]; ano?: number | null },
  ano: number,
): boolean {
  if (!meta.meses?.length) {
    return false;
  }
  const anoFallback =
    meta.ano != null && Number.isFinite(Number(meta.ano))
      ? Number(meta.ano)
      : ano;
  return meta.meses.some((m) => anoDoMes(m.nome, anoFallback) === ano);
}

export function quantidadeMesesPlanejamento(meta: {
  mesesNecessarios?: number;
  meses?: { nome: string }[];
}): number {
  const porCampo = Number(meta.mesesNecessarios) || 0;
  const porLista = meta.meses?.length ?? 0;
  const temAnoNoNome = meta.meses?.some((m) => m.nome.includes('/')) ?? false;

  if (temAnoNoNome) {
    return Math.max(porLista, porCampo, 0);
  }

  return Math.max(porCampo, porLista, 0);
}

/** Último ano do calendário ao planejar N meses a partir de janeiro do ano inicial. */
export function calcularAnoFimPlanejamento(
  anoInicio: number,
  quantidadeMeses: number,
): number {
  if (quantidadeMeses <= 0) {
    return anoInicio;
  }
  return anoInicio + Math.floor((quantidadeMeses - 1) / 12);
}

/**
 * A meta cobre o ano no calendário (ex.: 18 meses de 2026 → também 2027).
 */
export function metaAlcancaAnoCalendario(
  meta: {
    meses?: { nome: string }[];
    mesesNecessarios?: number;
    ano?: number | null;
  },
  ano: number,
): boolean {
  if (metaTemMesesNoAno(meta, ano)) {
    return true;
  }

  const anoInicio = Number(meta.ano);
  if (!Number.isFinite(anoInicio)) {
    return false;
  }

  const qtd = quantidadeMesesPlanejamento(meta);
  if (qtd <= 0) {
    return anoInicio === ano;
  }

  const anoFim = calcularAnoFimPlanejamento(anoInicio, qtd);
  return ano >= anoInicio && ano <= anoFim;
}

/**
 * Meta aparece no exercício: ano de criação, legado sem ano (só ano atual)
 * ou planejamento que atravessa o ano (18 meses 2026→2027).
 */
export function metaVisivelNoExercicio(
  meta: {
    meses?: { nome: string }[];
    mesesNecessarios?: number;
    ano?: number | null;
  },
  anoExercicio: number,
  anoAtual: number,
): boolean {
  if ((meta.ano == null || meta.ano === undefined) && anoExercicio === anoAtual) {
    return true;
  }

  return metaAlcancaAnoCalendario(meta, anoExercicio);
}

export function mesesPadraoDoAno(ano: number): string[] {
  return NOMES_MESES.map((_, i) => formatMesAno(i, ano));
}

const ANO_INICIO_LISTA = 2020;
const MAX_MESES_PLANEJAMENTO = 600;

export function buildAnosComparacaoParaMetas(
  metas: { ano?: number | null; mesesNecessarios?: number; meses?: { nome: string }[] }[],
  anoAtual: number,
): number[] {
  let anoFim = Math.max(anoAtual + 1, 2027);

  for (const meta of metas) {
    const anoInicio = Number(meta.ano);
    if (!Number.isFinite(anoInicio)) {
      continue;
    }
    const qtd = quantidadeMesesPlanejamento(meta);
    if (qtd > 0) {
      anoFim = Math.max(anoFim, calcularAnoFimPlanejamento(anoInicio, qtd));
    }
  }

  const anos: number[] = [];
  for (let y = ANO_INICIO_LISTA; y <= anoFim; y++) {
    anos.push(y);
  }
  return anos;
}

export function mesesTotaisDoPlano(meta: {
  valorMeta?: number;
  valorPorMes?: number;
  mesesNecessarios?: number;
}): number {
  const armazenado = Number(meta.mesesNecessarios) || 0;
  if (armazenado > 0) {
    return armazenado;
  }
  const valorMeta = Number(meta.valorMeta) || 0;
  const valorPorMes = Number(meta.valorPorMes) || 0;
  if (valorMeta <= 0 || valorPorMes <= 0) {
    return 0;
  }
  return Math.ceil(valorMeta / valorPorMes);
}

export function gerarMesesPlanejamento(
  anoInicio: number,
  quantidadeMeses: number,
  valorPorMes = 0,
): MesMeta[] {
  const qtd = Math.max(0, Math.min(quantidadeMeses, MAX_MESES_PLANEJAMENTO));
  const valor = valorPorMes > 0 ? valorPorMes : 0;
  const status: StatusMeta = valorPorMes > 0 ? 'Programado' : 'Vazio';

  const meses: MesMeta[] = [];
  let indice = 0;
  let ano = anoInicio;

  for (let i = 0; i < qtd; i++) {
    meses.push({
      id: i + 1,
      nome: formatMesAno(indice, ano),
      valor,
      status,
    });
    indice++;
    if (indice >= 12) {
      indice = 0;
      ano++;
    }
  }

  return meses;
}

/** Converte meses antigos (só "Janeiro") para "Janeiro/2026", preservando valores. */
export function migrarMesesLegado(
  meta: {
    meses?: MesMeta[];
    mesesNecessarios?: number;
    ano?: number | null;
    valorPorMes?: number;
  },
  anoPadrao: number,
): void {
  if (!meta.meses?.length) return;
  if (meta.meses.some((m) => m.nome.includes('/'))) return;

  const qtd = Math.max(quantidadeMesesPlanejamento(meta), 12);
  const anoInicio = meta.ano ?? anoPadrao;
  const gerados = gerarMesesPlanejamento(anoInicio, qtd, 0);

  meta.meses = gerados.map((novo, i) => {
    const antigo = meta.meses![i];
    if (!antigo) return novo;
    return {
      ...novo,
      id: antigo.id,
      valor: antigo.valor,
      status: antigo.status,
    };
  });
}

export function regenerarMesesMeta(
  meta: {
    meses?: MesMeta[];
    mesesNecessarios?: number;
    ano?: number | null;
    valorPorMes?: number;
  },
  anoInicio: number,
  quantidadeMeses: number,
  valorPorMes: number,
): MesMeta[] {
  const qtd = Math.max(quantidadeMeses, 1);
  const gerados = gerarMesesPlanejamento(anoInicio, qtd, valorPorMes);
  const oldByName = new Map((meta.meses ?? []).map((m) => [m.nome, m]));

  return gerados.map((novo, i) => {
    const prev = oldByName.get(novo.nome);
    if (prev) {
      return {
        ...novo,
        id: prev.id,
        valor:
          prev.status === 'Pago' || prev.status === 'Finalizado'
            ? prev.valor
            : novo.valor,
        status: prev.status,
      };
    }

    const legacy = meta.meses?.[i];
    if (legacy && !legacy.nome.includes('/')) {
      return {
        ...novo,
        id: legacy.id,
        valor: legacy.status === 'Pago' ? legacy.valor : novo.valor,
        status: legacy.status,
      };
    }

    return novo;
  });
}
