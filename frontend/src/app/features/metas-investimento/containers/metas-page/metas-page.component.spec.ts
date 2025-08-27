import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MetasPageComponent } from './metas-page.component';
import { MetasService } from '../../services/metas.service';
import { MetaExtended } from '../../../../core/interfaces/mes-meta';
import { of } from 'rxjs';

describe('MetasPageComponent', () => {
  let component: MetasPageComponent;
  let fixture: ComponentFixture<MetasPageComponent>;
  let metasService: MetasService;

  const mockMetas: MetaExtended[] = [
    {
      id: 1,
      nome: 'Meta Teste 1',
      valorMeta: 10000,
      valorAtual: 5000,
      valorPorMes: 1000,
      mesesNecessarios: 10,
      meses: [],
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
      nome: 'Meta Teste 2',
      valorMeta: 5000,
      valorAtual: 3000,
      valorPorMes: 500,
      mesesNecessarios: 10,
      meses: [],
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
      imports: [MetasPageComponent, HttpClientTestingModule],
      providers: [MetasService],
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
    expect(component.meses).toEqual([]);
    expect(component.percentualPagoView).toBe(0);
    expect(component.totalValorMetaView).toBe(0);
    expect(component.totalValorPorMesView).toBe(0);
    expect(component.totalMesesNecessariosView).toBe(0);
    expect(component.totalValorAtualView).toBe(0);
    expect(component.totalContribuicoesView).toBe(0);
  });

  it('should load metas on init', () => {
    const spy = jest
      .spyOn(metasService, 'getMetas')
      .mockReturnValue(of(mockMetas));

    component.ngOnInit();

    expect(spy).toHaveBeenCalled();
  });

  it('should reload metas when reloadMetas is called', () => {
    const spy = jest
      .spyOn(metasService, 'getMetas')
      .mockReturnValue(of(mockMetas));

    component.reloadMetas();

    expect(spy).toHaveBeenCalled();
  });

  it('should remove meta when removerMeta is called', () => {
    const mockMeta = mockMetas[0];
    const reloadSpy = jest.spyOn(component, 'reloadMetas');
    const deleteSpy = jest
      .spyOn(metasService, 'deleteMeta')
      .mockReturnValue(of(void 0));

    component.removerMeta(mockMeta.id);

    expect(deleteSpy).toHaveBeenCalledWith(mockMeta.id);
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should handle meta completion when onMetaCompleta is called', () => {
    const event = {
      metaId: 1,
      metaNome: 'Meta Teste',
      valorMeta: 10000,
    };

    component.onMetaCompleta(event);

    // O método existe mas não faz nada por enquanto
    expect(component).toBeTruthy();
  });

  it('should handle status change when onAlterarStatus is called', () => {
    const mockMeta = {
      ...mockMetas[0],
      meses: [
        { id: 1, nome: 'Janeiro', valor: 1000, status: 'Vazio' as const },
        { id: 2, nome: 'Fevereiro', valor: 1000, status: 'Vazio' as const },
      ],
    };
    component.metas = [mockMeta];

    const event = {
      metaId: 1,
      mesId: 1,
      status: 'Pago' as const,
    };

    const updateSpy = jest
      .spyOn(metasService, 'updateMeta')
      .mockReturnValue(of(mockMeta));

    component.onAlterarStatus(event);

    expect(updateSpy).toHaveBeenCalled();
  });

  it('should handle value save when onSalvarValorMes is called', () => {
    const mockMeta = {
      ...mockMetas[0],
      meses: [
        { id: 1, nome: 'Janeiro', valor: 1000, status: 'Vazio' as const },
        { id: 2, nome: 'Fevereiro', valor: 1000, status: 'Vazio' as const },
      ],
    };
    component.metas = [mockMeta];

    const event = {
      metaId: 1,
      mesId: 1,
      valor: 1000,
    };

    const updateSpy = jest
      .spyOn(metasService, 'updateMeta')
      .mockReturnValue(of(mockMeta));

    component.onSalvarValorMes(event);

    expect(updateSpy).toHaveBeenCalled();
  });

  it('should render component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();
  });
});
