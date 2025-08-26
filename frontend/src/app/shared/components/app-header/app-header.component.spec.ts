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

  it('should have sidebarToggle EventEmitter', () => {
    expect(component.sidebarToggle).toBeDefined();
    expect(typeof component.sidebarToggle.emit).toBe('function');
  });

  it('should emit sidebarToggle event when toggleSidebar is called', () => {
    const spy = jest.spyOn(component.sidebarToggle, 'emit');

    component.toggleSidebar();

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should emit sidebarToggle event multiple times when toggleSidebar is called multiple times', () => {
    const spy = jest.spyOn(component.sidebarToggle, 'emit');

    component.toggleSidebar();
    component.toggleSidebar();
    component.toggleSidebar();

    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('should have correct component structure', () => {
    expect(typeof component.toggleSidebar).toBe('function');
  });

  it('should render header element', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('header')).toBeTruthy();
  });

  it('should have toggleSidebar method that can be called', () => {
    expect(() => component.toggleSidebar()).not.toThrow();
  });
});
