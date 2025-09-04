import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppHeaderComponent } from './app-header.component';

describe('AppHeaderComponent', () => {
  let component: AppHeaderComponent;
  let fixture: ComponentFixture<AppHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit sidebarToggle event when toggleSidebar is called', () => {
    const spy = jest.spyOn(component.sidebarToggle, 'emit');
    component.toggleSidebar();
    expect(spy).toHaveBeenCalled(); // <- sem With(true)
  });

  it('should have menu button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    // usar a classe existente .nav-toggle (ou adicione aria-label no HTML)
    const menuButton = compiled.querySelector('.nav-toggle');
    expect(menuButton).toBeTruthy();
  });

  it('should call toggleSidebar when menu button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const menuButton = compiled.querySelector(
      'button[aria-label="Menu"]'
    ) as HTMLButtonElement;
    const spy = jest.spyOn(component, 'toggleSidebar');

    menuButton.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit sidebarToggle event with true when toggleSidebar is called', () => {
    const spy = jest.spyOn(component.sidebarToggle, 'emit');

    component.toggleSidebar();

    expect(spy).toHaveBeenCalledWith(true);
  });

  it('should render header title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titleElement = compiled.querySelector('h1');
    expect(titleElement?.textContent).toContain('Planilha Organização');
  });

  it('should have menu button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const menuButton = compiled.querySelector('button[aria-label="Menu"]');
    expect(menuButton).toBeTruthy();
  });
});
