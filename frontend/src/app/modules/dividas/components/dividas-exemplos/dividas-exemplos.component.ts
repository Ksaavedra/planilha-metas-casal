import { Component, Input } from '@angular/core';

type ContextoDividas = 'emprestimos' | 'financiamentos';

interface ExemploDivida {
  titulo: string;
  subtitulo: string;
  valor: string;
  parcelas: string;
  origem: string;
  descricao: string;
}

@Component({
  selector: 'app-dividas-exemplos',
  templateUrl: './dividas-exemplos.component.html',
  styleUrl: './dividas-exemplos.component.scss',
  standalone: false,
})
export class DividasExemplosComponent {
  @Input() contexto: ContextoDividas = 'emprestimos';

  private readonly exemplosEmprestimos: ExemploDivida[] = [
    {
      titulo: 'Empréstimo pessoal',
      subtitulo: 'Banco • Crédito pessoal',
      valor: 'R$ 5.000,00',
      parcelas: '20 parcelas de R$ 250,00',
      origem: 'Banco',
      descricao:
        'Use para controlar dinheiro emprestado pelo banco, com parcela mensal, saldo restante e progresso.',
    },
    {
      titulo: 'Empréstimo familiar',
      subtitulo: 'Sem banco • Familiar',
      valor: 'R$ 1.200,00',
      parcelas: '6 parcelas de R$ 200,00',
      origem: 'Sem cartão',
      descricao:
        'Bom para valores combinados com familiares, mantendo o controle de quanto já foi pago.',
    },
    {
      titulo: 'Consignado',
      subtitulo: 'Banco • Consignado',
      valor: 'R$ 8.000,00',
      parcelas: '36 parcelas',
      origem: 'Banco',
      descricao:
        'Ideal para acompanhar empréstimos de prazo maior, saldo restante e percentual quitado.',
    },
  ];

  private readonly exemplosFinanciamentos: ExemploDivida[] = [
    {
      titulo: 'Financiamento imobiliário',
      subtitulo: 'Banco • Imóvel',
      valor: 'R$ 240.000,00',
      parcelas: '360 parcelas',
      origem: 'Banco',
      descricao:
        'Use para bens de longo prazo, acompanhando saldo devedor, parcelas restantes e quitação.',
    },
    {
      titulo: 'Financiamento do carro',
      subtitulo: 'Financeira • Veículo',
      valor: 'R$ 48.000,00',
      parcelas: '48 parcelas de R$ 1.000,00',
      origem: 'Financeira',
      descricao:
        'Ajuda a visualizar quanto ainda falta pagar e a evolução mês a mês do financiamento.',
    },
    {
      titulo: 'Financiamento de moto',
      subtitulo: 'Banco • Veículo',
      valor: 'R$ 18.000,00',
      parcelas: '36 parcelas de R$ 500,00',
      origem: 'Banco',
      descricao:
        'Use para acompanhar bens parcelados de médio prazo sem misturar com faturas de cartão.',
    },
  ];

  get titulo(): string {
    return this.contexto === 'financiamentos'
      ? 'Exemplos de financiamentos'
      : 'Exemplos de empréstimos';
  }

  get introducao(): string {
    return this.contexto === 'financiamentos'
      ? 'Use esta tela para controlar bens financiados, saldo devedor, parcelas e previsão de quitação.'
      : 'Use esta tela para controlar empréstimos pessoais, consignados, familiares e crédito bancário.';
  }

  get exemplos(): ExemploDivida[] {
    return this.contexto === 'financiamentos'
      ? this.exemplosFinanciamentos
      : this.exemplosEmprestimos;
  }

  get dica(): string {
    return this.contexto === 'financiamentos'
      ? 'Se é um bem de longo prazo, como imóvel, carro ou moto, cadastre em Financiamentos.'
      : 'Se é dinheiro tomado emprestado, com ou sem banco, cadastre em Empréstimos.';
  }
}
