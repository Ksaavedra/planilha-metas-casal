import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-success-modal',
  templateUrl: './success-modal.component.html',
  styleUrls: ['./success-modal.component.scss'],
})
export class SuccessModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Tudo certo!';
  @Input() message = 'Operação realizada com sucesso.';
  @Input() confirmText = 'OK';
  @Input() closeOnBackdrop = true;
  @Input() autoCloseMs = 0;
  @Output() close = new EventEmitter<void>();

  ngOnInit() {
    if (this.isOpen && this.autoCloseMs > 0) {
      setTimeout(() => this.handleClose(), this.autoCloseMs);
    }
  }

  handleClose(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.close.emit();
  }

  onBackdropClick(_e?: MouseEvent): void {
    if (this.closeOnBackdrop) this.handleClose();
  }

  stop(e: Event): void {
    e.stopPropagation();
  }
}
