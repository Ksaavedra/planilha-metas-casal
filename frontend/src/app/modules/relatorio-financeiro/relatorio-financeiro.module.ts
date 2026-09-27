import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DSModule } from '../../@ds/ds.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RelatorioFinanceiroRoutingModule } from './relatorio-financeiro.routing';
import { RelatorioPageComponent } from './containers/relatorio-page/relatorio-page.component';
import { RelatorioCategoriasComponent } from './containers/relatorio-categorias/relatorio-categorias.component';
import { RelatorioGuiaComponent } from './containers/relatorio-guia/relatorio-guia.component';
import { RelatorioGraficosComponent } from './containers/relatorio-graficos/relatorio-graficos.component';
import { RelatorioResumoTableComponent } from './components/relatorio-resumo-table/relatorio-resumo-table.component';

@NgModule({
  declarations: [
    RelatorioPageComponent,
    RelatorioCategoriasComponent,
    RelatorioGuiaComponent,
    RelatorioGraficosComponent,
    RelatorioResumoTableComponent,
  ],
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
