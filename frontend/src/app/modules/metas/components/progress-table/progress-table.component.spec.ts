import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressTableComponent } from './progress-table.component';
import { MetaExtended } from '../../../../core/interfaces/mes-meta';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

describe('ProgressTableComponent', () => {
  let component: ProgressTableComponent;
  let fixture: ComponentFixture<ProgressTableComponent>;

  const norm = (s: string | null | undefined) =>
    (s ?? '')?.replace(/\u00A0/g, ' ');
  const mockMetas: MetaExtended[] = [
    {
      id: 1,
      nome: 'Meta 1',
      valorMeta: 10000,
      valorAtual: 5000,
      valorPorMes: 1000,
      mesesNecessarios: 10,
      meses: [],
    },
    {
      id: 2,
      nome: 'Meta 2',
      valorMeta: 5000,
      valorAtual: 5000,
      valorPorMes: 500,
      mesesNecessarios: 10,
      meses: [],
    },
  ];

  beforeAll(() => {
    registerLocaleData(localePt);
  });

  beforeEach(async () => {
    jest.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [ProgressTableComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.metas).toEqual(mockMetas);
    expect(component.currentIndex).toBe(0);
  });

  it('should calculate progress correctly', () => {
    const progress = component.getProgressoRealMeta(mockMetas[0]);
    expect(progress).toBe(50); // 5000/10000 * 100
  });

  it('should calculate realized value correctly', () => {
    const valorRealizado = component.getValorRealizadoMeta(mockMetas[0]);
    expect(valorRealizado).toBe(5000); // valorAtual + valorPago(0)
  });

  it('should calculate remaining value correctly', () => {
    const valorFaltante = component.getValorFaltanteMeta(mockMetas[0]);
    expect(valorFaltante).toBe(5000); // 10000 - 5000
  });

  it('should format currency correctly (pt-BR)', () => {
    const formatted = component.formatarMoeda(1000);
    expect(norm(formatted)).toContain('R$ 1.000');
  });

  it('should get visible metas correctly', () => {
    const visibleMetas = component.getVisibleMetas();
    expect(visibleMetas.length).toBe(2);
    expect(visibleMetas[0]).toEqual(mockMetas[0]);
    expect(visibleMetas[1]).toEqual(mockMetas[1]);
  });

  it('should calculate total slides correctly', () => {
    const totalSlides = component.getTotalSlides();
    expect(totalSlides).toBe(1); // 2 metas / 2 por slide
  });

  it('should get current slide number correctly', () => {
    const currentSlide = component.getCurrentSlideNumber();
    expect(currentSlide).toBe(1);
  });

  it('should navigate to next slide (when there are more than 2 metas)', () => {
    component.metas = [
      ...mockMetas,
      { ...mockMetas[0], id: 3 },
      { ...mockMetas[1], id: 4 },
    ];
    fixture.detectChanges();

    component.nextSlide();
    expect(component.currentIndex).toBe(2);
  });

  it('should navigate to previous slide (when there are more than 2 metas)', () => {
    component.metas = [
      ...mockMetas,
      { ...mockMetas[0], id: 3 },
      { ...mockMetas[1], id: 4 },
    ];
    component.currentIndex = 2;
    fixture.detectChanges();

    component.prevSlide();
    expect(component.currentIndex).toBe(0);
  });

  it('should go to specific slide', () => {
    component.goToSlide(1);
    expect(component.currentIndex).toBe(1);
  });

  it('should not change index when there are only 2 metas', () => {
    component.metas = mockMetas;
    fixture.detectChanges();

    component.nextSlide();
    expect(component.currentIndex).toBe(0);

    component.prevSlide();
    expect(component.currentIndex).toBe(0);
  });

  it('nextSlide deve resetar para 0 quando alcançar o último índice (lista ímpar: 3 metas)', () => {
    component.metas = [
      { ...mockMetas[0], id: 1 },
      { ...mockMetas[1], id: 2 },
      { ...mockMetas[0], id: 3 },
    ];
    component.currentIndex = 0;
    fixture.detectChanges();

    component.nextSlide(); // (0+2)%3 = 2  -> >= 2  => zera
    expect(component.currentIndex).toBe(0);
  });

  it('nextSlide também reseta para 0 em lista ímpar maior (5 metas)', () => {
    component.metas = [
      { ...mockMetas[0], id: 1 },
      { ...mockMetas[1], id: 2 },
      { ...mockMetas[0], id: 3 },
      { ...mockMetas[1], id: 4 },
      { ...mockMetas[0], id: 5 },
    ];
    component.currentIndex = 0;
    fixture.detectChanges();

    // 1ª chamada: (0+2)%5 = 2 (não zera ainda)
    component.nextSlide();
    expect(component.currentIndex).toBe(2);

    // 2ª chamada: (2+2)%5 = 4  -> >= 4  => zera
    component.nextSlide();
    expect(component.currentIndex).toBe(0);
  });

  it('auto-advance (setInterval) deve cair no ramo de reset com 3 metas', () => {
    jest.useFakeTimers(); // se já estiver em beforeEach, ok
    component.metas = [
      { ...mockMetas[0], id: 1 },
      { ...mockMetas[1], id: 2 },
      { ...mockMetas[0], id: 3 },
    ];
    component.currentIndex = 0;
    fixture.detectChanges();

    // dispara o nextSlide do setInterval (5000 ms) -> cai no reset
    jest.advanceTimersByTime(5000);
    expect(component.currentIndex).toBe(0);

    jest.useRealTimers();
  });

  it('should auto-advance every 5s when metas > 2', () => {
    component.metas = [
      ...mockMetas,
      { ...mockMetas[0], id: 3 },
      { ...mockMetas[1], id: 4 },
    ];
    fixture.detectChanges();

    const initial = component.currentIndex; // 0
    jest.advanceTimersByTime(5000); // dispara setInterval
    expect(component.currentIndex).toBe((initial + 2) % component.metas.length);
  });

  it('should render carousel container', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.carousel-container')).toBeTruthy();
  });

  it('should render component root', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();
  });

  it('should sum only months with status "Pago" and treat undefined as 0', () => {
    const meses = [
      { status: 'Pago', valor: 200 },
      { status: 'Pendente', valor: 300 },
      { status: 'Pago', valor: undefined },
    ] as unknown as MetaExtended['meses'];

    const meta: MetaExtended = {
      ...mockMetas[0],
      valorMeta: 1000,
      valorAtual: 100,
      meses,
    };

    const realizado = component.getValorRealizadoMeta(meta);
    expect(realizado).toBe(100 + 200 + 0); // só pagos contam

    const progresso = component.getProgressoRealMeta(meta);
    expect(progresso).toBeCloseTo(((100 + 200) / 1000) * 100);
  });

  it('should cap progress at 100%', () => {
    const meses = [
      { status: 'Pago', valor: 6000 },
    ] as unknown as MetaExtended['meses'];
    const meta: MetaExtended = {
      ...mockMetas[0],
      valorMeta: 10000,
      valorAtual: 6000,
      meses,
    };

    const p = component.getProgressoRealMeta(meta);
    expect(p).toBe(100);
  });

  it('prevSlide should wrap to last pair when currentIndex goes negative', () => {
    component.metas = [
      ...mockMetas,
      { ...mockMetas[0], id: 3 },
      { ...mockMetas[1], id: 4 },
    ];
    component.currentIndex = 0;
    fixture.detectChanges();

    component.prevSlide();
    expect(component.currentIndex).toBe(component.metas.length - 2);
  });

  it('getVisibleMetas should reflect currentIndex window (index = 2)', () => {
    component.metas = [
      ...mockMetas,
      { ...mockMetas[0], id: 3 },
      { ...mockMetas[1], id: 4 },
    ];
    component.currentIndex = 2;
    fixture.detectChanges();

    const vis = component.getVisibleMetas();
    expect(vis.map((m) => m.id)).toEqual([3, 4]);
  });

  it('getTotalSlides should ceil with odd metas (5 => 3 slides)', () => {
    component.metas = [
      ...mockMetas,
      { ...mockMetas[0], id: 3 },
      { ...mockMetas[1], id: 4 },
      { ...mockMetas[0], id: 5 },
    ];
    expect(component.getTotalSlides()).toBe(3);
  });

  it('should clear interval on ngOnDestroy', () => {
    const spy = jest.spyOn(global, 'clearInterval');
    (component as unknown as { interval: any }).interval = setInterval(() => {},
    5000);
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });

  it('getValorRealizadoMeta deve tratar valorAtual undefined como 0', () => {
    const meta = {
      ...mockMetas[0],
      valorAtual: undefined as unknown as number,
      meses: [{ status: 'Pago', valor: 150 }] as any,
      valorMeta: 1000,
    } as MetaExtended;

    const realizado = component.getValorRealizadoMeta(meta);
    expect(realizado).toBe(150); // 0 (valorAtual) + 150 (Pago)
  });

  it('getProgressoRealMeta deve tratar valorAtual undefined como 0', () => {
    const meta = {
      ...mockMetas[0],
      valorAtual: undefined as unknown as number,
      meses: [{ status: 'Pago', valor: undefined }] as any, // cobre (mes.valor || 0)
      valorMeta: 1000,
    } as MetaExtended;

    const progresso = component.getProgressoRealMeta(meta);
    expect(progresso).toBe(0); // (0 + 0) / 1000 * 100
  });
});
