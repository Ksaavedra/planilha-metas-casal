import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { RotaPageComponent } from './containers/rota-page/rota-page.component';

const routes: Routes = [
  {
    path: '',
    component: RotaPageComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RotaDinheiroRoutingModule {}
