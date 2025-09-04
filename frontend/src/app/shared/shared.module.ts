import {
  CUSTOM_ELEMENTS_SCHEMA,
  NgModule,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DSModule } from 'app/@ds';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { ParabensModalComponent } from './components/parabens-modal/parabens-modal.component';
import { SuccessModalComponent } from './components/success-modal/success-modal.component';

@NgModule({
  declarations: [
    ConfirmModalComponent,
    SuccessModalComponent,
    ParabensModalComponent,
  ],
  imports: [CommonModule, DSModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class SharedModule {}
