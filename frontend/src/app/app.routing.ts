import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoggedComponent } from './core/components/logged/logged.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: LoggedComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import(
            './modules/relatorio-financeiro/relatorio-financeiro.module'
          ).then((module) => module.RelatorioFinanceiroModule),
      },
      {
        path: 'rotaDinheiro',
        loadChildren: () =>
          import('./modules/rota-dinheiro/rota-dinheiro.module').then(
            (module) => module.RotaDinheiroModule
          ),
      },
      {
        path: 'receitas',
        loadChildren: () =>
          import('./modules/receitas/receitas.module').then(
            (module) => module.ReceitasModule
          ),
      },
      {
        path: 'despesas',
        loadChildren: () =>
          import('./modules/despesas/despesas.module').then(
            (module) => module.DespesasModule
          ),
      },
      {
        path: 'dividas',
        loadChildren: () =>
          import('./modules/dividas/dividas.module').then(
            (module) => module.DividasModule
          ),
      },
      {
        path: 'investimentos',
        loadChildren: () =>
          import('./modules/investimentos/investimentos.module').then(
            (module) => module.InvestimentosModule
          ),
      },
      {
        path: 'metas',
        loadChildren: () =>
          import('./modules/metas/metas.module').then(
            (module) => module.MetasModule
          ),
      },
      {
        path: '**',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
