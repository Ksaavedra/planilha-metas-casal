import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  MAT_DATE_FORMATS,
  MAT_NATIVE_DATE_FORMATS,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';

export interface SeletorMesDialogData {
  selectedDate: Date;
}

@Component({
  selector: 'app-seletor-mes-dialog',
  templateUrl: './seletor-mes-dialog.component.html',
  styleUrls: ['./seletor-mes-dialog.component.scss'],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeletorMesDialogComponent {
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    if (view === 'month') {
      const date = cellDate.getDate();
      return date % 2 === 0 ? 'even-date' : 'odd-date';
    }
    return '';
  };

  constructor(
    public dialogRef: MatDialogRef<SeletorMesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SeletorMesDialogData
  ) {}
}
