import { RouterModule, Routes } from '@angular/router';
import { DespesasPageComponent } from './containers/despesas-page/despesas-page.component';
import { NgModule } from '@angular/core';

const routes: Routes = [
  {
    path: '',
    component: DespesasPageComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DespesasRoutingModule {}
