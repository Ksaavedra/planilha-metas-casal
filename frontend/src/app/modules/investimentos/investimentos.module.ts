import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DSModule } from 'app/@ds';
import { ReactiveFormsModule } from '@angular/forms';
import { InvestimentosRoutingModule } from './investimentos.routing';
import { InvestimentosPageComponent } from './containers/investimentos-page/investimentos-page.component';

@NgModule({
  declarations: [InvestimentosPageComponent],
  imports: [
    CommonModule,
    RouterModule,
    InvestimentosRoutingModule,
    DSModule,
    ReactiveFormsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InvestimentosModule {}
