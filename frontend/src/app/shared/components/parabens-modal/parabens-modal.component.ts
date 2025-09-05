import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-parabens-modal',
  templateUrl: './parabens-modal.component.html',
  styleUrls: ['./parabens-modal.component.scss'],
})
export class ParabensModalComponent {
  @Input() isOpen = false;
  @Input() metaNome = '';
  @Input() valorMeta = 0;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}
