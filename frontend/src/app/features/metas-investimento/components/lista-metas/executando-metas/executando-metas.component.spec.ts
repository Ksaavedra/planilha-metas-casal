/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExecutandoMetasComponent } from './executando-metas.component';
import { MetasService } from '../../../services/metas.service';

describe('ExecutandoMetasComponent', () => {
  let component: ExecutandoMetasComponent;
  let fixture: ComponentFixture<ExecutandoMetasComponent>;
  let metasService: MetasService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExecutandoMetasComponent, HttpClientTestingModule],
      providers: [MetasService],
    }).compileComponents();

    fixture = TestBed.createComponent(ExecutandoMetasComponent);
    component = fixture.componentInstance;
    metasService = TestBed.inject(MetasService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.meses).toEqual([]);
    expect(component.metas).toEqual([]);
    expect(component.percentualPagoView).toBe(0);
    expect(component.totalValorMetaView).toBe(0);
    expect(component.totalValorPorMesView).toBe(0);
    expect(component.totalMesesNecessariosView).toBe(0);
    expect(component.totalValorAtualView).toBe(0);
    expect(component.totalContribuicoesView).toBe(0);
  });

  it('should emit alternarStatus event when alternarStatus is called', () => {
    const spy = jest.spyOn(component.alternarStatus, 'emit');
    
    component.alternarStatus.emit({ metaId: 1, mesId: 1, status: 'Pago' });
    
    expect(spy).toHaveBeenCalledWith({ metaId: 1, mesId: 1, status: 'Pago' });
  });

  it('should emit salvarValor event when salvarValor is called', () => {
    const spy = jest.spyOn(component.salvarValor, 'emit');
    
    component.salvarValor.emit({ metaId: 1, mesId: 1, valor: 100 });
    
    expect(spy).toHaveBeenCalledWith({ metaId: 1, mesId: 1, valor: 100 });
  });

  it('should emit metaCompleta event when metaCompleta is called', () => {
    const spy = jest.spyOn(component.metaCompleta, 'emit');
    
    component.metaCompleta.emit({ metaId: 1, metaNome: 'Teste', valorMeta: 1000 });
    
    expect(spy).toHaveBeenCalledWith({ metaId: 1, metaNome: 'Teste', valorMeta: 1000 });
  });

  it('should have default modalEdicao values', () => {
    expect(component.modalEdicao.meta).toEqual({} as any);
    expect(component.modalEdicao.mesId).toBe(-1);
    expect(component.modalEdicao.valor).toBe(0);
    expect(component.modalEdicao.isOpen).toBe(false);
  });
});
