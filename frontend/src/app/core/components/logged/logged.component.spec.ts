import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LoggedComponent } from './logged.component';

describe('LoggedComponent', () => {
  let component: LoggedComponent;
  let fixture: ComponentFixture<LoggedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoggedComponent],
      imports: [RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LoggedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render header and sidebar components', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('app-sidebar')).toBeTruthy();
  });

  it('should have main content area', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const mainContent = compiled.querySelector('.main-content');
    expect(mainContent).toBeTruthy();
  });

  it('should have router outlet in main content', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const routerOutlet = compiled.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });
});
