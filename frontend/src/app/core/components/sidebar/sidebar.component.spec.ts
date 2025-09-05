import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SidebarComponent } from './sidebar.component';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { SidebarService } from '../../services/sidebar/sidebar.service';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SidebarComponent],
      imports: [RouterTestingModule],
      providers: [SidebarService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render navigation links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should have correct navigation items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const linkTexts = Array.from(compiled.querySelectorAll('a')).map((link) =>
      link.textContent?.trim()
    );

    expect(linkTexts).toContain('📊 Dashboard');
    expect(linkTexts).toContain('🎯 Metas');
    expect(linkTexts).toContain('💰 Investimentos');
    expect(linkTexts).toContain('💸 Despesas');
    expect(linkTexts).toContain('💵 Receitas');
    expect(linkTexts).toContain('📋 Dívidas');
  });

  it('should have correct router links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');

    const hrefs = Array.from(links).map((link) =>
      link.getAttribute('routerLink')
    );
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/metas');
    expect(hrefs).toContain('/investimentos');
    expect(hrefs).toContain('/despesas');
    expect(hrefs).toContain('/receitas');
    expect(hrefs).toContain('/dividas');
  });

  it('should have close button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const closeButton = compiled.querySelector('button');
    expect(closeButton).toBeTruthy();
    expect(closeButton?.textContent?.trim()).toBe('✕');
  });
});
