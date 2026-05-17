import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DSModule } from '../../@ds/ds.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RelatorioFinanceiroRoutingModule } from './relatorio-financeiro.routing';
import { RelatorioPageComponent } from './containers/relatorio-page/relatorio-page.component';
import { RelatorioCategoriasComponent } from './containers/relatorio-categorias/relatorio-categorias.component';

@NgModule({
  declarations: [RelatorioPageComponent, RelatorioCategoriasComponent],
  imports: [
    CommonModule,
    RouterModule,
    DSModule,
    ReactiveFormsModule,
    FormsModule,
    RelatorioFinanceiroRoutingModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RelatorioFinanceiroModule {}
