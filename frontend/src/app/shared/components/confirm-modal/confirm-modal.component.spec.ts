import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  const openModal = (title: string, message: string) => {
    component.isOpen = true;
    component.title = title;
    component.message = message;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.isOpen).toBe(false);
    expect(component.title).toBe('Confirmar Exclusão');
    expect(component.message).toBe('Tem certeza que deseja excluir este item?');
  });

  it('should emit confirm event when onConfirm is called', () => {
    const spy = jest.spyOn(component.confirm, 'emit');

    component.onConfirm();

    expect(spy).toHaveBeenCalled();
  });

  it('should emit cancel event when onCancel is called', () => {
    const spy = jest.spyOn(component.cancel, 'emit');

    component.onCancel();

    expect(spy).toHaveBeenCalled();
  });

  it('should call onCancel when overlay is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();

    const cancelButton = fixture.nativeElement.querySelector('.btn-cancelar');
    const spy = jest.spyOn(component, 'onCancel');

    cancelButton.click();

    expect(spy).toHaveBeenCalled();
  });

  it('should show modal when isOpen is true', () => {
    openModal('Test Title', 'Test Message');

    const modal = fixture.nativeElement.querySelector('.modal-overlay');
    expect(modal).toBeTruthy();
  });

  it('should hide modal when isOpen is false', () => {
    component.isOpen = false;
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.modal-overlay');
    expect(modal).toBeFalsy();
  });

  it('should display custom title and message', () => {
    component.isOpen = true;
    component.title = 'Test Title';
    component.message = 'Test Message';
    fixture.detectChanges();

    const titleElement = fixture.nativeElement.querySelector('h3');
    const messageElement = fixture.nativeElement.querySelector('.message');

    expect(titleElement.textContent).toContain('Test Title');
    expect(messageElement.textContent).toContain('Test Message');
  });

  it('should call onConfirm when confirm button is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();

    const confirmButton = fixture.nativeElement.querySelector('.btn-confirmar');
    const spy = jest.spyOn(component, 'onConfirm');

    confirmButton.click();

    expect(spy).toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();

    const cancelButton = fixture.nativeElement.querySelector('.btn-cancelar');
    const spy = jest.spyOn(component, 'onCancel');

    cancelButton.click();

    expect(spy).toHaveBeenCalled();
  });

  it('should call onCancel when overlay itself is clicked', () => {
    component.isOpen = true;
    fixture.detectChanges();

    const spy = jest.spyOn(component, 'onCancel');
    const overlay = fixture.nativeElement.querySelector(
      '.modal-overlay'
    ) as HTMLElement;

    // força target === currentTarget (ramo que está vermelho)
    component.onOverlayClick({
      target: overlay,
      currentTarget: overlay,
    } as any);

    expect(spy).toHaveBeenCalled();
  });

  it('should NOT call onCancel when click happens inside modal content', () => {
    component.isOpen = true;
    fixture.detectChanges();

    const spy = jest.spyOn(component, 'onCancel');
    const overlay = fixture.nativeElement.querySelector(
      '.modal-overlay'
    ) as HTMLElement;
    const inner = fixture.nativeElement.querySelector(
      '.modal-content'
    ) as HTMLElement;

    // target != currentTarget => não deve cancelar
    component.onOverlayClick({ target: inner, currentTarget: overlay } as any);

    expect(spy).not.toHaveBeenCalled();
  });
});
