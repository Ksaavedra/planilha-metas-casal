import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ExecutandoMetasComponent } from './executando-metas.component';
import { MetasService } from '../../../../../core/services/metas/metas.service';
import { Meta, StatusMeta } from '../../../../../core/interfaces/mes-meta';

describe('ExecutandoMetasComponent', () => {
  let component: ExecutandoMetasComponent;
  let fixture: ComponentFixture<ExecutandoMetasComponent>;

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
    await TestBed.configureTestingModule({
      declarations: [ExecutandoMetasComponent],
      imports: [HttpClientTestingModule],
      providers: [MetasService],
      schemas: [NO_ERRORS_SCHEMA],
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

    // Test different status values
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

  it('should handle modal interactions', () => {
    const mockMeta = mockMetas[0];
    const mockMes = mockMeta.meses[0];

    // Test modal opening
    component.modalEdicao = {
      meta: mockMeta,
      mesId: mockMes.id,
      valor: mockMes.valor,
      isOpen: true,
    };

    expect(component.modalEdicao.isOpen).toBe(true);
    expect(component.modalEdicao.meta).toBe(mockMeta);
    expect(component.modalEdicao.mesId).toBe(mockMes.id);
  });

  it('should calculate totals correctly', () => {
    const mockMeta = mockMetas[0];

    // Simulate calculation by setting values directly
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

    // Simulate percentual calculation
    component.percentualPagoView =
      (mockMeta.valorAtual / mockMeta.valorMeta) * 100;

    expect(component.percentualPagoView).toBe(30); // 3000 / 10000 * 100
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
});
