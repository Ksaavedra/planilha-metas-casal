import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DividasPageComponent } from './containers/dividas-page/dividas-page.component';
import { DSModule } from 'app/@ds';
import { ReactiveFormsModule } from '@angular/forms';
import { DividasRoutingModule } from './dividas.routing';

@NgModule({
  declarations: [DividasPageComponent],
  imports: [
    CommonModule,
    RouterModule,
    DividasRoutingModule,
    DSModule,
    ReactiveFormsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DividasModule {}
