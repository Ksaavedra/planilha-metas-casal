import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { InvestimentosPageComponent } from './containers/investimentos-page/investimentos-page.component';

const routes: Routes = [
  {
    path: '',
    component: InvestimentosPageComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InvestimentosRoutingModule {}
