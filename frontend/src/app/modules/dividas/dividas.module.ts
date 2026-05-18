import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DSModule } from 'app/@ds';
import { SharedModule } from 'shared/shared.module';
import { DividasRoutingModule } from './dividas.routing';
import { DividasPageComponent } from './containers/dividas-page/dividas-page.component';
import { AdicionarDividaDialogComponent } from './components/adicionar-divida-dialog/adicionar-divida-dialog.component';

@NgModule({
  declarations: [DividasPageComponent, AdicionarDividaDialogComponent],
  imports: [
    CommonModule,
    RouterModule,
    DividasRoutingModule,
    DSModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DividasModule {}
