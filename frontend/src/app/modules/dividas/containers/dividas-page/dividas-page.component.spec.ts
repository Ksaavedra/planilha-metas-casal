import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DividasPageComponent } from './dividas-page.component';

describe('DividasPageComponent', () => {
  let component: DividasPageComponent;
  let fixture: ComponentFixture<DividasPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DividasPageComponent],
      imports: [HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DividasPageComponent);
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
