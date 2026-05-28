import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Inicialização', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default values', () => {
      expect(component.isOpen).toBe(true);
      expect(component.title).toBe('Confirmar Exclusão');
      expect(component.message).toBe(
        'Tem certeza que deseja excluir este item?',
      );
      expect(component.confirmText).toBe('Sim, Excluir');
      expect(component.cancelText).toBe('Cancelar');
    });
  });

  describe('Eventos sem MatDialog', () => {
    it('should emit confirm event', () => {
      const spy = jest.spyOn(component.confirm, 'emit');

      component.onConfirm();

      expect(spy).toHaveBeenCalled();
    });

    it('should emit cancel event', () => {
      const spy = jest.spyOn(component.cancel, 'emit');

      component.onCancel();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Com MatDialog', () => {
    it('deve usar dados completos do MAT_DIALOG_DATA', async () => {
      await TestBed.resetTestingModule()
        .configureTestingModule({
          declarations: [ConfirmModalComponent],
          providers: [
            {
              provide: MAT_DIALOG_DATA,
              useValue: {
                title: 'Título customizado',
                message: 'Mensagem customizada',
                confirmText: 'Confirmar',
                cancelText: 'Voltar',
              },
            },
            {
              provide: MatDialogRef,
              useValue: { close: jest.fn() },
            },
          ],
        })
        .compileComponents();

      const fixture = TestBed.createComponent(ConfirmModalComponent);
      const comp = fixture.componentInstance;

      expect(comp.title).toBe('Título customizado');
      expect(comp.message).toBe('Mensagem customizada');
      expect(comp.confirmText).toBe('Confirmar');
      expect(comp.cancelText).toBe('Voltar');
    });

    it('deve usar fallback quando dados vierem parciais', async () => {
      await TestBed.resetTestingModule()
        .configureTestingModule({
          declarations: [ConfirmModalComponent],
          providers: [
            {
              provide: MAT_DIALOG_DATA,
              useValue: {
                title: '',
                message: null,
                confirmText: undefined,
                cancelText: '',
              },
            },
          ],
        })
        .compileComponents();

      const fixture = TestBed.createComponent(ConfirmModalComponent);
      const comp = fixture.componentInstance;

      expect(comp.title).toBe('Confirmar Exclusão');
      expect(comp.message).toBe('Tem certeza que deseja excluir este item?');
      expect(comp.confirmText).toBe('Sim, Excluir');
      expect(comp.cancelText).toBe('Cancelar');
    });

    it('onConfirm deve fechar dialog com true', async () => {
      const dialogRefMock = { close: jest.fn() };

      await TestBed.resetTestingModule()
        .configureTestingModule({
          declarations: [ConfirmModalComponent],
          providers: [
            { provide: MAT_DIALOG_DATA, useValue: null },
            { provide: MatDialogRef, useValue: dialogRefMock },
          ],
        })
        .compileComponents();

      const fixture = TestBed.createComponent(ConfirmModalComponent);
      const comp = fixture.componentInstance;

      comp.onConfirm();

      expect(dialogRefMock.close).toHaveBeenCalledWith(true);
    });

    it('onCancel deve fechar dialog com false', async () => {
      const dialogRefMock = { close: jest.fn() };

      await TestBed.resetTestingModule()
        .configureTestingModule({
          declarations: [ConfirmModalComponent],
          providers: [
            { provide: MAT_DIALOG_DATA, useValue: null },
            { provide: MatDialogRef, useValue: dialogRefMock },
          ],
        })
        .compileComponents();

      const fixture = TestBed.createComponent(ConfirmModalComponent);
      const comp = fixture.componentInstance;

      comp.onCancel();

      expect(dialogRefMock.close).toHaveBeenCalledWith(false);
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

      const title = fixture.nativeElement.querySelector('h3');
      const msg = fixture.nativeElement.querySelector('.message');

      expect(title.textContent).toContain('Test Title');
      expect(msg.textContent).toContain('Test Message');
    });

    it('should call onConfirm when confirm button is clicked', () => {
      component.isOpen = true;
      fixture.detectChanges();

      const spy = jest.spyOn(component, 'onConfirm');
      fixture.nativeElement.querySelector('.btn-confirmar').click();

      expect(spy).toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked', () => {
      component.isOpen = true;
      fixture.detectChanges();

      const spy = jest.spyOn(component, 'onCancel');
      fixture.nativeElement.querySelector('.btn-cancelar').click();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Overlay click', () => {
    it('should call onCancel when clicking overlay', () => {
      const spy = jest.spyOn(component, 'onCancel');

      const overlay = document.createElement('div');

      component.onOverlayClick({
        target: overlay,
        currentTarget: overlay,
      } as any);

      expect(spy).toHaveBeenCalled();
    });

    it('should NOT call onCancel when clicking inside modal', () => {
      const spy = jest.spyOn(component, 'onCancel');

      component.onOverlayClick({
        target: document.createElement('div'),
        currentTarget: document.createElement('div'),
      } as any);

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
