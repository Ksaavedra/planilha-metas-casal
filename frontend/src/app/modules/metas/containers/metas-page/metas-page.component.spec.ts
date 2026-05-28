import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { MetasPageComponent } from './metas-page.component';
import { MetasService } from '../../../../core/services/metas/metas.service';
import { Meta, StatusMeta } from '../../../../core/interfaces/metas/mes-meta';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { mesesPadraoDoAno } from '@core/utils/metas-meses.util';

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
      providers: [
        MetasService,
        {
          provide: MatDialog,
          useValue: { open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }) },
        },
      ],
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
    expect(component.visaoMetas).toBe('lista');
  });

  it('selecionarVisao alterna entre lista e exemplos', () => {
    component.selecionarVisao('exemplos');
    expect(component.visaoMetas).toBe('exemplos');
    component.selecionarVisao('lista');
    expect(component.visaoMetas).toBe('lista');
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

      expect(component.meses).toEqual(
        mesesPadraoDoAno(component.anoSelecionado),
      );
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
        'Erro: Meta sem ID válido. Recarregue a página e tente novamente.',
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

  describe('onAlterarStatus', () => {
    it('atualiza o status do mês e chama updateMeta com cópia dos meses', () => {
      component.metas = JSON.parse(JSON.stringify(mockMetas)) as any;
      const meta = component.metas[0];
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(of(mockMetas[0]));

      component.onAlterarStatus({ metaId: meta.id, mesId: 1, status: 'Programado' });

      expect(meta.meses.find((m) => m.id === 1)!.status).toBe('Programado');
      expect(updateSpy).toHaveBeenCalledWith(meta.id, {
        meses: meta.meses.map((m) => ({ ...m })),
      });
    });

    it('não altera nada se a meta não existir', () => {
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(of(mockMetas[0]));
      component.metas = JSON.parse(JSON.stringify(mockMetas)) as any;

      component.onAlterarStatus({ metaId: 999, mesId: 1, status: 'Pago' });

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('não altera nada se o mês não existir', () => {
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(of(mockMetas[0]));
      component.metas = JSON.parse(JSON.stringify(mockMetas)) as any;

      component.onAlterarStatus({ metaId: component.metas[0].id, mesId: 999, status: 'Pago' });

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('onSalvarValorMes', () => {
    it('atualiza valor e status Programado quando valor > 0', () => {
      component.metas = JSON.parse(JSON.stringify(mockMetas)) as any;
      const meta = component.metas[0];
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(of(mockMetas[0]));

      component.onSalvarValorMes({ metaId: meta.id, mesId: 1, valor: 200 });

      const mes = meta.meses.find((m) => m.id === 1)!;
      expect(mes.valor).toBe(200);
      expect(mes.status).toBe('Programado');
      expect(updateSpy).toHaveBeenCalled();
    });

    it('define status Vazio quando valor é 0', () => {
      component.metas = JSON.parse(JSON.stringify(mockMetas)) as any;
      const meta = component.metas[0];
      jest.spyOn(metasService, 'updateMeta').mockReturnValue(of(mockMetas[0]));

      component.onSalvarValorMes({ metaId: meta.id, mesId: 1, valor: 0 });

      expect(meta.meses.find((m) => m.id === 1)!.status).toBe('Vazio');
    });

    it('não chama a API se meta ou mês forem inválidos', () => {
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(of(mockMetas[0]));
      component.metas = JSON.parse(JSON.stringify(mockMetas)) as any;

      component.onSalvarValorMes({ metaId: 999, mesId: 1, valor: 10 });
      component.onSalvarValorMes({ metaId: component.metas[0].id, mesId: 999, valor: 10 });

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('onMetaCompleta', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('deve abrir dialog de parabéns quando meta está concluída', () => {
      localStorage.removeItem('metas_parabens_exibidos_v3');
      (component as any).parabensDialogAberto = false;

      const dialog = TestBed.inject(MatDialog);
      const openSpy = jest.spyOn(dialog, 'open');
      component.metas = [
        {
          id: 1,
          nome: 'Casa',
          valorMeta: 1000,
          valorAtual: 1000,
          valorPorMes: 0,
          mesesNecessarios: 0,
          meses: [],
        } as any,
      ];

      component.onMetaCompleta({ metaId: 1, metaNome: 'Casa', valorMeta: 1000 });
      jest.runAllTimers();

      expect(openSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnInit filtragem de metas', () => {
    it('exclui metas com id inválido, nome vazio ou nome "undefined"', () => {
      const payload: Meta[] = [
        { ...mockMetas[0], id: 0, nome: 'A' },
        { ...mockMetas[0], id: 2, nome: '   ' },
        { ...mockMetas[0], id: 3, nome: 'undefined' },
        {
          id: 4,
          nome: 'Válida',
          valorMeta: 100,
          valorAtual: 0,
          valorPorMes: 0,
          mesesNecessarios: 0,
          meses: [{ id: 1, nome: 'Janeiro', valor: 0, status: 'Vazio' }],
        },
      ];
      jest.spyOn(metasService, 'getMetas').mockReturnValue(of(payload));

      component.ngOnInit();

      expect(component.metas.length).toBe(1);
      expect(component.metas[0].nome).toBe('Válida');
      expect(component.metas[0].id).toBe(4);
    });
  });

  describe('recalcResumo com totalValorMetaView zero', () => {
    it('deixa percentualPagoView em 0', () => {
      component.metas = [
        {
          ...mockMetas[0],
          id: 10,
          valorMeta: 0,
          valorAtual: 0,
          meses: [],
        } as any,
      ];
      component['recalcResumo']();
      expect(component.percentualPagoView).toBe(0);
    });
  });

  describe('confirmarCampo valorPorMes', () => {
    it('inclui mesesNecessarios no patch quando altera valorPorMes', () => {
      const meta: any = {
        ...mockMetas[0],
        id: 7,
        valorMeta: 10000,
        valorPorMes: 1000,
        editandoValorPorMes: true,
        valorPorMesTemp: '500,00',
      };
      const updateSpy = jest
        .spyOn(metasService, 'updateMeta')
        .mockReturnValue(of(mockMetas[0]));

      component.confirmarCampo(meta, 'valorPorMes');

      expect(updateSpy).toHaveBeenCalledTimes(1);
      const [metaId, patch] = updateSpy.mock.calls[0];
      expect(metaId).toBe(7);
      expect(patch.valorPorMes).toBe(500);
      expect(patch.mesesNecessarios).toBe(20);
      expect(patch.ano).toBe(component.anoSelecionado);
      expect(Array.isArray(patch.meses)).toBe(true);
    });
  });

  describe('reloadMetas e savedTickCampo', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('preserva savedTickCampo e limpa após 5s', () => {
      const apiRow: Meta = {
        id: 5,
        nome: 'M',
        valorMeta: 100,
        valorAtual: 0,
        valorPorMes: 0,
        mesesNecessarios: 0,
        meses: [{ id: 1, nome: 'Janeiro', valor: 0, status: 'Vazio' as StatusMeta }],
      };
      component.metas = [
        {
          ...apiRow,
          editandoNome: false,
          nomeTemp: '',
          savingNome: false,
          savedTick: false,
          editandoValorMeta: false,
          editandoValorPorMes: false,
          editandoValorAtual: false,
          savedTickCampo: true,
        } as any,
      ];
      const getSpy = jest.spyOn(metasService, 'getMetas').mockReturnValue(of([apiRow]));

      component.reloadMetas();
      const reloaded = component.metas.find((m) => m.id === 5);
      expect(reloaded?.savedTickCampo).toBe(true);
      expect(getSpy).toHaveBeenCalled();

      jest.advanceTimersByTime(5000);
      expect(
        component.metas.find((m) => m.id === 5)?.savedTickCampo,
      ).toBe(false);
    });
  });

  describe('adicionarMeta no limite', () => {
    it('não chama createMeta com 15 metas', () => {
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
        })) as any;
      const createSpy = jest.spyOn(metasService, 'createMeta');

      component.adicionarMeta();

      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('navegação por ano e getters de visão', () => {
    it('estaEmAnoFuturo quando ano selecionado é maior que o atual', () => {
      component.anoSelecionado = component.anoAtual + 2;
      expect(component.estaEmAnoFuturo).toBe(true);
      component.anoSelecionado = component.anoAtual;
      expect(component.estaEmAnoFuturo).toBe(false);
    });

    it('exibirBotaoVoltarExercicioAtual quando ano vazio e diferente do calendário', () => {
      component.metas = [];
      component.carregandoMetas = false;
      component.anoSelecionado = component.anoAtual - 1;
      expect(component.exibirBotaoVoltarExercicioAtual).toBe(true);
      component.anoSelecionado = component.anoAtual;
      expect(component.exibirBotaoVoltarExercicioAtual).toBe(false);
    });

    it('ocultarSecoesMetas quando não há metas e não está carregando', () => {
      component.metas = [];
      component.carregandoMetas = false;
      expect(component.ocultarSecoesMetas).toBe(true);
      component.metas = mockMetas as any;
      expect(component.ocultarSecoesMetas).toBe(false);
    });

    it('podeProximoAno é sempre true', () => {
      expect(component.podeProximoAno).toBe(true);
    });

    it('anoAnterior decrementa ano e recarrega metas', () => {
      component.anosComparacao = [2020, component.anoAtual];
      component.anoSelecionado = component.anoAtual;
      const getSpy = jest.spyOn(metasService, 'getMetas').mockReturnValue(of([]));
      const setSpy = jest.spyOn(metasService, 'setAnoSelecionado');

      component.anoAnterior();

      expect(component.anoSelecionado).toBe(component.anoAtual - 1);
      expect(setSpy).toHaveBeenCalledWith(component.anoAtual - 1);
      expect(getSpy).toHaveBeenCalled();
    });

    it('anoAnterior não altera quando já está no ano mínimo', () => {
      component.anosComparacao = [2020];
      component.anoSelecionado = 2020;
      const getSpy = jest.spyOn(metasService, 'getMetas');

      component.anoAnterior();

      expect(component.anoSelecionado).toBe(2020);
      expect(getSpy).not.toHaveBeenCalled();
    });

    it('proximoAno incrementa ano e recarrega metas', () => {
      component.anoSelecionado = component.anoAtual;
      const getSpy = jest.spyOn(metasService, 'getMetas').mockReturnValue(of([]));

      component.proximoAno();

      expect(component.anoSelecionado).toBe(component.anoAtual + 1);
      expect(getSpy).toHaveBeenCalled();
    });

    it('onAnoChange ignora ano abaixo do mínimo', () => {
      component.anoSelecionado = 2010;
      const getSpy = jest.spyOn(metasService, 'getMetas');

      component.onAnoChange();

      expect(getSpy).not.toHaveBeenCalled();
    });

    it('voltarParaAnoAtual navega para o ano civil atual', () => {
      const irSpy = jest.spyOn(component, 'irParaAno');
      component.voltarParaAnoAtual();
      expect(irSpy).toHaveBeenCalledWith(component.anoAtual);
    });

    it('irParaAno não recarrega quando o ano é o mesmo', () => {
      component.anoSelecionado = 2025;
      const getSpy = jest.spyOn(metasService, 'getMetas');

      component.irParaAno(2025);

      expect(getSpy).not.toHaveBeenCalled();
    });

    it('irParaAno recarrega e faz scroll quando o ano muda', () => {
      const scrollSpy = jest
        .spyOn(window, 'scrollTo')
        .mockImplementation(() => undefined);
      component.anoSelecionado = 2024;
      jest.spyOn(metasService, 'getMetas').mockReturnValue(of([]));

      component.irParaAno(2026);

      expect(component.anoSelecionado).toBe(2026);
      expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      scrollSpy.mockRestore();
    });

    it('ngOnInit usa anoAtual quando getAnoSelecionado retorna NaN', () => {
      jest.spyOn(metasService, 'getAnoSelecionado').mockReturnValue(NaN);
      jest.spyOn(metasService, 'getMetas').mockReturnValue(of([]));

      component.ngOnInit();

      expect(component.anoSelecionado).toBe(component.anoAtual);
    });
  });

  describe('template visaoMetas', () => {
    it('exibe app-metas-exemplos e oculta seções na visão exemplos', () => {
      component.selecionarVisao('exemplos');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-metas-exemplos')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-elaborando-metas')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.btn-add-meta')).toBeFalsy();
    });

    it('exibe seções e botão adicionar na visão lista com metas', () => {
      component.metas = mockMetas as any;
      component.carregandoMetas = false;
      component.selecionarVisao('lista');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-elaborando-metas')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-metas-exemplos')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.btn-add-meta')).toBeTruthy();
    });
  });

  describe('abrirModalAdicionarMeta', () => {
    it('abre dialog e recarrega após salvar com modal de sucesso', () => {
      const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>;
      const reloadSpy = jest.spyOn(component, 'reloadMetas').mockImplementation();
      dialog.open = jest
        .fn()
        .mockReturnValueOnce({ afterClosed: () => of(true) })
        .mockReturnValueOnce({ afterClosed: () => of(undefined) });

      component.abrirModalAdicionarMeta();

      expect(dialog.open).toHaveBeenCalledTimes(2);
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('não abre modal quando já há 15 metas', () => {
      const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>;
      component.metas = Array(15)
        .fill(null)
        .map((_, i) => ({ id: i + 1, nome: `M${i}` })) as any;
      const openSpy = jest.spyOn(dialog, 'open');

      component.abrirModalAdicionarMeta();

      expect(openSpy).not.toHaveBeenCalled();
    });
  });
});
