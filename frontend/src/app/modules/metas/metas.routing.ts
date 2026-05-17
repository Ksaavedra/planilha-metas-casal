import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { MetasPageComponent } from './containers/metas-page/metas-page.component';

const routes: Routes = [
  {
    path: '',
    component: MetasPageComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MetasRoutingModule {}
