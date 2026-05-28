import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoggedComponent } from './core/components/logged/logged.component';
import { AuthGuard } from '@core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((module) => module.AuthModule),
  },
  {
    path: '',
    component: LoggedComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./modules/relatorio-financeiro/relatorio-financeiro.module').then(
            (module) => module.RelatorioFinanceiroModule,
          ),
      },
      {
        path: 'rotaDinheiro',
        loadChildren: () =>
          import('./modules/rota-dinheiro/rota-dinheiro.module').then(
            (module) => module.RotaDinheiroModule,
          ),
      },
      {
        path: 'receitas',
        loadChildren: () =>
          import('./modules/receitas/receitas.module').then(
            (module) => module.ReceitasModule,
          ),
      },
      {
        path: 'despesas',
        loadChildren: () =>
          import('./modules/despesas/despesas.module').then(
            (module) => module.DespesasModule,
          ),
      },
      {
        path: 'emprestimos',
        loadChildren: () =>
          import('./modules/dividas/dividas.module').then(
            (module) => module.DividasModule,
          ),
        data: { contextoDividas: 'emprestimos' },
      },
      {
        path: 'financiamentos',
        loadChildren: () =>
          import('./modules/dividas/dividas.module').then(
            (module) => module.DividasModule,
          ),
        data: { contextoDividas: 'financiamentos' },
      },
      {
        path: 'faturas',
        loadChildren: () =>
          import('./modules/cartoes/cartoes.module').then(
            (module) => module.CartoesModule,
          ),
      },
      {
        path: 'dividas',
        redirectTo: 'emprestimos',
        pathMatch: 'full',
      },
      {
        path: 'cartoes',
        redirectTo: 'faturas',
        pathMatch: 'full',
      },
      {
        path: 'investimentos',
        loadChildren: () =>
          import('./modules/investimentos/investimentos.module').then(
            (module) => module.InvestimentosModule,
          ),
      },
      {
        path: 'metas',
        loadChildren: () =>
          import('./modules/metas/metas.module').then(
            (module) => module.MetasModule,
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
