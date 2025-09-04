import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { ReceitasPageComponent } from './containers/receitas-page/receitas-page.component';

const routes: Routes = [
  {
    path: '',
    component: ReceitasPageComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReceitasRoutingModule {}
