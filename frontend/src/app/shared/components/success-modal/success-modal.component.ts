import {
  Component,
  EventEmitter,
  Inject,
  Input,
  Optional,
  Output,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface SuccessModalData {
  title?: string;
  message?: string;
  confirmText?: string;
  autoCloseMs?: number;
}

@Component({
  selector: 'app-success-modal',
  templateUrl: './success-modal.component.html',
  styleUrls: ['./success-modal.component.scss'],
  standalone: false,
})
export class SuccessModalComponent {
  @Input() isOpen = true;
  @Input() title = 'Tudo certo!';
  @Input() message = 'Operação realizada com sucesso.';
  @Input() confirmText = 'OK';
  @Input() closeOnBackdrop = true;
  @Input() autoCloseMs = 0;
  @Output() close = new EventEmitter<void>();

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: SuccessModalData | null,
    @Optional() private dialogRef: MatDialogRef<SuccessModalComponent, boolean>,
  ) {
    if (data) {
      this.title = data.title || this.title;
      this.message = data.message || this.message;
      this.confirmText = data.confirmText || this.confirmText;
      this.autoCloseMs = data.autoCloseMs ?? this.autoCloseMs;
    }
  }

  ngOnInit() {
    if (this.isOpen && this.autoCloseMs > 0) {
      setTimeout(() => this.handleClose(), this.autoCloseMs);
    }
  }

  handleClose(): void {
    if (this.dialogRef) {
      this.dialogRef.close(true);
      return;
    }

    if (!this.isOpen) {
      this.isOpen = false;
      this.close.emit();
    }
  }

  onBackdropClick(_e?: MouseEvent): void {
    if (this.closeOnBackdrop) this.handleClose();
  }

  stop(e: Event): void {
    e.stopPropagation();
  }
}
