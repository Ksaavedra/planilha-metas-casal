import {
  CUSTOM_ELEMENTS_SCHEMA,
  NgModule,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DSModule } from 'app/@ds';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from './components/success-modal/success-modal.component';
import { SeletorMesDialogComponent } from './components/seletor-mes-dialog/seletor-mes-dialog.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ConfirmModalComponent,
    SuccessModalComponent,
    SeletorMesDialogComponent,
  ],
  imports: [CommonModule, DSModule, FormsModule, ReactiveFormsModule],
  exports: [
    ConfirmModalComponent,
    SuccessModalComponent,
    SeletorMesDialogComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class SharedModule {}
