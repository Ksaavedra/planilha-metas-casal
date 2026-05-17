import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ElaborandoMetasComponent } from './elaborando-metas.component';
import { MetasService } from '../../../../../core/services/metas/metas.service';
import { MetaExtended } from '../../../../../core/interfaces/metas/mes-meta';
import { of, throwError } from 'rxjs';

describe('ElaborandoMetasComponent', () => {
  let component: ElaborandoMetasComponent;
  let fixture: ComponentFixture<ElaborandoMetasComponent>;
  let metasService: MetasService;

  const makeMeta = (over?: Partial<MetaExtended>): MetaExtended => ({
    id: 1,
    nome: 'Meta 1',
    valorMeta: 10000,
    valorAtual: 0,
    valorPorMes: 1000,
    mesesNecessarios: 10,
    meses: [
      { id: 1, nome: 'Janeiro', valor: 1000, status: 'Pago' as const },
      { id: 2, nome: 'Fevereiro', valor: 1000, status: 'Vazio' as const },
    ],
    editandoNome: false,
    nomeTemp: '',
    savingNome: false,
    savedTick: false,
    editandoValorMeta: false,
    editandoValorPorMes: false,
    editandoValorAtual: false,
    savedTickCampo: false,
    dropdownOpen: undefined,
    ...over,
  });
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ElaborandoMetasComponent],
      imports: [HttpClientTestingModule],
      providers: [MetasService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ElaborandoMetasComponent);
    component = fixture.componentInstance;
    metasService = TestBed.inject(MetasService);
    component.metas = [makeMeta()];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.metas).toEqual([makeMeta()]);
    expect(component.percentualPagoView).toBe(0);
    expect(component.totalValorMetaView).toBe(0);
    expect(component.totalValorPorMesView).toBe(0);
    expect(component.totalMesesNecessariosView).toBe(0);
    expect(component.totalValorAtualView).toBe(0);
    expect(component.totalContribuicoesView).toBe(0);
  });

  describe('constructor subscriptions', () => {
    it('should call processarExclusao(metaId) when metasService.confirmDelete$ emits', () => {
      const processarSpy = jest.spyOn(component, 'processarExclusao');
      component.metas = [[makeMeta()][0]];
      metasService.openConfirmarDelete(
        [makeMeta()][0].id,
        [makeMeta()][0].nome || '',
      );

      metasService.confirmDelete();

      expect(processarSpy).toHaveBeenCalledTimes(1);
      expect(processarSpy).toHaveBeenCalledWith([makeMeta()][0].id);
    });
  });

  // Testes para editarCampo
  describe('editarCampo', () => {
    it('should edit nome field', () => {
      const meta = [makeMeta()][0];
      component.editarCampo(meta, 'nome');

      expect(meta.editandoNome).toBe(true);
      expect(meta.nomeTemp).toBe('Meta 1');
    });

    it('should edit valorMeta field', () => {
      const meta = [makeMeta()][0];
      component.editarCampo(meta, 'valorMeta');

      expect(meta.editandoValorMeta).toBe(true);
      expect(meta.valorMetaTemp).toBe('10000');
    });

    it('should edit valorPorMes field', () => {
      const meta = [makeMeta()][0];
      component.editarCampo(meta, 'valorPorMes');

      expect(meta.editandoValorPorMes).toBe(true);
      expect(meta.valorPorMesTemp).toBe('1000');
    });

    it('should edit valorAtual field', () => {
      const meta = [makeMeta()][0];
      component.editarCampo(meta, 'valorAtual');

      expect(meta.editandoValorAtual).toBe(true);
      expect(meta.valorAtualTemp).toBe('0');
    });

    it('should not edit fields when meta is concluded', () => {
      const meta = makeMeta({
        valorMeta: 1000,
        valorPorMes: 100,
        valorAtual: 1000,
        meses: [{ id: 1, nome: 'Jan', valor: 0, status: 'Pago' as const }],
      }) as any;

      component.editarCampo(meta, 'nome');

      expect(meta.editandoNome).toBeFalsy();
      expect(component.metaConcluida(meta)).toBe(true);
    });

    it('should handle null values in editarCampo', () => {
      const meta = {
        ...[makeMeta()][0],
        nome: '',
        valorMeta: 0,
        valorPorMes: 0,
        valorAtual: 0,
      };

      component.editarCampo(meta, 'nome');
      expect(meta.nomeTemp).toBe('');

      component.editarCampo(meta, 'valorMeta');
      expect(meta.valorMetaTemp).toBe('0');

      component.editarCampo(meta, 'valorPorMes');
      expect(meta.valorPorMesTemp).toBe('0');

      component.editarCampo(meta, 'valorAtual');
      expect(meta.valorAtualTemp).toBe('0');
    });

    it('should handle null/undefined values in editarCampo', () => {
      const meta = {
        ...[makeMeta()][0],
        nome: null as any,
        valorMeta: null as any,
        valorPorMes: undefined as any,
        valorAtual: null as any,
      };

      component.editarCampo(meta, 'nome');
      expect(meta.nomeTemp).toBe('');

      component.editarCampo(meta, 'valorMeta');
      expect(meta.valorMetaTemp).toBe('0');

      component.editarCampo(meta, 'valorPorMes');
      expect(meta.valorPorMesTemp).toBe('0');

      component.editarCampo(meta, 'valorAtual');
      expect(meta.valorAtualTemp).toBe('0');
    });
  });

  // Testes para métodos de formatação
  describe('formatting methods', () => {
    it('should parse Brazilian number format correctly', () => {
      expect(component.parseNumeroBR('1.234,56')).toBe(1234.56);
      expect(component.parseNumeroBR('1234.56')).toBe(1234.56);
      expect(component.parseNumeroBR('1234')).toBe(1234);
      expect(component.parseNumeroBR('')).toBe(0);
      expect(component.parseNumeroBR('abc')).toBe(0);
    });

    it('should parse numbers with comma as decimal separator', () => {
      expect(component.parseNumeroBR('1234,56')).toBe(1234.56);
      expect(component.parseNumeroBR('1000,00')).toBe(1000);
      expect(component.parseNumeroBR('0,50')).toBe(0.5);
    });

    it('should return 0 for empty, whitespace or non-numeric string', () => {
      expect(component.parseNumeroBR('')).toBe(0);
      expect(component.parseNumeroBR('   ')).toBe(0);
      expect(component.parseNumeroBR('---')).toBe(0);
      expect(component.parseNumeroBR('abc')).toBe(0);
      expect(component.parseNumeroBR('  \t  ')).toBe(0);
    });

    it('should return 0 when only non-digit characters remain after clean', () => {
      expect(component.parseNumeroBR('...')).toBe(0);
      expect(component.parseNumeroBR(',,')).toBe(0);
    });

    it('should return 0 when parseFloat yields NaN in comma or dot branches', () => {
      expect(component.parseNumeroBR(',')).toBe(0);
      expect(component.parseNumeroBR('.')).toBe(0);
    });

    // it('should return 0 when parseFloat yields NaN (isNaN(resultado) ? 0 : resultado)', () => {
    //   // Ramo da vírgula (linha 255): limpo vira "." -> parseFloat retorna NaN -> 0
    //   expect(component.parseNumeroBR(',')).toBe(0);
    //   expect(component.parseNumeroBR(',.')).toBe(0);
    //   // Ramo do ponto (linha 266): parseFloat(limpo) NaN -> 0
    //   expect(component.parseNumeroBR('.')).toBe(0);
    //   expect(component.parseNumeroBR('...')).toBe(0);
    //   expect(component.parseNumeroBR(',')).toEqual(0);
    //   expect(component.parseNumeroBR('.')).toEqual(0);
    // });

    it('should return 0 (number) not undefined when resultado is NaN in any branch', () => {
      const zeroComma = component.parseNumeroBR(',');
      const zeroDot = component.parseNumeroBR('.');
      expect(zeroComma).toBe(0);
      expect(typeof zeroComma).toBe('number');
      expect(zeroDot).toBe(0);
      expect(typeof zeroDot).toBe('number');
    });

    it('should parse dot as thousand separator when multiple dots (partes.length > 2)', () => {
      // 1.234.56 -> último é decimal, resto é inteiro
      expect(component.parseNumeroBR('1.234.56')).toBe(1234.56);
      expect(component.parseNumeroBR('10.000.50')).toBe(10000.5);
    });

    it('should format numbers to Brazilian format', () => {
      expect(component.formatBR(1234.56)).toBe('1.234,56');
      expect(component.formatBR(1000)).toBe('1.000,00');
      expect(component.formatBR(0)).toBe('0,00');
    });

    it('should format currency correctly', () => {
      const result = component.formatarMoeda(1234.56);
      expect(result).toContain('R$');
      expect(result).toContain('1.234,56');
    });

    it('should convert values to numbers correctly', () => {
      expect(component.toNum(1234.56)).toBe(1234.56);
      expect(component.toNum('1234,56')).toBe(1234.56);
      expect(component.toNum('1234.56')).toBe(1234.56);
      expect(component.toNum(null)).toBe(0);
      expect(component.toNum(undefined)).toBe(0);
      expect(component.toNum('')).toBe(0);
    });

    it('should handle non-string/number types in toNum', () => {
      expect(component.toNum(true)).toBe(0);
      expect(component.toNum(false)).toBe(0);
      expect(component.toNum({})).toBe(0);
      expect(component.toNum([])).toBe(0);
      expect(component.toNum(() => {})).toBe(0);
    });

    it('should handle invalid string parsing in toNum', () => {
      expect(component.toNum('abc')).toBe(0);
      expect(component.toNum('xyz123')).toBe(123);
      expect(component.toNum('123abc')).toBe(123);
    });

    it('should return 0 when comma-branch parseFloat results NaN', () => {
      // limpo = "," -> vira "." -> parseFloat(".") => NaN -> retorna 0
      expect(component.parseNumeroBR(',')).toBe(0);
    });

    it('should return 0 when dot-branch parseFloat results NaN', () => {
      expect(component.parseNumeroBR('.')).toBe(0);
    });
  });

  describe('parseNumeroBR - retornos 0 (NaN)', () => {
    it('should return 0 when comma-branch parseFloat results NaN', () => {
      // "," -> inclui "," => branch da vírgula
      // remove "." (nada), replace "," por "." => "." -> parseFloat(".") => NaN => 0
      expect(component.parseNumeroBR(',')).toBe(0);
    });

    it('should return 0 when dot-branch parseFloat results NaN', () => {
      // "." -> inclui "." => branch do ponto
      // split(".") => ["", ""] -> parseFloat(".") => NaN => 0
      expect(component.parseNumeroBR('.')).toBe(0);
    });

    it('should return 0 when final-branch parseFloat results NaN after cleaning', () => {
      // "abc" -> limpa => "" -> cai no if (!limpo) return 0
      expect(component.parseNumeroBR('abc')).toBe(0);

      // "R$" -> limpa => "" -> return 0
      expect(component.parseNumeroBR('R$')).toBe(0);
    });

    it('should handle weird punctuation inputs safely', () => {
      expect(component.parseNumeroBR('...')).toBe(0); // se seu código atual retornar 0, ok
      expect(component.parseNumeroBR(',,')).toBe(0); // pode variar, então é melhor não usar
    });

    it('should parse dot as thousand separator when multiple dots (partes.length > 2)', () => {
      expect(component.parseNumeroBR('1.234.56')).toBe(1234.56);
      expect(component.parseNumeroBR('10.000.50')).toBe(10000.5);
    });
  });

  // Testes para métodos de cálculo
  describe('calculation methods', () => {
    it('should calculate total contributions correctly', () => {
      const meta = [makeMeta()][0];
      const total = component.getTotalContribuicoesMeta(meta);
      expect(total).toBe(2000); // Sum of all months (1000 + 1000)
    });

    it('should handle null meses in getTotalContribuicoesMeta', () => {
      const meta = { ...[makeMeta()][0], meses: null as any };
      const total = component.getTotalContribuicoesMeta(meta);
      expect(total).toBe(0);
    });

    it('should calculate progress correctly', () => {
      const meta = [makeMeta()][0];
      const progress = component.getProgressoRealMeta(meta);
      expect(progress).toBe(10); // (0 + 1000 / 10000) * 100
    });

    it('should calculate remaining months correctly', () => {
      const meta = [makeMeta()][0];
      const remaining = component.getMesesRestantes(meta);
      expect(remaining).toBe(9); // (10000 - 1000) / 1000 = 9
    });

    it('should calculate missing value correctly', () => {
      const meta = [makeMeta()][0];
      const missing = component.getValorFaltanteMeta(meta);
      expect(missing).toBe(9000); // 10000 - 1000
    });

    it('should calculate realized value correctly', () => {
      const meta = [makeMeta()][0];
      const realized = component.getValorRealizadoMeta(meta);
      expect(realized).toBe(1000); // 0 + 1000
    });

    it('should handle null meses in getValorRealizadoMeta', () => {
      const meta = { ...[makeMeta()][0], meses: null as any };
      const realized = component.getValorRealizadoMeta(meta);
      expect(realized).toBe(0); // 0 + 0 (null coalescing)
    });

    it('should handle zero values in calculations', () => {
      const meta = { ...[makeMeta()][0], valorMeta: 0, valorPorMes: 0 };

      expect(component.getProgressoRealMeta(meta)).toBe(0);
      expect(component.getMesesRestantes(meta)).toBe(-1); // -1 quando valorPorMes <= 0
      expect(component.getValorFaltanteMeta(meta)).toBe(0);
    });

    it('should handle null/undefined values in calculations', () => {
      const meta = {
        ...[makeMeta()][0],
        valorMeta: null as any,
        valorPorMes: undefined as any,
        valorAtual: null as any,
      };

      // Testar cálculos com valores null/undefined
      expect(component.getProgressoRealMeta(meta)).toBe(0);
      expect(component.getMesesRestantes(meta)).toBe(-1); // -1 quando valorPorMes <= 0
      expect(component.getValorFaltanteMeta(meta)).toBe(0);
    });

    it('should handle null meses in calculations', () => {
      const meta = { ...[makeMeta()][0], meses: null as any };

      // Testar cálculos com meses null
      expect(component.getValorRealizadoMeta(meta)).toBe(0);
      expect(component.getTotalContribuicoesMeta(meta)).toBe(0);
    });

    it('should handle zero valorPorMes in getMesesRestantes (returns -1)', () => {
      const meta = { ...[makeMeta()][0], valorMeta: 0, valorPorMes: 0 };
      expect(component.getMesesRestantes(meta)).toBe(-1);
      expect(component.getValorFaltanteMeta(meta)).toBe(0);
    });

    it('should recalcResumo using 0 for NaN/undefined values (reduce Number(x) || 0)', () => {
      const meta = [
        {
          ...[makeMeta()][0],
          valorMeta: 'abc' as unknown as number,
          valorPorMes: undefined as unknown as number,
          mesesNecessarios: null as unknown as number,
          valorAtual: '---' as unknown as number,
          meses: [
            {
              id: 1,
              nome: 'Janeiro',
              valor: 'abc' as unknown as number,
              status: 'Pago' as const,
            },
            { id: 2, nome: 'Fevereiro', valor: 100, status: 'Vazio' as const },
          ],
        },
      ];

      const metasForTest = [meta] as unknown as MetaExtended[];
      component.metas = metasForTest;
      (component as any).recalcResumo();

      // totalValorMetaView: NaN => 0
      expect(component.totalValorMetaView).toBe(0);
      // totalValorPorMesView: undefined => 0
      expect(component.totalValorPorMesView).toBe(0);
      // totalMesesNecessariosView: null => 0
      expect(component.totalMesesNecessariosView).toBe(0);
      // totalValorAtualView: NaN => 0
      expect(component.totalValorAtualView).toBe(0);

      // totalPago = (NaN->0) + 100 = 100, mas percentual depende totalValorMetaView (0) => 0
      expect(component.percentualPagoView).toBe(0);
    });

    it('should handle null meses in recalcResumo percentual calculation', () => {
      const metasWithNullMeses = [
        { ...[makeMeta()][0], meses: null as any },
        { ...[makeMeta()][1], meses: [] },
      ];
      component.metas = metasWithNullMeses;

      // Trigger recalcResumo through a public method
      component.confirmarCampo(metasWithNullMeses[0], 'nome');

      expect(component.percentualPagoView).toBe(0);
    });

    it('should handle zero totalValorMetaView in recalcResumo', () => {
      const metasWithZero = [
        { ...[makeMeta()][0], valorMeta: 0 },
        { ...[makeMeta()][1], valorMeta: 0 },
      ];
      component.metas = metasWithZero;

      // Trigger recalcResumo through a public method
      component.confirmarCampo(metasWithZero[0], 'nome');

      expect(component.percentualPagoView).toBe(0);
    });

    it('should return 0 when valorRestante <= 0 (covers early return 0)', () => {
      const meta = makeMeta({ valorMeta: 1000, valorPorMes: 100 }) as any;

      // já completou: valorAtual + pago >= valorMeta
      meta.valorAtual = 1000;
      meta.meses = []; // tanto faz

      expect(component.getMesesRestantes(meta)).toBe(0);
    });

    it('should use [] fallback when meses is null (covers ?? []) in getMesesRestantes', () => {
      const meta = makeMeta({
        valorMeta: 1000,
        valorPorMes: 100,
        valorAtual: 0,
      }) as any;
      meta.meses = null; // força fallback

      // valorPago = 0, valorRestante = 1000 => ceil(1000/100)=10
      expect(component.getMesesRestantes(meta)).toBe(10);
    });

    it('should use 0 when mes.valor is NaN in getMesesRestantes (Number(x.valor) || 0)', () => {
      const meta = makeMeta({
        valorMeta: 1000,
        valorPorMes: 100,
        valorAtual: 0,
      }) as any;

      meta.meses = [
        { id: 1, nome: 'Jan', valor: 'abc', status: 'Pago' }, // NaN => 0
        { id: 2, nome: 'Fev', valor: 200, status: 'Pago' }, // pago = 200
      ];

      // totalRealizado = 0 + 200 => restante 800 => ceil(800/100)=8
      expect(component.getMesesRestantes(meta)).toBe(8);
    });

    it('should use [] fallback when meses is undefined in getValorFaltanteMeta (covers ?? [])', () => {
      const meta = makeMeta({ valorMeta: 1000, valorAtual: 100 }) as any;
      meta.meses = undefined; // força fallback

      // pago = 0 => faltante = 1000 - 100 = 900
      expect(component.getValorFaltanteMeta(meta)).toBe(900);
    });

    it('should use 0 when mes.valor is NaN in getValorFaltanteMeta (Number(x.valor) || 0)', () => {
      const meta = makeMeta({ valorMeta: 1000, valorAtual: 0 }) as any;
      meta.meses = [
        { id: 1, nome: 'Jan', valor: 'abc', status: 'Pago' }, // NaN => 0
        { id: 2, nome: 'Fev', valor: 300, status: 'Pago' }, // pago = 300
      ];

      expect(component.getValorFaltanteMeta(meta)).toBe(700);
    });

    it('should use [] fallback when meses is null in getValorRealizadoMeta (covers ?? [])', () => {
      const meta = makeMeta({ valorAtual: 150 }) as any;
      meta.meses = null;

      // realizado = 150 + 0
      expect(component.getValorRealizadoMeta(meta)).toBe(150);
    });

    it('should use 0 when mes.valor is NaN in getValorRealizadoMeta (Number(x.valor) || 0)', () => {
      const meta = makeMeta({ valorAtual: 0 }) as any;
      meta.meses = [
        { id: 1, nome: 'Jan', valor: 'abc', status: 'Pago' }, // NaN => 0
        { id: 2, nome: 'Fev', valor: 500, status: 'Pago' }, // pago = 500
      ];

      expect(component.getValorRealizadoMeta(meta)).toBe(500);
    });
  });

  describe('getMesesRestantes', () => {
    it('should return -1 when valorMeta <= 0 or valorPorMes <= 0', () => {
      const meta1 = makeMeta({ valorMeta: 0, valorPorMes: 1000 }) as any;
      const meta2 = makeMeta({ valorMeta: 1000, valorPorMes: 0 }) as any;

      expect(component.getMesesRestantes(meta1)).toBe(-1);
      expect(component.getMesesRestantes(meta2)).toBe(-1);
    });

    it('should use [] fallback when meta.meses is null (covers ?? [])', () => {
      const meta = makeMeta({
        valorMeta: 1000,
        valorPorMes: 1000,
        valorAtual: 0,
      }) as any;
      meta.meses = null;

      // valorPago = 0, valorRestante = 1000 => mesesRestantes = 1
      expect(component.getMesesRestantes(meta)).toBe(1);
    });

    it('should use [] fallback when meta.meses is undefined (covers ?? [])', () => {
      const meta = makeMeta({
        valorMeta: 1000,
        valorPorMes: 1000,
        valorAtual: 0,
      }) as any;
      meta.meses = undefined;

      expect(component.getMesesRestantes(meta)).toBe(1);
    });

    it('should return 0 when valorRestante <= 0 (covers return 0 branch)', () => {
      const meta = makeMeta({
        valorMeta: 1000,
        valorPorMes: 1000,
        valorAtual: 1000,
      }) as any;
      meta.meses = []; // sem meses pagos, mas valorAtual já completa a meta

      // totalRealizado = 1000, valorRestante = 0 => return 0
      expect(component.getMesesRestantes(meta)).toBe(0);
    });

    it('should use 0 when mes.valor is NaN (Number(x.valor) || 0)', () => {
      const meta = makeMeta({
        valorMeta: 1000,
        valorPorMes: 1000,
        valorAtual: 0,
      }) as any;
      meta.meses = [
        { id: 1, nome: 'Jan', valor: 'abc', status: 'Pago' }, // NaN => 0
      ];

      // valorPago = 0, valorRestante = 1000 => mesesRestantes = 1
      expect(component.getMesesRestantes(meta)).toBe(1);
    });
  });

  describe('ElaborandoMetasComponent - recalcResumo', () => {
    function makeMeta(overrides: Partial<MetaExtended> = {}): MetaExtended {
      return {
        id: 1 as any,
        nome: 'Meta',
        valorMeta: 0,
        valorPorMes: 0,
        mesesNecessarios: 0,
        valorAtual: 0,
        icon: 'bi-bullseye',
        meses: [],
        // flags do seu MetaExtended (coloque o mínimo necessário)
        editandoNome: false,
        nomeTemp: '',
        savingNome: false,
        savedTick: false,
        editandoValorMeta: false,
        editandoValorPorMes: false,
        editandoValorAtual: false,
        valorMetaTemp: '',
        valorPorMesTemp: '',
        valorAtualTemp: '',
        savedTickCampo: false,
        dropdownOpen: undefined,
        ...overrides,
      };
    }

    it('should use 0 when Number(x) is NaN/undefined/null', () => {
      const metas: MetaExtended[] = [
        makeMeta({
          valorMeta: 'abc' as unknown as number, // NaN => 0
          valorPorMes: undefined as unknown as number, // => 0
          mesesNecessarios: null as unknown as number, // => 0
          valorAtual: '---' as unknown as number, // NaN => 0
          meses: [
            {
              id: 1,
              nome: 'Jan',
              valor: 'abc' as unknown as number,
              status: 'Pago' as const,
            },
            { id: 2, nome: 'Fev', valor: 100 as any, status: 'Vazio' as const },
          ] as any,
        }),
      ];

      component.metas = metas;
      (component as any).recalcResumo();

      expect(component.totalValorMetaView).toBe(0);
      expect(component.totalValorPorMesView).toBe(0);
      expect(component.totalMesesNecessariosView).toBe(0);
      expect(component.totalValorAtualView).toBe(0);

      // totalValorMetaView = 0 => percentual deve ser 0
      expect(component.percentualPagoView).toBe(0);
    });

    it('should handle null/undefined meses using (m.meses ?? [])', () => {
      component.metas = [
        makeMeta({ valorMeta: 1000, meses: null as any }),
        makeMeta({ valorMeta: 2000, meses: undefined as any }),
      ];

      expect(() => (component as any).recalcResumo()).not.toThrow();
      expect(component.percentualPagoView).toBe(0);
    });

    it('should keep percentualPagoView as 0 when totalValorMetaView is 0', () => {
      component.metas = [
        makeMeta({
          valorMeta: 0,
          meses: [
            { id: 1, nome: 'Jan', valor: 100, status: 'Pago' as const },
          ] as any,
        }),
      ];

      (component as any).recalcResumo();

      expect(component.totalValorMetaView).toBe(0);
      expect(component.percentualPagoView).toBe(0);
    });

    it('should calculate percentualPagoView correctly when there are paid months', () => {
      component.metas = [
        makeMeta({
          valorMeta: 1000,
          meses: [
            { id: 1, nome: 'Jan', valor: 200, status: 'Pago' as const },
            { id: 2, nome: 'Fev', valor: 100, status: 'Vazio' as const },
          ] as any,
        }),
      ];

      (component as any).recalcResumo();
      expect(component.percentualPagoView).toBe(20);
    });
  });

  describe('confirmarCampo', () => {
    describe('validação', () => {
      it('should handle invalid meta ID', () => {
        const meta = { ...[makeMeta()][0], id: 0 };
        const alertSpy = jest
          .spyOn(window, 'alert')
          .mockImplementation(() => {});

        component.confirmarCampo(meta, 'nome');

        expect(alertSpy).toHaveBeenCalledWith(
          'Erro: Meta sem ID válido. Recarregue a página e tente novamente.',
        );
        alertSpy.mockRestore();
      });
    });

    describe('campo nome', () => {
      it('should handle nome field update', () => {
        const meta = {
          ...[makeMeta()][0],
          editandoNome: true,
          nomeTemp: 'Novo Nome',
        };
        jest.spyOn(metasService, 'updateMeta').mockReturnValue({
          subscribe: (callbacks: any) => {
            if (callbacks.next) callbacks.next();
          },
        } as any);

        component.confirmarCampo(meta, 'nome');

        expect(metasService.updateMeta).toHaveBeenCalledWith(meta.id, {
          nome: 'Novo Nome',
        });
        expect(meta.nome).toBe('Novo Nome');
        expect(meta.editandoNome).toBe(false);
      });

      it('should cancel when no changes detected', () => {
        const meta = {
          ...[makeMeta()][0],
          editandoNome: true,
          nomeTemp: [makeMeta()][0].nome,
        };
        const cancelSpy = jest.spyOn(component, 'cancelarCampo');

        component.confirmarCampo(meta, 'nome');

        expect(cancelSpy).toHaveBeenCalledWith(meta, 'nome');
      });
    });

    describe('campo valorMeta', () => {
      it('should handle valorMeta field update', () => {
        const meta = {
          ...[makeMeta()][0],
          editandoValorMeta: true,
          valorMetaTemp: '15000',
        };
        jest.spyOn(metasService, 'updateMeta').mockReturnValue({
          subscribe: (callbacks: any) => {
            if (callbacks.next) callbacks.next();
          },
        } as any);

        component.confirmarCampo(meta, 'valorMeta');

        expect(metasService.updateMeta).toHaveBeenCalledWith(
          meta.id,
          expect.objectContaining({ valorMeta: 15000, meses: expect.any(Array) }),
        );
        expect(meta.valorMeta).toBe(15000);
        expect(meta.editandoValorMeta).toBe(false);
      });

      it('should handle numeric field with null/undefined values', () => {
        const meta = {
          ...[makeMeta()][0],
          editandoValorMeta: true,
          valorMetaTemp: '15000',
          valorMeta: null as any, // Test the || 0 fallback
        };
        jest.spyOn(metasService, 'updateMeta').mockReturnValue({
          subscribe: (callbacks: any) => {
            if (callbacks.next) callbacks.next();
          },
        } as any);

        component.confirmarCampo(meta, 'valorMeta');

        expect(metasService.updateMeta).toHaveBeenCalledWith(
          meta.id,
          expect.objectContaining({ valorMeta: 15000 }),
        );
      });

      it('should cancel when novo equals atual for numeric fields', () => {
        const meta = {
          ...[makeMeta()][0],
          editandoValorMeta: true,
          valorMetaTemp: '10000', // Same as current value
        };
        const cancelSpy = jest.spyOn(component, 'cancelarCampo');

        component.confirmarCampo(meta, 'valorMeta');

        expect(cancelSpy).toHaveBeenCalledWith(meta, 'valorMeta');
      });
    });

    describe('campo valorPorMes', () => {
      it('should handle valorPorMes field update with mesesNecessarios calculation', () => {
        const meta = {
          ...[makeMeta()][0],
          editandoValorPorMes: true,
          valorPorMesTemp: '2000',
        };
        jest.spyOn(metasService, 'updateMeta').mockReturnValue({
          subscribe: (callbacks: any) => {
            if (callbacks.next) callbacks.next();
          },
        } as any);

        component.confirmarCampo(meta, 'valorPorMes');

        expect(metasService.updateMeta).toHaveBeenCalledTimes(1);
        const payload = (metasService.updateMeta as jest.Mock).mock.calls[0][1];
        expect(payload.valorPorMes).toBe(2000);
        expect(payload.mesesNecessarios).toBe(5);
        expect(meta.valorPorMes).toBe(2000);
        expect(meta.editandoValorPorMes).toBe(false);
        // meta.meses.length > 0 => patch.meses com valor/status atualizados (novo > 0)
        expect(payload.meses).toBeDefined();
        expect(payload.meses.length).toBeGreaterThan(0);
        payload.meses
          .filter((mes: any) => mes.status !== 'Pago' && mes.status !== 'Finalizado')
          .forEach((mes: any) => {
            expect(mes.valor).toBe(2000);
          });
        expect(payload.meses.some((mes: any) => mes.valor === 2000)).toBe(true);
      });

      describe('erro updateMeta', () => {
        it('should handle error in updateMeta subscription', () => {
          const meta = {
            ...[makeMeta()][0],
            editandoNome: true,
            nomeTemp: 'Novo Nome',
          };
          const alertSpy = jest
            .spyOn(window, 'alert')
            .mockImplementation(() => {});
          jest.spyOn(metasService, 'updateMeta').mockReturnValue({
            subscribe: (callbacks: any) => {
              if (callbacks.error) callbacks.error(new Error('Test error'));
            },
          } as any);

          component.confirmarCampo(meta, 'nome');

          expect(alertSpy).toHaveBeenCalledWith(
            'Erro ao salvar. Tente novamente.',
          );
          alertSpy.mockRestore();
        });
      });

      it('should handle valorPorMes with zero value', () => {
        const meta = {
          ...[makeMeta()][0],
          editandoValorPorMes: true,
          valorPorMesTemp: '0',
        };
        jest.spyOn(metasService, 'updateMeta').mockReturnValue({
          subscribe: (callbacks: any) => {
            if (callbacks.next) callbacks.next();
          },
        } as any);

        component.confirmarCampo(meta, 'valorPorMes');

        expect(metasService.updateMeta).toHaveBeenCalledTimes(1);
        const payload = (metasService.updateMeta as jest.Mock).mock.calls[0][1];
        expect(payload.valorPorMes).toBe(0);
        expect(payload.mesesNecessarios).toBe(0);
        expect(payload.meses).toBeUndefined();
      });

      it('should regenerate patch.meses when meta.meses is empty (valorPorMes)', () => {
        const metaSemMeses = {
          ...[makeMeta()][0],
          meses: [] as any,
          editandoValorPorMes: true,
          valorPorMesTemp: '1500',
        };
        jest.spyOn(metasService, 'updateMeta').mockReturnValue({
          subscribe: (callbacks: any) => {
            if (callbacks.next) callbacks.next();
          },
        } as any);

        component.confirmarCampo(metaSemMeses, 'valorPorMes');

        const payload = (metasService.updateMeta as jest.Mock).mock.calls[0][1];
        expect(payload.valorPorMes).toBe(1500);
        expect(payload.meses).toBeDefined();
        expect(payload.meses.length).toBeGreaterThan(0);
      });

      it('should regenerate patch.meses when meta.meses is null (valorPorMes)', () => {
        const metaMesesNull = {
          ...[makeMeta()][0],
          meses: null as any,
          editandoValorPorMes: true,
          valorPorMesTemp: '800',
        };
        jest.spyOn(metasService, 'updateMeta').mockReturnValue({
          subscribe: (callbacks: any) => {
            if (callbacks.next) callbacks.next();
          },
        } as any);

        component.confirmarCampo(metaMesesNull, 'valorPorMes');

        const payload = (metasService.updateMeta as jest.Mock).mock.calls[0][1];
        expect(payload.valorPorMes).toBe(800);
        expect(payload.meses).toBeDefined();
        expect(payload.meses.length).toBeGreaterThan(0);
      });

      it('should handle numeric field update with null valorMeta in mesesNecessarios calculation', () => {
        const meta = {
          ...[makeMeta()][0],
          editandoValorPorMes: true,
          valorPorMesTemp: '2000',
          valorMeta: null as any, // Test the || 0 fallback in mesesNecessarios calculation
        };
        jest.spyOn(metasService, 'updateMeta').mockReturnValue({
          subscribe: (callbacks: any) => {
            if (callbacks.next) callbacks.next();
          },
        } as any);

        component.confirmarCampo(meta, 'valorPorMes');

        expect(metasService.updateMeta).toHaveBeenCalledTimes(1);
        const payload = (metasService.updateMeta as jest.Mock).mock.calls[0][1];
        expect(payload.valorPorMes).toBe(2000);
        expect(payload.mesesNecessarios).toBe(0);
      });
    });

    describe('callbacks de sucesso (setTimeout)', () => {
      it('should set savedTickCampo true then reset to false after 5000ms (numeric field path)', fakeAsync(() => {
        const meta = {
          ...[makeMeta()][0],
          editandoValorMeta: true,
          valorMetaTemp: '15000',
          savedTickCampo: false,
        };

        component.metas = [meta];

        jest.spyOn(metasService, 'updateMeta').mockReturnValue({
          subscribe: ({ next }: any) => next?.(),
        } as any);

        component.confirmarCampo(meta, 'valorMeta');

        expect(meta.savedTickCampo).toBe(true);

        tick(5000);

        const currentMeta = component.metas.find(
          (m) => String(m.id) === String(meta.id),
        );
        expect(currentMeta?.savedTickCampo).toBe(false);
      }));

      it('should NOT crash if currentMeta is not found when 5000ms timeout runs', fakeAsync(() => {
        const meta = {
          ...[makeMeta()][0],
          editandoValorMeta: true,
          valorMetaTemp: '15000',
        };

        component.metas = [];

        jest.spyOn(metasService, 'updateMeta').mockReturnValue({
          subscribe: ({ next }: any) => next?.(),
        } as any);

        component.confirmarCampo(meta, 'valorMeta');

        tick(5000);
      }));

      it('should emit metasAtualizadas and call reloadMetas after 200ms on numeric update success', fakeAsync(() => {
        const meta = {
          ...[makeMeta()][0],
          editandoNome: true,
          valorMetaTemp: '15000',
        };
        component.metas = [meta];
        jest.spyOn(metasService, 'updateMeta').mockReturnValue({
          subscribe: ({ next }: any) => next?.(),
        } as any);

        const emitSpy = jest.spyOn(component.metasAtualizadas, 'emit');
        const reloadSpy = jest
          .spyOn(component as any, 'reloadMetas')
          .mockImplementation(() => {});

        component.confirmarCampo(meta, 'valorMeta');

        tick(199);
        expect(emitSpy).not.toHaveBeenCalled();

        tick(1);
        expect(emitSpy).toHaveBeenCalledTimes(1);
        expect(reloadSpy).toHaveBeenCalledWith(meta.id, true);
      }));
    });

    describe('confirmarCampo', () => {
      it('should alert and return when meta id is invalid', () => {
        const alertSpy = jest
          .spyOn(window, 'alert')
          .mockImplementation(() => {});
        const meta = makeMeta({ id: 0 as any });

        component.confirmarCampo(meta, 'nome');

        expect(alertSpy).toHaveBeenCalledWith(
          'Erro: Meta sem ID válido. Recarregue a página e tente novamente.',
        );
      });

      it('should route to confirmarCampoNome when campo === nome and clear flag/temp', () => {
        const meta = makeMeta({ editandoNome: true, nomeTemp: 'Novo' });
        const spy = jest
          .spyOn(component as any, 'confirmarCampoNome')
          .mockImplementation(() => {});

        component.confirmarCampo(meta, 'nome');

        expect(spy).toHaveBeenCalledWith(meta, 'Novo');
        expect(meta.editandoNome).toBe(false);
        expect(meta.nomeTemp).toBeUndefined();
      });

      it('should route to confirmarCampoNumerico when campo !== nome and clear flag/temp', () => {
        const meta = makeMeta({ editandoValorMeta: true } as any);
        (meta as any).valorMetaTemp = '2000';

        const spy = jest
          .spyOn(component as any, 'confirmarCampoNumerico')
          .mockImplementation(() => {});

        component.confirmarCampo(meta, 'valorMeta');

        expect(spy).toHaveBeenCalledWith(meta, 'valorMeta', '2000');
        expect(meta.editandoValorMeta).toBe(false);
        expect((meta as any).valorMetaTemp).toBeUndefined();
      });
    });

    describe('confirmarCampoNome', () => {
      it('should cancelarCampo and return when novoNome is empty/whitespace', () => {
        const meta = makeMeta({ nome: 'Meta 1' });
        const cancelarSpy = jest
          .spyOn(component, 'cancelarCampo')
          .mockImplementation(() => {});
        jest.spyOn(metasService, 'updateMeta');

        (component as any).confirmarCampoNome(meta, '   ');

        expect(cancelarSpy).toHaveBeenCalledWith(meta, 'nome');
        expect(metasService.updateMeta).not.toHaveBeenCalled();
      });

      it('should cancelarCampo and return when novoNome equals meta.nome', () => {
        const meta = makeMeta({ nome: 'Meta 1' });
        const cancelarSpy = jest
          .spyOn(component, 'cancelarCampo')
          .mockImplementation(() => {});
        jest.spyOn(metasService, 'updateMeta');

        (component as any).confirmarCampoNome(meta, 'Meta 1');

        expect(cancelarSpy).toHaveBeenCalledWith(meta, 'nome');
        expect(metasService.updateMeta).not.toHaveBeenCalled();
      });

      it('should call updateMeta and onUpdateMetaSuccessNome on success', fakeAsync(() => {
        const meta = makeMeta({ nome: 'Meta 1' });
        const successSpy = jest.spyOn(
          component as any,
          'onUpdateMetaSuccessNome',
        );
        jest.spyOn(component as any, 'onUpdateMetaError');

        jest.spyOn(metasService, 'updateMeta').mockReturnValue(of({} as any));

        (component as any).confirmarCampoNome(meta, '  Novo Nome  ');

        expect(meta.nome).toBe('Novo Nome');
        expect(metasService.updateMeta).toHaveBeenCalledWith(meta.id, {
          nome: 'Novo Nome',
        });
        expect(successSpy).toHaveBeenCalledWith(meta);
        expect((component as any).onUpdateMetaError).not.toHaveBeenCalled();
        tick(0);
      }));

      it('should call onUpdateMetaError on error', () => {
        const meta = makeMeta();
        const errSpy = jest
          .spyOn(component as any, 'onUpdateMetaError')
          .mockImplementation(() => {});
        jest
          .spyOn(metasService, 'updateMeta')
          .mockReturnValue(throwError(() => ({ status: 500 })));

        (component as any).confirmarCampoNome(meta, 'Outro Nome');

        expect(errSpy).toHaveBeenCalledTimes(1);
      });

      it('should treat null or undefined tempVal as empty string and cancelar', () => {
        const meta = makeMeta({ nome: 'Meta 1' });

        const cancelarSpy = jest
          .spyOn(component, 'cancelarCampo')
          .mockImplementation(() => {});

        jest.spyOn(metasService, 'updateMeta');

        (component as any).confirmarCampoNome(meta, null);
        expect(cancelarSpy).toHaveBeenCalledWith(meta, 'nome');

        (component as any).confirmarCampoNome(meta, undefined);
        expect(cancelarSpy).toHaveBeenCalledWith(meta, 'nome');

        expect(metasService.updateMeta).not.toHaveBeenCalled();
      });
    });

    describe('onUpdateMetaSuccessNome', () => {
      it('should set savedTickCampo true, emit metasAtualizadas, and reset after 5000ms', fakeAsync(() => {
        const meta = makeMeta({ savedTickCampo: false });
        const emitSpy = jest.spyOn(component.metasAtualizadas, 'emit');

        (component as any).onUpdateMetaSuccessNome(meta);

        expect(meta.savedTickCampo).toBe(true);
        expect(emitSpy).toHaveBeenCalledTimes(1);

        tick(5000);
        expect(meta.savedTickCampo).toBe(false);
      }));
    });

    describe('confirmarCampoNumerico', () => {
      it('should cancelarCampo when novo === atual', () => {
        const meta = makeMeta({ valorMeta: 1000 });
        jest.spyOn(component, 'parseNumeroBR').mockReturnValue(1000);

        const cancelarSpy = jest
          .spyOn(component, 'cancelarCampo')
          .mockImplementation(() => {});
        jest.spyOn(metasService, 'updateMeta');

        (component as any).confirmarCampoNumerico(meta, 'valorMeta', '1000');

        expect(cancelarSpy).toHaveBeenCalledWith(meta, 'valorMeta');
        expect(metasService.updateMeta).not.toHaveBeenCalled();
      });

      it('should update numeric field, call updateMeta with patch (valorMeta)', () => {
        const meta = makeMeta({ valorMeta: 1000 });
        jest.spyOn(component, 'parseNumeroBR').mockReturnValue(1500);

        const successSpy = jest.spyOn(
          component as any,
          'onUpdateMetaSuccessNumerico',
        );
        jest.spyOn(component as any, 'onUpdateMetaError');

        jest.spyOn(metasService, 'updateMeta').mockReturnValue(of({} as any));

        (component as any).confirmarCampoNumerico(meta, 'valorMeta', '1500');

        expect(meta.valorMeta).toBe(1500);
        expect(metasService.updateMeta).toHaveBeenCalledTimes(1);
        const payload = (metasService.updateMeta as jest.Mock).mock.calls[0][1];
        expect(payload).toEqual(
          expect.objectContaining({
            valorMeta: 1500,
            meses: expect.any(Array),
          }),
        );
        expect(successSpy).toHaveBeenCalledWith(meta, 'valorMeta', 1500);
      });

      it('should build patch for valorPorMes including mesesNecessarios and meses (novo > 0)', () => {
        const meta = makeMeta({ valorMeta: 1000, valorPorMes: 100 });
        jest.spyOn(component, 'parseNumeroBR').mockReturnValue(200);

        jest.spyOn(metasService, 'updateMeta').mockReturnValue(of({} as any));
        const successSpy = jest.spyOn(
          component as any,
          'onUpdateMetaSuccessNumerico',
        );

        (component as any).confirmarCampoNumerico(meta, 'valorPorMes', '200');

        const payload = (metasService.updateMeta as jest.Mock).mock
          .calls[0][1] as any;
        expect(payload.valorPorMes).toBe(200);
        expect(payload.mesesNecessarios).toBe(5); // ceil(1000/200)
        expect(payload.meses).toBeDefined();
        payload.meses
          .filter((mes: any) => mes.status !== 'Pago' && mes.status !== 'Finalizado')
          .forEach((mes: any) => {
            expect(mes.valor).toBe(200);
          });
        expect(payload.meses.some((mes: any) => mes.valor === 200)).toBe(true);

        expect(successSpy).toHaveBeenCalledWith(meta, 'valorPorMes', 200);
      });

      it('should build patch for valorPorMes with meses empty -> regenera meses', () => {
        const meta = makeMeta({
          meses: [] as any,
          valorMeta: 1000,
          valorPorMes: 100,
        });
        jest.spyOn(component, 'parseNumeroBR').mockReturnValue(200);

        jest.spyOn(metasService, 'updateMeta').mockReturnValue(of({} as any));

        (component as any).confirmarCampoNumerico(meta, 'valorPorMes', '200');

        const payload = (metasService.updateMeta as jest.Mock).mock
          .calls[0][1] as any;
        expect(payload.valorPorMes).toBe(200);
        expect(payload.mesesNecessarios).toBe(5);
        expect(payload.meses).toBeDefined();
        expect(payload.meses.length).toBe(5);
      });

      it('should call onUpdateMetaError on numeric update error', () => {
        const meta = makeMeta({ valorMeta: 1000 });
        jest.spyOn(component, 'parseNumeroBR').mockReturnValue(1500);

        const errSpy = jest
          .spyOn(component as any, 'onUpdateMetaError')
          .mockImplementation(() => {});
        jest
          .spyOn(metasService, 'updateMeta')
          .mockReturnValue(throwError(() => ({ status: 500 })));

        (component as any).confirmarCampoNumerico(meta, 'valorMeta', '1500');

        expect(errSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('onUpdateMetaSuccessNumerico', () => {
      it('should update meses when campo=valorPorMes, call recalcResumo, emit+reload after 200ms, and reset savedTickCampo after 5000ms (currentMeta found)', fakeAsync(() => {
        const meta = makeMeta({
          id: 1,
          valorPorMes: 200,
          meses: [
            { id: 1, nome: 'Janeiro/2026', valor: 100, status: 'Programado' as const },
            { id: 2, nome: 'Fevereiro/2026', valor: 100, status: 'Programado' as const },
          ],
        });
        component.metas = [meta];

        const recalcSpy = jest
          .spyOn(component as any, 'recalcResumo')
          .mockImplementation(() => {});
        const reloadSpy = jest
          .spyOn(component as any, 'reloadMetas')
          .mockImplementation(() => {});
        const emitSpy = jest.spyOn(component.metasAtualizadas, 'emit');

        (component as any).onUpdateMetaSuccessNumerico(
          meta,
          'valorPorMes',
          200,
        );

        meta.meses!.forEach((mes) => {
          if (mes.status === 'Pago' || mes.status === 'Finalizado') {
            return;
          }
          expect(mes.valor).toBe(200);
          expect(mes.status).toBe('Programado');
        });

        expect(meta.savedTickCampo).toBe(true);
        expect(recalcSpy).toHaveBeenCalledTimes(1);

        // callback 200ms
        tick(200);
        expect(emitSpy).toHaveBeenCalledTimes(1);
        expect(reloadSpy).toHaveBeenCalledWith(meta.id, true);

        // callback 5000ms (find acha o meta)
        tick(5000);
        expect(meta.savedTickCampo).toBe(false);
      }));

      it('should not crash when currentMeta is not found in 5000ms timeout branch', fakeAsync(() => {
        const meta = makeMeta({ id: 99 });
        component.metas = []; // garante que find não acha

        const reloadSpy = jest
          .spyOn(component as any, 'reloadMetas')
          .mockImplementation(() => {});
        jest
          .spyOn(component as any, 'recalcResumo')
          .mockImplementation(() => {});
        const emitSpy = jest.spyOn(component.metasAtualizadas, 'emit');

        (component as any).onUpdateMetaSuccessNumerico(meta, 'valorMeta', 123);

        tick(200);
        expect(emitSpy).toHaveBeenCalledTimes(1);
        expect(reloadSpy).toHaveBeenCalledWith(99, true);

        tick(5000);
        // sem assert de savedTickCampo porque meta não está em component.metas
      }));

      it('should not alterar meses quando novo <= 0 (campo=valorPorMes)', fakeAsync(() => {
        const meta = makeMeta({ id: 1 });
        const mesesAntes = JSON.parse(JSON.stringify(meta.meses));
        component.metas = [meta];

        jest
          .spyOn(component as any, 'recalcResumo')
          .mockImplementation(() => {});
        jest
          .spyOn(component as any, 'reloadMetas')
          .mockImplementation(() => {});
        jest.spyOn(component.metasAtualizadas, 'emit');

        (component as any).onUpdateMetaSuccessNumerico(meta, 'valorPorMes', 0);

        expect(meta.meses).toEqual(mesesAntes);

        tick(200);
        tick(5000);
      }));
    });

    describe('onUpdateMetaError', () => {
      it('should alert error message', () => {
        const alertSpy = jest
          .spyOn(window, 'alert')
          .mockImplementation(() => {});
        (component as any).onUpdateMetaError();
        expect(alertSpy).toHaveBeenCalledWith(
          'Erro ao salvar. Tente novamente.',
        );
      });
    });
  });

  // Testes para métodos de eventos
  describe('event methods', () => {
    it('should handle confirmarCampoComValor', () => {
      const meta = [makeMeta()][0];
      const event = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as any;
      const confirmSpy = jest.spyOn(component, 'confirmarCampo');

      component.confirmarCampoComValor(meta, 'nome', event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.camposProcessados.has(`${meta.id}-nome`)).toBe(true);
      expect(confirmSpy).toHaveBeenCalledWith(meta, 'nome');
    });

    it('should handle confirmarCampoBlur', () => {
      const meta = [makeMeta()][0];
      const confirmSpy = jest.spyOn(component, 'confirmarCampo');

      component.confirmarCampoBlur(meta, 'nome');

      expect(confirmSpy).toHaveBeenCalledWith(meta, 'nome');
    });

    it('should handle confirmarCampoBlur with processed field', () => {
      const meta = [makeMeta()][0];
      const chave = `${meta.id}-nome`;
      component.camposProcessados.add(chave);
      const confirmSpy = jest.spyOn(component, 'confirmarCampo');

      component.confirmarCampoBlur(meta, 'nome');

      expect(component.camposProcessados.has(chave)).toBe(false);
      expect(confirmSpy).not.toHaveBeenCalled();
    });
  });

  describe('confirmarCampoNome edge cases', () => {
    it('should cancelarCampo when tempVal is undefined (uses fallback "")', () => {
      const meta = makeMeta({ nome: 'Meta 1' });
      const cancelarSpy = jest
        .spyOn(component, 'cancelarCampo')
        .mockImplementation(() => {});

      (component as any).confirmarCampoNome(meta, undefined);

      expect(cancelarSpy).toHaveBeenCalledWith(meta, 'nome');
    });
  });

  // Testes para métodos de exclusão
  describe('deletion methods', () => {
    it('should set metaParaExcluir when removerMeta is called', () => {
      const mockMeta = [makeMeta()][0];

      component.removerMeta(mockMeta.id);

      expect(component.metaParaExcluir).toEqual(mockMeta);
    });

    it('should not open delete modal when meta is concluded', () => {
      const meta = makeMeta({
        valorMeta: 1000,
        valorPorMes: 100,
        valorAtual: 1000,
        meses: [{ id: 1, nome: 'Jan', valor: 0, status: 'Pago' as const }],
      }) as any;
      component.metas = [meta];
      const openSpy = jest.spyOn(metasService, 'openConfirmarDelete');

      component.removerMeta(meta.id);

      expect(openSpy).not.toHaveBeenCalled();
      expect(component.metaParaExcluir).toBeNull();
    });

    it('should call openConfirmarDelete with meta.id and meta.nome (or empty string)', () => {
      const openSpy = jest.spyOn(metasService, 'openConfirmarDelete');
      component.removerMeta([makeMeta()][0].id);

      expect(openSpy).toHaveBeenCalledWith(
        [makeMeta()][0].id,
        [makeMeta()][0].nome || '',
      );
    });

    it('should call openConfirmarDelete with empty string when meta.nome is falsy', () => {
      const metaSemNome = { ...[makeMeta()][0], nome: '', id: 99 };
      component.metas = [metaSemNome];
      const openSpy = jest.spyOn(metasService, 'openConfirmarDelete');

      component.removerMeta(99);

      expect(openSpy).toHaveBeenCalledWith(99, '');
    });

    it('should handle meta not found in removerMeta', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      component.removerMeta(999);

      expect(alertSpy).toHaveBeenCalledWith('Meta não encontrada.');
      alertSpy.mockRestore();
    });

    it('should alert and return when meta not found in processarExclusao', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      jest.spyOn(metasService, 'deleteMeta');

      component.processarExclusao(999);

      expect(alertSpy).toHaveBeenCalledWith('Meta não encontrada.');
      expect(metasService.deleteMeta).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should call deleteMeta and showSucessoDelete when processarExclusao is called with valid meta', () => {
      const mockMeta = { ...[makeMeta()][0], nome: 'Meta válida' };
      component.metas = [mockMeta];
      jest.spyOn(metasService, 'deleteMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
        },
      } as any);
      const showSucessoSpy = jest.spyOn(metasService, 'showSucessoDelete');

      component.processarExclusao(mockMeta.id);

      expect(metasService.deleteMeta).toHaveBeenCalledWith(mockMeta.id);
      expect(showSucessoSpy).toHaveBeenCalled();
    });

    it('should handle empty name meta in processarExclusao (no API call)', () => {
      const mockMeta = { ...[makeMeta()][0], nome: '' };
      component.metas = [mockMeta];
      const emitSpy = jest.spyOn(component.metasAtualizadas, 'emit');
      const showSucessoSpy = jest.spyOn(metasService, 'showSucessoDelete');
      jest.spyOn(metasService, 'deleteMeta');

      component.processarExclusao(mockMeta.id);

      expect(component.metas.some((m) => m.id === mockMeta.id)).toBe(false);
      expect(emitSpy).toHaveBeenCalled();
      expect(showSucessoSpy).toHaveBeenCalled();
      expect(metasService.deleteMeta).not.toHaveBeenCalled();
    });

    it('should handle draft meta in processarExclusao (no API call)', () => {
      const mockMeta = { ...[makeMeta()][0], _draft: true };
      component.metas = [mockMeta];
      const emitSpy = jest.spyOn(component.metasAtualizadas, 'emit');
      const showSucessoSpy = jest.spyOn(metasService, 'showSucessoDelete');
      jest.spyOn(metasService, 'deleteMeta');

      component.processarExclusao(mockMeta.id);

      expect(component.metas).not.toContain(mockMeta);
      expect(emitSpy).toHaveBeenCalled();
      expect(showSucessoSpy).toHaveBeenCalled();
      expect(metasService.deleteMeta).not.toHaveBeenCalled();
    });

    it('should handle 404 error in processarExclusao (remove from list and show success)', () => {
      const mockMeta = { ...[makeMeta()][0], nome: 'Meta válida' };
      component.metas = [mockMeta];
      jest.spyOn(metasService, 'deleteMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.error) {
            const error = new Error('Not Found');
            (error as any).status = 404;
            callbacks.error(error);
          }
        },
      } as any);
      const emitSpy = jest.spyOn(component.metasAtualizadas, 'emit');
      const showSucessoSpy = jest.spyOn(metasService, 'showSucessoDelete');

      component.processarExclusao(mockMeta.id);

      expect(component.metas.some((m) => m.id === mockMeta.id)).toBe(false);
      expect(emitSpy).toHaveBeenCalled();
      expect(showSucessoSpy).toHaveBeenCalled();
    });

    it('should handle non-404 error in processarExclusao (alert)', () => {
      const mockMeta = { ...[makeMeta()][0], nome: 'Meta válida' };
      component.metas = [mockMeta];
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      jest.spyOn(metasService, 'deleteMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.error) {
            const error = new Error('Server Error');
            (error as any).status = 500;
            callbacks.error(error);
          }
        },
      } as any);

      component.processarExclusao(mockMeta.id);

      expect(alertSpy).toHaveBeenCalledWith(
        'Não foi possível excluir. Tente novamente.',
      );
      alertSpy.mockRestore();
    });
  });

  // Testes para métodos de validação
  describe('validation methods', () => {
    it('should validate numeric input', () => {
      const event = {
        key: '1',
        code: 'Digit1',
        preventDefault: jest.fn(),
      } as any;

      component.validarApenasNumeros(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-numeric input', () => {
      const event = {
        key: 'a',
        code: 'KeyA',
        preventDefault: jest.fn(),
      } as any;

      component.validarApenasNumeros(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow special keys', () => {
      const specialKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape'];

      specialKeys.forEach((key) => {
        const event = { key, code: key, preventDefault: jest.fn() } as any;
        component.validarApenasNumeros(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should allow numeric keypad keys', () => {
      const numpadKeys = [
        'Numpad0',
        'Numpad1',
        'Numpad2',
        'Numpad3',
        'Numpad4',
        'Numpad5',
        'Numpad6',
        'Numpad7',
        'Numpad8',
        'Numpad9',
      ];

      numpadKeys.forEach((key) => {
        const event = {
          key: key.replace('Numpad', ''),
          code: key,
          preventDefault: jest.fn(),
        } as any;
        component.validarApenasNumeros(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should allow NumpadComma and NumpadPeriod', () => {
      const evComma = {
        key: ',',
        code: 'NumpadComma',
        preventDefault: jest.fn(),
      } as any;
      component.validarApenasNumeros(evComma);
      expect(evComma.preventDefault).not.toHaveBeenCalled();

      const evPeriod = {
        key: '.',
        code: 'NumpadPeriod',
        preventDefault: jest.fn(),
      } as any;
      component.validarApenasNumeros(evPeriod);
      expect(evPeriod.preventDefault).not.toHaveBeenCalled();
    });
  });

  // Testes para métodos de evento de teclado
  describe('keyboard event methods', () => {
    it('should handle Enter key', () => {
      const meta = [makeMeta()][0];
      const event = {
        key: 'Enter',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as any;
      const confirmSpy = jest.spyOn(component, 'confirmarCampo');

      component.onKeyUp(event, meta, 'nome');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(confirmSpy).toHaveBeenCalledWith(meta, 'nome');
    });

    it('should handle Escape key', () => {
      const meta = [makeMeta()][0];
      const event = {
        key: 'Escape',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as any;
      const cancelSpy = jest.spyOn(component, 'cancelarCampo');

      component.onKeyUp(event, meta, 'nome');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(cancelSpy).toHaveBeenCalledWith(meta, 'nome');
    });

    it('should do nothing for other keys', () => {
      const meta = makeMeta();
      const event = {
        key: 'a',
        code: 'KeyA',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as any;

      const confirmSpy = jest.spyOn(component, 'confirmarCampo');
      const cancelSpy = jest.spyOn(component, 'cancelarCampo');

      component.onKeyUp(event, meta, 'nome');

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(cancelSpy).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });


  // Testes para métodos de cancelamento
  describe('cancel methods', () => {
    it('should cancel field edit via cancelarCampo (clear flags and temp)', () => {
      const meta = { ...[makeMeta()][0], editandoNome: true, nomeTemp: 'Temp' };
      component.cancelarCampo(meta, 'nome');
      expect(meta.editandoNome).toBe(false);
      expect(meta.nomeTemp).toBeUndefined();
    });

    it('should cancel valorMeta edit via cancelarCampo', () => {
      const meta = {
        ...[makeMeta()][0],
        editandoValorMeta: true,
        valorMetaTemp: '999',
      };
      component.cancelarCampo(meta, 'valorMeta');
      expect(meta.editandoValorMeta).toBe(false);
      expect(meta.valorMetaTemp).toBeUndefined();
    });
  });

  // Testes para métodos de filtro
  describe('filter methods', () => {
    it('should filter metas in elaboration', () => {
      const metas = [
        { ...[makeMeta()][0], mesesNecessarios: 0 }, // Meta finalizada
        { ...[makeMeta()][1], mesesNecessarios: 5 }, // Meta em elaboração
      ];
      component.metas = metas;

      // Simular filtro de metas em elaboração
      const result = component.metas.filter(
        (meta) => meta.mesesNecessarios > 0,
      );

      expect(result.length).toBe(1);
      expect(result[0].mesesNecessarios).toBe(5);
    });
  });

  // Testes para métodos de evento
  describe('event emission', () => {
    it('should emit editar event when editar is called', () => {
      const spy = jest.spyOn(component.editar, 'emit');
      const mockMeta = [makeMeta()][0];

      component.editar.emit({
        meta: mockMeta,
        campo: 'nome',
      });

      expect(spy).toHaveBeenCalledWith({
        meta: mockMeta,
        campo: 'nome',
      });
    });

    it('should emit cancelar event when cancelar is called', () => {
      const spy = jest.spyOn(component.cancelar, 'emit');
      const mockMeta = [makeMeta()][0];

      component.cancelar.emit({
        meta: mockMeta,
        campo: 'nome',
      });

      expect(spy).toHaveBeenCalledWith({
        meta: mockMeta,
        campo: 'nome',
      });
    });

    it('should emit confirmar event when confirmar is called', () => {
      const spy = jest.spyOn(component.confirmar, 'emit');
      const mockMeta = [makeMeta()][0];

      component.confirmar.emit({
        meta: mockMeta,
        campo: 'nome',
      });

      expect(spy).toHaveBeenCalledWith({
        meta: mockMeta,
        campo: 'nome',
      });
    });

    it('should emit remover event when remover is called', () => {
      const spy = jest.spyOn(component.remover, 'emit');

      component.remover.emit(1);

      expect(spy).toHaveBeenCalledWith(1);
    });

    it('should emit metasAtualizadas event when metasAtualizadas is called', () => {
      const spy = jest.spyOn(component.metasAtualizadas, 'emit');

      component.metasAtualizadas.emit();

      expect(spy).toHaveBeenCalled();
    });
  });

  // Testes para métodos de reload
  describe('reload methods', () => {
    it('should handle reloadMetas basic functionality', () => {
      const validMetas = [
        {
          id: 1,
          nome: 'Meta válida 1',
          valorMeta: 1000,
          valorPorMes: 100,
          valorAtual: 0,
          mesesNecessarios: 10,
          meses: [],
        },
        {
          id: 2,
          nome: 'Meta válida 2',
          valorMeta: 2000,
          valorPorMes: 200,
          valorAtual: 100,
          mesesNecessarios: 10,
          meses: [],
        },
      ];
      const getMetasSpy = jest.spyOn(metasService, 'getMetas').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next(validMetas);
        },
      } as any);

      (component as any).reloadMetas();

      expect(getMetasSpy).toHaveBeenCalled();
      expect(component.metas.length).toBe(1);
    });

    it('should reloadMetas filtering invalid metas and preserving savedTickCampo when requested', () => {
      const serverMetas: any[] = [
        {
          id: 0,
          nome: 'X',
          valorMeta: 1,
          valorPorMes: 1,
          valorAtual: 0,
          mesesNecessarios: 1,
        }, // inválida (id 0)
        {
          id: '   ',
          nome: 'Y',
          valorMeta: 1,
          valorPorMes: 1,
          valorAtual: 0,
          mesesNecessarios: 1,
        }, // inválida (id vazio)
        {
          id: 10,
          nome: 'undefined',
          valorMeta: 1,
          valorPorMes: 1,
          valorAtual: 0,
          mesesNecessarios: 1,
        }, // inválida (nome 'undefined')
        {
          id: 11,
          nome: 'Ok',
          valorMeta: '1000',
          valorPorMes: '100',
          valorAtual: '0',
          mesesNecessarios: '10',
          icon: '',
        }, // válida
      ];

      jest.spyOn(metasService, 'getMetas').mockReturnValue({
        subscribe: (cb: any) => cb(serverMetas),
      } as any);

      const recalcSpy = jest.spyOn(component as any, 'recalcResumo');

      // chama private
      (component as any).reloadMetas(11, true);

      expect(component.metas.length).toBe(1);
      expect(component.metas[0].id).toBe(11);
      expect(component.metas[0].savedTickCampo).toBe(true);
      expect(component.metas[0].icon).toBe('bi-bullseye'); // default quando icon falsy
      expect(recalcSpy).toHaveBeenCalled();
    });
  });

  it('should render component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();
  });
});
