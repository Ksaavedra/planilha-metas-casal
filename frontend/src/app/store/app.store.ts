import { Injectable, signal, computed } from '@angular/core';
import { Divida } from './models/divida';
import { Investimento } from './models/investimento';
import { Categoria } from './models/divida';

interface Periodo {
  mes: number;
  ano: number;
}

export interface AppState {
  dividas: Divida[];
  investimentos: Investimento[];
  categorias: Categoria[];
  periodoAtual: Periodo;
  filtroAtivo: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AppStore {
  private state = signal<AppState>({
    dividas: [],
    investimentos: [],
    categorias: [],
    periodoAtual: {
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
    },
    filtroAtivo: false,
  });

  public dividas = computed(() => this.state().dividas);
  public investimentos = computed(() => this.state().investimentos);
  public categorias = computed(() => this.state().categorias);
  public periodoAtual = computed(() => this.state().periodoAtual);
  public filtroAtivo = computed(() => this.state().filtroAtivo);

  public resumoDividas = computed(() => {
    const dividas = this.dividas();
    const totalDividas = dividas.reduce((sum, d) => sum + d.valorAtual, 0);
    const totalPago = dividas
      .filter((d) => d.dataPagamento)
      .reduce((sum, d) => sum + d.valorAtual, 0);
    const totalPendente = totalDividas - totalPago;
    const quantidadeVencidas = dividas.filter(
      (d) => new Date(d.dataVencimento) < new Date() && !d.dataPagamento,
    ).length;

    const proximoVencimento = dividas
      .filter((d) => !d.dataPagamento)
      .sort(
        (a, b) =>
          new Date(a.dataVencimento).getTime() -
          new Date(b.dataVencimento).getTime(),
      )[0]?.dataVencimento;

    return {
      totalDividas,
      totalPago,
      totalPendente,
      quantidadeDividas: dividas.length,
      quantidadeVencidas,
      proximoVencimento,
    };
  });

  public resumoInvestimentos = computed(() => {
    const investimentos = this.investimentos();
    const totalInvestido = investimentos.reduce(
      (sum, i) => sum + i.valorInvestido,
      0,
    );
    const totalAtual = investimentos.reduce((sum, i) => sum + i.valorAtual, 0);
    const rentabilidadeTotal = totalAtual - totalInvestido;
    const rentabilidadePercentual =
      totalInvestido > 0 ? (rentabilidadeTotal / totalInvestido) * 100 : 0;

    return {
      totalInvestido,
      totalAtual,
      rentabilidadeTotal,
      rentabilidadePercentual,
      quantidadeInvestimentos: investimentos.length,
    };
  });

  public adicionarDivida(divida: Divida): void {
    this.state.update((state) => ({
      ...state,
      dividas: [...state.dividas, divida],
    }));
  }

  public atualizarDivida(divida: Divida): void {
    this.state.update((state) => ({
      ...state,
      dividas: state.dividas.map((d) => (d.id === divida.id ? divida : d)),
    }));
  }

  public removerDivida(id: string): void {
    this.state.update((state) => ({
      ...state,
      dividas: state.dividas.filter((d) => d.id !== id),
    }));
  }

  public adicionarInvestimento(investimento: Investimento): void {
    this.state.update((state) => ({
      ...state,
      investimentos: [...state.investimentos, investimento],
    }));
  }

  public atualizarInvestimento(investimento: Investimento): void {
    this.state.update((state) => ({
      ...state,
      investimentos: state.investimentos.map((i) =>
        i.id === investimento.id ? investimento : i,
      ),
    }));
  }

  public removerInvestimento(id: string): void {
    this.state.update((state) => ({
      ...state,
      investimentos: state.investimentos.filter((i) => i.id !== id),
    }));
  }

  public adicionarCategoria(categoria: Categoria): void {
    this.state.update((state) => ({
      ...state,
      categorias: [...state.categorias, categoria],
    }));
  }

  public atualizarCategoria(categoria: Categoria): void {
    this.state.update((state) => ({
      ...state,
      categorias: state.categorias.map((c) =>
        c.id === categoria.id ? categoria : c,
      ),
    }));
  }

  public removerCategoria(id: string): void {
    this.state.update((state) => ({
      ...state,
      categorias: state.categorias.filter((c) => c.id !== id),
    }));
  }

  public definirPeriodo(periodo: Periodo): void {
    this.state.update((state) => ({
      ...state,
      periodoAtual: periodo,
    }));
  }

  public setFiltroAtivo(ativo: boolean): void {
    this.state.update((state) => ({
      ...state,
      filtroAtivo: ativo,
    }));
  }

  public gerarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public obterCategoriaPorId(id: string): Categoria | undefined {
    return this.categorias().find((c) => c.id === id);
  }
}
