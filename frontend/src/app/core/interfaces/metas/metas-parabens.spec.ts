import { MetaExtended } from './mes-meta';
import {
  getValorFaltanteMeta,
  getValorMaximoPermitidoMes,
  getValorRealizadoMeta,
  getValorRealizadoSemMes,
  metaEstaConcluida,
} from './metas-parabens';

describe('metas-parabens', () => {
  const metaBase = (overrides: Partial<MetaExtended> = {}): MetaExtended =>
    ({
      id: 1,
      nome: 'Meta teste',
      valorMeta: 4124,
      valorAtual: 0,
      meses: [],
      ...overrides,
    }) as MetaExtended;

  describe('getValorRealizadoMeta', () => {
    it('deve somar valorAtual com meses Pago', () => {
      const meta = metaBase({
        valorAtual: 100,
        meses: [
          { id: 1, nome: 'Jan', valor: 4000, status: 'Pago' },
          { id: 2, nome: 'Fev', valor: 500, status: 'Programado' },
        ],
      });
      expect(getValorRealizadoMeta(meta)).toBe(4100);
    });
  });

  describe('getValorFaltanteMeta', () => {
    it('deve retornar meta menos realizado', () => {
      const meta = metaBase({
        meses: [{ id: 1, nome: 'Jan', valor: 4000, status: 'Pago' }],
      });
      expect(getValorFaltanteMeta(meta)).toBe(124);
    });

    it('não deve retornar valor negativo', () => {
      const meta = metaBase({
        valorAtual: 5000,
        valorMeta: 4124,
      });
      expect(getValorFaltanteMeta(meta)).toBe(0);
    });
  });

  describe('getValorRealizadoSemMes', () => {
    it('deve excluir o mês informado da soma de pagos', () => {
      const meta = metaBase({
        valorAtual: 22000,
        valorMeta: 80000,
        meses: [{ id: 6, nome: 'Junho', valor: 1000, status: 'Pago' }],
      });
      expect(getValorRealizadoSemMes(meta, 6)).toBe(22000);
      expect(getValorRealizadoSemMes(meta, 99)).toBe(23000);
    });
  });

  describe('getValorMaximoPermitidoMes', () => {
    it('deve permitir falta global em mês Programado', () => {
      const meta = metaBase({
        meses: [
          { id: 1, nome: 'Jan', valor: 4000, status: 'Pago' },
          { id: 2, nome: 'Fev', valor: 0, status: 'Programado' },
        ],
      });
      expect(getValorMaximoPermitidoMes(meta, 2)).toBe(124);
    });

    it('deve somar falta + valor do mês já Pago', () => {
      const meta = metaBase({
        valorAtual: 22000,
        valorMeta: 80000,
        meses: [{ id: 6, nome: 'Junho', valor: 1000, status: 'Pago' }],
      });
      expect(getValorFaltanteMeta(meta)).toBe(57000);
      expect(getValorMaximoPermitidoMes(meta, 6)).toBe(58000);
    });
  });

  describe('metaEstaConcluida', () => {
    it('deve retornar true quando falta é zero', () => {
      const meta = metaBase({
        meses: [{ id: 1, nome: 'Jan', valor: 4124, status: 'Pago' }],
      });
      expect(metaEstaConcluida(meta)).toBe(true);
    });

    it('deve retornar false quando ainda falta valor', () => {
      const meta = metaBase({
        meses: [{ id: 1, nome: 'Jan', valor: 4000, status: 'Pago' }],
      });
      expect(metaEstaConcluida(meta)).toBe(false);
    });
  });
});
