import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DespesasPageComponent } from './containers/despesas-page/despesas-page.component';
import { DespesasRoutingModule } from './despesas.routing';
import { DSModule } from 'app/@ds';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [DespesasPageComponent],
  imports: [
    CommonModule,
    RouterModule,
    DespesasRoutingModule,
    DSModule,
    ReactiveFormsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DespesasModule {}
