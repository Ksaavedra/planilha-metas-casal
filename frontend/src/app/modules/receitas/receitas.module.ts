import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DSModule } from 'app/@ds';
import { ReactiveFormsModule } from '@angular/forms';
import { ReceitasRoutingModule } from './receitas.routing';
import { ReceitasPageComponent } from './containers/receitas-page/receitas-page.component';

@NgModule({
  declarations: [ReceitasPageComponent],
  imports: [
    CommonModule,
    RouterModule,
    DSModule,
    ReactiveFormsModule,
    ReceitasRoutingModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReceitasModule {}
