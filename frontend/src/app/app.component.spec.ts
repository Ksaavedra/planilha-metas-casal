import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { AppHeaderComponent } from './shared';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppComponent, AppHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should start with sidebar closed', () => {
    expect(component.sidebarOpen).toBe(false);
  });

  it('should toggle sidebar when toggleSidebar is called', () => {
    // Teste inicial
    expect(component.sidebarOpen).toBe(false);

    // Primeiro toggle - deve abrir
    component.toggleSidebar();
    expect(component.sidebarOpen).toBe(true);

    // Segundo toggle - deve fechar
    component.toggleSidebar();
    expect(component.sidebarOpen).toBe(false);
  });

  it('should close sidebar when closeSidebar is called', () => {
    // Preparar estado inicial
    component.sidebarOpen = true;
    expect(component.sidebarOpen).toBe(true);

    // Testar fechamento
    component.closeSidebar();
    expect(component.sidebarOpen).toBe(false);
  });

  it('should close sidebar when closeSidebar is called even if already closed', () => {
    // Preparar estado inicial fechado
    component.sidebarOpen = false;
    expect(component.sidebarOpen).toBe(false);

    // Testar fechamento quando já está fechado
    component.closeSidebar();
    expect(component.sidebarOpen).toBe(false);
  });

  it('should render app-header component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
  });

  it('should render router outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should have correct component structure', () => {
    expect(component.sidebarOpen).toBeDefined();
    expect(typeof component.toggleSidebar).toBe('function');
    expect(typeof component.closeSidebar).toBe('function');
  });
});
