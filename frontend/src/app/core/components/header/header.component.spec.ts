import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { SidebarService } from '@core/services/sidebar/sidebar.service';
import { AuthService } from '@core/services/auth/auth.service';
import { Router } from '@angular/router';
import { Usuario } from '@core/interfaces/auths/auth';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let sidebarService: { getStatus: jest.Mock; changeStatus: jest.Mock };
  let authService: { currentUser$: Observable<Usuario | null>; logout: jest.Mock };
  let router: { navigateByUrl: jest.Mock };

  beforeEach(async () => {
    sidebarService = {
      getStatus: jest.fn().mockReturnValue(of(false)),
      changeStatus: jest.fn(),
    };
    authService = {
      currentUser$: of({ id: 1, nome: 'Kelly', email: 'kelly@email.com' }),
      logout: jest.fn(),
    };
    router = {
      navigateByUrl: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      providers: [
        { provide: SidebarService, useValue: sidebarService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call sidebar service when onSidebarClick is called', () => {
    component.onSidebarClick();
    expect(sidebarService.changeStatus).toHaveBeenCalled();
  });

  it('should have menu button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    // usar a classe existente .nav-toggle (ou adicione aria-label no HTML)
    const menuButton = compiled.querySelector('.nav-toggle');
    expect(menuButton).toBeTruthy();
  });

  it('should call onSidebarClick when menu button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const menuButton = compiled.querySelector(
      'button[aria-label="Menu"]',
    ) as HTMLButtonElement;
    const spy = jest.spyOn(component, 'onSidebarClick');

    menuButton.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should render header title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titleElement = compiled.querySelector('h1');
    expect(titleElement?.textContent).toContain('Planejamento Financeiro');
  });

  it('should have menu button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const menuButton = compiled.querySelector('button[aria-label="Menu"]');
    expect(menuButton).toBeTruthy();
  });

  it('deve fazer logout e navegar para login', () => {
    component.logout();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
