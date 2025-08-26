import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MetasPageComponent } from './metas-page.component';
import { MetasService } from '../../services/metas.service';

describe('MetasPageComponent', () => {
  let component: MetasPageComponent;
  let fixture: ComponentFixture<MetasPageComponent>;
  let metasService: MetasService;

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
    expect(component.meses).toEqual([]);
    expect(component.metas).toEqual([]);
    expect(component.percentualPagoView).toBe(0);
    expect(component.isProcessingEdit).toBe(false);
    expect(component.totalValorMetaView).toBe(0);
    expect(component.totalValorPorMesView).toBe(0);
    expect(component.totalMesesNecessariosView).toBe(0);
    expect(component.totalValorAtualView).toBe(0);
    expect(component.totalContribuicoesView).toBe(0);
    expect(component.camposProcessados).toBeInstanceOf(Set);
  });

  it('should have default modalEdicao values', () => {
    expect(component.modalEdicao.meta).toEqual({} as any);
    expect(component.modalEdicao.mesId).toBe(-1);
    expect(component.modalEdicao.valor).toBe(0);
    expect(component.modalEdicao.isOpen).toBe(false);
  });
});
