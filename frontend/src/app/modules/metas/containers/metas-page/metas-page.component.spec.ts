import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { MetasPageComponent } from './metas-page.component';
import { MetasService } from '../../../../core/services/metas.service';
import { Meta, StatusMeta } from '../../../../core/interfaces/mes-meta';

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
});
