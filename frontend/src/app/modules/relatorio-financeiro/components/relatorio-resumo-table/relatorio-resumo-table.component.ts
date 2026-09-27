import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-relatorio-resumo-table',
  templateUrl: './relatorio-resumo-table.component.html',
  styleUrls: ['./relatorio-resumo-table.component.scss'],
  standalone: false,
})
export class RelatorioResumoTableComponent {
  @Input() meses: string[] = [];
  @Input() dadosReceitas: number[] = [];
  @Input() dadosDespesas: number[] = [];
  @Input() dadosCartaoCredito: number[] = [];
  @Input() dadosTotal: number[] = [];
  @Input() totalReceitas = 0;
  @Input() totalDespesas = 0;
  @Input() totalCartaoCredito = 0;
  @Input() saldoTotal = 0;
}
