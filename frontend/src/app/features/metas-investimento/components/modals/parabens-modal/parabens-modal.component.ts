import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-parabens-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parabens-modal.component.html',
  styleUrl: './parabens-modal.component.scss',
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
