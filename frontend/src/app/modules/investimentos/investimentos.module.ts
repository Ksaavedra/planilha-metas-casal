import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DSModule } from 'app/@ds';
import { SharedModule } from 'shared/shared.module';
import { InvestimentosRoutingModule } from './investimentos.routing';
import { InvestimentosPageComponent } from './containers/investimentos-page/investimentos-page.component';
import { AdicionarInvestimentoDialogComponent } from './components/adicionar-investimento-dialog/adicionar-investimento-dialog.component';

@NgModule({
  declarations: [
    InvestimentosPageComponent,
    AdicionarInvestimentoDialogComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    InvestimentosRoutingModule,
    DSModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InvestimentosModule {}
