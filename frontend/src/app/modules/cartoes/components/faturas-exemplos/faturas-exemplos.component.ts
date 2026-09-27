import { Component } from '@angular/core';

interface ExemploFatura {
  banco: string;
  limite: string;
  utilizado: string;
  disponivel: string;
  vencimento: string;
  melhorCompra: string;
  status: string;
  compraParcelada: string;
  descricao: string;
  explicacao: string;
}

interface ConceitoFatura {
  titulo: string;
  descricao: string;
}

@Component({
  selector: 'app-faturas-exemplos',
  templateUrl: './faturas-exemplos.component.html',
  styleUrl: './faturas-exemplos.component.scss',
  standalone: false,
})
export class FaturasExemplosComponent {
  readonly exemplos: ExemploFatura[] = [
    {
      banco: 'Nubank',
      limite: 'R$ 5.000,00',
      utilizado: 'R$ 550,00',
      disponivel: 'R$ 4.450,00',
      vencimento: 'Dia 10',
      melhorCompra: 'Dia 26',
      status: 'Fatura em dia',
      compraParcelada: 'Tênis em 2x de R$ 275,00',
      descricao:
        'Use para acompanhar quanto da fatura já foi usado e quando precisa pagar.',
      explicacao:
        'Como ainda existe limite disponível e o vencimento não passou, a fatura aparece controlada e sem alerta.',
    },
    {
      banco: 'C6 Bank',
      limite: 'R$ 6.000,00',
      utilizado: 'R$ 1.200,00',
      disponivel: 'R$ 4.800,00',
      vencimento: 'Dia 15',
      melhorCompra: 'Dia 1',
      status: 'A vencer',
      compraParcelada: 'Notebook em 6x de R$ 200,00',
      descricao:
        'Bom para comparar limite disponível entre cartões e evitar passar do orçamento.',
      explicacao:
        'As compras parceladas entram no controle mensal da fatura e ajudam a visualizar o valor restante.',
    },
    {
      banco: 'Itaú',
      limite: 'R$ 3.000,00',
      utilizado: 'R$ 0,00',
      disponivel: 'R$ 3.000,00',
      vencimento: 'Dia 20',
      melhorCompra: 'Dia 6',
      status: 'Sem fatura aberta',
      compraParcelada: 'Nenhuma compra parcelada',
      descricao:
        'Quando a fatura está zerada, não há valor para pagar; o botão de pagamento fica desabilitado.',
      explicacao:
        'Se não existe valor utilizado, o cartão continua disponível e não precisa de ação de pagamento.',
    },
  ];

  readonly conceitos: ConceitoFatura[] = [
    {
      titulo: 'Limite utilizado',
      descricao:
        'Mostra quanto já foi consumido do cartão no mês selecionado, incluindo compras parceladas em aberto.',
    },
    {
      titulo: 'Limite disponível',
      descricao:
        'É o limite total menos o valor utilizado. Ajuda a saber quanto ainda pode gastar com segurança.',
    },
    {
      titulo: 'Vencimento',
      descricao:
        'É o dia de pagamento da fatura. Depois desse dia, a fatura pode ficar atrasada se ainda houver valor em aberto.',
    },
    {
      titulo: 'Melhor compra',
      descricao:
        'Indica o melhor dia para comprar pensando no próximo ciclo da fatura e em mais prazo para pagar.',
    },
  ];
}
