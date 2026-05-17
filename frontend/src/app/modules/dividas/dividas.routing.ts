import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { DividasPageComponent } from './containers/dividas-page/dividas-page.component';

const routes: Routes = [
  {
    path: '',
    component: DividasPageComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DividasRoutingModule {}
