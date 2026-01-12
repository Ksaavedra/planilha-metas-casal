import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalAdicionarUsuarioService } from '../../../../core/services/modal-adicionar-usuario.service';

export type PessoaReceita = 'Kelly' | 'David' | 'Casal';
export type TipoReceita =
  | 'Salário'
  | 'Bônus'
  | 'Freela'
  | 'Renda extra'
  | 'Aluguel'
  | 'Outras rendas compartilhadas';
export type CategoriaReceita = 'Fixa' | 'Variável';

export interface ReceitaMensal {
  id?: string | number;
  pessoa: PessoaReceita;
  tipo: TipoReceita;
  categoria: CategoriaReceita;
  valor: number;
  mes?: string;
}

@Component({
  selector: 'app-receitas-page',
  templateUrl: './receitas-page.component.html',
  styleUrls: ['./receitas-page.component.scss'],
})
export class ReceitasPageComponent implements OnInit, OnDestroy {
  mesAtual: Date = new Date();

  // Receitas do mês atual (podem variar por mês)
  receitasMensal: ReceitaMensal[] = [];

  private saveSubscription?: Subscription;

  meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  get nomeMesAtual(): string {
    const mes = this.mesAtual.getMonth();
    const ano = this.mesAtual.getFullYear();
    return `${this.meses[mes]} ${ano}`;
  }

  get receitasKelly(): ReceitaMensal[] {
    return this.receitasMensal.filter((r) => r.pessoa === 'Kelly');
  }

  get receitasDavid(): ReceitaMensal[] {
    return this.receitasMensal.filter((r) => r.pessoa === 'David');
  }

  get receitasCasal(): ReceitaMensal[] {
    return this.receitasMensal.filter((r) => r.pessoa === 'Casal');
  }

  get totalKelly(): number {
    return this.receitasKelly.reduce(
      (total, receita) => total + receita.valor,
      0
    );
  }

  get totalDavid(): number {
    return this.receitasDavid.reduce(
      (total, receita) => total + receita.valor,
      0
    );
  }

  get totalCasal(): number {
    return this.receitasCasal.reduce(
      (total, receita) => total + receita.valor,
      0
    );
  }

  get totalMensal(): number {
    return this.receitasMensal.reduce(
      (total, receita) => total + receita.valor,
      0
    );
  }

  constructor(
    private modalAdicionarUsuarioService: ModalAdicionarUsuarioService
  ) {}

  ngOnInit(): void {
    this.carregarReceitasDoMes();

    // Escutar evento de save do modal
    this.saveSubscription = this.modalAdicionarUsuarioService.save$.subscribe(
      (data: {
        nomeUsuario: string;
        valorSalario: number;
        meses: number[];
        ano: number;
      }) => {
        this.salvarUsuario(data);
      }
    );
  }

  ngOnDestroy(): void {
    this.saveSubscription?.unsubscribe();
  }

  abrirModalAdicionarUsuario(): void {
    this.modalAdicionarUsuarioService.open();
  }

  salvarUsuario(data: {
    nomeUsuario: string;
    valorSalario: number;
    meses: number[];
    ano: number;
  }): void {
    // TODO: Salvar no backend
    // Por enquanto, apenas adicionar à lista local
    console.log('Salvando usuário:', data);

    // Aqui você pode adicionar lógica para salvar no backend
    // e atualizar a lista de receitas mensais
    alert(
      `Usuário ${
        data.nomeUsuario
      } adicionado com salário de R$ ${data.valorSalario.toFixed(
        2
      )} para os meses selecionados no ano ${data.ano}.`
    );
  }

  carregarReceitasDoMes(): void {
    // TODO: Buscar receitas do backend para o mês atual
    // Por enquanto, usando dados de exemplo
    // Os valores podem ser diferentes para cada mês (13º, bonificações, etc)
    // Em produção, isso virá do backend com os valores reais do mês selecionado

    // Exemplo: valores diferentes por mês
    this.receitasMensal = [
      // Receitas da Kelly
      {
        id: 1,
        pessoa: 'Kelly',
        tipo: 'Salário',
        categoria: 'Fixa',
        valor: 6200,
      },
      {
        id: 2,
        pessoa: 'Kelly',
        tipo: 'Bônus',
        categoria: 'Variável',
        valor: 1000,
      },
      {
        id: 3,
        pessoa: 'Kelly',
        tipo: 'Freela',
        categoria: 'Variável',
        valor: 800,
      },
      {
        id: 4,
        pessoa: 'Kelly',
        tipo: 'Renda extra',
        categoria: 'Variável',
        valor: 300,
      },
      // Receitas do David
      {
        id: 5,
        pessoa: 'David',
        tipo: 'Salário',
        categoria: 'Fixa',
        valor: 5500,
      },
      {
        id: 6,
        pessoa: 'David',
        tipo: 'Bônus',
        categoria: 'Variável',
        valor: 500,
      },
      {
        id: 7,
        pessoa: 'David',
        tipo: 'Renda extra',
        categoria: 'Variável',
        valor: 400,
      },
      // Receitas do Casal
      {
        id: 8,
        pessoa: 'Casal',
        tipo: 'Aluguel',
        categoria: 'Fixa',
        valor: 1200,
      },
    ];
  }

  mesAnterior(): void {
    const novaData = new Date(this.mesAtual);
    novaData.setMonth(novaData.getMonth() - 1);
    this.mesAtual = novaData;
    this.carregarReceitasDoMes();
  }

  proximoMes(): void {
    const novaData = new Date(this.mesAtual);
    novaData.setMonth(novaData.getMonth() + 1);
    this.mesAtual = novaData;
    this.carregarReceitasDoMes();
  }
}
