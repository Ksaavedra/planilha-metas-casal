import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParabensModalComponent } from './parabens-modal.component';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

describe('ParabensModalComponent', () => {
  let component: ParabensModalComponent;
  let fixture: ComponentFixture<ParabensModalComponent>;
  let root: HTMLElement;

  const openModal = (metaNome: string, valorMeta: number) => {
    component.isOpen = true;
    component.metaNome = metaNome;
    component.valorMeta = valorMeta;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ParabensModalComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
    }).compileComponents();

    fixture = TestBed.createComponent(ParabensModalComponent);
    component = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  beforeAll(() => {
    registerLocaleData(localePt);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.isOpen).toBe(false);
    expect(component.metaNome).toBe('');
    expect(component.valorMeta).toBe(0);
  });

  it('should emit close event when onClose is called', () => {
    const spy = jest.spyOn(component.close, 'emit');

    component.onClose();

    expect(spy).toHaveBeenCalled();
  });

  it('should hire when isOpen is false', () => {
    component.isOpen = false;
    fixture.detectChanges();

    expect(root.querySelector('.modal-overlay')).toBeFalsy();
  });

  it('should show modal when isOpen is true', () => {
    openModal('Test Meta', 10000);

    expect(root.querySelector('.modal-overlay')).toBeTruthy();
  });

  it('should display meta information when metaNome is provided', () => {
    openModal('Test Meta', 10000);

    const metaEl = root.querySelector('.meta-info strong') as HTMLElement;
    expect(metaEl.textContent?.trim()).toBe('Test Meta');
  });

  it('should display valorMeta formatted as BRL', () => {
    const valor = 1500;
    openModal('X', valor);
    const valorEl = root.querySelector('.valor-info strong') as HTMLElement;
    const brl = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);

    const norm = (s: string) => s.replace(/\u00A0/g, ' ');
    expect(norm(valorEl.textContent!)).toContain(norm(brl));
  });

  it('should emit close when close button is clicked', () => {
    openModal('Test Meta', 10000);
    const spy = jest.spyOn(component.close, 'emit');
    const btn = root.querySelector('.btn-close') as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit close when overlay is clicked', () => {
    openModal('Test Meta', 10000);
    const spy = jest.spyOn(component.close, 'emit');
    const overlay = root.querySelector('.modal-overlay') as HTMLElement;
    // overlay tem (click)="onClose()"
    overlay.click();
    expect(spy).toHaveBeenCalled();
  });
});
