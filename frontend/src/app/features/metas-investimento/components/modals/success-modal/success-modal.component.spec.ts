import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuccessModalComponent } from './success-modal.component';

describe('SuccessModalComponent', () => {
  let component: SuccessModalComponent;
  let fixture: ComponentFixture<SuccessModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuccessModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SuccessModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.isOpen).toBe(false);
    expect(component.title).toBe('Tudo certo!');
    expect(component.message).toBe('Operação realizada com sucesso.');
    expect(component.confirmText).toBe('OK');
    expect(component.closeOnBackdrop).toBe(true);
    expect(component.autoCloseMs).toBe(0);
  });

  it('should accept custom input values', () => {
    component.isOpen = true;
    component.title = 'Sucesso!';
    component.message = 'Operação customizada realizada.';
    component.confirmText = 'Entendi';
    component.closeOnBackdrop = false;
    component.autoCloseMs = 5000;

    expect(component.isOpen).toBe(true);
    expect(component.title).toBe('Sucesso!');
    expect(component.message).toBe('Operação customizada realizada.');
    expect(component.confirmText).toBe('Entendi');
    expect(component.closeOnBackdrop).toBe(false);
    expect(component.autoCloseMs).toBe(5000);
  });

  it('should have close EventEmitter', () => {
    expect(component.close).toBeDefined();
    expect(typeof component.close.emit).toBe('function');
  });

  it('should emit close event when handleClose is called and modal is open', () => {
    const spy = jest.spyOn(component.close, 'emit');
    component.isOpen = true;

    component.handleClose();

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(component.isOpen).toBe(false);
  });

  it('should not emit close event when modal is already closed', () => {
    const spy = jest.spyOn(component.close, 'emit');
    component.isOpen = false;

    component.handleClose();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should call handleClose when backdrop is clicked and closeOnBackdrop is true', () => {
    const spy = jest.spyOn(component, 'handleClose');
    component.closeOnBackdrop = true;

    component.onBackdropClick();

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not call handleClose when backdrop is clicked and closeOnBackdrop is false', () => {
    const spy = jest.spyOn(component, 'handleClose');
    component.closeOnBackdrop = false;

    component.onBackdropClick();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should stop event propagation when stop is called', () => {
    const mockEvent = {
      stopPropagation: jest.fn(),
    } as any;

    component.stop(mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('should auto close after specified time when autoCloseMs is set', () => {
    jest.useFakeTimers();
    component.isOpen = true;
    component.autoCloseMs = 1000;
    const spy = jest.spyOn(component, 'handleClose');

    component.ngOnInit();

    jest.advanceTimersByTime(1000);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('should not auto close when autoCloseMs is 0', () => {
    jest.useFakeTimers();
    component.isOpen = true;
    component.autoCloseMs = 0;
    const spy = jest.spyOn(component, 'handleClose');

    component.ngOnInit();

    jest.advanceTimersByTime(1000);

    expect(spy).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should not auto close when modal is not open', () => {
    jest.useFakeTimers();
    component.isOpen = false;
    component.autoCloseMs = 1000;
    const spy = jest.spyOn(component, 'handleClose');

    component.ngOnInit();

    jest.advanceTimersByTime(1000);

    expect(spy).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should handle multiple close events', () => {
    const spy = jest.spyOn(component.close, 'emit');
    component.isOpen = true;

    component.handleClose();
    component.handleClose();
    component.handleClose();

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

  it('should display custom title and message', () => {
    component.isOpen = true;
    component.title = 'Título Teste';
    component.message = 'Mensagem de teste';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Título Teste');
    expect(compiled.textContent).toContain('Mensagem de teste');
  });
});
