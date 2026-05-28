import {
  Component,
  EventEmitter,
  Inject,
  Input,
  Optional,
  Output,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmModalData {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
  standalone: false,
})
export class ConfirmModalComponent {
  @Input() isOpen = true;
  @Input() title = 'Confirmar Exclusão';
  @Input() message = 'Tem certeza que deseja excluir este item?';
  @Input() confirmText = 'Sim, Excluir';
  @Input() cancelText = 'Cancelar';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: ConfirmModalData | null,
    @Optional() private dialogRef: MatDialogRef<ConfirmModalComponent, boolean>,
  ) {
    if (data) {
      this.title = data.title || this.title;
      this.message = data.message || this.message;
      this.confirmText = data.confirmText || this.confirmText;
      this.cancelText = data.cancelText || this.cancelText;
    }
  }

  onConfirm(): void {
    if (this.dialogRef) {
      this.dialogRef.close(true);
      return;
    }

    this.confirm.emit();
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close(false);
      return;
    }

    this.cancel.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
