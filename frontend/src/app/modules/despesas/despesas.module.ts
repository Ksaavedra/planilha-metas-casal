import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DespesasPageComponent } from './containers/despesas-page/despesas-page.component';
import { AdicionarDespesaDialogComponent } from './components/adicionar-despesa-dialog/adicionar-despesa-dialog.component';
import { DespesasRoutingModule } from './despesas.routing';
import { DSModule } from 'app/@ds';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'app/shared/shared.module';
import { DespesasExemplosComponent } from './containers/despesas-exemplos/despesas-exemplos.component';

@NgModule({
  declarations: [
    DespesasPageComponent,
    AdicionarDespesaDialogComponent,
    DespesasExemplosComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    DespesasRoutingModule,
    DSModule,
    ReactiveFormsModule,
    SharedModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DespesasModule {}
