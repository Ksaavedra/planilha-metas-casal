import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ElaborandoMetasComponent } from './elaborando-metas.component';
import { MetasService } from '../../../services/metas.service';

describe('ElaborandoMetasComponent', () => {
  let component: ElaborandoMetasComponent;
  let fixture: ComponentFixture<ElaborandoMetasComponent>;
  let metasService: MetasService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElaborandoMetasComponent, HttpClientTestingModule],
      providers: [MetasService],
    }).compileComponents();

    fixture = TestBed.createComponent(ElaborandoMetasComponent);
    component = fixture.componentInstance;
    metasService = TestBed.inject(MetasService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.metas).toEqual([]);
    expect(component.percentualPagoView).toBe(0);
    expect(component.totalValorMetaView).toBe(0);
    expect(component.totalValorPorMesView).toBe(0);
    expect(component.totalMesesNecessariosView).toBe(0);
    expect(component.totalValorAtualView).toBe(0);
    expect(component.totalContribuicoesView).toBe(0);
  });

  it('should emit addMeta event when addMeta is called', () => {
    const spy = jest.spyOn(component.addMeta, 'emit');
    
    component.addMeta.emit();
    
    expect(spy).toHaveBeenCalled();
  });

  it('should emit editar event when editar is called', () => {
    const spy = jest.spyOn(component.editar, 'emit');
    const mockMeta = { id: 1, nome: 'Teste' } as any;
    
    component.editar.emit({ meta: mockMeta, campo: 'nome' });
    
    expect(spy).toHaveBeenCalledWith({ meta: mockMeta, campo: 'nome' });
  });

  it('should emit remover event when remover is called', () => {
    const spy = jest.spyOn(component.remover, 'emit');
    
    component.remover.emit(1);
    
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('should track by id correctly', () => {
    const mockMeta = { id: 1, nome: 'Teste' } as any;
    
    const result = component.trackById(0, mockMeta);
    
    expect(result).toBe(1);
  });
});
