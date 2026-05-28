import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DSModule } from 'app/@ds';
import { ReactiveFormsModule } from '@angular/forms';
import { RotaDinheiroRoutingModule } from './rota-dinheiro.routing';
import { RotaPageComponent } from './containers/rota-page/rota-page.component';

@NgModule({
  declarations: [RotaPageComponent],
  imports: [
    CommonModule,
    RouterModule,
    DSModule,
    ReactiveFormsModule,
    RotaDinheiroRoutingModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RotaDinheiroModule {}
