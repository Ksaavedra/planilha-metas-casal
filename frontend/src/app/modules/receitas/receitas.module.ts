import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DSModule } from 'app/@ds';
import { ReactiveFormsModule } from '@angular/forms';
import { ReceitasRoutingModule } from './receitas.routing';
import { ReceitasPageComponent } from './containers/receitas-page/receitas-page.component';
import { SharedModule } from '../../shared/shared.module';
import { ReceitasExemplosComponent } from './components/receitas-exemplos/receitas-exemplos.component';
import { AdicionarReceitaDialogComponent } from './components/adicionar-receita-dialog/adicionar-receita-dialog.component';

@NgModule({
  declarations: [
    ReceitasPageComponent,
    ReceitasExemplosComponent,
    AdicionarReceitaDialogComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    DSModule,
    ReactiveFormsModule,
    ReceitasRoutingModule,
    SharedModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReceitasModule {}
