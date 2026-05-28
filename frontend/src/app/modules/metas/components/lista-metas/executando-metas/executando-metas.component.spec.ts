import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { ExecutandoMetasComponent } from './executando-metas.component';
import { MetasService } from '../../../../../core/services/metas/metas.service';
import {
  Meta,
  StatusMeta,
} from '../../../../../core/interfaces/metas/mes-meta';
import { EditarValorDialogComponent } from '../../editar-valor-dialog/editar-valor-dialog.component';
import { of, Subject } from 'rxjs';

describe('ExecutandoMetasComponent', () => {
  let component: ExecutandoMetasComponent;
  let fixture: ComponentFixture<ExecutandoMetasComponent>;
  let dialogAfterClosed$!: Subject<
    | {
        metaId: number | string;
        mesId: number;
        valor: number;
      }
    | undefined
  >;

  const dialogMock = {
    open: jest.fn(),
  };

  const metasServiceMock = {
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
    dialogAfterClosed$ = new Subject<
      | {
          metaId: number | string;
          mesId: number;
          valor: number;
        }
      | undefined
    >();

    dialogMock.open.mockReturnValue({
      afterClosed: () => dialogAfterClosed$.asObservable(),
    });

    metasServiceMock.updateMeta.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      declarations: [ExecutandoMetasComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MetasService, useValue: metasServiceMock },
        { provide: MatDialog, useValue: dialogMock },
      ],
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

  it('trackByMetaId deve retornar id da meta', () => {
    expect(component.trackByMetaId(0, { id: 10 })).toBe(10);
  });

  it('trackByMesId deve retornar id do mês', () => {
    expect(component.trackByMesId(0, { id: 5 })).toBe(5);
  });

  describe('abrirModalEdicao', () => {
    it('deve abrir EditarValorDialogComponent via MatDialog', () => {
      component.meses = ['Janeiro', 'Fevereiro'];
      const meta = component.metas[0];
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;

      component.abrirModalEdicao(meta, 3, 2, event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(dialogMock.open).toHaveBeenCalledTimes(1);

      const [dialogComponent, dialogConfig] = dialogMock.open.mock.calls[0];
      expect(dialogComponent).toBe(EditarValorDialogComponent);
      expect(dialogConfig.width).toBe('min(420px, 96vw)');
      expect(dialogConfig.data).toEqual({
        meta,
        mesId: 3,
        meses: ['Janeiro', 'Fevereiro'],
      });
    });

    it('após fechar o dialog com valor deve atualizar mês e emitir salvarValor', () => {
      const spy = jest.spyOn(component.salvarValor, 'emit');
      const meta = component.metas[0];

      component.abrirModalEdicao(meta, 3, 2);
      dialogAfterClosed$.next({ metaId: 1, mesId: 3, valor: 900 });

      expect(component.metas[0].meses[2].valor).toBe(900);
      expect(component.metas[0].meses[2].status).toBe('Programado');
      expect(spy).toHaveBeenCalledWith({
        metaId: 1,
        mesId: 3,
        valor: 900,
      });
    });

    it('deve deixar status Vazio quando valor for zero', () => {
      const meta = component.metas[0];
      component.abrirModalEdicao(meta, 3, 2);
      dialogAfterClosed$.next({ metaId: 1, mesId: 3, valor: 0 });

      expect(component.metas[0].meses[2].valor).toBe(0);
      expect(component.metas[0].meses[2].status).toBe('Vazio');
    });

    it('não deve emitir quando dialog for cancelado', () => {
      const spy = jest.spyOn(component.salvarValor, 'emit');
      component.abrirModalEdicao(component.metas[0], 3, 2);
      dialogAfterClosed$.next(undefined);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should normalize meses when metas input changes', () => {
      component.meses = ['Janeiro/2026', 'Fevereiro/2026'];
      const changes = {
        metas: {
          currentValue: mockMetas,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true,
        },
      };

      const normalizeSpy = jest.spyOn(component as any, 'normalizeMeses');

      component.ngOnChanges(changes);

      expect(normalizeSpy).toHaveBeenCalledTimes(mockMetas.length);
    });

    it('should normalize when meses header changes', () => {
      component.metas = mockMetas;
      const normalizeSpy = jest.spyOn(component as any, 'normalizeMeses');

      component.ngOnChanges({
        meses: {
          currentValue: ['Janeiro/2026'],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(normalizeSpy).toHaveBeenCalledTimes(mockMetas.length);
    });

    it('ngOnChanges deve ignorar quando não há mudança em metas nem meses', () => {
      const normalizeSpy = jest.spyOn(component as any, 'normalizeMeses');

      component.ngOnChanges({});

      expect(normalizeSpy).not.toHaveBeenCalled();
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

    it('normalizeMeses deve manter mês existente e criar mês faltante como Vazio', () => {
      component.meses = ['Janeiro', 'Fevereiro'];

      const meta = {
        ...mockMetas[0],
        meses: [
          {
            id: 1,
            nome: 'Janeiro',
            valor: 500,
            status: 'Pago' as StatusMeta,
          },
        ],
      };

      component['normalizeMeses'](meta as any);

      expect(meta.meses[0].valor).toBe(500);
      expect(meta.meses[0].status).toBe('Pago');

      expect(meta.meses[1]).toEqual({
        id: 2,
        nome: 'Fevereiro',
        valor: 0,
        status: 'Vazio',
      });
    });

    it('normalizeMeses deve funcionar quando meta.meses for undefined', () => {
      component.meses = ['Janeiro'];

      const meta = {
        ...mockMetas[0],
        meses: undefined,
      };

      component['normalizeMeses'](meta as any);

      expect(Array.isArray(meta.meses) ? (meta.meses as any[]).length : 0).toBe(
        1,
      );
      expect((meta.meses as unknown as any[])?.[0]).toEqual({
        id: 1,
        nome: 'Janeiro',
        valor: 0,
        status: 'Vazio',
      });
    });

    it('normalizeMeses deve ignorar meses que não estão no header', () => {
      component.meses = ['Janeiro'];

      const meta = {
        ...mockMetas[0],
        meses: [
          {
            id: 99,
            nome: 'Março',
            valor: 999,
            status: 'Pago' as StatusMeta,
          },
        ],
      };

      component['normalizeMeses'](meta as any);

      expect(meta.meses.length).toBe(1);
      expect(meta.meses[0]).toEqual({
        id: 1,
        nome: 'Janeiro',
        valor: 0,
        status: 'Vazio',
      });
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

  describe('isDropdownOpen', () => {
    it('should return true when dropdown is open', () => {
      component.openDropdownKey = '1_3';
      expect(component.isDropdownOpen(1, 3)).toBe(true);
    });
  });

  describe('getActiveMes', () => {
    it('getActiveMes deve retornar null quando não houver meta ativa', () => {
      expect(component.getActiveMes()).toBeNull();
    });

    it('getActiveMes deve retornar mês ativo', () => {
      component['activeMeta'] = component.metas[0] as any;
      component['activeMesId'] = 1;

      const result = component.getActiveMes();

      expect(result?.id).toBe(1);
    });
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

  describe('ngOnDestroy', () => {
    it('ngOnDestroy deve remover dropdown do body', () => {
      const removeSpy = jest.spyOn(component as any, 'removeDropdownFromBody');
      component.ngOnDestroy();
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe('removeDropdownFromBody', () => {
    it('removeDropdownFromBody deve remover dropdown do body', () => {
      const dropdown = document.createElement('div');
      document.body.appendChild(dropdown);

      component['dropdownElement'] = dropdown;

      component['removeDropdownFromBody']();

      expect(document.body.contains(dropdown)).toBe(false);
      expect(component['dropdownElement']).toBeNull();
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

  describe('applyStatusDropdownHostStyles', () => {
    it('applyStatusDropdownHostStyles deve aplicar estilos no dropdown', () => {
      const host = document.createElement('div');

      component['applyStatusDropdownHostStyles'](host);

      expect(host.style.position).toBe('fixed');
      expect(host.style.zIndex).toBe('99999');
      expect(host.style.minWidth).toBe('120px');
      expect(host.style.background).toBe('rgb(255, 255, 255)');
    });
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

      expect(spy).toHaveBeenCalledWith(component.metas[0], 1, 0, 'Pago');
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

      component.toggleDropdown(component.metas[0] as any, 1, 0, event);

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

      component.toggleDropdown(component.metas[0] as any, 1, 0, event);

      expect(closeSpy).toHaveBeenCalled();
    });

    it('toggleDropdown deve retornar quando não encontrar anchor', () => {
      const event = {
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
        currentTarget: document.createElement('div'),
        target: document.createElement('div'),
      } as unknown as MouseEvent;

      component.toggleDropdown(component.metas[0] as any, 1, 0, event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openDropdownKey).toBeNull();
      expect(component['activeMeta']).toBeNull();
      expect(component['activeMesId']).toBeNull();
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

  describe('scheduleDropdownRefinement are refineDropdownPositionAfterLayout', () => {
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

    it('deve usar estWidth e estHeight quando offsetWidth/offsetHeight forem 0', () => {
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
        value: 0,
      });

      Object.defineProperty(dd, 'offsetHeight', {
        configurable: true,
        value: 0,
      });

      const spy = jest.spyOn(
        component as any,
        'computeRefinedClampedDropdownPosition',
      );

      component['refineDropdownPositionAfterLayout'](anchor, dd, 8, 120, 100);
      const chamada = spy.mock.calls[0];

      expect(chamada[2]).toBe(120);
      expect(chamada[3]).toBe(100);
      expect(chamada[4]).toBe(8);
    });

    it('deve retornar quando dropdown não está no body', () => {
      const anchor = document.createElement('div');
      const dd = document.createElement('div');

      document.body.appendChild(anchor);
      // dd NÃO está no body

      const spy = jest.spyOn(
        component as any,
        'computeRefinedClampedDropdownPosition',
      );

      component['refineDropdownPositionAfterLayout'](anchor, dd, 8, 120, 100);

      expect(spy).not.toHaveBeenCalled();
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

    it('deve ajustar adjustedTop para margin quando top inicial ficar menor que margin', () => {
      const rect = {
        top: -50,
        bottom: -30,
        left: 100,
        width: 100,
      } as DOMRect;

      const result = component.computeRefinedClampedDropdownPosition(
        rect,
        { width: 1000, height: 800 },
        120,
        100,
        8,
      );

      expect(result.top).toBe(8);
    });
  });

  describe('applyNudgeAfterPaint', () => {
    it('applyNudgeAfterPaint não deve fazer nada quando não houver nudged', () => {
      const dd = document.createElement('div');

      jest.spyOn(dd, 'getBoundingClientRect').mockReturnValue({
        top: 10,
        left: 10,
        bottom: 50,
        right: 50,
      } as DOMRect);

      jest
        .spyOn(component as any, 'computeNudgePositionIfClipped')
        .mockReturnValue(null);

      const setSpy = jest.spyOn(component as any, 'setDropdownElementPosition');

      component['applyNudgeAfterPaint'](dd, 8, 10, 10, 120, 100);

      expect(setSpy).not.toHaveBeenCalled();
    });

    it('applyNudgeAfterPaint deve aplicar nova posição quando houver nudged', () => {
      const dd = document.createElement('div');

      jest.spyOn(dd, 'getBoundingClientRect').mockReturnValue({
        top: -10,
        left: -10,
        bottom: 900,
        right: 900,
      } as DOMRect);

      jest
        .spyOn(component as any, 'computeNudgePositionIfClipped')
        .mockReturnValue({ top: 20, left: 30 });

      const setSpy = jest.spyOn(component as any, 'setDropdownElementPosition');

      component['applyNudgeAfterPaint'](dd, 8, 10, 10, 120, 100);

      expect(component.dropdownPos).toEqual({ top: 20, left: 30 });
      expect(setSpy).toHaveBeenCalledWith(dd, 20, 30);
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
    it('deve retornar null quando estiver dentro da viewport', () => {
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

    it('deve ajustar top quando paintedRect.top for menor que 0', () => {
      const rect = {
        top: -10,
        left: 10,
        bottom: 100,
        right: 100,
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

      expect(result).toEqual({ top: 8, left: 20 });
    });

    it('deve ajustar left quando paintedRect.left for menor que 0', () => {
      const rect = {
        top: 10,
        left: -10,
        bottom: 100,
        right: 100,
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

      expect(result).toEqual({ top: 20, left: 8 });
    });

    it('deve ajustar top quando paintedRect.bottom passar da viewport', () => {
      const rect = {
        top: 10,
        left: 10,
        bottom: 900,
        right: 100,
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

      expect(result).toEqual({ top: 692, left: 20 });
    });

    it('deve ajustar left quando paintedRect.right passar da viewport', () => {
      const rect = {
        top: 10,
        left: 10,
        bottom: 100,
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

      expect(result).toEqual({ top: 20, left: 872 });
    });
  });

  describe('selecionarStatus', () => {
    it('should handle mes not found', () => {
      const meta = mockMetas[0];
      const spy = jest.spyOn(component.alternarStatus, 'emit');

      component.selecionarStatus(meta, 999, 0, 'Pago');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should verify meta completion when status is Pago', () => {
      const meta = mockMetas[0];
      const spy = jest.spyOn(component as any, 'verificarMetaCompleta');

      component.selecionarStatus(meta, 1, 0, 'Pago');

      expect(spy).toHaveBeenCalledWith(meta);
    });

    it('should not verify meta completion when status is not Pago', () => {
      const meta = mockMetas[0];
      const spy = jest.spyOn(component as any, 'verificarMetaCompleta');

      component.selecionarStatus(meta, 1, 0, 'Programado');

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

      component['verificarMetaCompleta'](meta);

      expect(spy).toHaveBeenCalledWith({
        metaId: meta.id,
        metaNome: meta.nome,
        valorMeta: meta.valorMeta,
      });
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

    it('deve emitir quando concluída só com valorAtual (sem mês pago)', () => {
      const meta = {
        ...mockMetas[0],
        valorMeta: 4124,
        valorAtual: 8000,
        meses: [
          { id: 1, nome: 'Janeiro', valor: 0, status: 'Vazio' as StatusMeta },
        ],
      };

      const spy = jest.spyOn(component.metaCompleta, 'emit');

      component['verificarMetaCompleta'](meta);

      expect(spy).toHaveBeenCalledWith({
        metaId: meta.id,
        metaNome: meta.nome,
        valorMeta: meta.valorMeta,
      });
    });

    it('verificarMetaCompleta deve usar valorAtual 0 quando vier undefined', () => {
      const meta = {
        ...mockMetas[0],
        valorMeta: 500,
        valorAtual: undefined,
        meses: [
          { id: 1, nome: 'Janeiro', valor: 500, status: 'Pago' as StatusMeta },
        ],
      };

      const spy = jest.spyOn(component.metaCompleta, 'emit');

      component['verificarMetaCompleta'](meta as any);

      expect(spy).toHaveBeenCalled();
    });

    it('deve emitir quando concluída só com valorAtual e meses undefined', () => {
      const meta = {
        ...mockMetas[0],
        valorMeta: 1000,
        valorAtual: 1000,
        meses: undefined,
      };

      const spy = jest.spyOn(component.metaCompleta, 'emit');

      component['verificarMetaCompleta'](meta as any);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getTotalContribuicoesMeta', () => {
    it('deve retornar 0 quando meta não tiver meses', () => {
      const meta = {
        ...mockMetas[0],
        meses: undefined,
      } as any;

      expect(component.getTotalContribuicoesMeta(meta)).toBe(0);
    });

    it('deve somar as contribuições dos meses', () => {
      const meta = {
        ...mockMetas[0],
        meses: [
          { id: 1, nome: 'Janeiro', valor: 100, status: 'Pago' as StatusMeta },
          {
            id: 2,
            nome: 'Fevereiro',
            valor: 200,
            status: 'Pago' as StatusMeta,
          },
        ],
      };

      expect(component.getTotalContribuicoesMeta(meta)).toBe(300);
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

    it('should calculate remaining months', () => {
      const meta = mockMetas[0];
      const restantes = component.getMesesRestantes(meta);

      expect(restantes).toBeGreaterThan(0);
      expect(typeof restantes).toBe('number');
    });

    it('should usar 0 quando valorAtual vier undefined e meses vier undefined', () => {
      const meta = {
        ...mockMetas[0],
        valorMeta: 1000,
        valorAtual: undefined,
        valorPorMes: 100,
        meses: undefined,
      } as any;

      const result = component.getMesesRestantes(meta);

      expect(result).toBe(10);
    });

    it('should usar 0 quando valor do mês Pago vier undefined', () => {
      const meta = {
        ...mockMetas[0],
        valorMeta: 1000,
        valorAtual: 100,
        valorPorMes: 100,
        meses: [
          {
            id: 1,
            nome: 'Janeiro',
            valor: undefined,
            status: 'Pago' as StatusMeta,
          },
        ],
      } as any;

      const result = component.getMesesRestantes(meta);

      expect(result).toBe(9);
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

    it('should ignorar meta sem meses dentro do forEach', () => {
      component.metas = [
        mockMetas[0],
        {
          ...mockMetas[1],
          meses: undefined,
        } as any,
      ];

      const result = component.totalContribuicoesPorMes;

      expect(result.length).toBe(mockMetas[0].meses.length);
      expect(result[0]).toBe(mockMetas[0].meses[0].valor);
    });

    it('should somar somente até o tamanho dos meses da primeira meta', () => {
      component.metas = [
        {
          ...mockMetas[0],
          meses: [
            {
              id: 1,
              nome: 'Janeiro',
              valor: 100,
              status: 'Pago' as StatusMeta,
            },
          ],
        },
        {
          ...mockMetas[1],
          meses: [
            {
              id: 1,
              nome: 'Janeiro',
              valor: 200,
              status: 'Pago' as StatusMeta,
            },
            {
              id: 2,
              nome: 'Fevereiro',
              valor: 300,
              status: 'Pago' as StatusMeta,
            },
          ],
        },
      ] as any;

      const result = component.totalContribuicoesPorMes;

      expect(result).toEqual([300]);
    });
  });

  it('should emit alternarStatus event when selecionarStatus is called', () => {
    const spy = jest.spyOn(component.alternarStatus, 'emit');
    const mockMeta = mockMetas[0];

    component.selecionarStatus(mockMeta, 1, 0, 'Pago');

    expect(spy).toHaveBeenCalledWith({
      metaId: 1,
      mesId: 1,
      status: 'Pago',
    });
  });
});
