import { Cartao } from '../interfaces/cartoes/cartoes';
import { Divida, DividaNoMes } from '../interfaces/dividas/dividas';
import {
  parcelaMensalDivida,
  totalParcelaMensalPendenteNoMes,
} from './dividas.util';

export const TIPO_DIVIDA_AJUSTE_FATURA = 'ajuste_fatura';

export const CATEGORIAS_AJUSTE_FATURA = [
  {
    id: 'credito_fatura_anterior',
    label: 'Crédito da fatura anterior',
    credito: true,
  },
  { id: 'estorno', label: 'Estorno', credito: true },
  { id: 'desconto', label: 'Desconto', credito: true },
  { id: 'pagamento_realizado', label: 'Pagamento realizado', credito: true },
  {
    id: 'ajuste_administradora',
    label: 'Ajuste da administradora',
    credito: true,
  },
  { id: 'juros', label: 'Juros', credito: false },
  { id: 'iof', label: 'IOF', credito: false },
  { id: 'encargos', label: 'Encargos', credito: false },
  { id: 'multa_contratual', label: 'Multa contratual', credito: false },
  { id: 'outros_credito', label: 'Outros créditos', credito: true },
  { id: 'outros_debito', label: 'Outros débitos', credito: false },
] as const;

export type CategoriaAjusteFaturaId =
  (typeof CATEGORIAS_AJUSTE_FATURA)[number]['id'];

export function isAjusteFatura(d: Pick<Divida, 'tipoDivida'>): boolean {
  return d.tipoDivida === TIPO_DIVIDA_AJUSTE_FATURA;
}

export function isCompraFatura(d: Pick<Divida, 'tipoDivida'>): boolean {
  return [
    'parcelamento',
    'cartao_credito',
    'crediario',
    'pix_parcelado',
  ].includes(d.tipoDivida);
}

export function labelCategoriaAjuste(objetivo: string): string {
  const cat = CATEGORIAS_AJUSTE_FATURA.find((c) => c.id === objetivo);
  return cat?.label ?? objetivo;
}

export function arredondarMoeda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export interface ResumoFaturaCartao {
  totalCompras: number;
  totalAjustes: number;
  valorFatura: number;
  pagamentosRealizados: number;
  valorAPagar: number;
}

export function calcularResumoFaturaCartao(
  compras: DividaNoMes[],
  ajustes: Divida[],
  cartao: Pick<Cartao, 'faturaPaga' | 'valorFaturaPaga'>,
): ResumoFaturaCartao {
  const totalCompras = arredondarMoeda(
    compras.reduce((s, c) => s + parcelaMensalDivida(c), 0),
  );

  const totalAjustes = arredondarMoeda(
    ajustes.reduce((s, a) => s + (a.valorTotal || 0), 0),
  );

  const valorFatura = arredondarMoeda(Math.max(0, totalCompras + totalAjustes));

  const parcelasPagas = arredondarMoeda(
    compras
      .filter(
        (c) =>
          c.parcelaMesPaga ||
          c.statusParcelaMes === 'paga' ||
          c.statusParcelaMes === 'quitada',
      )
      .reduce((s, c) => s + parcelaMensalDivida(c), 0),
  );

  const ajustesPagamento = arredondarMoeda(
    ajustes
      .filter((a) => a.objetivo === 'pagamento_realizado')
      .reduce((s, a) => s + Math.abs(a.valorTotal || 0), 0),
  );

  let pagamentosRealizados = arredondarMoeda(parcelasPagas + ajustesPagamento);

  const semComprasNoMes = compras.length === 0;
  if (
    semComprasNoMes &&
    cartao.faturaPaga &&
    (cartao.valorFaturaPaga || 0) > 0
  ) {
    pagamentosRealizados = arredondarMoeda(
      Math.max(pagamentosRealizados, cartao.valorFaturaPaga || 0),
    );
  }

  pagamentosRealizados = Math.min(pagamentosRealizados, valorFatura);

  const pendenteCompras = totalParcelaMensalPendenteNoMes(compras);
  const valorAPagar =
    semComprasNoMes && cartao.faturaPaga
      ? 0
      : arredondarMoeda(Math.max(0, pendenteCompras + totalAjustes));

  return {
    totalCompras,
    totalAjustes,
    valorFatura,
    pagamentosRealizados,
    valorAPagar,
  };
}
