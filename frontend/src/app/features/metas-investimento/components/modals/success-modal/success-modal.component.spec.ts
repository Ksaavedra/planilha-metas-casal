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

  it('should emit close event when handleClose is called', () => {
    const spy = jest.spyOn(component.close, 'emit');
    component.isOpen = true;

    component.handleClose();

    expect(spy).toHaveBeenCalled();
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
  });

  it('should auto close after specified time when autoCloseMs is set', () => {
    jest.useFakeTimers();
    component.isOpen = true;
    component.autoCloseMs = 1000;
    const spy = jest.spyOn(component, 'handleClose');

    component.ngOnInit();

    jest.advanceTimersByTime(1000);

    expect(spy).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
