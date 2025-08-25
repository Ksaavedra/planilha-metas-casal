import { Injectable, signal, computed } from '@angular/core';
import { Receita } from './models/receita';
import { Despesa } from './models/despesa';
import { Divida } from './models/divida';
import { Investimento } from './models/investimento';
import { MetaInvestimento } from './models/meta';
import { Categoria, ResumoFinanceiro, Periodo } from './models/common';

export interface AppState {
  receitas: Receita[];
  despesas: Despesa[];
  dividas: Divida[];
  investimentos: Investimento[];
  metas: MetaInvestimento[];
  categorias: Categoria[];
  periodoAtual: Periodo;
  filtroAtivo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppStore {
  // Estado principal
  private state = signal<AppState>({
    receitas: [],
    despesas: [],
    dividas: [],
    investimentos: [],
    metas: [],
    categorias: [],
    periodoAtual: { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() },
    filtroAtivo: false
  });

  // Getters públicos
  public receitas = computed(() => this.state().receitas);
  public despesas = computed(() => this.state().despesas);
  public dividas = computed(() => this.state().dividas);
  public investimentos = computed(() => this.state().investimentos);
  public metas = computed(() => this.state().metas);
  public categorias = computed(() => this.state().categorias);
  public periodoAtual = computed(() => this.state().periodoAtual);
  public filtroAtivo = computed(() => this.state().filtroAtivo);

  // Computed values para resumos
  public resumoFinanceiro = computed(() => {
    const receitas = this.receitas();
    const despesas = this.despesas();
    const periodo = this.periodoAtual();

    const totalReceitas = receitas
      .filter(r => {
        const data = new Date(r.data);
        return data.getMonth() + 1 === periodo.mes && data.getFullYear() === periodo.ano;
      })
      .reduce((sum, r) => sum + r.valor, 0);

    const totalDespesas = despesas
      .filter(d => {
        const data = new Date(d.data);
        return data.getMonth() + 1 === periodo.mes && data.getFullYear() === periodo.ano;
      })
      .reduce((sum, d) => sum + d.valor, 0);

    return {
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      periodo
    } as ResumoFinanceiro;
  });

  public resumoDividas = computed(() => {
    const dividas = this.dividas();
    const totalDividas = dividas.reduce((sum, d) => sum + d.valorAtual, 0);
    const totalPago = dividas
      .filter(d => d.dataPagamento)
      .reduce((sum, d) => sum + d.valorAtual, 0);
    const totalPendente = totalDividas - totalPago;
    const quantidadeVencidas = dividas.filter(d =>
      new Date(d.dataVencimento) < new Date() && !d.dataPagamento
    ).length;

    const proximoVencimento = dividas
      .filter(d => !d.dataPagamento)
      .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())[0]?.dataVencimento;

    return {
      totalDividas,
      totalPago,
      totalPendente,
      quantidadeDividas: dividas.length,
      quantidadeVencidas,
      proximoVencimento
    };
  });

  public resumoInvestimentos = computed(() => {
    const investimentos = this.investimentos();
    const totalInvestido = investimentos.reduce((sum, i) => sum + i.valorInvestido, 0);
    const totalAtual = investimentos.reduce((sum, i) => sum + i.valorAtual, 0);
    const rentabilidadeTotal = totalAtual - totalInvestido;
    const rentabilidadePercentual = totalInvestido > 0 ? (rentabilidadeTotal / totalInvestido) * 100 : 0;

    return {
      totalInvestido,
      totalAtual,
      rentabilidadeTotal,
      rentabilidadePercentual,
      quantidadeInvestimentos: investimentos.length
    };
  });

  public resumoMetas = computed(() => {
    const metas = this.metas();
    const metasConcluidas = metas.filter(m => m.status.id === 'concluido').length;
    const metasEmAndamento = metas.filter(m => m.status.id === 'ativo').length;
    const metasAtrasadas = metas.filter(m =>
      new Date(m.dataLimite) < new Date() && m.status.id !== 'concluido'
    ).length;

    const valorTotalMetas = metas.reduce((sum, m) => sum + m.valorMeta, 0);
    const valorTotalAtual = metas.reduce((sum, m) => sum + m.valorAtual, 0);
    const percentualGeral = valorTotalMetas > 0 ? (valorTotalAtual / valorTotalMetas) * 100 : 0;

    const proximaMeta = metas
      .filter(m => m.status.id !== 'concluido')
      .sort((a, b) => new Date(a.dataLimite).getTime() - new Date(b.dataLimite).getTime())[0];

    return {
      totalMetas: metas.length,
      metasConcluidas,
      metasEmAndamento,
      metasAtrasadas,
      valorTotalMetas,
      valorTotalAtual,
      percentualGeral,
      proximaMeta
    };
  });

  // Actions
  public adicionarReceita(receita: Receita): void {
    this.state.update(state => ({
      ...state,
      receitas: [...state.receitas, receita]
    }));
  }

  public atualizarReceita(receita: Receita): void {
    this.state.update(state => ({
      ...state,
      receitas: state.receitas.map(r => r.id === receita.id ? receita : r)
    }));
  }

  public removerReceita(id: string): void {
    this.state.update(state => ({
      ...state,
      receitas: state.receitas.filter(r => r.id !== id)
    }));
  }

  public adicionarDespesa(despesa: Despesa): void {
    this.state.update(state => ({
      ...state,
      despesas: [...state.despesas, despesa]
    }));
  }

  public atualizarDespesa(despesa: Despesa): void {
    this.state.update(state => ({
      ...state,
      despesas: state.despesas.map(d => d.id === despesa.id ? despesa : d)
    }));
  }

  public removerDespesa(id: string): void {
    this.state.update(state => ({
      ...state,
      despesas: state.despesas.filter(d => d.id !== id)
    }));
  }

  public adicionarDivida(divida: Divida): void {
    this.state.update(state => ({
      ...state,
      dividas: [...state.dividas, divida]
    }));
  }

  public atualizarDivida(divida: Divida): void {
    this.state.update(state => ({
      ...state,
      dividas: state.dividas.map(d => d.id === divida.id ? divida : d)
    }));
  }

  public removerDivida(id: string): void {
    this.state.update(state => ({
      ...state,
      dividas: state.dividas.filter(d => d.id !== id)
    }));
  }

  public adicionarInvestimento(investimento: Investimento): void {
    this.state.update(state => ({
      ...state,
      investimentos: [...state.investimentos, investimento]
    }));
  }

  public atualizarInvestimento(investimento: Investimento): void {
    this.state.update(state => ({
      ...state,
      investimentos: state.investimentos.map(i => i.id === investimento.id ? investimento : i)
    }));
  }

  public removerInvestimento(id: string): void {
    this.state.update(state => ({
      ...state,
      investimentos: state.investimentos.filter(i => i.id !== id)
    }));
  }

  public adicionarMeta(meta: MetaInvestimento): void {
    this.state.update(state => ({
      ...state,
      metas: [...state.metas, meta]
    }));
  }

  public atualizarMeta(meta: MetaInvestimento): void {
    this.state.update(state => ({
      ...state,
      metas: state.metas.map(m => m.id === meta.id ? meta : m)
    }));
  }

  public removerMeta(id: string): void {
    this.state.update(state => ({
      ...state,
      metas: state.metas.filter(m => m.id !== id)
    }));
  }

  public adicionarCategoria(categoria: Categoria): void {
    this.state.update(state => ({
      ...state,
      categorias: [...state.categorias, categoria]
    }));
  }

  public atualizarCategoria(categoria: Categoria): void {
    this.state.update(state => ({
      ...state,
      categorias: state.categorias.map(c => c.id === categoria.id ? categoria : c)
    }));
  }

  public removerCategoria(id: string): void {
    this.state.update(state => ({
      ...state,
      categorias: state.categorias.filter(c => c.id !== id)
    }));
  }

  public definirPeriodo(periodo: Periodo): void {
    this.state.update(state => ({
      ...state,
      periodoAtual: periodo
    }));
  }

  public setFiltroAtivo(ativo: boolean): void {
    this.state.update(state => ({
      ...state,
      filtroAtivo: ativo
    }));
  }

  // Métodos utilitários
  public gerarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public obterCategoriaPorId(id: string): Categoria | undefined {
    return this.categorias().find(c => c.id === id);
  }
}
