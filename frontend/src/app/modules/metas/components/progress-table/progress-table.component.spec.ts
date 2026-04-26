import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ProgressTableComponent } from './progress-table.component';
import { MetaExtended } from '../../../../core/interfaces/metas/mes-meta';

describe('ProgressTableComponent', () => {
  let component: ProgressTableComponent;
  let fixture: ComponentFixture<ProgressTableComponent>;

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
    jest.useFakeTimers();

    await TestBed.configureTestingModule({
      declarations: [ProgressTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressTableComponent);
    component = fixture.componentInstance;
    component.metas = mockMetas;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve ter valores iniciais', () => {
    expect(component.metas).toEqual(mockMetas);
    expect(component.currentIndex).toBe(0);
  });

  describe('metasValidas', () => {
    it('metasValidas deve filtrar nome vazio, valor inválido e draft', () => {
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
    it('getProgressoRealMeta deve calcular progresso corretamente', () => {
      const meta = {
        ...criarMeta(1),
        valorMeta: 10000,
        valorAtual: 5000,
        meses: [],
      } as MetaExtended;

      expect(component.getProgressoRealMeta(meta)).toBe(50);
    });

    it('getProgressoRealMeta deve limitar em 100%', () => {
      const meta = {
        ...criarMeta(1),
        valorMeta: 10000,
        valorAtual: 6000,
        meses: [{ status: 'Pago', valor: 6000 }] as any,
      } as MetaExtended;

      expect(component.getProgressoRealMeta(meta)).toBe(100);
    });

    it('deve tratar valorAtual undefined como 0', () => {
      const meta = {
        ...criarMeta(1),
        valorMeta: 1000,
        valorAtual: undefined,
        meses: [],
      } as any;

      const result = component.getProgressoRealMeta(meta);

      expect(result).toBe(0);
    });

    it('deve ignorar meses com status diferente de Pago', () => {
      const meta = {
        ...criarMeta(1),
        valorMeta: 1000,
        valorAtual: 100,
        meses: [
          { status: 'Programado', valor: 500 },
          { status: 'Vazio', valor: 500 },
        ],
      } as any;

      const result = component.getProgressoRealMeta(meta);

      expect(result).toBe(10); // 100 / 1000 * 100
    });

    it('deve tratar valor do mês Pago undefined como 0', () => {
      const meta = {
        ...criarMeta(1),
        valorMeta: 1000,
        valorAtual: 100,
        meses: [
          { status: 'Pago', valor: undefined },
          { status: 'Pago', valor: 200 },
        ],
      } as any;

      const result = component.getProgressoRealMeta(meta);

      expect(result).toBe(30); // (100 + 0 + 200) / 1000 * 100
    });
  });

  describe('getValorRealizadoMeta', () => {
    it('getValorRealizadoMeta deve somar valorAtual com meses pagos', () => {
      const meta = {
        ...criarMeta(1),
        valorAtual: 100,
        meses: [
          { status: 'Pago', valor: 200 },
          { status: 'Programado', valor: 300 },
          { status: 'Pago', valor: undefined },
        ] as any,
      } as MetaExtended;

      expect(component.getValorRealizadoMeta(meta)).toBe(300);
    });

    it('getValorRealizadoMeta deve tratar valorAtual undefined como 0', () => {
      const meta = {
        ...criarMeta(1),
        valorAtual: undefined as any,
        meses: [{ status: 'Pago', valor: 150 }] as any,
      } as MetaExtended;

      expect(component.getValorRealizadoMeta(meta)).toBe(150);
    });
  });

  describe('getValorFaltanteMeta', () => {
    it('getValorFaltanteMeta deve calcular valor faltante', () => {
      const meta = {
        ...criarMeta(1),
        valorMeta: 10000,
        valorAtual: 5000,
        meses: [],
      } as MetaExtended;

      expect(component.getValorFaltanteMeta(meta)).toBe(5000);
    });

    it('getValorFaltanteMeta não deve retornar valor negativo', () => {
      const meta = {
        ...criarMeta(1),
        valorMeta: 1000,
        valorAtual: 2000,
        meses: [],
      } as MetaExtended;

      expect(component.getValorFaltanteMeta(meta)).toBe(0);
    });
  });

  describe('formatarMoeda', () => {
    it('formatarMoeda deve formatar em pt-BR', () => {
      expect(norm(component.formatarMoeda(1000))).toContain('R$ 1.000');
    });
  });

  describe('getMetaIcon', () => {
    it('getMetaIcon deve retornar ícone salvo quando existir', () => {
      const meta = { ...criarMeta(1), icon: 'bi-car-front' } as MetaExtended;

      expect(component.getMetaIcon(meta)).toBe('bi-car-front');
    });

    it('getMetaIcon deve retornar ícone padrão quando não encontrar pelo nome', () => {
      const meta = {
        ...criarMeta(1),
        nome: 'Nome aleatório xyz',
      } as MetaExtended;

      expect(component.getMetaIcon(meta)).toBeTruthy();
    });

    it('getMetaIcon deve retornar ícone quando encontrar pelo nome', () => {
      const meta = {
        ...criarMeta(1),
        nome: 'carro', // precisa bater com algum label da constante
        icon: '',
      } as MetaExtended;

      const result = component.getMetaIcon(meta);

      expect(result).toBeTruthy();
    });
  });

  describe('getGradientColor', () => {
    it('getGradientColor deve retornar gradiente conforme índice', () => {
      expect(component.getGradientColor(0)).toContain('linear-gradient');
      expect(component.getGradientColor(8)).toBe(component.getGradientColor(0));
    });
  });

  describe('ngOnInit', () => {
    it('deve iniciar carrossel quando tiver entre 7 e 15 metas válidas', () => {
      const startSpy = jest.spyOn(component, 'startCarousel');

      component.metas = Array.from({ length: 7 }, (_, i) => criarMeta(i + 1));

      component.ngOnInit();

      expect(component.currentIndex).toBe(0);
      expect(startSpy).toHaveBeenCalled();
    });

    it('não deve iniciar carrossel quando metas válidas < 7', () => {
      const startSpy = jest.spyOn(component, 'startCarousel');

      component.metas = Array.from({ length: 6 }, (_, i) => criarMeta(i + 1));

      component.ngOnInit();

      expect(startSpy).not.toHaveBeenCalled();
    });

    it('não deve iniciar carrossel quando metas válidas > 15', () => {
      const startSpy = jest.spyOn(component, 'startCarousel');

      component.metas = Array.from({ length: 16 }, (_, i) => criarMeta(i + 1));

      component.ngOnInit();

      expect(startSpy).not.toHaveBeenCalled();
    });

    it('deve resetar currentIndex quando hasCarousel for true', () => {
      component.metas = Array.from({ length: 8 }, (_, i) => criarMeta(i + 1));
      component.currentIndex = 5;

      component.ngOnInit();

      expect(component.currentIndex).toBe(0);
    });
  });

  describe('ngAfterViewInit', () => {
    it('deve chamar recalcLayout no setTimeout', () => {
      const recalcSpy = jest.spyOn(component as any, 'recalcLayout');

      component.ngAfterViewInit();
      jest.runOnlyPendingTimers();

      expect(recalcSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('ngOnChanges deve parar carrossel quando metas válidas <= 6', () => {
      const stopSpy = jest.spyOn(component, 'stopCarousel');

      component.metas = [criarMeta(1), criarMeta(2)];

      component.ngOnChanges({
        metas: {
          currentValue: component.metas,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.currentIndex).toBe(0);
      expect(stopSpy).toHaveBeenCalled();
    });

    it('ngOnChanges deve parar carrossel quando metas válidas > 15', () => {
      const stopSpy = jest.spyOn(component, 'stopCarousel');

      component.metas = Array.from({ length: 16 }, (_, i) => criarMeta(i + 1));

      component.ngOnChanges({
        metas: {
          currentValue: component.metas,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.currentIndex).toBe(0);
      expect(stopSpy).toHaveBeenCalled();
    });

    it('ngOnChanges deve recalcular e iniciar carrossel quando tiver carrossel', () => {
      const recalcSpy = jest.spyOn(component as any, 'recalcLayout');
      const startSpy = jest.spyOn(component, 'startCarousel');

      component.metas = Array.from({ length: 8 }, (_, i) => criarMeta(i + 1));

      component.ngOnChanges({
        metas: {
          currentValue: component.metas,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      jest.runOnlyPendingTimers();

      expect(recalcSpy).toHaveBeenCalled();
      expect(component.currentIndex).toBe(0);
      expect(startSpy).toHaveBeenCalled();
    });

    it('ngOnChanges deve ajustar currentIndex pelo maxIndex quando não tiver carrossel após recalcLayout', () => {
      const recalcSpy = jest.spyOn(component as any, 'recalcLayout');
      const getMaxIndexSpy = jest
        .spyOn(component as any, 'getMaxIndex')
        .mockReturnValue(2);

      jest
        .spyOn(component as any, 'hasCarousel')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const stopSpy = jest.spyOn(component, 'stopCarousel');
      const startSpy = jest.spyOn(component, 'startCarousel');

      component.metas = Array.from({ length: 8 }, (_, i) => criarMeta(i + 1));
      component.currentIndex = 10;

      component.ngOnChanges({
        metas: {
          currentValue: component.metas,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      jest.runOnlyPendingTimers();

      expect(recalcSpy).toHaveBeenCalled();
      expect(getMaxIndexSpy).toHaveBeenCalled();
      expect(component.currentIndex).toBe(0);
      expect(stopSpy).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
    });

    it('ngOnChanges não deve fazer nada quando for firstChange', () => {
      const stopSpy = jest.spyOn(component, 'stopCarousel');

      component.ngOnChanges({
        metas: {
          currentValue: component.metas,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(stopSpy).not.toHaveBeenCalled();
    });
  });

  describe('startCarousel', () => {
    it('deve limpar intervalo anterior antes de iniciar novo', () => {
      component.metas = Array.from({ length: 7 }, (_, i) => criarMeta(i + 1));

      (component as any).interval = setInterval(() => {}, 3000);
      const clearSpy = jest.spyOn(global, 'clearInterval');

      component.startCarousel();

      expect(clearSpy).toHaveBeenCalled();
    });

    it('não deve iniciar quando estiver pausado', () => {
      component.metas = Array.from({ length: 7 }, (_, i) => criarMeta(i + 1));
      (component as any).isPaused = true;
      (component as any).interval = null;

      component.startCarousel();

      expect((component as any).interval).toBeNull();
    });

    it('deve voltar para índice 0 quando estiver no último slide', () => {
      component.metas = Array.from({ length: 7 }, (_, i) => criarMeta(i + 1));

      jest.spyOn(component as any, 'hasCarousel').mockReturnValue(true);
      jest.spyOn(component, 'isLastSlide').mockReturnValue(true);

      component.currentIndex = 3;

      component.startCarousel();
      jest.advanceTimersByTime(3000);

      expect(component.currentIndex).toBe(0);
    });

    it('deve chamar nextSlide quando não estiver no último slide', () => {
      component.metas = Array.from({ length: 7 }, (_, i) => criarMeta(i + 1));

      jest.spyOn(component as any, 'hasCarousel').mockReturnValue(true);
      jest.spyOn(component, 'isLastSlide').mockReturnValue(false);

      const nextSpy = jest.spyOn(component, 'nextSlide');

      component.startCarousel();
      jest.advanceTimersByTime(3000);

      expect(nextSpy).toHaveBeenCalled();
    });

    it('startCarousel não deve iniciar quando não tem carrossel', () => {
      component.metas = [criarMeta(1), criarMeta(2)];
      (component as any).interval = null;

      component.startCarousel();

      expect((component as any).interval).toBeNull();
    });

    it('startCarousel deve retornar dentro do interval quando estiver pausado', () => {
      component.metas = Array.from({ length: 7 }, (_, i) => criarMeta(i + 1));

      jest.spyOn(component as any, 'hasCarousel').mockReturnValue(true);

      const nextSpy = jest.spyOn(component, 'nextSlide');
      const lastSpy = jest.spyOn(component, 'isLastSlide');

      (component as any).isPaused = false;

      component.startCarousel();

      (component as any).isPaused = true;

      jest.advanceTimersByTime(3000);

      expect(nextSpy).not.toHaveBeenCalled();
      expect(lastSpy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('ngOnDestroy deve parar carrossel', () => {
      const spy = jest.spyOn(component, 'stopCarousel');

      component.ngOnDestroy();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('stopCarousel', () => {
    it('stopCarousel deve limpar intervalo', () => {
      const spy = jest.spyOn(global, 'clearInterval');
      (component as any).interval = setInterval(() => {}, 3000);

      component.stopCarousel();

      expect(spy).toHaveBeenCalled();
      expect((component as any).interval).toBeNull();
    });
  });

  describe('pauseCarousel', () => {
    it('pauseCarousel deve pausar e parar intervalo', () => {
      const stopSpy = jest.spyOn(component, 'stopCarousel');

      component.pauseCarousel();

      expect((component as any).isPaused).toBe(true);
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('resumeCarousel', () => {
    it('resumeCarousel deve despausar', () => {
      component.pauseCarousel();
      component.resumeCarousel();

      expect((component as any).isPaused).toBe(false);
    });

    it('resumeCarousel deve chamar startCarousel quando tiver carrossel', () => {
      const startSpy = jest.spyOn(component, 'startCarousel');

      jest.spyOn(component as any, 'hasCarousel').mockReturnValue(true);

      component.resumeCarousel();

      expect(startSpy).toHaveBeenCalled();
    });

    it('resumeCarousel não deve chamar startCarousel quando não tiver carrossel', () => {
      const startSpy = jest.spyOn(component, 'startCarousel');

      jest.spyOn(component as any, 'hasCarousel').mockReturnValue(false);

      component.resumeCarousel();

      expect(startSpy).not.toHaveBeenCalled();
    });
  });

  describe('nextSlide / prevSlide', () => {
    it('nextSlide deve retornar quando já está no maxIndex', () => {
      component.metas = Array.from({ length: 7 }, (_, i) => criarMeta(i + 1));
      jest.spyOn(component as any, 'getMaxIndex').mockReturnValue(2);

      component.currentIndex = 2;
      component.nextSlide();

      expect(component.currentIndex).toBe(2);
    });

    it('nextSlide deve avançar quando não está no último índice', () => {
      component.metas = Array.from({ length: 7 }, (_, i) => criarMeta(i + 1));
      jest.spyOn(component as any, 'getMaxIndex').mockReturnValue(2);

      component.currentIndex = 0;
      component.nextSlide();

      expect(component.currentIndex).toBe(1);
    });

    it('prevSlide deve voltar para maxIndex quando currentIndex for 0', () => {
      component.metas = Array.from({ length: 7 }, (_, i) => criarMeta(i + 1));
      jest.spyOn(component as any, 'getMaxIndex').mockReturnValue(3);

      component.currentIndex = 0;
      component.prevSlide();

      expect(component.currentIndex).toBe(3);
    });

    it('nextSlide não deve fazer nada quando não tem carrossel', () => {
      jest.spyOn(component as any, 'hasCarousel').mockReturnValue(false);

      const recalcSpy = jest.spyOn(component as any, 'recalcLayout');

      component.nextSlide();

      expect(recalcSpy).not.toHaveBeenCalled();
    });

    it('prevSlide não deve fazer nada quando não tem carrossel', () => {
      jest.spyOn(component as any, 'hasCarousel').mockReturnValue(false);

      const recalcSpy = jest.spyOn(component as any, 'recalcLayout');

      component.prevSlide();

      expect(recalcSpy).not.toHaveBeenCalled();
    });

    it('prevSlide deve decrementar índice quando currentIndex > 0', () => {
      jest.spyOn(component as any, 'hasCarousel').mockReturnValue(true);
      jest.spyOn(component as any, 'recalcLayout').mockImplementation(() => {});
      jest.spyOn(component as any, 'getMaxIndex').mockReturnValue(5);

      component.currentIndex = 3;

      component.prevSlide();

      expect(component.currentIndex).toBe(2);
    });

    it('prevSlide deve ir para maxIndex quando currentIndex = 0', () => {
      jest.spyOn(component as any, 'hasCarousel').mockReturnValue(true);
      jest.spyOn(component as any, 'recalcLayout').mockImplementation(() => {});
      jest.spyOn(component as any, 'getMaxIndex').mockReturnValue(5);

      component.currentIndex = 0;

      component.prevSlide();

      expect(component.currentIndex).toBe(5);
    });
  });

  describe('goToSlide', () => {
    it('goToSlide deve limitar índice maior que maxIndex', () => {
      jest.spyOn(component as any, 'getMaxIndex').mockReturnValue(5);
      jest.spyOn(component as any, 'recalcLayout').mockImplementation(() => {});

      component.goToSlide(10);

      expect(component.currentIndex).toBe(5);
    });

    it('goToSlide deve usar o índice informado quando estiver dentro do limite', () => {
      jest.spyOn(component as any, 'getMaxIndex').mockReturnValue(5);
      jest.spyOn(component as any, 'recalcLayout').mockImplementation(() => {});

      component.goToSlide(3);

      expect(component.currentIndex).toBe(3);
    });

    it('goToSlide deve reiniciar carrossel quando tiver entre 7 e 15 metas válidas', () => {
      component.metas = Array.from({ length: 8 }, (_, i) => criarMeta(i + 1));

      jest.spyOn(component as any, 'getMaxIndex').mockReturnValue(5);
      jest.spyOn(component as any, 'recalcLayout').mockImplementation(() => {});

      const stopSpy = jest.spyOn(component, 'stopCarousel');
      const startSpy = jest.spyOn(component, 'startCarousel');

      component.goToSlide(2);

      expect(stopSpy).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
    });

    it('goToSlide deve limitar índice menor que zero', () => {
      jest.spyOn(component as any, 'getMaxIndex').mockReturnValue(5);
      jest.spyOn(component as any, 'recalcLayout').mockImplementation(() => {});

      component.goToSlide(-1);

      expect(component.currentIndex).toBe(0);
    });
  });

  describe('getMaxIndex', () => {
    it('getMaxIndex deve retornar 0 quando cardStep <= 0', () => {
      (component as any).cardStep = 0;

      const result = (component as any).getMaxIndex();

      expect(result).toBe(0);
    });

    it('getMaxIndex deve calcular corretamente com floor', () => {
      (component as any).cardStep = 100;
      (component as any).maxTranslate = 450;
      (component as any).endOffset = 50;

      // maxWithPadding = 500 → 500 / 100 = 5
      const result = (component as any).getMaxIndex();

      expect(result).toBe(5);
    });

    it('getMaxIndex deve nunca retornar negativo', () => {
      (component as any).cardStep = 100;
      (component as any).maxTranslate = -200;
      (component as any).endOffset = 0;

      const result = (component as any).getMaxIndex();

      expect(result).toBe(0);
    });
  });

  describe('isLastSlide', () => {
    it('isLastSlide deve retornar true quando currentIndex >= maxIndex', () => {
      jest.spyOn(component as any, 'getMaxIndex').mockReturnValue(5);

      component.currentIndex = 5;

      expect(component.isLastSlide()).toBe(true);
    });

    it('isLastSlide deve retornar false quando currentIndex < maxIndex', () => {
      jest.spyOn(component as any, 'getMaxIndex').mockReturnValue(5);

      component.currentIndex = 3;

      expect(component.isLastSlide()).toBe(false);
    });
  });

  describe('onResize', () => {
    it('onResize deve recalcular layout sem erro', () => {
      expect(() => component.onResize()).not.toThrow();
    });
  });

  describe('recalcLayout', () => {
    it('recalcLayout deve retornar quando não existir wrapper ou content', () => {
      (component as any).wrapperRef = null;
      (component as any).contentRef = null;

      expect(() => (component as any).recalcLayout()).not.toThrow();
    });

    it('recalcLayout deve calcular cardStep quando existir firstCard', () => {
      const wrapper = document.createElement('div');
      const content = document.createElement('div');
      const card = document.createElement('div');

      card.classList.add('meta-card');
      content.appendChild(card);

      // mock offsetWidth
      Object.defineProperty(card, 'offsetWidth', {
        configurable: true,
        value: 200,
      });

      // mock styles (gap)
      jest.spyOn(window, 'getComputedStyle').mockImplementation((el: any) => {
        if (el === content) {
          return {
            gap: '16px',
            columnGap: '16px',
          } as any;
        }
        return {
          paddingLeft: '0px',
          paddingRight: '0px',
        } as any;
      });

      (component as any).wrapperRef = { nativeElement: wrapper };
      (component as any).contentRef = { nativeElement: content };

      (component as any).recalcLayout();

      expect((component as any).cardStep).toBe(216); // 200 + 16
    });

    it('recalcLayout não deve alterar cardStep quando não houver firstCard', () => {
      const wrapper = document.createElement('div');
      const content = document.createElement('div');

      (component as any).wrapperRef = { nativeElement: wrapper };
      (component as any).contentRef = { nativeElement: content };

      const initial = (component as any).cardStep;

      (component as any).recalcLayout();

      expect((component as any).cardStep).toBe(initial);
    });
  });

  describe('getTranslateX', () => {
    it('getTranslateX deve retornar 0px quando não tem carrossel', () => {
      component.metas = [criarMeta(1), criarMeta(2)];

      expect(component.getTranslateX()).toBe('translateX(0px)');
    });

    it('getTranslateX deve calcular translate quando tem carrossel', () => {
      component.metas = Array.from({ length: 8 }, (_, i) => criarMeta(i + 1));

      (component as any).cardStep = 100;
      (component as any).maxTranslate = 500;
      (component as any).endOffset = 0;
      component.currentIndex = 2;

      expect(component.getTranslateX()).toBe('translateX(-200px)');
    });

    it('getTranslateX deve limitar pelo maxWithPadding', () => {
      component.metas = Array.from({ length: 8 }, (_, i) => criarMeta(i + 1));

      (component as any).cardStep = 100;
      (component as any).maxTranslate = 250;
      (component as any).endOffset = 50;
      component.currentIndex = 10;

      expect(component.getTranslateX()).toBe('translateX(-300px)');
    });
  });

  describe('getPlaceholderCards', () => {
    it('getPlaceholderCards deve sempre retornar array vazio', () => {
      component.metas = Array.from({ length: 8 }, (_, i) => criarMeta(i + 1));
      expect(component.getPlaceholderCards()).toEqual([]);
    });

    it('deve retornar vazio quando não há metas válidas', () => {
      component.metas = [];

      expect(component.getPlaceholderCards()).toEqual([]);
    });

    it('deve retornar vazio quando tiver 7 ou menos metas', () => {
      component.metas = Array.from({ length: 7 }, (_, i) => criarMeta(i + 1));

      expect(component.getPlaceholderCards()).toEqual([]);
    });

    it('deve retornar vazio quando tiver mais de 15 metas', () => {
      component.metas = Array.from({ length: 16 }, (_, i) => criarMeta(i + 1));

      expect(component.getPlaceholderCards()).toEqual([]);
    });

    it('deve cair no return final (fallback)', () => {
      jest.spyOn(component, 'metasValidas', 'get').mockReturnValue({
        length: Number.NaN,
      } as any);

      const result = component.getPlaceholderCards();

      expect(result).toEqual([]);
    });
  });
});
