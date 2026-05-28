import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { RelatorioPageComponent } from './containers/relatorio-page/relatorio-page.component';

const routes: Routes = [
  {
    path: '',
    component: RelatorioPageComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RelatorioFinanceiroRoutingModule {}
