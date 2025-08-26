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
    expect(component.sidebarOpen).toBe(false);

    component.toggleSidebar();
    expect(component.sidebarOpen).toBe(true);

    component.toggleSidebar();
    expect(component.sidebarOpen).toBe(false);
  });

  it('should close sidebar when closeSidebar is called', () => {
    component.sidebarOpen = true;
    expect(component.sidebarOpen).toBe(true);

    component.closeSidebar();
    expect(component.sidebarOpen).toBe(false);
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
  });
});
