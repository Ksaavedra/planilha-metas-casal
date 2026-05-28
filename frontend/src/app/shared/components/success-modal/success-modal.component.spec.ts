import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuccessModalComponent } from './success-modal.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('SuccessModalComponent', () => {
  let component: SuccessModalComponent;
  let fixture: ComponentFixture<SuccessModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SuccessModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SuccessModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Inicialização', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default values', () => {
      expect(component.isOpen).toBe(true);
      expect(component.title).toBe('Tudo certo!');
      expect(component.message).toBe('Operação realizada com sucesso.');
      expect(component.confirmText).toBe('OK');
      expect(component.closeOnBackdrop).toBe(true);
      expect(component.autoCloseMs).toBe(0);
    });
  });

  describe('Eventos sem MatDialog', () => {
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
      component.isOpen = true;

      component.onBackdropClick();

      expect(spy).toHaveBeenCalled();
    });

    it('should not call handleClose when backdrop is clicked and closeOnBackdrop is false', () => {
      const spy = jest.spyOn(component, 'handleClose');
      component.closeOnBackdrop = false;
      component.isOpen = true;

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
      const spy = jest.spyOn(component, 'handleClose');
      component.autoCloseMs = 1000;
      component.isOpen = true;

      component.ngOnInit();

      jest.advanceTimersByTime(1000);

      expect(spy).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should not auto close when autoCloseMs is 0', () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(component, 'handleClose');
      component.autoCloseMs = 0;
      component.isOpen = true;

      component.ngOnInit();

      jest.advanceTimersByTime(1000);

      expect(spy).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should not auto close when modal is not open', () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(component, 'handleClose');
      component.autoCloseMs = 1000;
      component.isOpen = false;

      component.ngOnInit();

      jest.advanceTimersByTime(1000);

      expect(spy).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Com MatDialog', () => {
    it('deve usar dados completos do MAT_DIALOG_DATA', async () => {
      await TestBed.resetTestingModule()
        .configureTestingModule({
          declarations: [SuccessModalComponent],
          providers: [
            {
              provide: MAT_DIALOG_DATA,
              useValue: {
                title: 'Sucesso!',
                message: 'Salvo com sucesso.',
                confirmText: 'Fechar',
                autoCloseMs: 2000,
              },
            },
            {
              provide: MatDialogRef,
              useValue: { close: jest.fn() },
            },
          ],
        })
        .compileComponents();

      const dialogFixture = TestBed.createComponent(SuccessModalComponent);
      const dialogComponent = dialogFixture.componentInstance;

      expect(dialogComponent.title).toBe('Sucesso!');
      expect(dialogComponent.message).toBe('Salvo com sucesso.');
      expect(dialogComponent.confirmText).toBe('Fechar');
      expect(dialogComponent.autoCloseMs).toBe(2000);
    });

    it('deve usar valores padrão quando MAT_DIALOG_DATA vier vazio/parcial', async () => {
      await TestBed.resetTestingModule()
        .configureTestingModule({
          declarations: [SuccessModalComponent],
          providers: [
            {
              provide: MAT_DIALOG_DATA,
              useValue: {
                title: '',
                message: null,
                confirmText: undefined,
                autoCloseMs: undefined,
              },
            },
          ],
        })
        .compileComponents();

      const dialogFixture = TestBed.createComponent(SuccessModalComponent);
      const dialogComponent = dialogFixture.componentInstance;

      expect(dialogComponent.title).toBe('Tudo certo!');
      expect(dialogComponent.message).toBe('Operação realizada com sucesso.');
      expect(dialogComponent.confirmText).toBe('OK');
      expect(dialogComponent.autoCloseMs).toBe(0);
    });

    it('handleClose deve fechar MatDialog com true', async () => {
      const dialogRefMock = { close: jest.fn() };

      await TestBed.resetTestingModule()
        .configureTestingModule({
          declarations: [SuccessModalComponent],
          providers: [
            { provide: MAT_DIALOG_DATA, useValue: null },
            { provide: MatDialogRef, useValue: dialogRefMock },
          ],
        })
        .compileComponents();

      const dialogFixture = TestBed.createComponent(SuccessModalComponent);
      const dialogComponent = dialogFixture.componentInstance;

      dialogComponent.handleClose();

      expect(dialogRefMock.close).toHaveBeenCalledWith(true);
    });
  });

  describe('Template / UI', () => {
    it('should show modal when isOpen is true', () => {
      component.isOpen = true;
      fixture.detectChanges();

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

      expect(titleElement?.textContent).toContain('Test Title');
      expect(messageElement?.textContent).toContain('Test Message');
    });

    it('should call handleClose when OK button is clicked', () => {
      component.isOpen = true;
      fixture.detectChanges();

      const okButton = fixture.nativeElement.querySelector('.btn-ok');
      const spy = jest.spyOn(component, 'handleClose');

      okButton.click();

      expect(spy).toHaveBeenCalled();
    });

    it('should call onBackdropClick when overlay is clicked', () => {
      component.isOpen = true;
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.modal-overlay');
      const spy = jest.spyOn(component, 'onBackdropClick');

      overlay.click();

      expect(spy).toHaveBeenCalled();
    });
  });
});
