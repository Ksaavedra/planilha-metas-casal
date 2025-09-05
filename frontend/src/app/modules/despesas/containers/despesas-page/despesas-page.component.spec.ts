import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DespesasPageComponent } from './despesas-page.component';

describe('DespesasPageComponent', () => {
  let component: DespesasPageComponent;
  let fixture: ComponentFixture<DespesasPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DespesasPageComponent],
      imports: [HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DespesasPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();
  });
});
