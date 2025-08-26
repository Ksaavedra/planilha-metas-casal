import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressTableComponent } from './progress-table.component';

describe('ProgressTableComponent', () => {
  let component: ProgressTableComponent;
  let fixture: ComponentFixture<ProgressTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.metas).toEqual([]);
    expect(component.meses).toEqual([]);
  });

  it('should accept custom input values', () => {
    const mockMetas = [{ id: 1, nome: 'Teste' }];
    const mockMeses = ['Janeiro', 'Fevereiro'];

    component.metas = mockMetas;
    component.meses = mockMeses;

    expect(component.metas).toEqual(mockMetas);
    expect(component.meses).toEqual(mockMeses);
  });
});
