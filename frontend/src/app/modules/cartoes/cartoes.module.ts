import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { DSModule } from 'app/@ds';
import { SharedModule } from 'shared/shared.module';
import { CartoesRoutingModule } from './cartoes.routing';
import { CartoesPageComponent } from './containers/cartoes-page/cartoes-page.component';
import { AdicionarCartaoDialogComponent } from './components/adicionar-cartao-dialog/adicionar-cartao-dialog.component';
import { AdicionarParcelamentoDialogComponent } from './components/adicionar-parcelamento-dialog/adicionar-parcelamento-dialog.component';
import { FaturaAtrasadaDialogComponent } from './components/fatura-atrasada-dialog/fatura-atrasada-dialog.component';
import { FaturasExemplosComponent } from './components/faturas-exemplos/faturas-exemplos.component';

@NgModule({
  declarations: [
    CartoesPageComponent,
    AdicionarCartaoDialogComponent,
    AdicionarParcelamentoDialogComponent,
    FaturaAtrasadaDialogComponent,
    FaturasExemplosComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    CartoesRoutingModule,
    DSModule,
    MatButtonModule,
    MatDialogModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CartoesModule {}
