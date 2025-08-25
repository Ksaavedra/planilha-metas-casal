import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/relatorio',
    pathMatch: 'full',
  },
  {
    path: 'relatorio',
    loadComponent: () =>
      import('./features/relatorio-financeiro').then(
        (m) => m.RelatorioPageComponent
      ),
    title: 'Relatório Financeiro',
  },
  {
    path: 'rota-do-dinheiro',
    loadComponent: () =>
      import('./features/rota-do-dinheiro').then((m) => m.RotaPageComponent),
    title: 'Rota do Dinheiro',
  },
  {
    path: 'receitas',
    loadComponent: () =>
      import('./features/receitas').then((m) => m.ReceitasPageComponent),
    title: 'Receitas',
  },
  {
    path: 'despesas',
    loadComponent: () =>
      import('./features/despesas').then((m) => m.DespesasPageComponent),
    title: 'Despesas',
  },
  {
    path: 'dividas',
    loadComponent: () =>
      import('./features/dividas').then((m) => m.DividasPageComponent),
    title: 'Dívidas',
  },
  {
    path: 'investimentos',
    loadComponent: () =>
      import('./features/investimentos').then(
        (m) => m.InvestimentosPageComponent
      ),
    title: 'Investimentos',
  },
  {
    path: 'metas',
    loadComponent: () =>
      import('./features/metas-investimento').then((m) => m.MetasPageComponent),
    title: 'Metas de Investimento',
  },
  {
    path: '**',
    redirectTo: '/relatorio',
  },
];
