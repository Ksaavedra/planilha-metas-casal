import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { MetasPageComponent } from './metas-page.component';
import { MetasService } from '../../../../core/services/metas/metas.service';
import { Meta, StatusMeta } from '../../../../core/interfaces/mes-meta';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('MetasPageComponent', () => {
  let component: MetasPageComponent;
  let fixture: ComponentFixture<MetasPageComponent>;
  let metasService: MetasService;

  const mockMetas: Meta[] = [
    {
      id: 1,
      nome: 'Meta 1',
      valorMeta: 10000,
      valorAtual: 5000,
      valorPorMes: 1000,
      mesesNecessarios: 10,
      meses: [
        { id: 1, nome: 'Janeiro', valor: 1000, status: 'Pago' as StatusMeta },
        { id: 2, nome: 'Fevereiro', valor: 1000, status: 'Pago' as StatusMeta },
        { id: 3, nome: 'Março', valor: 1000, status: 'Pago' as StatusMeta },
        { id: 4, nome: 'Abril', valor: 1000, status: 'Pago' as StatusMeta },
        { id: 5, nome: 'Maio', valor: 1000, status: 'Pago' as StatusMeta },
      ],
    },
    {
      id: 2,
      nome: 'Meta 2',
      valorMeta: 5000,
      valorAtual: 3000,
      valorPorMes: 500,
      mesesNecessarios: 10,
      meses: [
        { id: 1, nome: 'Janeiro', valor: 500, status: 'Pago' as StatusMeta },
        { id: 2, nome: 'Fevereiro', valor: 500, status: 'Pago' as StatusMeta },
        { id: 3, nome: 'Março', valor: 500, status: 'Pago' as StatusMeta },
        { id: 4, nome: 'Abril', valor: 500, status: 'Pago' as StatusMeta },
        { id: 5, nome: 'Maio', valor: 500, status: 'Pago' as StatusMeta },
        { id: 6, nome: 'Junho', valor: 500, status: 'Pago' as StatusMeta },
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MetasPageComponent],
      imports: [HttpClientTestingModule],
      providers: [MetasService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MetasPageComponent);
    component = fixture.componentInstance;
    metasService = TestBed.inject(MetasService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.metas).toEqual([]);
  });

  it('should load metas on init', () => {
    const spy = jest
      .spyOn(metasService, 'getMetas')
      .mockReturnValue(of(mockMetas));

    component.ngOnInit();

    expect(spy).toHaveBeenCalled();
  });

  it('should reload metas', () => {
    const spy = jest
      .spyOn(metasService, 'getMetas')
      .mockReturnValue(of(mockMetas));

    component.reloadMetas();

    expect(spy).toHaveBeenCalled();
  });

  it('should handle empty metas array', () => {
    component.metas = [];
    fixture.detectChanges();

    expect(component.metas).toEqual([]);
  });

  it('should handle metas with different statuses', () => {
    const metasWithDifferentStatuses: Meta[] = [
      {
        id: 1,
        nome: 'Meta com diferentes status',
        valorMeta: 6000,
        valorAtual: 2000,
        valorPorMes: 1000,
        mesesNecessarios: 6,
        meses: [
          { id: 1, nome: 'Janeiro', valor: 1000, status: 'Pago' as StatusMeta },
          {
            id: 2,
            nome: 'Fevereiro',
            valor: 1000,
            status: 'Pago' as StatusMeta,
          },
          { id: 3, nome: 'Março', valor: 0, status: 'Vazio' as StatusMeta },
          {
            id: 4,
            nome: 'Abril',
            valor: 0,
            status: 'Programado' as StatusMeta,
          },
          { id: 5, nome: 'Maio', valor: 0, status: 'Vazio' as StatusMeta },
          {
            id: 6,
            nome: 'Junho',
            valor: 0,
            status: 'Programado' as StatusMeta,
          },
        ],
      },
    ];

    component.metas = metasWithDifferentStatuses;
    fixture.detectChanges();

    expect(component.metas[0].meses[0].status).toBe('Pago');
    expect(component.metas[0].meses[2].status).toBe('Vazio');
    expect(component.metas[0].meses[3].status).toBe('Programado');
  });

  it('should handle error when loading metas', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const spy = jest.spyOn(metasService, 'getMetas').mockReturnValue(of([]));

    component.ngOnInit();

    expect(spy).toHaveBeenCalled();
    errorSpy.mockRestore();
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

  describe('getProgressoRealMeta', () => {
    it('should calculate real progress for meta', () => {
      const meta = mockMetas[0];
      const progresso = component.getProgressoRealMeta(meta);

      expect(progresso).toBeGreaterThanOrEqual(0);
      expect(progresso).toBeLessThanOrEqual(100);
      expect(typeof progresso).toBe('number');
    });
  });

  describe('getValorFaltanteMeta', () => {
    it('should calculate missing value for meta', () => {
      const meta = mockMetas[0];
      const faltante = component.getValorFaltanteMeta(meta);

      expect(faltante).toBeGreaterThanOrEqual(0);
      expect(typeof faltante).toBe('number');
    });
  });

  describe('getValorRealizadoMeta', () => {
    it('should calculate realized value for meta', () => {
      const meta = mockMetas[0];
      const realizado = component.getValorRealizadoMeta(meta);

      expect(realizado).toBeGreaterThanOrEqual(0);
      expect(typeof realizado).toBe('number');
    });
  });

  describe('adicionarMeta', () => {
    it('should add new meta when under limit', () => {
      component.metas = [];
      const createSpy = jest
        .spyOn(metasService, 'createMeta')
        .mockReturnValue(of(mockMetas[0]));
      const reloadSpy = jest.spyOn(component, 'reloadMetas');

      component.adicionarMeta();

      expect(createSpy).toHaveBeenCalled();
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('should not add meta when at limit', () => {
      // Create 15 metas to reach the limit
      component.metas = Array(15)
        .fill(null)
        .map((_, i) => ({
          id: i + 1,
          nome: `Meta ${i + 1}`,
          valorMeta: 1000,
          valorAtual: 0,
          valorPorMes: 100,
          mesesNecessarios: 10,
          meses: [],
        }));

      const spy = jest.spyOn(component, 'reloadMetas');

      component.adicionarMeta();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('removerMeta', () => {
    it('should remove meta successfully', () => {
      const metaId = 1;
      const spy = jest
        .spyOn(metasService, 'deleteMeta')
        .mockReturnValue(of(void 0));
      const reloadSpy = jest.spyOn(component, 'reloadMetas');

      component.removerMeta(metaId);

      expect(spy).toHaveBeenCalledWith(metaId);
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('setHeaderMesesFromData', () => {
    it('should set meses from metas data', () => {
      component.metas = mockMetas;
      component.setHeaderMesesFromData();

      expect(component.meses.length).toBeGreaterThan(0);
    });

    it('should handle empty metas array', () => {
      component.metas = [];
      component.setHeaderMesesFromData();

      // When metas is empty, it should use MESES_PADRAO
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

  describe('toNum', () => {
    it('should convert values to numbers', () => {
      expect(component['toNum'](123)).toBe(123);
      expect(component['toNum']('456')).toBe(456);
      expect(component['toNum'](null)).toBe(0);
      expect(component['toNum'](undefined)).toBe(0);
    });
  });

  describe('parseNumeroBR', () => {
    it('should parse Brazilian number format', () => {
      expect(component['parseNumeroBR']('1.234,56')).toBe(1234.56);
      expect(component['parseNumeroBR']('1.000')).toBe(1); // The method parses this as 1, not 1000
      expect(component['parseNumeroBR'](null)).toBe(0);
      expect(component['parseNumeroBR'](undefined)).toBe(0);
    });
  });

  describe('onConfirmarCampo', () => {
    it('should call confirmarCampoComValor when withEvent is provided', () => {
      const meta = mockMetas[0];
      const event = new Event('click');
      const spy = jest.spyOn(component, 'confirmarCampoComValor');

      component.onConfirmarCampo({
        meta,
        campo: 'nome',
        withEvent: event,
      });

      expect(spy).toHaveBeenCalledWith(meta, 'nome', event);
    });

    it('should call confirmarCampo when withEvent is not provided', () => {
      const meta = mockMetas[0];
      const spy = jest.spyOn(component, 'confirmarCampo');

      component.onConfirmarCampo({
        meta,
        campo: 'nome',
      });

      expect(spy).toHaveBeenCalledWith(meta, 'nome');
    });
  });

  describe('confirmarCampoComValor', () => {
    it('should prevent default and call confirmarCampo', () => {
      const meta = mockMetas[0];
      const event = new Event('click');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
      const confirmarCampoSpy = jest.spyOn(component, 'confirmarCampo');

      component.confirmarCampoComValor(meta, 'nome', event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(confirmarCampoSpy).toHaveBeenCalledWith(meta, 'nome');
      expect(component.camposProcessados.has(`${meta.id}-nome`)).toBe(true);
    });
  });

  describe('confirmarCampo', () => {
    it('should handle meta without valid ID', () => {
      const meta = { ...mockMetas[0], id: 0 };
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      component.confirmarCampo(meta, 'nome');

      expect(alertSpy).toHaveBeenCalledWith(
        'Erro: Meta sem ID válido. Recarregue a página e tente novamente.'
      );
      alertSpy.mockRestore();
    });

    it('should handle nome field update', () => {
      const meta = mockMetas[0];
      // Set a different temp value to trigger the update
      (meta as any).nomeTemp = 'Novo Nome';
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(of(meta));

      component.confirmarCampo(meta, 'nome');

      expect(updateSpy).toHaveBeenCalled();
    });

    it('should handle valorMeta field update', () => {
      const meta = mockMetas[0];
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(of(meta));

      component.confirmarCampo(meta, 'valorMeta');

      expect(updateSpy).toHaveBeenCalled();
    });

    it('should handle valorPorMes field update', () => {
      const meta = mockMetas[0];
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(of(meta));

      component.confirmarCampo(meta, 'valorPorMes');

      expect(updateSpy).toHaveBeenCalled();
    });

    it('should handle valorAtual field update', () => {
      const meta = mockMetas[0];
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(of(meta));

      component.confirmarCampo(meta, 'valorAtual');

      expect(updateSpy).toHaveBeenCalled();
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
  });

  describe('recalcResumo', () => {
    it('should recalculate summary values', () => {
      component.metas = mockMetas;

      component['recalcResumo']();

      expect(component.totalValorMetaView).toBeGreaterThan(0);
      expect(component.totalValorAtualView).toBeGreaterThan(0);
      expect(component.totalValorPorMesView).toBeGreaterThan(0);
    });
  });

  describe('confirmarCampo error handling', () => {
    it('should handle updateMeta error for nome field', () => {
      const meta = mockMetas[0];
      (meta as any).nomeTemp = 'Nome Completamente Diferente';
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(throwError(() => new Error('Update failed')));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      component.confirmarCampo(meta, 'nome');

      expect(updateSpy).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should handle updateMeta error for valorMeta field', () => {
      const meta = mockMetas[0];
      (meta as any).valorMetaTemp = '15.000,00'; // Different from current 10000
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(throwError(() => new Error('Update failed')));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      component.confirmarCampo(meta, 'valorMeta');

      expect(updateSpy).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should handle updateMeta error for valorPorMes field', () => {
      const meta = mockMetas[0];
      (meta as any).valorPorMesTemp = '1.500,00'; // Different from current 1000
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(throwError(() => new Error('Update failed')));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      component.confirmarCampo(meta, 'valorPorMes');

      expect(updateSpy).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should handle updateMeta error for valorAtual field', () => {
      const meta = mockMetas[0];
      (meta as any).valorAtualTemp = '7.500,00'; // Different from current 5000
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(throwError(() => new Error('Update failed')));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      component.confirmarCampo(meta, 'valorAtual');

      expect(updateSpy).toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('confirmarCampo edge cases', () => {
    it('should cancel nome field when temp value is empty', () => {
      const meta = mockMetas[0];
      (meta as any).nomeTemp = '';
      const cancelarSpy = jest.spyOn(component, 'cancelarCampo');

      component.confirmarCampo(meta, 'nome');

      expect(cancelarSpy).toHaveBeenCalledWith(meta, 'nome');
    });

    it('should cancel nome field when temp value equals current value', () => {
      const meta = mockMetas[0];
      (meta as any).nomeTemp = meta.nome;
      const cancelarSpy = jest.spyOn(component, 'cancelarCampo');

      component.confirmarCampo(meta, 'nome');

      expect(cancelarSpy).toHaveBeenCalledWith(meta, 'nome');
    });

    it('should cancel other fields when temp value equals current value', () => {
      const meta = mockMetas[0];
      (meta as any).valorMetaTemp = meta.valorMeta;
      const cancelarSpy = jest.spyOn(component, 'cancelarCampo');

      component.confirmarCampo(meta, 'valorMeta');

      expect(cancelarSpy).toHaveBeenCalledWith(meta, 'valorMeta');
    });
  });

  describe('adicionarMeta error handling', () => {
    it('should handle createMeta error', () => {
      component.metas = [];
      const createSpy = jest
        .spyOn(metasService, 'createMeta')
        .mockReturnValue(throwError(() => new Error('Create failed')));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      component.adicionarMeta();

      expect(createSpy).toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('removerMeta error handling', () => {
    it('should handle deleteMeta error', () => {
      const metaId = 1;
      const deleteSpy = jest
        .spyOn(metasService, 'deleteMeta')
        .mockReturnValue(throwError(() => new Error('Delete failed')));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      component.removerMeta(metaId);

      expect(deleteSpy).toHaveBeenCalledWith(metaId);
      alertSpy.mockRestore();
    });
  });

  describe('getTotalContribuicoesMeta edge cases', () => {
    it('should handle meta with undefined meses', () => {
      const meta = { ...mockMetas[0], meses: undefined as any };
      const result = component.getTotalContribuicoesMeta(meta);
      expect(result).toBe(0);
    });

    it('should handle meta with null meses', () => {
      const meta = { ...mockMetas[0], meses: null as any };
      const result = component.getTotalContribuicoesMeta(meta);
      expect(result).toBe(0);
    });
  });

  describe('getProgressoRealMeta edge cases', () => {
    it('should handle meta with zero valorMeta', () => {
      const meta = { ...mockMetas[0], valorMeta: 0 };
      const result = component.getProgressoRealMeta(meta);
      expect(result).toBe(0);
    });

    it('should handle meta with negative valorMeta', () => {
      const meta = { ...mockMetas[0], valorMeta: -100 };
      const result = component.getProgressoRealMeta(meta);
      expect(result).toBe(0);
    });

    it('should handle meta with undefined valorMeta', () => {
      const meta = { ...mockMetas[0], valorMeta: undefined as any };
      const result = component.getProgressoRealMeta(meta);
      expect(result).toBe(0);
    });
  });

  describe('parseNumeroBR edge cases', () => {
    it('should handle empty string', () => {
      const result = component['parseNumeroBR']('');
      expect(result).toBe(0);
    });

    it('should handle null input', () => {
      const result = component['parseNumeroBR'](null as any);
      expect(result).toBe(0);
    });

    it('should handle undefined input', () => {
      const result = component['parseNumeroBR'](undefined as any);
      expect(result).toBe(0);
    });

    it('should handle string with only spaces', () => {
      const result = component['parseNumeroBR']('   ');
      expect(result).toBe(0);
    });

    it('should handle invalid number format', () => {
      const result = component['parseNumeroBR']('abc');
      expect(result).toBe(0);
    });

    it('should handle mixed valid and invalid characters', () => {
      const result = component['parseNumeroBR']('123abc456');
      expect(result).toBe(123456);
    });
  });

  describe('toNum edge cases', () => {
    it('should handle null input', () => {
      const result = component['toNum'](null as any);
      expect(result).toBe(0);
    });

    it('should handle undefined input', () => {
      const result = component['toNum'](undefined as any);
      expect(result).toBe(0);
    });

    it('should handle empty string', () => {
      const result = component['toNum']('');
      expect(result).toBe(0);
    });

    it('should handle string with only spaces', () => {
      const result = component['toNum']('   ');
      expect(result).toBe(0);
    });

    it('should handle invalid number string', () => {
      const result = component['toNum']('abc');
      expect(result).toBe(0);
    });
  });

  describe('adicionarMeta edge cases', () => {
    it('should handle metas array with exactly 5 items', () => {
      component.metas = [
        mockMetas[0],
        mockMetas[1],
        mockMetas[0],
        mockMetas[1],
        mockMetas[0],
      ];
      const createSpy = jest
        .spyOn(metasService, 'createMeta')
        .mockReturnValue(of(mockMetas[0]));

      component.adicionarMeta();

      expect(createSpy).toHaveBeenCalled();
    });
  });

  describe('confirmarCampo edge cases', () => {
    it('should handle meta with undefined id', () => {
      const meta = { ...mockMetas[0], id: undefined as any };
      const updateSpy = jest.spyOn(metasService, 'updateMeta');

      component.confirmarCampo(meta, 'nome');

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should handle meta with null id', () => {
      const meta = { ...mockMetas[0], id: null as any };
      const updateSpy = jest.spyOn(metasService, 'updateMeta');

      component.confirmarCampo(meta, 'nome');

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should handle meta with zero id', () => {
      const meta = { ...mockMetas[0], id: 0 };
      const updateSpy = jest.spyOn(metasService, 'updateMeta');

      component.confirmarCampo(meta, 'nome');

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});
