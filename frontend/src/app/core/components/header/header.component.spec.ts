import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit showOverlay event when onSidebarClick is called', () => {
    const spy = jest.spyOn(component.showOverlay, 'emit');
    component.onSidebarClick();
    expect(spy).toHaveBeenCalled();
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
      'button[aria-label="Menu"]'
    ) as HTMLButtonElement;
    const spy = jest.spyOn(component, 'onSidebarClick');

    menuButton.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit showOverlay event when onSidebarClick is called', () => {
    const spy = jest.spyOn(component.showOverlay, 'emit');

    component.onSidebarClick();

    expect(spy).toHaveBeenCalled();
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
