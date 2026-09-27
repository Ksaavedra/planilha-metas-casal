import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { DSModule } from 'app/@ds';
import { SharedModule } from 'shared/shared.module';
import { DividasRoutingModule } from './dividas.routing';
import { DividasPageComponent } from './containers/dividas-page/dividas-page.component';
import { AdicionarDividaDialogComponent } from './components/adicionar-divida-dialog/adicionar-divida-dialog.component';
import { DividasExemplosComponent } from './components/dividas-exemplos/dividas-exemplos.component';

@NgModule({
  declarations: [
    DividasPageComponent,
    AdicionarDividaDialogComponent,
    DividasExemplosComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    DividasRoutingModule,
    DSModule,
    MatButtonModule,
    MatDialogModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DividasModule {}
