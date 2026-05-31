import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-relatorio-graficos',
  templateUrl: './relatorio-graficos.component.html',
  styleUrls: ['./relatorio-graficos.component.scss'],
  standalone: false,
})
export class RelatorioGraficosComponent {
  @Input() anoSelecionado = new Date().getFullYear();
  @Input() anoAtual = new Date().getFullYear();
  @Input() anosSaldoSelecionados: number[] = [];
  @Input() podeAnoAnterior = false;
  @Input() podeProximoAno = false;
  @Input() podeAdicionarAnoGraficoSaldo = false;
  @Input() podeLimparFiltrosGraficoSaldo = false;
  @Input() totalAnosAdicionaisGraficoSaldo = 0;
  @Input() limiteAnosAdicionaisGraficoSaldo = 0;

  @Output() anoAnterior = new EventEmitter<void>();
  @Output() proximoAno = new EventEmitter<void>();
  @Output() adicionarAnoAoGraficoSaldo = new EventEmitter<void>();
  @Output() limparFiltrosGraficoSaldo = new EventEmitter<void>();
  @Output() removerAnoDoGraficoSaldo = new EventEmitter<number>();

  @ViewChild('chartSaldo') chartSaldo!: ElementRef;
  @ViewChild('chartReceitasDespesas') chartReceitasDespesas!: ElementRef;
  @ViewChild('chartDividasInvestimentos')
  chartDividasInvestimentos!: ElementRef;

  removerAno(ano: number): void {
    this.removerAnoDoGraficoSaldo.emit(ano);
  }

  rotuloAnoGraficoSaldo(ano: number): string {
    return ano === this.anoAtual ? `${ano} (atual)` : String(ano);
  }
}
