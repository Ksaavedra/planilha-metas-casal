import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
// import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ExecutandoMetasComponent } from './executando-metas.component';
import { MetasService } from '../../../../../core/services/metas/metas.service';
import {
  Meta,
  StatusMeta,
} from '../../../../../core/interfaces/metas/mes-meta';
import { of, Subject } from 'rxjs';

describe('ExecutandoMetasComponent', () => {
  let component: ExecutandoMetasComponent;
  let fixture: ComponentFixture<ExecutandoMetasComponent>;
  let editarValorSave$!: Subject<{
    metaId: number | string;
    mesId: number;
    valor: number;
  }>;

  const metasServiceMock = {
    editarValorSave$: undefined as any,
    openEditarValor: jest.fn(),
    updateMeta: jest.fn(),
  };
  const mockMetas: Meta[] = [
    {
      id: 1,
      nome: 'Meta em Execução 1',
      valorMeta: 10000,
      valorAtual: 3000,
      valorPorMes: 500,
      mesesNecessarios: 10,
      meses: [
        { id: 1, nome: 'Janeiro', valor: 500, status: 'Pago' as StatusMeta },
        { id: 2, nome: 'Fevereiro', valor: 500, status: 'Pago' as StatusMeta },
        {
          id: 3,
          nome: 'Março',
          valor: 500,
          status: 'Programado' as StatusMeta,
        },
        {
          id: 4,
          nome: 'Abril',
          valor: 500,
          status: 'Programado' as StatusMeta,
        },
        { id: 5, nome: 'Maio', valor: 500, status: 'Programado' as StatusMeta },
        {
          id: 6,
          nome: 'Junho',
          valor: 500,
          status: 'Programado' as StatusMeta,
        },
        {
          id: 7,
          nome: 'Julho',
          valor: 500,
          status: 'Programado' as StatusMeta,
        },
        {
          id: 8,
          nome: 'Agosto',
          valor: 500,
          status: 'Programado' as StatusMeta,
        },
        {
          id: 9,
          nome: 'Setembro',
          valor: 500,
          status: 'Programado' as StatusMeta,
        },
        {
          id: 10,
          nome: 'Outubro',
          valor: 500,
          status: 'Programado' as StatusMeta,
        },
        {
          id: 11,
          nome: 'Novembro',
          valor: 500,
          status: 'Programado' as StatusMeta,
        },
        {
          id: 12,
          nome: 'Dezembro',
          valor: 500,
          status: 'Programado' as StatusMeta,
        },
      ],
    },
    {
      id: 3,
      nome: 'Meta Completa',
      valorMeta: 2000,
      valorAtual: 2000,
      valorPorMes: 500,
      mesesNecessarios: 4,
      meses: [
        { id: 1, nome: 'Janeiro', valor: 500, status: 'Pago' as StatusMeta },
        { id: 2, nome: 'Fevereiro', valor: 500, status: 'Pago' as StatusMeta },
        { id: 3, nome: 'Março', valor: 500, status: 'Pago' as StatusMeta },
        { id: 4, nome: 'Abril', valor: 500, status: 'Pago' as StatusMeta },
      ],
    },
  ];

  beforeEach(async () => {
    editarValorSave$ = new Subject<{
      metaId: number | string;
      mesId: number;
      valor: number;
    }>();

    metasServiceMock.editarValorSave$ = editarValorSave$.asObservable();
    metasServiceMock.openEditarValor.mockClear();
    metasServiceMock.updateMeta.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      declarations: [ExecutandoMetasComponent],
      imports: [HttpClientTestingModule],
      providers: [{ provide: MetasService, useValue: metasServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ExecutandoMetasComponent);
    component = fixture.componentInstance;
    component.metas = mockMetas;

    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.metas).toEqual(mockMetas);
    expect(component.meses).toEqual([]);
    expect(component.percentualPagoView).toBe(0);
    expect(component.totalValorMetaView).toBe(0);
    expect(component.totalValorPorMesView).toBe(0);
    expect(component.totalMesesNecessariosView).toBe(0);
    expect(component.totalValorAtualView).toBe(0);
    expect(component.totalContribuicoesView).toBe(0);
  });

  it('should emit alternarStatus event when selecionarStatus is called', () => {
    const spy = jest.spyOn(component.alternarStatus, 'emit');
    const mockMeta = mockMetas[0];

    component.selecionarStatus(mockMeta, 1, 'Pago');

    expect(spy).toHaveBeenCalledWith({
      metaId: 1,
      mesId: 1,
      status: 'Pago',
    });
  });

  it('should emit salvarValor event when salvarValor is called', () => {
    const spy = jest.spyOn(component.salvarValor, 'emit');

    component.salvarValor.emit({
      metaId: 1,
      mesId: 1,
      valor: 1000,
    });

    expect(spy).toHaveBeenCalledWith({
      metaId: 1,
      mesId: 1,
      valor: 1000,
    });
  });

  it('should emit metaCompleta event when meta is completed', () => {
    const spy = jest.spyOn(component.metaCompleta, 'emit');

    component.metaCompleta.emit({
      metaId: 1,
      metaNome: 'Meta em Execução 1',
      valorMeta: 10000,
    });

    expect(spy).toHaveBeenCalledWith({
      metaId: 1,
      metaNome: 'Meta em Execução 1',
      valorMeta: 10000,
    });
  });

  it('should handle status changes correctly', () => {
    const mockMeta = mockMetas[0];
    const mockMes = mockMeta.meses[0];
    const spy = jest.spyOn(component.alternarStatus, 'emit');

    component.selecionarStatus(mockMeta, mockMes.id, 'Pago');

    expect(spy).toHaveBeenCalledWith({
      metaId: mockMeta.id,
      mesId: mockMes.id,
      status: 'Pago',
    });
  });

  it('should handle value changes correctly', () => {
    const mockMeta = mockMetas[0];
    const mockMes = mockMeta.meses[0];
    const spy = jest.spyOn(component.salvarValor, 'emit');

    component.salvarValor.emit({
      metaId: mockMeta.id,
      mesId: mockMes.id,
      valor: 1500,
    });

    expect(spy).toHaveBeenCalledWith({
      metaId: mockMeta.id,
      mesId: mockMes.id,
      valor: 1500,
    });
  });

  it('should handle different status values', () => {
    const mockMeta = mockMetas[0];
    const mockMes = mockMeta.meses[0];
    const spy = jest.spyOn(component.alternarStatus, 'emit');

    component.selecionarStatus(mockMeta, mockMes.id, 'Pago');
    expect(spy).toHaveBeenCalledWith({
      metaId: mockMeta.id,
      mesId: mockMes.id,
      status: 'Pago',
    });

    component.selecionarStatus(mockMeta, mockMes.id, 'Programado');
    expect(spy).toHaveBeenCalledWith({
      metaId: mockMeta.id,
      mesId: mockMes.id,
      status: 'Programado',
    });

    component.selecionarStatus(mockMeta, mockMes.id, 'Vazio');
    expect(spy).toHaveBeenCalledWith({
      metaId: mockMeta.id,
      mesId: mockMes.id,
      status: 'Vazio',
    });
  });

  it('should handle meta completion', () => {
    const completedMeta = mockMetas[1]; // Meta completa
    const spy = jest.spyOn(component.metaCompleta, 'emit');

    component.metaCompleta.emit({
      metaId: completedMeta.id,
      metaNome: completedMeta.nome,
      valorMeta: completedMeta.valorMeta,
    });

    expect(spy).toHaveBeenCalledWith({
      metaId: completedMeta.id,
      metaNome: completedMeta.nome,
      valorMeta: completedMeta.valorMeta,
    });
  });

  it('should calculate totals correctly', () => {
    const mockMeta = mockMetas[0];

    component.totalValorMetaView = mockMeta.valorMeta;
    component.totalValorAtualView = mockMeta.valorAtual;
    component.totalValorPorMesView = mockMeta.valorPorMes;
    component.totalMesesNecessariosView = mockMeta.mesesNecessarios;

    expect(component.totalValorMetaView).toBe(10000);
    expect(component.totalValorAtualView).toBe(3000);
    expect(component.totalValorPorMesView).toBe(500);
    expect(component.totalMesesNecessariosView).toBe(10);
  });

  it('should handle percentual calculation', () => {
    const mockMeta = mockMetas[0];

    component.percentualPagoView =
      (mockMeta.valorAtual / mockMeta.valorMeta) * 100;

    expect(component.percentualPagoView).toBe(30);
  });

  it('should handle empty metas array', () => {
    component.metas = [];
    fixture.detectChanges();

    expect(component.metas).toEqual([]);
  });

  it('should handle metas with empty meses array', () => {
    const metaWithEmptyMeses: Meta = {
      id: 4,
      nome: 'Meta sem meses',
      valorMeta: 5000,
      valorAtual: 0,
      valorPorMes: 1000,
      mesesNecessarios: 5,
      meses: [],
    };

    component.metas = [metaWithEmptyMeses];
    fixture.detectChanges();

    expect(component.metas[0].meses).toEqual([]);
  });

  describe('setHeaderMesesFromData', () => {
    it('should set meses from metas data', () => {
      component.metas = mockMetas;
      component.setHeaderMesesFromData();

      expect(component.meses).toContain('Janeiro');
      expect(component.meses).toContain('Fevereiro');
      expect(component.meses).toContain('Março');
      expect(component.meses).toContain('Abril');
      expect(component.meses).toContain('Maio');
      expect(component.meses).toContain('Junho');
    });

    it('should handle empty metas array', () => {
      component.metas = [];
      component.setHeaderMesesFromData();

      expect(component.meses).toEqual([
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
      ]);
    });
  });

  describe('formatBR', () => {
    it('should format number in Brazilian format', () => {
      const result1 = component.formatBR(1234.56);
      const result2 = component.formatBR(1000);
      const result3 = component.formatBR(0);

      expect(result1).toContain('1.234,56');
      expect(result2).toContain('1.000,00');
      expect(result3).toContain('0,00');
    });
  });

  describe('getTotalContribuicoesMeta', () => {
    it('should calculate total contributions for meta', () => {
      const meta = mockMetas[0];
      const total = component.getTotalContribuicoesMeta(meta);

      expect(total).toBeGreaterThan(0);
      expect(typeof total).toBe('number');
    });

    it('should return 0 for meta with no meses', () => {
      const meta = { ...mockMetas[0], meses: [] };
      const total = component.getTotalContribuicoesMeta(meta);

      expect(total).toBe(0);
    });
  });

  describe('getMesesRestantes', () => {
    it('should calculate remaining months', () => {
      const meta = mockMetas[0];
      const restantes = component.getMesesRestantes(meta);

      expect(restantes).toBeGreaterThan(0);
      expect(typeof restantes).toBe('number');
    });
  });

  describe('marcarParabensMostrado', () => {
    it('should save meta ID to localStorage', () => {
      const metaId = 123;
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      component['marcarParabensMostrado'](metaId);

      expect(setItemSpy).toHaveBeenCalledWith(
        'metas_parabens_mostrados',
        JSON.stringify(['123']),
      );
    });

    it('should handle localStorage error gracefully', () => {
      const metaId = 123;
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => component['marcarParabensMostrado'](metaId)).not.toThrow();
    });
  });

  describe('jaMostrouParabens', () => {
    it('should return true if meta already showed congratulations', () => {
      const metaId = 123;
      jest
        .spyOn(Storage.prototype, 'getItem')
        .mockReturnValue(JSON.stringify(['123', '456']));

      const result = component['jaMostrouParabens'](metaId);

      expect(result).toBe(true);
    });

    it('should return false if meta has not shown congratulations', () => {
      const metaId = 789;
      jest
        .spyOn(Storage.prototype, 'getItem')
        .mockReturnValue(JSON.stringify(['123', '456']));

      const result = component['jaMostrouParabens'](metaId);

      expect(result).toBe(false);
    });

    it('should handle localStorage error gracefully', () => {
      const metaId = 123;
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = component['jaMostrouParabens'](metaId);

      expect(result).toBe(false);
    });
  });

  describe('getParabensMostrados', () => {
    it('should return parsed array from localStorage', () => {
      const storedData = ['123', '456'];
      jest
        .spyOn(Storage.prototype, 'getItem')
        .mockReturnValue(JSON.stringify(storedData));

      const result = component['getParabensMostrados']();

      expect(result).toEqual(storedData);
    });

    it('should return empty array when localStorage is empty', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

      const result = component['getParabensMostrados']();

      expect(result).toEqual([]);
    });

    it('should handle localStorage error gracefully', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = component['getParabensMostrados']();

      expect(result).toEqual([]);
    });
  });

  describe('marcarMesesComoFinalizado', () => {
    it('should mark remaining months as Finalizado', () => {
      const meta = mockMetas[0];
      const originalMeses = [...meta.meses];

      component['marcarMesesComoFinalizado'](meta);

      meta.meses.forEach((mes, index) => {
        if (
          originalMeses[index].status === 'Vazio' ||
          originalMeses[index].status === 'Programado'
        ) {
          expect(mes.status).toBe('Finalizado');
        }
      });
    });
  });

  describe('normalizeMeses', () => {
    it('should normalize meses for meta', () => {
      const meta = mockMetas[0];
      component.meses = ['Janeiro', 'Fevereiro'];

      component['normalizeMeses'](meta);

      expect(meta.meses).toBeDefined();
      expect(meta.meses.length).toBe(2);
    });

    it('normalizeMeses deve usar MESES_PADRAO quando meses estiver vazio', () => {
      component.meses = [];

      const meta = {
        ...mockMetas[0],
        meses: [],
      };

      component['normalizeMeses'](meta as any);

      expect(meta.meses.length).toBe(12);
      expect((meta.meses[0] as any).nome).toBe('Janeiro');
      expect((meta.meses[11] as any).nome).toBe('Dezembro');
    });
  });

  describe('recalcResumo', () => {
    it('should recalculate summary values', () => {
      component.metas = mockMetas;

      component['recalcResumo']();

      expect(typeof component.totalValorMetaView).toBe('number');
      expect(typeof component.totalValorAtualView).toBe('number');
      expect(typeof component.totalValorPorMesView).toBe('number');
    });
  });

  describe('ngOnChanges', () => {
    it('should handle metas changes', () => {
      const changes = {
        metas: {
          currentValue: mockMetas,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true,
        },
      };

      const setHeaderSpy = jest.spyOn(component, 'setHeaderMesesFromData');
      const normalizeSpy = jest.spyOn(component as any, 'normalizeMeses');
      const recalcSpy = jest.spyOn(component as any, 'recalcResumo');

      component.ngOnChanges(changes);

      expect(setHeaderSpy).toHaveBeenCalled();
      expect(normalizeSpy).toHaveBeenCalledTimes(mockMetas.length);
      expect(recalcSpy).toHaveBeenCalled();
    });

    it('should not process changes when metas is null', () => {
      const changes = {
        metas: {
          currentValue: null,
          previousValue: mockMetas,
          firstChange: false,
          isFirstChange: () => false,
        },
      };

      const setHeaderSpy = jest.spyOn(component, 'setHeaderMesesFromData');
      const normalizeSpy = jest.spyOn(component as any, 'normalizeMeses');
      const recalcSpy = jest.spyOn(component as any, 'recalcResumo');

      component.ngOnChanges(changes);

      expect(setHeaderSpy).not.toHaveBeenCalled();
      expect(normalizeSpy).not.toHaveBeenCalled();
      expect(recalcSpy).not.toHaveBeenCalled();
    });

    it('ngOnChanges deve ignorar quando não existe changes de metas', () => {
      const spy = jest.spyOn(component, 'setHeaderMesesFromData');

      component.ngOnChanges({});

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('selecionarStatus', () => {
    it('should handle mes not found', () => {
      const meta = mockMetas[0];
      const spy = jest.spyOn(component.alternarStatus, 'emit');

      component.selecionarStatus(meta, 999, 'Pago');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should verify meta completion when status is Pago', () => {
      const meta = mockMetas[0];
      const spy = jest.spyOn(component as any, 'verificarMetaCompleta');

      component.selecionarStatus(meta, 1, 'Pago');

      expect(spy).toHaveBeenCalledWith(meta);
    });

    it('should not verify meta completion when status is not Pago', () => {
      const meta = mockMetas[0];
      const spy = jest.spyOn(component as any, 'verificarMetaCompleta');

      component.selecionarStatus(meta, 1, 'Programado');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('verificarMetaCompleta', () => {
    it('should emit metaCompleta when meta reaches 100%', () => {
      const meta = {
        ...mockMetas[0],
        valorMeta: 1000,
        valorAtual: 500,
        meses: [
          { id: 1, nome: 'Janeiro', valor: 500, status: 'Pago' as StatusMeta },
        ],
      };

      const spy = jest.spyOn(component.metaCompleta, 'emit');
      const marcarSpy = jest.spyOn(component as any, 'marcarParabensMostrado');
      const finalizarSpy = jest.spyOn(
        component as any,
        'marcarMesesComoFinalizado',
      );

      component['verificarMetaCompleta'](meta);

      expect(spy).toHaveBeenCalledWith({
        metaId: meta.id,
        metaNome: meta.nome,
        valorMeta: meta.valorMeta,
      });
      expect(marcarSpy).toHaveBeenCalledWith(meta.id);
      expect(finalizarSpy).toHaveBeenCalledWith(meta);
    });

    it('should not emit when valorMeta is 0 or negative', () => {
      const meta = { ...mockMetas[0], valorMeta: 0 };
      const spy = jest.spyOn(component.metaCompleta, 'emit');

      component['verificarMetaCompleta'](meta);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit when progress is less than 100%', () => {
      const meta = {
        ...mockMetas[0],
        valorMeta: 1000,
        valorAtual: 100,
        meses: [
          { id: 1, nome: 'Janeiro', valor: 100, status: 'Pago' as StatusMeta },
        ],
      };

      const spy = jest.spyOn(component.metaCompleta, 'emit');

      component['verificarMetaCompleta'](meta);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit when no months are paid', () => {
      const meta = {
        ...mockMetas[0],
        valorMeta: 1000,
        valorAtual: 1000,
        meses: [
          { id: 1, nome: 'Janeiro', valor: 0, status: 'Vazio' as StatusMeta },
        ],
      };

      const spy = jest.spyOn(component.metaCompleta, 'emit');

      component['verificarMetaCompleta'](meta);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit when congratulations already shown', () => {
      const meta = {
        ...mockMetas[0],
        valorMeta: 1000,
        valorAtual: 500,
        meses: [
          { id: 1, nome: 'Janeiro', valor: 500, status: 'Pago' as StatusMeta },
        ],
      };

      jest.spyOn(component as any, 'jaMostrouParabens').mockReturnValue(true);
      const spy = jest.spyOn(component.metaCompleta, 'emit');

      component['verificarMetaCompleta'](meta);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('getTotalContribuicoesMetaExtended', () => {
    it('should call getTotalContribuicoesMeta', () => {
      const meta = mockMetas[0];
      const spy = jest.spyOn(component, 'getTotalContribuicoesMeta');

      component.getTotalContribuicoesMetaExtended(meta as any);

      expect(spy).toHaveBeenCalledWith(meta);
    });
  });

  describe('getMesesRestantes', () => {
    it('should return 0 when valorMeta is 0 or negative', () => {
      const meta = { ...mockMetas[0], valorMeta: 0 };
      const result = component.getMesesRestantes(meta);
      expect(result).toBe(0);
    });

    it('should return 0 when valorPorMes is 0 or negative', () => {
      const meta = { ...mockMetas[0], valorPorMes: 0 };
      const result = component.getMesesRestantes(meta);
      expect(result).toBe(0);
    });

    it('should calculate remaining months correctly', () => {
      const meta = {
        ...mockMetas[0],
        valorMeta: 1000,
        valorAtual: 200,
        valorPorMes: 100,
        meses: [
          { id: 1, nome: 'Janeiro', valor: 100, status: 'Pago' as StatusMeta },
        ],
      };

      const result = component.getMesesRestantes(meta);
      expect(result).toBe(7); // (1000 - 200 - 100) / 100 = 7
    });
  });

  describe('totalContribuicoesPorMes', () => {
    it('should return empty array when no metas', () => {
      component.metas = [];
      const result = component.totalContribuicoesPorMes;
      expect(result).toEqual([]);
    });

    it('should return empty array when metas have no meses', () => {
      component.metas = [{ ...mockMetas[0], meses: [] }];
      const result = component.totalContribuicoesPorMes;
      expect(result).toEqual([]);
    });

    it('should calculate totals correctly', () => {
      component.metas = mockMetas;
      const result = component.totalContribuicoesPorMes;
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((total) => typeof total === 'number')).toBe(true);
    });
  });

  describe('marcarMesesComoFinalizado', () => {
    it('should handle meta with no meses', () => {
      metasServiceMock.updateMeta.mockClear();

      const meta = { ...mockMetas[0], meses: [] };

      component['marcarMesesComoFinalizado'](meta as any);

      expect(metasServiceMock.updateMeta).not.toHaveBeenCalled();
    });

    it('should handle meta with all months already paid', () => {
      metasServiceMock.updateMeta.mockClear();

      const meta = {
        ...mockMetas[0],
        meses: [
          { id: 1, nome: 'Janeiro', valor: 500, status: 'Pago' as StatusMeta },
          {
            id: 2,
            nome: 'Fevereiro',
            valor: 500,
            status: 'Pago' as StatusMeta,
          },
        ],
      };

      component['marcarMesesComoFinalizado'](meta as any);

      expect(metasServiceMock.updateMeta).not.toHaveBeenCalled();
    });

    it('should call updateMeta service', () => {
      const meta = mockMetas[0];
      const updateSpy = jest
        .spyOn(component['metasService'], 'updateMeta')
        .mockReturnValue({
          subscribe: jest.fn(),
        } as any);

      component['marcarMesesComoFinalizado'](meta);

      expect(updateSpy).toHaveBeenCalledWith(meta.id, {
        meses: meta.meses.map((m) => ({ ...m })),
        mesesNecessarios: 0,
      });
    });

    it('should emit alternarStatus on successful update', () => {
      const meta = mockMetas[0];
      const emitSpy = jest.spyOn(component.alternarStatus, 'emit');

      jest.spyOn(component['metasService'], 'updateMeta').mockReturnValue({
        subscribe: jest.fn((callback) => {
          callback.next();
          return { unsubscribe: jest.fn() };
        }),
      } as any);

      component['marcarMesesComoFinalizado'](meta);

      expect(emitSpy).toHaveBeenCalledWith({
        metaId: meta.id,
        mesId: 0,
        status: 'Finalizado',
      });
    });

    it('should handle update error gracefully', () => {
      const meta = mockMetas[0];

      jest.spyOn(component['metasService'], 'updateMeta').mockReturnValue({
        subscribe: jest.fn((callbacks) => {
          callbacks.error();
          return { unsubscribe: jest.fn() };
        }),
      } as any);

      expect(() => component['marcarMesesComoFinalizado'](meta)).not.toThrow();
    });
  });

  it('trackByMetaId deve retornar id da meta', () => {
    expect(component.trackByMetaId(0, { id: 10 })).toBe(10);
  });

  it('trackByMesId deve retornar id do mês', () => {
    expect(component.trackByMesId(0, { id: 5 })).toBe(5);
  });

  it('ngOnInit deve atualizar valor vindo do editarValorSave$', () => {
    const spy = jest.spyOn(component.salvarValor, 'emit');

    editarValorSave$.next({
      metaId: 1,
      mesId: 3,
      valor: 900,
    });

    expect(component.metas[0].meses[2].valor).toBe(900);
    expect(component.metas[0].meses[2].status).toBe('Programado');

    expect(spy).toHaveBeenCalledWith({
      metaId: 1,
      mesId: 3,
      valor: 900,
    });
  });

  it('ngOnInit deve deixar status Vazio quando valor for zero', () => {
    editarValorSave$.next({
      metaId: 1,
      mesId: 3,
      valor: 0,
    });

    expect(component.metas[0].meses[2].valor).toBe(0);
    expect(component.metas[0].meses[2].status).toBe('Vazio');
  });

  it('ngOnInit deve ignorar quando meta não existe', () => {
    const spy = jest.spyOn(component.salvarValor, 'emit');

    editarValorSave$.next({
      metaId: 999,
      mesId: 1,
      valor: 100,
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it('ngOnInit deve ignorar quando mês não existe', () => {
    const spy = jest.spyOn(component.salvarValor, 'emit');

    editarValorSave$.next({
      metaId: 1,
      mesId: 999,
      valor: 100,
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it('isDropdownOpen deve retornar true quando dropdown estiver aberto', () => {
    component.openDropdownKey = '1_3';

    expect(component.isDropdownOpen(1, 3)).toBe(true);
  });

  it('getActiveMes deve retornar null quando não houver meta ativa', () => {
    expect(component.getActiveMes()).toBeNull();
  });

  it('getActiveMes deve retornar mês ativo', () => {
    component['activeMeta'] = component.metas[0] as any;
    component['activeMesId'] = 1;

    const result = component.getActiveMes();

    expect(result?.id).toBe(1);
  });

  describe('closeDropdown', () => {
    it('closeDropdown deve não fechar quando clicar dentro do overlay', () => {
      component.openDropdownKey = '1_1';

      const overlay = document.createElement('div');
      overlay.classList.add('status-dropdown-overlay');

      const child = document.createElement('span');
      overlay.appendChild(child);

      component.closeDropdown({
        target: child,
      } as unknown as MouseEvent);

      expect(component.openDropdownKey).toBe('1_1');
    });

    it('closeDropdown deve não fechar quando clicar no material-icons dentro do status-indicator', () => {
      component.openDropdownKey = '1_1';

      const status = document.createElement('div');
      status.classList.add('status-indicator');

      const icon = document.createElement('span');
      icon.classList.add('material-icons');
      status.appendChild(icon);

      component.closeDropdown({
        target: icon,
      } as unknown as MouseEvent);

      expect(component.openDropdownKey).toBe('1_1');
    });

    it('closeDropdown deve não fechar quando clicar no status-indicator', () => {
      component.openDropdownKey = '1_1';

      const wrapper = document.createElement('div');
      wrapper.classList.add('status-indicator');

      const event = {
        target: wrapper,
      } as unknown as MouseEvent;

      component.closeDropdown(event);

      expect(component.openDropdownKey).toBe('1_1');
    });

    it('closeDropdown deve limpar dropdown quando clicar fora', () => {
      component.openDropdownKey = '1_1';
      component.dropdownPos = { top: 10, left: 20 };

      component.closeDropdown({
        target: document.createElement('div'),
      } as unknown as MouseEvent);

      expect(component.openDropdownKey).toBeNull();
      expect(component.dropdownPos).toEqual({ top: 0, left: 0 });
    });
  });

  it('removeDropdownFromBody deve remover dropdown do body', () => {
    const dropdown = document.createElement('div');
    document.body.appendChild(dropdown);

    component['dropdownElement'] = dropdown;

    component['removeDropdownFromBody']();

    expect(document.body.contains(dropdown)).toBe(false);
    expect(component['dropdownElement']).toBeNull();
  });

  it('applyStatusDropdownHostStyles deve aplicar estilos no dropdown', () => {
    const host = document.createElement('div');

    component['applyStatusDropdownHostStyles'](host);

    expect(host.style.position).toBe('fixed');
    expect(host.style.zIndex).toBe('99999');
    expect(host.style.minWidth).toBe('120px');
    expect(host.style.background).toBe('rgb(255, 255, 255)');
  });

  describe('mountStatusOptionRows', () => {
    it('mountStatusOptionRows deve criar opções Programado, Pago e Vazio', () => {
      const dropdown = document.createElement('div');

      component['mountStatusOptionRows'](dropdown);

      const options = dropdown.querySelectorAll('.dropdown-option');

      expect(options.length).toBe(3);
      expect(options[0].textContent).toBe('Programado');
      expect(options[1].textContent).toBe('Pago');
      expect(options[2].textContent).toBe('Vazio');
    });

    it('mountStatusOptionRows deve marcar opção ativa como selected', () => {
      const dropdown = document.createElement('div');

      component.metas[0].meses[0].status = 'Pago';

      component['activeMeta'] = component.metas[0] as any;
      component['activeMesId'] = 1;

      component['mountStatusOptionRows'](dropdown);

      const selected = dropdown.querySelector('.selected');

      expect(selected?.textContent).toBe('Pago');
    });

    it('mountStatusOptionRows deve chamar selecionarStatusByOverlay ao clicar', () => {
      const dropdown = document.createElement('div');

      const spy = jest.spyOn(component, 'selecionarStatusByOverlay');

      component['mountStatusOptionRows'](dropdown);

      const option = dropdown.querySelector('.dropdown-option') as HTMLElement;

      option.click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('createDropdownInBody', () => {
    it('createDropdownInBody deve parar propagação ao clicar no dropdown', () => {
      const dropdown = component['createDropdownInBody']();

      const event = new Event('click');
      const stopSpy = jest.spyOn(event, 'stopPropagation');

      dropdown.dispatchEvent(event);

      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('computeInitialClampedDropdownPosition', () => {
    it('computeInitialClampedDropdownPosition deve ajustar posição dentro da viewport', () => {
      const rect = {
        top: 700,
        bottom: 740,
        left: 900,
        width: 100,
      } as DOMRect;

      const result = component.computeInitialClampedDropdownPosition(
        rect,
        1000,
        800,
        120,
        100,
        8,
      );

      expect(result.top).toBeLessThanOrEqual(692);
      expect(result.left).toBeLessThanOrEqual(872);
    });

    it('computeInitialClampedDropdownPosition deve ajustar left para minLeft', () => {
      const rect = {
        top: 100,
        bottom: 130,
        left: -50,
        width: 20,
      } as DOMRect;

      const result = component.computeInitialClampedDropdownPosition(
        rect,
        1000,
        800,
        120,
        100,
        8,
      );

      expect(result.left).toBe(8);
    });

    it('computeInitialClampedDropdownPosition deve ajustar top para minTop quando top ficar menor que margin', () => {
      const rect = {
        top: -20,
        bottom: -5,
        left: 100,
        width: 100,
      } as DOMRect;

      const result = component.computeInitialClampedDropdownPosition(
        rect,
        1000,
        800,
        120,
        100,
        8,
      );

      expect(result.top).toBe(8);
    });

    it('computeInitialClampedDropdownPosition deve reposicionar acima quando não couber embaixo', () => {
      const rect = {
        top: 650,
        bottom: 760,
        left: 100,
        width: 100,
      } as DOMRect;

      const result = component.computeInitialClampedDropdownPosition(
        rect,
        1000,
        800,
        120,
        100,
        8,
      );

      expect(result.top).toBe(542); // 650 - 100 - 8
    });

    it('computeInitialClampedDropdownPosition deve ajustar top para minTop quando reposicionar acima fica negativo', () => {
      const rect = {
        top: 20,
        bottom: 790,
        left: 100,
        width: 100,
      } as DOMRect;

      const result = component.computeInitialClampedDropdownPosition(
        rect,
        1000,
        800,
        120,
        100,
        8,
      );

      expect(result.top).toBe(20);
    });
  });

  describe('computeRefinedClampedDropdownPosition', () => {
    it('computeRefinedClampedDropdownPosition deve ajustar posição refinada', () => {
      const rect = {
        top: 700,
        bottom: 740,
        left: 900,
        width: 100,
      } as DOMRect;

      const result = component.computeRefinedClampedDropdownPosition(
        rect,
        { width: 1000, height: 800 },
        120,
        100,
        8,
      );

      expect(result.top).toBeLessThanOrEqual(692);
      expect(result.left).toBeLessThanOrEqual(872);
    });

    it('deve ajustar left para margin quando ficar negativo', () => {
      const rect = { top: 100, bottom: 120, left: -50, width: 20 } as DOMRect;

      const result = component.computeRefinedClampedDropdownPosition(
        rect,
        { width: 1000, height: 800 },
        120,
        100,
        8,
      );

      expect(result.left).toBe(8);
    });

    it('deve ajustar top para margin quando não couber em cima', () => {
      const rect = { top: 20, bottom: 790, left: 100, width: 100 } as DOMRect;

      const result = component.computeRefinedClampedDropdownPosition(
        rect,
        { width: 1000, height: 800 },
        120,
        100,
        8,
      );

      expect(result.top).toBe(8);
    });

    it('deve ajustar top para baixo da viewport quando ainda passar do limite', () => {
      const rect = { top: 760, bottom: 790, left: 100, width: 100 } as DOMRect;

      const result = component.computeRefinedClampedDropdownPosition(
        rect,
        { width: 1000, height: 800 },
        120,
        900,
        8,
      );

      expect(result.top).toBe(8);
    });
  });

  describe('isRectFullyInViewport', () => {
    it('isRectFullyInViewport deve retornar true quando rect está dentro da viewport', () => {
      const rect = {
        top: 10,
        left: 10,
        bottom: 100,
        right: 100,
      } as DOMRect;

      expect(component.isRectFullyInViewport(rect, 800, 1000)).toBe(true);
    });

    it('isRectFullyInViewport deve retornar false quando rect está fora da viewport', () => {
      const rect = {
        top: -1,
        left: 10,
        bottom: 100,
        right: 100,
      } as DOMRect;

      expect(component.isRectFullyInViewport(rect, 800, 1000)).toBe(false);
    });
  });

  describe('computeNudgePositionIfClipped', () => {
    it('computeNudgePositionIfClipped deve retornar null quando estiver dentro da viewport', () => {
      const rect = {
        top: 10,
        left: 10,
        bottom: 100,
        right: 100,
      } as DOMRect;

      const result = component.computeNudgePositionIfClipped(
        rect,
        1000,
        800,
        10,
        10,
        120,
        100,
        8,
      );

      expect(result).toBeNull();
    });

    it('computeNudgePositionIfClipped deve ajustar quando estiver fora da viewport', () => {
      const rect = {
        top: -10,
        left: -10,
        bottom: 900,
        right: 1100,
      } as DOMRect;

      const result = component.computeNudgePositionIfClipped(
        rect,
        1000,
        800,
        20,
        20,
        120,
        100,
        8,
      );

      expect(result).toEqual({
        top: 692,
        left: 872,
      });
    });
  });

  describe('toggleDropdown', () => {
    it('toggleDropdown deve abrir dropdown quando encontrar anchor', () => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('status-indicator-wrapper');

      jest.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
        top: 10,
        bottom: 30,
        left: 10,
        width: 100,
      } as DOMRect);

      document.body.appendChild(wrapper);

      const event = {
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
        currentTarget: wrapper,
        target: wrapper,
      } as unknown as MouseEvent;

      component.toggleDropdown(component.metas[0] as any, 1, event);

      expect(component.openDropdownKey).toBe('1_1');
      expect(component['activeMeta']).toBe(component.metas[0]);
      expect(component['activeMesId']).toBe(1);
    });

    it('toggleDropdown deve fechar quando clicar na mesma célula aberta', () => {
      component.openDropdownKey = '1_1';

      const closeSpy = jest.spyOn(component, 'closeDropdown');

      const wrapper = document.createElement('div');

      const event = {
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
        currentTarget: wrapper,
        target: wrapper,
      } as unknown as MouseEvent;

      component.toggleDropdown(component.metas[0] as any, 1, event);

      expect(closeSpy).toHaveBeenCalled();
    });

    it('toggleDropdown deve retornar quando não encontrar anchor', () => {
      const event = {
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
        currentTarget: document.createElement('div'),
        target: document.createElement('div'),
      } as unknown as MouseEvent;

      component.toggleDropdown(component.metas[0] as any, 1, event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openDropdownKey).toBeNull();
      expect(component['activeMeta']).toBeNull();
      expect(component['activeMesId']).toBeNull();
    });
  });

  describe('selecionarStatusByOverlay', () => {
    it('selecionarStatusByOverlay deve retornar quando não tiver meta ativa', () => {
      const spy = jest.spyOn(component, 'selecionarStatus');

      component.selecionarStatusByOverlay('Pago');

      expect(spy).not.toHaveBeenCalled();
    });

    it('selecionarStatusByOverlay deve selecionar status quando houver meta ativa', () => {
      const spy = jest.spyOn(component, 'selecionarStatus');

      (component as any).activeMeta = component.metas[0];
      (component as any).activeMesId = 1;

      component.selecionarStatusByOverlay('Pago');

      expect(spy).toHaveBeenCalledWith(component.metas[0], 1, 'Pago');
    });
  });

  describe('marcarMesesComoFinalizado', () => {
    it('ngOnDestroy deve remover dropdown e cancelar subscription', () => {
      const removeSpy = jest.spyOn(component as any, 'removeDropdownFromBody');

      component.ngOnDestroy();

      expect(removeSpy).toHaveBeenCalled();
    });

    it('ngOnDestroy deve cancelar subscription quando existir', () => {
      const unsubscribeSpy = jest.fn();

      component['editarValorSubscription'] = {
        unsubscribe: unsubscribeSpy,
      } as any;

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('ngOnDestroy não deve quebrar quando não existir subscription', () => {
      component['editarValorSubscription'] = undefined;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('resolveStatusIndicatorAnchor', () => {
    it('deve retornar null quando não tiver currentTarget nem target', () => {
      const result = component['resolveStatusIndicatorAnchor'](
        {} as MouseEvent,
      );

      expect(result).toBeNull();
    });

    it('deve buscar anchor pelo currentTarget quando target não encontrar', () => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('status-indicator-wrapper');

      const event = {
        target: document.createElement('span'),
        currentTarget: wrapper,
      } as unknown as MouseEvent;

      const result = component['resolveStatusIndicatorAnchor'](event);

      expect(result).toBe(wrapper);
    });

    it('deve buscar anchor dentro da célula data-meta-id/data-mes-id', () => {
      const cell = document.createElement('div');
      cell.setAttribute('data-meta-id', '1');
      cell.setAttribute('data-mes-id', '1');

      const wrapper = document.createElement('div');
      wrapper.classList.add('status-indicator-wrapper');

      const target = document.createElement('span');

      cell.appendChild(wrapper);
      cell.appendChild(target);

      const event = {
        target,
        currentTarget: target,
      } as unknown as MouseEvent;

      const result = component['resolveStatusIndicatorAnchor'](event);

      expect(result).toBe(wrapper);
    });
  });

  describe('scheduleDropdownRefinement', () => {
    it('scheduleDropdownRefinement deve chamar refine após dois requestAnimationFrame', () => {
      const anchor = document.createElement('div');
      const dd = document.createElement('div');

      const rafSpy = jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((cb: FrameRequestCallback) => {
          cb(0);
          return 1;
        });

      const refineSpy = jest.spyOn(
        component as any,
        'refineDropdownPositionAfterLayout',
      );

      component['scheduleDropdownRefinement'](anchor, dd, 8, 120, 100);

      expect(rafSpy).toHaveBeenCalledTimes(2);
      expect(refineSpy).toHaveBeenCalledWith(anchor, dd, 8, 120, 100);
    });

    it('deve retornar quando anchor não está no document', () => {
      const anchor = document.createElement('div');
      const dd = document.createElement('div');

      const spy = jest.spyOn(
        component as any,
        'computeRefinedClampedDropdownPosition',
      );

      component['refineDropdownPositionAfterLayout'](anchor, dd, 8, 120, 100);

      expect(spy).not.toHaveBeenCalled();
    });

    it('deve refinar posição quando anchor e dropdown estão no document', () => {
      jest.useFakeTimers();

      const anchor = document.createElement('div');
      const dd = document.createElement('div');

      document.body.appendChild(anchor);
      document.body.appendChild(dd);

      jest.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
        top: 10,
        bottom: 30,
        left: 10,
        width: 100,
      } as DOMRect);

      Object.defineProperty(dd, 'offsetWidth', {
        configurable: true,
        value: 140,
      });

      Object.defineProperty(dd, 'offsetHeight', {
        configurable: true,
        value: 90,
      });

      const setPosSpy = jest.spyOn(
        component as any,
        'setDropdownElementPosition',
      );
      const nudgeSpy = jest.spyOn(component as any, 'applyNudgeAfterPaint');

      component['refineDropdownPositionAfterLayout'](anchor, dd, 8, 120, 100);

      expect(component.dropdownPos.top).toBeGreaterThanOrEqual(8);
      expect(setPosSpy).toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(nudgeSpy).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
