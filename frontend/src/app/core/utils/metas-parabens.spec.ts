import { MetaExtended } from '../interfaces/metas/mes-meta';
import {
  getValorFaltanteMeta,
  getValorMaximoPermitidoMes,
  getValorRealizadoMeta,
  getValorRealizadoSemMes,
  jaMostrouParabens,
  marcarParabensMostrado,
  mesExecucaoDesabilitado,
  finalizarMesesRestantesDaMeta,
  metaEstaConcluida,
} from '@core/utils/metas-parabens';

const STORAGE_KEY = 'metas_parabens_exibidos_v3';

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

    it('deve tratar valorAtual inválido como zero', () => {
      const meta = metaBase({
        valorAtual: undefined as any,
        meses: [{ id: 1, nome: 'Jan', valor: 100, status: 'Pago' }],
      });

      expect(getValorRealizadoMeta(meta)).toBe(100);
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

    it('deve tratar valorAtual e valores pagos inválidos como zero', () => {
      const meta = metaBase({
        valorAtual: undefined as any,
        meses: [{ id: 1, nome: 'Jan', valor: undefined as any, status: 'Pago' }],
      });

      expect(getValorRealizadoSemMes(meta, 99)).toBe(0);
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

    it('deve retornar zero quando valorMeta não é positivo', () => {
      expect(getValorMaximoPermitidoMes(metaBase({ valorMeta: 0 }), 1)).toBe(0);
      expect(getValorMaximoPermitidoMes(metaBase({ valorMeta: -1 }), 1)).toBe(0);
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

    it('deve retornar false quando valorMeta é inválido', () => {
      const meta = metaBase({
        valorMeta: 0,
        meses: [{ id: 1, nome: 'Jan', valor: 0, status: 'Pago' }],
      });
      expect(metaEstaConcluida(meta)).toBe(false);
    });
  });

  describe('jaMostrouParabens e marcarParabensMostrado', () => {
    beforeEach(() => localStorage.clear());

    it('deve retornar false se nada estiver marcado e true após marcar', () => {
      expect(jaMostrouParabens(1)).toBe(false);
      marcarParabensMostrado(1);
      expect(jaMostrouParabens(1)).toBe(true);
    });

    it('não deve duplicar ids existentes no localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['1']));
      marcarParabensMostrado(1);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([
        '1',
      ]);
    });

    it('retorna false quando localStorage contém JSON inválido', () => {
      localStorage.setItem(STORAGE_KEY, '###');
      expect(jaMostrouParabens(1)).toBe(false);
    });
  });

  describe('mesExecucaoDesabilitado', () => {
    it('deve retornar false quando meta não está concluída', () => {
      const meta = metaBase({
        meses: [{ id: 1, nome: 'Jan', valor: 100, status: 'Programado' }],
      });
      expect(mesExecucaoDesabilitado(meta, 0)).toBe(false);
    });

    it('deve retornar false quando mês não existe', () => {
      const meta = metaBase({ meses: [], valorAtual: 4124 });
      expect(mesExecucaoDesabilitado(meta, 0)).toBe(false);
    });

    it('deve retornar false quando meta concluída não tem meses', () => {
      const meta = metaBase({ meses: undefined, valorAtual: 4124 });

      expect(mesExecucaoDesabilitado(meta, 0)).toBe(false);
    });

    it('deve retornar true quando mês já estiver Finalizado', () => {
      const meta = metaBase({
        valorAtual: 4124,
        meses: [{ id: 1, nome: 'Jan', valor: 4124, status: 'Finalizado' }],
      });
      expect(mesExecucaoDesabilitado(meta, 0)).toBe(true);
    });

    it('deve retornar true quando mês não pago e não há pagamento anterior', () => {
      const meta = metaBase({
        valorAtual: 4124,
        meses: [{ id: 1, nome: 'Jan', valor: 0, status: 'Programado' }],
      });
      expect(mesExecucaoDesabilitado(meta, 0)).toBe(true);
    });

    it('deve retornar false quando mês está pago e não há pagamento anterior diferente dele', () => {
      const meta = metaBase({
        valorAtual: 0,
        valorMeta: 100,
        meses: [{ id: 1, nome: 'Jan', valor: 100, status: 'Pago' }],
      });

      expect(mesExecucaoDesabilitado(meta, 0)).toBe(false);
    });

    it('deve retornar true quando índice do mês é após o último pago', () => {
      const meta = metaBase({
        valorAtual: 4124,
        meses: [
          { id: 1, nome: 'Jan', valor: 4124, status: 'Pago' },
          { id: 2, nome: 'Fev', valor: 0, status: 'Programado' },
        ],
      });
      expect(mesExecucaoDesabilitado(meta, 1)).toBe(true);
    });
  });

  describe('finalizarMesesRestantesDaMeta', () => {
    it('deve retornar false quando meses estiver undefined', () => {
      const meta = metaBase({ meses: undefined });
      expect(finalizarMesesRestantesDaMeta(meta)).toBe(false);
    });

    it('deve retornar false quando não há meses', () => {
      const meta = metaBase({ meses: [] });
      expect(finalizarMesesRestantesDaMeta(meta)).toBe(false);
    });

    it('deve retornar false quando todos os meses já estão pagos', () => {
      const meta = metaBase({
        meses: [{ id: 1, nome: 'Jan', valor: 4124, status: 'Pago' }],
      });
      expect(finalizarMesesRestantesDaMeta(meta)).toBe(false);
    });

    it('deve finalizar meses restantes e zerar mesesNecessarios', () => {
      const meta = metaBase({
        valorAtual: 0,
        mesesNecessarios: 3,
        meses: [
          { id: 1, nome: 'Jan', valor: 0, status: 'Programado' },
          { id: 2, nome: 'Fev', valor: 0, status: 'Programado' },
        ],
      });
      expect(finalizarMesesRestantesDaMeta(meta)).toBe(true);
      expect(
        meta.meses?.every(
          (mes) => mes.status === 'Finalizado' && mes.valor === 0,
        ),
      ).toBe(true);
      expect(meta.mesesNecessarios).toBe(0);
    });
  });
});
