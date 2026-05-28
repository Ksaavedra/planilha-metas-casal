import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { CartoesPageComponent } from './containers/cartoes-page/cartoes-page.component';

const routes: Routes = [
  {
    path: '',
    component: CartoesPageComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CartoesRoutingModule {}
