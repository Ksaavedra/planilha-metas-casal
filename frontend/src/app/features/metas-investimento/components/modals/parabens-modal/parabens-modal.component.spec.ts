import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParabensModalComponent } from './parabens-modal.component';

describe('ParabensModalComponent', () => {
  let component: ParabensModalComponent;
  let fixture: ComponentFixture<ParabensModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParabensModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ParabensModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.isOpen).toBe(false);
    expect(component.metaNome).toBe('');
    expect(component.valorMeta).toBe(0);
  });

  it('should accept custom input values', () => {
    component.isOpen = true;
    component.metaNome = 'Teste Meta';
    component.valorMeta = 1000;

    expect(component.isOpen).toBe(true);
    expect(component.metaNome).toBe('Teste Meta');
    expect(component.valorMeta).toBe(1000);
  });

  it('should have close EventEmitter', () => {
    expect(component.close).toBeDefined();
    expect(typeof component.close.emit).toBe('function');
  });

  it('should emit close event when onClose is called', () => {
    const spy = jest.spyOn(component.close, 'emit');

    component.onClose();

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple close events', () => {
    const spy = jest.spyOn(component.close, 'emit');

    component.onClose();
    component.onClose();
    component.onClose();

    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('should render modal when isOpen is true', () => {
    component.isOpen = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.modal')).toBeTruthy();
  });

  it('should not render modal when isOpen is false', () => {
    component.isOpen = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.modal')).toBeFalsy();
  });

  it('should display meta name and value', () => {
    component.isOpen = true;
    component.metaNome = 'Meta de Teste';
    component.valorMeta = 5000;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Meta de Teste');
    expect(compiled.textContent).toContain('5000');
  });

  it('should handle empty meta name', () => {
    component.isOpen = true;
    component.metaNome = '';
    component.valorMeta = 1000;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('1000');
  });

  it('should handle zero valor meta', () => {
    component.isOpen = true;
    component.metaNome = 'Meta Zero';
    component.valorMeta = 0;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Meta Zero');
    expect(compiled.textContent).toContain('0');
  });

  it('should have correct component structure', () => {
    expect(typeof component.onClose).toBe('function');
  });

  it('should handle onClose method call without errors', () => {
    expect(() => component.onClose()).not.toThrow();
  });
});
