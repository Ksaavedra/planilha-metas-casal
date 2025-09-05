import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DSModule } from '../../@ds/ds.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RelatorioFinanceiroRoutingModule } from './relatorio-financeiro.routing';
import { RelatorioPageComponent } from './containers/relatorio-page/relatorio-page.component';
import { NGX_ECHARTS_CONFIG, NgxEchartsModule } from 'ngx-echarts';

@NgModule({
  declarations: [RelatorioPageComponent],
  imports: [
    CommonModule,
    RouterModule,
    DSModule,
    ReactiveFormsModule,
    RelatorioFinanceiroRoutingModule,
    FormsModule,
    NgxEchartsModule,
  ],
  providers: [
    {
      provide: NGX_ECHARTS_CONFIG,
      useValue: {
        echarts: () => import('echarts'),
      },
    },
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RelatorioFinanceiroModule {}
