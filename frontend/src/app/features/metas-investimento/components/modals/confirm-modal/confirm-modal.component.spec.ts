import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.isOpen).toBe(false);
    expect(component.title).toBe('Confirmar Exclusão');
    expect(component.message).toBe('Tem certeza que deseja excluir este item?');
    expect(component.confirmText).toBe('Sim, Excluir');
    expect(component.cancelText).toBe('Cancelar');
  });

  it('should accept custom input values', () => {
    component.isOpen = true;
    component.title = 'Título Customizado';
    component.message = 'Mensagem customizada';
    component.confirmText = 'Confirmar';
    component.cancelText = 'Não';

    expect(component.isOpen).toBe(true);
    expect(component.title).toBe('Título Customizado');
    expect(component.message).toBe('Mensagem customizada');
    expect(component.confirmText).toBe('Confirmar');
    expect(component.cancelText).toBe('Não');
  });

  it('should have EventEmitters', () => {
    expect(component.confirm).toBeDefined();
    expect(component.cancel).toBeDefined();
    expect(typeof component.confirm.emit).toBe('function');
    expect(typeof component.cancel.emit).toBe('function');
  });

  it('should emit confirm event when onConfirm is called', () => {
    const spy = jest.spyOn(component.confirm, 'emit');

    component.onConfirm();

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should emit cancel event when onCancel is called', () => {
    const spy = jest.spyOn(component.cancel, 'emit');

    component.onCancel();

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when overlay is clicked (target === currentTarget)', () => {
    const spy = jest.spyOn(component, 'onCancel');
    const mockEvent = {
      target: document.createElement('div'),
      currentTarget: document.createElement('div'),
    } as any;

    // Simular clique no overlay (target === currentTarget)
    mockEvent.target = mockEvent.currentTarget;
    component.onOverlayClick(mockEvent);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not call onCancel when content is clicked (target !== currentTarget)', () => {
    const spy = jest.spyOn(component, 'onCancel');
    const mockEvent = {
      target: document.createElement('div'),
      currentTarget: document.createElement('div'),
    } as any;

    // Simular clique no conteúdo (target !== currentTarget)
    mockEvent.target = document.createElement('span');
    component.onOverlayClick(mockEvent);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should handle multiple confirm events', () => {
    const spy = jest.spyOn(component.confirm, 'emit');

    component.onConfirm();
    component.onConfirm();
    component.onConfirm();

    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('should handle multiple cancel events', () => {
    const spy = jest.spyOn(component.cancel, 'emit');

    component.onCancel();
    component.onCancel();

    expect(spy).toHaveBeenCalledTimes(2);
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
});
