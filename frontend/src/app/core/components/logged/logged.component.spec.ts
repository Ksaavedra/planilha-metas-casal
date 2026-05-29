import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { LoggedComponent } from './logged.component';
import { SidebarService } from '../../services/sidebar/sidebar.service';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

describe('LoggedComponent', () => {
  let component: LoggedComponent;
  let fixture: ComponentFixture<LoggedComponent>;
  let sidebarService: { getStatus: jest.Mock; isMobile: jest.Mock; changeStatus: jest.Mock };

  beforeEach(async () => {
    sidebarService = {
      getStatus: jest.fn().mockReturnValue(of(false)),
      isMobile: jest.fn().mockReturnValue(of(false)),
      changeStatus: jest.fn(),
    };
    await TestBed.configureTestingModule({
      declarations: [LoggedComponent],
      imports: [RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [{ provide: SidebarService, useValue: sidebarService }],
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

  it('onShowOverlay(show) deve setar showOverlay com o valor passado', () => {
    expect(component.showOverlay).toBe(false);
    component.onShowOverlay(true);
    expect(component.showOverlay).toBe(true);
    component.onShowOverlay(false);
    expect(component.showOverlay).toBe(false);
  });

  it('deve fechar sidebar pelo backdrop apenas no mobile', () => {
    component.isMobile = true;
    component.sidebarStatus = true;

    component.fecharSidebarMobile();

    expect(sidebarService.changeStatus).toHaveBeenCalledTimes(1);
  });

  it('não deve fechar sidebar pelo backdrop no desktop', () => {
    component.isMobile = false;
    component.sidebarStatus = true;

    component.fecharSidebarMobile();

    expect(sidebarService.changeStatus).not.toHaveBeenCalled();
  });
});
