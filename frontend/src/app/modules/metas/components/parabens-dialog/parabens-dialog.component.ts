import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ParabensDialogData } from '@core/interfaces/metas/metas-parabens';

@Component({
  selector: 'app-parabens-dialog',
  templateUrl: './parabens-dialog.component.html',
  styleUrl: './parabens-dialog.component.scss',
  standalone: false,
})
export class ParabensDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ParabensDialogData,
    private dialogRef: MatDialogRef<ParabensDialogComponent>,
  ) {}

  fechar(): void {
    this.dialogRef.close();
  }
}
