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
      import(
        './features/relatorio-financeiro/containers/relatorio-page/relatorio-page.component'
      ).then((m) => m.RelatorioPageComponent),
    title: 'Relatório Financeiro',
  },
  {
    path: 'rota-do-dinheiro',
    loadComponent: () =>
      import(
        './features/rota-do-dinheiro/containers/rota-page/rota-page.component'
      ).then((m) => m.RotaPageComponent),
    title: 'Rota do Dinheiro',
  },
  {
    path: 'receitas',
    loadComponent: () =>
      import(
        './features/receitas/containers/receitas-page/receitas-page.component'
      ).then((m) => m.ReceitasPageComponent),
    title: 'Receitas',
  },
  {
    path: 'despesas',
    loadComponent: () =>
      import(
        './features/despesas/containers/despesas-page/despesas-page.component'
      ).then((m) => m.DespesasPageComponent),
    title: 'Despesas',
  },
  {
    path: 'dividas',
    loadComponent: () =>
      import(
        './features/dividas/containers/dividas-page/dividas-page.component'
      ).then((m) => m.DividasPageComponent),
    title: 'Dívidas',
  },
  {
    path: 'investimentos',
    loadComponent: () =>
      import(
        './features/investimentos/containers/investimentos-page/investimentos-page.component'
      ).then((m) => m.InvestimentosPageComponent),
    title: 'Investimentos',
  },
  {
    path: 'metas',
    loadComponent: () =>
      import(
        './features/metas-investimento/containers/metas-page/metas-page.component'
      ).then((m) => m.MetasPageComponent),
    title: 'Metas de Investimento',
  },
  {
    path: '**',
    redirectTo: '/relatorio',
  },
];
