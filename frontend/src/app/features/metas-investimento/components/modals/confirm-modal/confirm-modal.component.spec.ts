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
    const spy = jest.spyOn(component, 'onCancel');
    const mockEvent = {
      target: document.createElement('div'),
      currentTarget: document.createElement('div'),
    } as any;

    // Simular clique no overlay (target === currentTarget)
    mockEvent.target = mockEvent.currentTarget;
    component.onOverlayClick(mockEvent);

    expect(spy).toHaveBeenCalled();
  });

  it('should not call onCancel when content is clicked', () => {
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
});
