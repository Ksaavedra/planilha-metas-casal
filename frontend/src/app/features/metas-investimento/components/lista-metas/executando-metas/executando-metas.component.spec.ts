import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExecutandoMetasComponent } from './executando-metas.component';
import { MetaExtended } from '../../../../../core/interfaces/mes-meta';
import { MetasService } from '../../../services/metas.service';

describe('ExecutandoMetasComponent', () => {
  let component: ExecutandoMetasComponent;
  let fixture: ComponentFixture<ExecutandoMetasComponent>;

  const mockMetas: MetaExtended[] = [
    {
      id: 1,
      nome: 'Meta em Execução 1',
      valorMeta: 10000,
      valorAtual: 5000,
      valorPorMes: 1000,
      mesesNecessarios: 10,
      meses: [
        { id: 1, nome: 'Janeiro', valor: 1000, status: 'Pago' },
        { id: 2, nome: 'Fevereiro', valor: 1000, status: 'Pago' },
      ],
    },
    {
      id: 2,
      nome: 'Meta em Execução 2',
      valorMeta: 5000,
      valorAtual: 3000,
      valorPorMes: 500,
      mesesNecessarios: 10,
      meses: [
        { id: 1, nome: 'Janeiro', valor: 500, status: 'Pago' },
        { id: 2, nome: 'Fevereiro', valor: 500, status: 'Pago' },
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExecutandoMetasComponent, HttpClientTestingModule],
      providers: [MetasService],
    }).compileComponents();

    fixture = TestBed.createComponent(ExecutandoMetasComponent);
    component = fixture.componentInstance;
    component.metas = mockMetas;
    fixture.detectChanges();
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

  it('should format currency correctly', () => {
    const formatted = component.formatBR(1000);
    expect(formatted).toContain('R$');
    expect(formatted).toContain('1.000');
  });

  it('should open edit modal when abrirModalEdicao is called', () => {
    const mockMeta = mockMetas[0];

    component.abrirModalEdicao(mockMeta, 1);

    expect(component.modalEdicao.isOpen).toBe(true);
    expect(component.modalEdicao.meta).toEqual(mockMeta);
    expect(component.modalEdicao.mesId).toBe(1);
  });

  it('should toggle dropdown when toggleDropdown is called', () => {
    const mockMeta = mockMetas[0];

    component.toggleDropdown(mockMeta, 1);

    expect(mockMeta.dropdownOpen).toBe(1);
  });

  it('should close other dropdowns when opening a new one', () => {
    const mockMeta1 = mockMetas[0];
    const mockMeta2 = mockMetas[1];

    component.toggleDropdown(mockMeta1, 1);
    component.toggleDropdown(mockMeta2, 1);

    expect(mockMeta1.dropdownOpen).toBeUndefined();
    expect(mockMeta2.dropdownOpen).toBe(1);
  });

  it('should render component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();
  });
});
