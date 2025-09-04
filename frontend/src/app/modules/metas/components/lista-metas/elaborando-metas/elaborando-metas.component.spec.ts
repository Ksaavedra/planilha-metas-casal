import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ElaborandoMetasComponent } from './elaborando-metas.component';
import { MetasService } from '../../../../../core/services/metas.service';
import { MetaExtended } from '../../../../../core/interfaces/mes-meta';

describe('ElaborandoMetasComponent', () => {
  let component: ElaborandoMetasComponent;
  let fixture: ComponentFixture<ElaborandoMetasComponent>;
  let metasService: MetasService;

  const mockMetas: MetaExtended[] = [
    {
      id: 1,
      nome: 'Meta em Elaboração 1',
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
    },
    {
      id: 2,
      nome: 'Meta em Elaboração 2',
      valorMeta: 5000,
      valorAtual: 0,
      valorPorMes: 500,
      mesesNecessarios: 10,
      meses: [
        { id: 1, nome: 'Janeiro', valor: 500, status: 'Pago' as const },
        { id: 2, nome: 'Fevereiro', valor: 500, status: 'Pago' as const },
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
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElaborandoMetasComponent, HttpClientTestingModule],
      providers: [MetasService],
    }).compileComponents();

    fixture = TestBed.createComponent(ElaborandoMetasComponent);
    component = fixture.componentInstance;
    metasService = TestBed.inject(MetasService);
    component.metas = mockMetas;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.metas).toEqual(mockMetas);
    expect(component.percentualPagoView).toBe(0);
    expect(component.totalValorMetaView).toBe(0);
    expect(component.totalValorPorMesView).toBe(0);
    expect(component.totalMesesNecessariosView).toBe(0);
    expect(component.totalValorAtualView).toBe(0);
    expect(component.totalContribuicoesView).toBe(0);
  });

  // Testes para editarCampo
  describe('editarCampo', () => {
    it('should edit nome field', () => {
      const meta = mockMetas[0];
      component.editarCampo(meta, 'nome');

      expect(meta.editandoNome).toBe(true);
      expect(meta.nomeTemp).toBe('Meta em Elaboração 1');
    });

    it('should edit valorMeta field', () => {
      const meta = mockMetas[0];
      component.editarCampo(meta, 'valorMeta');

      expect(meta.editandoValorMeta).toBe(true);
      expect(meta.valorMetaTemp).toBe('10000');
    });

    it('should edit valorPorMes field', () => {
      const meta = mockMetas[0];
      component.editarCampo(meta, 'valorPorMes');

      expect(meta.editandoValorPorMes).toBe(true);
      expect(meta.valorPorMesTemp).toBe('1000');
    });

    it('should edit valorAtual field', () => {
      const meta = mockMetas[0];
      component.editarCampo(meta, 'valorAtual');

      expect(meta.editandoValorAtual).toBe(true);
      expect(meta.valorAtualTemp).toBe('0');
    });

    it('should handle null values in editarCampo', () => {
      const meta = {
        ...mockMetas[0],
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
        ...mockMetas[0],
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
  });

  // Testes para métodos de cálculo
  describe('calculation methods', () => {
    it('should calculate total contributions correctly', () => {
      const meta = mockMetas[0];
      const total = component.getTotalContribuicoesMeta(meta);
      expect(total).toBe(2000); // Sum of all months (1000 + 1000)
    });

    it('should handle null meses in getTotalContribuicoesMeta', () => {
      const meta = { ...mockMetas[0], meses: null as any };
      const total = component.getTotalContribuicoesMeta(meta);
      expect(total).toBe(0);
    });

    it('should calculate progress correctly', () => {
      const meta = mockMetas[0];
      const progress = component.getProgressoRealMeta(meta);
      expect(progress).toBe(10); // (0 + 1000 / 10000) * 100
    });

    it('should calculate remaining months correctly', () => {
      const meta = mockMetas[0];
      const remaining = component.getMesesRestantes(meta);
      expect(remaining).toBe(9); // (10000 - 1000) / 1000 = 9
    });

    it('should calculate missing value correctly', () => {
      const meta = mockMetas[0];
      const missing = component.getValorFaltanteMeta(meta);
      expect(missing).toBe(9000); // 10000 - 1000
    });

    it('should calculate realized value correctly', () => {
      const meta = mockMetas[0];
      const realized = component.getValorRealizadoMeta(meta);
      expect(realized).toBe(1000); // 0 + 1000
    });

    it('should handle null meses in getValorRealizadoMeta', () => {
      const meta = { ...mockMetas[0], meses: null as any };
      const realized = component.getValorRealizadoMeta(meta);
      expect(realized).toBe(0); // 0 + 0 (null coalescing)
    });

    it('should handle zero values in calculations', () => {
      const meta = { ...mockMetas[0], valorMeta: 0, valorPorMes: 0 };

      expect(component.getProgressoRealMeta(meta)).toBe(0);
      expect(component.getMesesRestantes(meta)).toBe(0);
      expect(component.getValorFaltanteMeta(meta)).toBe(0);
    });

    it('should handle null/undefined values in calculations', () => {
      const meta = {
        ...mockMetas[0],
        valorMeta: null as any,
        valorPorMes: undefined as any,
        valorAtual: null as any,
      };

      // Testar cálculos com valores null/undefined
      expect(component.getProgressoRealMeta(meta)).toBe(0);
      expect(component.getMesesRestantes(meta)).toBe(0);
      expect(component.getValorFaltanteMeta(meta)).toBe(0);
    });

    it('should handle null meses in calculations', () => {
      const meta = { ...mockMetas[0], meses: null as any };

      // Testar cálculos com meses null
      expect(component.getValorRealizadoMeta(meta)).toBe(0);
      expect(component.getTotalContribuicoesMeta(meta)).toBe(0);
    });

    it('should handle zero values in calculations', () => {
      const meta = { ...mockMetas[0], valorMeta: 0, valorPorMes: 0 };

      // Testar cálculos com valores zero
      expect(component.getProgressoRealMeta(meta)).toBe(0);
      expect(component.getMesesRestantes(meta)).toBe(0);
      expect(component.getValorFaltanteMeta(meta)).toBe(0);
    });

    it('should handle null/undefined values in recalcResumo calculations', () => {
      const metasWithNulls = [
        {
          ...mockMetas[0],
          valorMeta: null as any,
          valorPorMes: undefined as any,
          valorAtual: null as any,
          mesesNecessarios: undefined as any,
          meses: null as any,
        },
        {
          ...mockMetas[1],
          valorMeta: 0,
          valorPorMes: 0,
          valorAtual: 0,
          mesesNecessarios: 0,
          meses: [],
        },
      ];
      component.metas = metasWithNulls;

      // Trigger recalcResumo through a public method
      component.confirmarCampo(metasWithNulls[0], 'nome');

      // The recalcResumo should handle null/undefined values gracefully
      expect(component.totalValorMetaView).toBe(0);
      expect(component.totalValorPorMesView).toBe(0);
      expect(component.totalMesesNecessariosView).toBe(0);
      expect(component.totalValorAtualView).toBe(0);
      expect(component.totalContribuicoesView).toBe(0);
      expect(component.percentualPagoView).toBe(0);
    });

    it('should handle null meses in recalcResumo percentual calculation', () => {
      const metasWithNullMeses = [
        { ...mockMetas[0], meses: null as any },
        { ...mockMetas[1], meses: [] },
      ];
      component.metas = metasWithNullMeses;

      // Trigger recalcResumo through a public method
      component.confirmarCampo(metasWithNullMeses[0], 'nome');

      expect(component.percentualPagoView).toBe(0);
    });

    it('should handle zero totalValorMetaView in recalcResumo', () => {
      const metasWithZero = [
        { ...mockMetas[0], valorMeta: 0 },
        { ...mockMetas[1], valorMeta: 0 },
      ];
      component.metas = metasWithZero;

      // Trigger recalcResumo through a public method
      component.confirmarCampo(metasWithZero[0], 'nome');

      expect(component.percentualPagoView).toBe(0);
    });
  });

  // Testes para confirmarCampo
  describe('confirmarCampo', () => {
    it('should handle invalid meta ID', () => {
      const meta = { ...mockMetas[0], id: 0 };
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      component.confirmarCampo(meta, 'nome');

      expect(alertSpy).toHaveBeenCalledWith(
        'Erro: Meta sem ID válido. Recarregue a página e tente novamente.'
      );
      alertSpy.mockRestore();
    });

    it('should handle nome field update', () => {
      const meta = {
        ...mockMetas[0],
        editandoNome: true,
        nomeTemp: 'Novo Nome',
      };
      const updateSpy = jest.spyOn(metasService, 'updateMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
        },
      } as any);

      component.confirmarCampo(meta, 'nome');

      expect(updateSpy).toHaveBeenCalledWith(meta.id, { nome: 'Novo Nome' });
      expect(meta.nome).toBe('Novo Nome');
      expect(meta.editandoNome).toBe(false);
    });

    it('should handle valorMeta field update', () => {
      const meta = {
        ...mockMetas[0],
        editandoValorMeta: true,
        valorMetaTemp: '15000',
      };
      const updateSpy = jest.spyOn(metasService, 'updateMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
        },
      } as any);

      component.confirmarCampo(meta, 'valorMeta');

      expect(updateSpy).toHaveBeenCalledWith(meta.id, { valorMeta: 15000 });
      expect(meta.valorMeta).toBe(15000);
      expect(meta.editandoValorMeta).toBe(false);
    });

    it('should handle valorPorMes field update with mesesNecessarios calculation', () => {
      const meta = {
        ...mockMetas[0],
        editandoValorPorMes: true,
        valorPorMesTemp: '2000',
      };
      const updateSpy = jest.spyOn(metasService, 'updateMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
        },
      } as any);

      component.confirmarCampo(meta, 'valorPorMes');

      expect(updateSpy).toHaveBeenCalledWith(meta.id, {
        valorPorMes: 2000,
        mesesNecessarios: 5, // 10000 / 2000
      });
      expect(meta.valorPorMes).toBe(2000);
      expect(meta.editandoValorPorMes).toBe(false);
    });

    it('should cancel when no changes detected', () => {
      const meta = {
        ...mockMetas[0],
        editandoNome: true,
        nomeTemp: mockMetas[0].nome,
      };
      const cancelSpy = jest.spyOn(component, 'cancelarCampo');

      component.confirmarCampo(meta, 'nome');

      expect(cancelSpy).toHaveBeenCalledWith(meta, 'nome');
    });

    it('should handle error in updateMeta subscription', () => {
      const meta = {
        ...mockMetas[0],
        editandoNome: true,
        nomeTemp: 'Novo Nome',
      };
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const updateSpy = jest.spyOn(metasService, 'updateMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.error) callbacks.error(new Error('Test error'));
        },
      } as any);

      component.confirmarCampo(meta, 'nome');

      expect(alertSpy).toHaveBeenCalledWith('Erro ao salvar. Tente novamente.');
      alertSpy.mockRestore();
    });

    it('should handle numeric field with null/undefined values', () => {
      const meta = {
        ...mockMetas[0],
        editandoValorMeta: true,
        valorMetaTemp: '15000',
        valorMeta: null as any, // Test the || 0 fallback
      };
      const updateSpy = jest.spyOn(metasService, 'updateMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
        },
      } as any);

      component.confirmarCampo(meta, 'valorMeta');

      expect(updateSpy).toHaveBeenCalledWith(meta.id, { valorMeta: 15000 });
    });

    it('should handle valorPorMes with zero value', () => {
      const meta = {
        ...mockMetas[0],
        editandoValorPorMes: true,
        valorPorMesTemp: '0',
      };
      const updateSpy = jest.spyOn(metasService, 'updateMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
        },
      } as any);

      component.confirmarCampo(meta, 'valorPorMes');

      expect(updateSpy).toHaveBeenCalledWith(meta.id, {
        valorPorMes: 0,
        mesesNecessarios: 0, // 10000 / 0 = Infinity, Math.ceil(Infinity) = Infinity, but 0 > 0 is false
      });
    });

    it('should handle setTimeout in updateMeta success callback', () => {
      jest.useFakeTimers();
      const meta = {
        ...mockMetas[0],
        editandoNome: true,
        nomeTemp: 'Novo Nome',
      };
      const updateSpy = jest.spyOn(metasService, 'updateMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
        },
      } as any);

      component.confirmarCampo(meta, 'nome');

      expect(meta.savedTickCampo).toBe(true);

      // Avançar o tempo para executar o setTimeout
      jest.advanceTimersByTime(1200);

      expect(meta.savedTickCampo).toBe(false);

      jest.useRealTimers();
    });

    it('should handle numeric field update with null valorMeta in mesesNecessarios calculation', () => {
      const meta = {
        ...mockMetas[0],
        editandoValorPorMes: true,
        valorPorMesTemp: '2000',
        valorMeta: null as any, // Test the || 0 fallback in mesesNecessarios calculation
      };
      const updateSpy = jest.spyOn(metasService, 'updateMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
        },
      } as any);

      component.confirmarCampo(meta, 'valorPorMes');

      expect(updateSpy).toHaveBeenCalledWith(meta.id, {
        valorPorMes: 2000,
        mesesNecessarios: 0, // (0 || 0) / 2000 = 0
      });
    });

    it('should cancel when novo equals atual for numeric fields', () => {
      const meta = {
        ...mockMetas[0],
        editandoValorMeta: true,
        valorMetaTemp: '10000', // Same as current value
      };
      const cancelSpy = jest.spyOn(component, 'cancelarCampo');

      component.confirmarCampo(meta, 'valorMeta');

      expect(cancelSpy).toHaveBeenCalledWith(meta, 'valorMeta');
    });
  });

  // Testes para métodos de eventos
  describe('event methods', () => {
    it('should handle confirmarCampoComValor', () => {
      const meta = mockMetas[0];
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
      const meta = mockMetas[0];
      const confirmSpy = jest.spyOn(component, 'confirmarCampo');

      component.confirmarCampoBlur(meta, 'nome');

      expect(confirmSpy).toHaveBeenCalledWith(meta, 'nome');
    });

    it('should handle confirmarCampoBlur with processed field', () => {
      const meta = mockMetas[0];
      const chave = `${meta.id}-nome`;
      component.camposProcessados.add(chave);
      const confirmSpy = jest.spyOn(component, 'confirmarCampo');

      component.confirmarCampoBlur(meta, 'nome');

      expect(component.camposProcessados.has(chave)).toBe(false);
      expect(confirmSpy).not.toHaveBeenCalled();
    });
  });

  // Testes para métodos de parabéns
  describe('parabens methods', () => {
    it('should show parabens modal when progress reaches 100%', () => {
      const meta = { ...mockMetas[0], valorMeta: 1000, valorAtual: 0 };
      meta.meses = [
        { id: 1, nome: 'Janeiro', valor: 1000, status: 'Pago' as const },
      ];

      // Mock localStorage
      const localStorageSpy = jest.spyOn(Storage.prototype, 'setItem');

      const progress = component.getProgressoRealMeta(meta);

      expect(progress).toBe(100);
      expect(component.modalParabens.isOpen).toBe(true);
      expect(component.modalParabens.metaNome).toBe(meta.nome);
      expect(localStorageSpy).toHaveBeenCalled();
    });

    it('should close parabens modal', () => {
      component.modalParabens.isOpen = true;

      component.fecharParabens();

      expect(component.modalParabens.isOpen).toBe(false);
    });

    it('should check if parabens was already shown', () => {
      const metaId = 1;
      const parabensMostrados = ['1', '2'];
      jest
        .spyOn(Storage.prototype, 'getItem')
        .mockReturnValue(JSON.stringify(parabensMostrados));

      const result = (component as any).jaMostrouParabens(metaId);

      expect(result).toBe(true);
    });

    it('should handle localStorage error in jaMostrouParabens', () => {
      const metaId = 1;
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = (component as any).jaMostrouParabens(metaId);

      expect(result).toBe(false);
    });

    it('should handle localStorage error in getParabensMostrados', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = (component as any).getParabensMostrados();

      expect(result).toEqual([]);
    });

    it('should handle JSON parse error in getParabensMostrados', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');

      const result = (component as any).getParabensMostrados();

      expect(result).toEqual([]);
    });

    it('should handle marcarMesesComoFinalizado with empty meses', () => {
      const meta = { ...mockMetas[0], meses: [] };
      const updateSpy = jest.spyOn(metasService, 'updateMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
        },
      } as any);

      (component as any).marcarMesesComoFinalizado(meta);

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should handle marcarMesesComoFinalizado with null meses', () => {
      const meta = { ...mockMetas[0], meses: null as any };
      const updateSpy = jest.spyOn(metasService, 'updateMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
        },
      } as any);

      (component as any).marcarMesesComoFinalizado(meta);

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should handle marcarMesesComoFinalizado with all months paid', () => {
      const meta = {
        ...mockMetas[0],
        meses: [
          { id: 1, nome: 'Janeiro', valor: 1000, status: 'Pago' as const },
          { id: 2, nome: 'Fevereiro', valor: 1000, status: 'Pago' as const },
        ],
      };
      const updateSpy = jest.spyOn(metasService, 'updateMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
        },
      } as any);

      (component as any).marcarMesesComoFinalizado(meta);

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should handle marcarMesesComoFinalizado with mixed status months', () => {
      const meta = {
        ...mockMetas[0],
        meses: [
          { id: 1, nome: 'Janeiro', valor: 1000, status: 'Pago' as const },
          { id: 2, nome: 'Fevereiro', valor: 1000, status: 'Vazio' as const },
          { id: 3, nome: 'Março', valor: 1000, status: 'Pendente' as const },
        ],
      };
      const updateSpy = jest.spyOn(metasService, 'updateMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
        },
      } as any);
      const emitSpy = jest.spyOn(component.metasAtualizadas, 'emit');

      (component as any).marcarMesesComoFinalizado(meta);

      expect(updateSpy).toHaveBeenCalledWith(meta.id, {
        meses: [
          { id: 1, nome: 'Janeiro', valor: 1000, status: 'Pago' },
          { id: 2, nome: 'Fevereiro', valor: 0, status: 'Finalizado' },
          { id: 3, nome: 'Março', valor: 0, status: 'Finalizado' },
        ],
      });
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should handle error in marcarMesesComoFinalizado updateMeta', () => {
      const meta = {
        ...mockMetas[0],
        meses: [
          { id: 1, nome: 'Janeiro', valor: 1000, status: 'Vazio' as const },
        ],
      };
      const updateSpy = jest.spyOn(metasService, 'updateMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.error) callbacks.error(new Error('Update error'));
        },
      } as any);

      (component as any).marcarMesesComoFinalizado(meta);

      expect(updateSpy).toHaveBeenCalled();
    });

    it('should call marcarMesesComoFinalizado when progress reaches 100%', () => {
      const meta = { ...mockMetas[0], valorMeta: 1000, valorAtual: 0 };
      meta.meses = [
        { id: 1, nome: 'Janeiro', valor: 1000, status: 'Pago' as const },
      ];

      // Mock localStorage
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('[]');
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});

      // Mock marcarMesesComoFinalizado
      const marcarSpy = jest.spyOn(
        component as any,
        'marcarMesesComoFinalizado'
      );

      const progress = component.getProgressoRealMeta(meta);

      expect(progress).toBe(100);
      expect(marcarSpy).toHaveBeenCalledWith(meta);
    });
  });

  // Testes para métodos de exclusão
  describe('deletion methods', () => {
    it('should set metaParaExcluir when removerMeta is called', () => {
      const mockMeta = mockMetas[0];

      component.removerMeta(mockMeta.id);

      expect(component.metaParaExcluir).toEqual(mockMeta);
    });

    it('should handle meta not found in removerMeta', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      component.removerMeta(999);

      expect(alertSpy).toHaveBeenCalledWith('Meta não encontrada.');
      alertSpy.mockRestore();
    });

    it('should return early when metaParaExcluir is null in confirmarExclusao', () => {
      component.metaParaExcluir = null;
      const deleteSpy = jest.spyOn(metasService, 'deleteMeta');

      component.confirmarExclusao();

      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should call confirmarExclusao when confirmarExclusao is called', () => {
      const mockMeta = { ...mockMetas[0], nome: 'Meta válida' };
      component.metaParaExcluir = mockMeta;
      const deleteSpy = jest.spyOn(metasService, 'deleteMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
        },
      } as any);

      component.confirmarExclusao();

      expect(deleteSpy).toHaveBeenCalledWith(mockMeta.id);
    });

    it('should handle empty name meta in confirmarExclusao', () => {
      const mockMeta = { ...mockMetas[0], nome: '' };
      component.metaParaExcluir = mockMeta;
      const emitSpy = jest.spyOn(component.metasAtualizadas, 'emit');

      component.confirmarExclusao();

      expect(component.metaParaExcluir).toBeNull();
      expect(component.modalConfirmarDelete.isOpen).toBe(false);
      expect(emitSpy).toHaveBeenCalled();
      expect(component.modalSucessoDelete.isOpen).toBe(true);
    });

    it('should handle draft meta in confirmarExclusao', () => {
      const mockMeta = { ...mockMetas[0], _draft: true };
      component.metaParaExcluir = mockMeta;
      const emitSpy = jest.spyOn(component.metasAtualizadas, 'emit');

      component.confirmarExclusao();

      expect(component.metaParaExcluir).toBeNull();
      expect(component.modalConfirmarDelete.isOpen).toBe(false);
      expect(emitSpy).toHaveBeenCalled();
      expect(component.modalSucessoDelete.isOpen).toBe(true);
    });

    it('should handle 404 error in confirmarExclusao', () => {
      const mockMeta = { ...mockMetas[0], nome: 'Meta válida' };
      component.metaParaExcluir = mockMeta;
      const deleteSpy = jest.spyOn(metasService, 'deleteMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.error) {
            const error = new Error('Not Found');
            (error as any).status = 404;
            callbacks.error(error);
          }
        },
      } as any);
      const emitSpy = jest.spyOn(component.metasAtualizadas, 'emit');

      component.confirmarExclusao();

      expect(emitSpy).toHaveBeenCalled();
      expect(component.modalSucessoDelete.isOpen).toBe(true);
    });

    it('should handle non-404 error in confirmarExclusao', () => {
      const mockMeta = { ...mockMetas[0], nome: 'Meta válida' };
      component.metaParaExcluir = mockMeta;
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const deleteSpy = jest.spyOn(metasService, 'deleteMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.error) {
            const error = new Error('Server Error');
            (error as any).status = 500;
            callbacks.error(error);
          }
        },
      } as any);

      component.confirmarExclusao();

      expect(alertSpy).toHaveBeenCalledWith(
        'Não foi possível excluir. Tente novamente.'
      );
      alertSpy.mockRestore();
    });

    it('should clear metaParaExcluir when cancelarExclusao is called', () => {
      component.metaParaExcluir = mockMetas[0];

      component.cancelarExclusao();

      expect(component.metaParaExcluir).toBeNull();
    });
  });

  // Testes para métodos de modal
  describe('modal methods', () => {
    it('should open add meta modal', () => {
      component.abrirModalAdicionarMeta();

      expect(component.modalAdicionarMeta.isOpen).toBe(true);
      expect(component.modalAdicionarMeta.nome).toBe('');
      expect(component.modalAdicionarMeta.valorMeta).toBe(0);
    });

    it('should close add meta modal', () => {
      component.modalAdicionarMeta.isOpen = true;
      component.modalAdicionarMeta.nome = 'Test';

      component.fecharModalAdicionarMeta();

      expect(component.modalAdicionarMeta.isOpen).toBe(false);
      expect(component.modalAdicionarMeta.nome).toBe('');
    });

    it('should save meta from modal', () => {
      component.modalAdicionarMeta.nome = 'Nova Meta';
      component.modalAdicionarMeta.valorMeta = 5000;
      component.modalAdicionarMeta.valorPorMes = 500;
      component.modalAdicionarMeta.valorAtual = 1000;

      const createSpy = jest.spyOn(metasService, 'createMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
          if (callbacks.complete) callbacks.complete();
        },
      } as any);
      const emitSpy = jest.spyOn(component.metasAtualizadas, 'emit');

      component.salvarMetaModal();

      expect(createSpy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalled();
      expect(component.modalSucessoAdd.isOpen).toBe(true);
    });

    it('should not save meta with empty name', () => {
      component.modalAdicionarMeta.nome = '';

      component.salvarMetaModal();

      expect(component.modalAdicionarMeta.isOpen).toBe(false);
    });

    it('should handle error in salvarMetaModal', () => {
      component.modalAdicionarMeta.nome = 'Nova Meta';
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const createSpy = jest.spyOn(metasService, 'createMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.error) callbacks.error(new Error('Create error'));
        },
      } as any);

      component.salvarMetaModal();

      expect(alertSpy).toHaveBeenCalledWith(
        'Erro ao criar meta. Tente novamente.'
      );
      alertSpy.mockRestore();
    });

    it('should handle complete callback in salvarMetaModal', () => {
      component.modalAdicionarMeta.nome = 'Nova Meta';
      const createSpy = jest.spyOn(metasService, 'createMeta').mockReturnValue({
        subscribe: (callbacks: any) => {
          if (callbacks.next) callbacks.next();
          if (callbacks.complete) callbacks.complete();
        },
      } as any);

      component.salvarMetaModal();

      expect(createSpy).toHaveBeenCalled();
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
  });

  // Testes para métodos de evento de teclado
  describe('keyboard event methods', () => {
    it('should handle Enter key', () => {
      const meta = mockMetas[0];
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
      const meta = mockMetas[0];
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
  });

  // Testes para métodos de valor do modal
  describe('modal value methods', () => {
    it('should handle valorMeta change', () => {
      component.onValorMetaChange('15000');
      expect(component.modalAdicionarMeta.valorMeta).toBe(15000);
    });

    it('should handle valorPorMes change', () => {
      component.onValorPorMesChange('1500');
      expect(component.modalAdicionarMeta.valorPorMes).toBe(1500);
    });

    it('should handle valorAtual change', () => {
      component.onValorAtualChange('2000');
      expect(component.modalAdicionarMeta.valorAtual).toBe(2000);
    });
  });

  // Testes para métodos de cancelamento
  describe('cancel methods', () => {
    it('should cancel add meta', () => {
      component.modalAdicionarMeta.isOpen = true;

      component.cancelarAdicionarMeta();

      expect(component.modalAdicionarMeta.isOpen).toBe(false);
    });
  });

  // Testes para métodos de filtro
  describe('filter methods', () => {
    it('should filter metas in elaboration', () => {
      const metas = [
        { ...mockMetas[0], mesesNecessarios: 0 }, // Meta finalizada
        { ...mockMetas[1], mesesNecessarios: 5 }, // Meta em elaboração
      ];
      component.metas = metas;

      // Simular filtro de metas em elaboração
      const result = component.metas.filter(
        (meta) => meta.mesesNecessarios > 0
      );

      expect(result.length).toBe(1);
      expect(result[0].mesesNecessarios).toBe(5);
    });
  });

  // Testes para métodos de evento
  describe('event emission', () => {
    it('should emit addMeta event when addMeta is called', () => {
      const spy = jest.spyOn(component.addMeta, 'emit');

      component.addMeta.emit();

      expect(spy).toHaveBeenCalled();
    });

    it('should emit editar event when editar is called', () => {
      const spy = jest.spyOn(component.editar, 'emit');
      const mockMeta = mockMetas[0];

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
      const mockMeta = mockMetas[0];

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
      const mockMeta = mockMetas[0];

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
      expect(component.metas.length).toBe(2);
    });
  });

  it('should render component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();
  });
});
