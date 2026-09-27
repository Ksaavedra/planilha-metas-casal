import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { EvolucaoMetasComponent } from './evolucao-metas.component';
import { MetaExtended } from '../../../../../core/interfaces/metas/mes-meta';

describe('EvolucaoMetasComponent', () => {
  let component: EvolucaoMetasComponent;
  let fixture: ComponentFixture<EvolucaoMetasComponent>;

  const norm = (s: string | null | undefined) =>
    (s ?? '').replace(/\u00A0/g, ' ');

  const criarMeta = (id: number, nome = `Meta ${id}`): MetaExtended =>
    ({
      id,
      nome,
      valorMeta: 10000,
      valorAtual: 5000,
      valorPorMes: 1000,
      mesesNecessarios: 10,
      meses: [],
    }) as MetaExtended;

  const mockMetas: MetaExtended[] = [criarMeta(1), criarMeta(2)];

  beforeAll(() => {
    registerLocaleData(localePt);
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvolucaoMetasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EvolucaoMetasComponent);
    component = fixture.componentInstance;
    component.metas = mockMetas;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('metasValidas', () => {
    it('filtra nome vazio, valor inválido e draft', () => {
      component.metas = [
        criarMeta(1, 'Meta válida'),
        { ...criarMeta(2), nome: '' },
        { ...criarMeta(3), valorMeta: 0 },
        { ...criarMeta(4), _draft: true },
      ] as MetaExtended[];

      expect(component.metasValidas.length).toBe(1);
      expect(component.metasValidas[0].id).toBe(1);
    });
  });

  describe('getProgressoRealMeta', () => {
    it('calcula progresso corretamente', () => {
      const meta = {
        ...criarMeta(1),
        valorMeta: 10000,
        valorAtual: 5000,
        meses: [],
      } as MetaExtended;

      expect(component.getProgressoRealMeta(meta)).toBe(50);
    });

    it('limita em 100%', () => {
      const meta = {
        ...criarMeta(1),
        valorMeta: 10000,
        meses: [{ status: 'Pago', valor: 12000 }] as any,
      } as MetaExtended;

      expect(component.getProgressoRealMeta(meta)).toBe(100);
    });
  });

  describe('getValorRealizadoMeta / getValorFaltanteMeta', () => {
    it('soma valorAtual com meses pagos', () => {
      const meta = {
        ...criarMeta(1),
        valorAtual: 100,
        meses: [{ status: 'Pago', valor: 400 }] as any,
      } as MetaExtended;

      expect(component.getValorRealizadoMeta(meta)).toBe(500);
    });

    it('retorna valor faltante', () => {
      const meta = {
        ...criarMeta(1),
        valorMeta: 1000,
        valorAtual: 300,
        meses: [],
      } as MetaExtended;

      expect(component.getValorFaltanteMeta(meta)).toBe(700);
    });
  });

  describe('formatarMoeda', () => {
    it('formata em pt-BR', () => {
      expect(norm(component.formatarMoeda(1000))).toContain('R$ 1.000');
    });
  });

  describe('getMetaIcon', () => {
    it('retorna ícone salvo quando existir', () => {
      const meta = { ...criarMeta(1), icon: 'bi-car-front' } as MetaExtended;
      expect(component.getMetaIcon(meta)).toBe('bi-car-front');
    });
  });

  describe('getGradientColor', () => {
    it('retorna gradiente conforme índice', () => {
      expect(component.getGradientColor(0)).toContain('linear-gradient');
      expect(component.getGradientColor(8)).toBe(component.getGradientColor(0));
    });
  });

  describe('onWheel', () => {
    it('rola horizontalmente quando há overflow', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 1000, configurable: true });
      Object.defineProperty(el, 'clientWidth', { value: 400, configurable: true });
      let scrollLeft = 0;
      Object.defineProperty(el, 'scrollLeft', {
        get: () => scrollLeft,
        set: (v: number) => {
          scrollLeft = v;
        },
        configurable: true,
      });

      const preventDefault = jest.fn();
      const event = {
        currentTarget: el,
        deltaX: 0,
        deltaY: 120,
        preventDefault,
      } as unknown as WheelEvent;

      component.onWheel(event);

      expect(scrollLeft).toBe(120);
      expect(preventDefault).toHaveBeenCalled();
    });

    it('não interfere quando todo conteúdo cabe na área', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 400, configurable: true });
      Object.defineProperty(el, 'clientWidth', { value: 400, configurable: true });

      const preventDefault = jest.fn();
      const event = {
        currentTarget: el,
        deltaX: 0,
        deltaY: 120,
        preventDefault,
      } as unknown as WheelEvent;

      component.onWheel(event);

      expect(preventDefault).not.toHaveBeenCalled();
    });

    it('respeita rolagem horizontal nativa do trackpad', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 1000, configurable: true });
      Object.defineProperty(el, 'clientWidth', { value: 400, configurable: true });

      const preventDefault = jest.fn();
      const event = {
        currentTarget: el,
        deltaX: 50,
        deltaY: 10,
        preventDefault,
      } as unknown as WheelEvent;

      component.onWheel(event);

      expect(preventDefault).not.toHaveBeenCalled();
    });
  });
});
