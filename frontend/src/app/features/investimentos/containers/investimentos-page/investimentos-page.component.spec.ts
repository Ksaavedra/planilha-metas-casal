import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvestimentosPageComponent } from './investimentos-page.component';

describe('InvestimentosPageComponent', () => {
  let component: InvestimentosPageComponent;
  let fixture: ComponentFixture<InvestimentosPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestimentosPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InvestimentosPageComponent);
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
