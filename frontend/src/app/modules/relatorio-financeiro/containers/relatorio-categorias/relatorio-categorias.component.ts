import { Component, Input } from '@angular/core';
import {
  NaturezaReportLinha,
  ReceitaTipoReportLinha,
  DespesaCategoriaReportLinha,
} from '@core/interfaces/relatorios';

@Component({
  selector: 'app-relatorio-categorias',
  templateUrl: './relatorio-categorias.component.html',
  styleUrls: ['./relatorio-categorias.component.scss'],
  standalone: false,
})
export class RelatorioCategoriasComponent {
  @Input({ required: true }) anoSelecionado!: number;
  @Input({ required: true }) meses: string[] = [];

  @Input() naturezaReceitaLinhas: NaturezaReportLinha[] = [];
  @Input() receitasPorTipoLinhas: ReceitaTipoReportLinha[] = [];

  @Input() naturezaDespesaLinhas: NaturezaReportLinha[] = [];
  @Input() despesasPorCategoriaLinhas: DespesaCategoriaReportLinha[] = [];

  get temNaturezaReceitaComValor(): boolean {
    return this.temAlgumValor(this.naturezaReceitaLinhas);
  }

  get temReceitasPorTipoComValor(): boolean {
    return this.temAlgumValor(this.receitasPorTipoLinhas);
  }

  get temNaturezaDespesaComValor(): boolean {
    return this.temAlgumValor(this.naturezaDespesaLinhas);
  }

  get temDespesasPorCategoriaComValor(): boolean {
    return this.temAlgumValor(this.despesasPorCategoriaLinhas);
  }

  private temAlgumValor(linhas: Array<{ valores: number[]; total: number }>): boolean {
    return linhas.some(
      (linha) =>
        this.temValorMovimentado(linha.total) ||
        linha.valores.some((valor) => this.temValorMovimentado(valor)),
    );
  }

  private temValorMovimentado(valor: number): boolean {
    return Math.abs(Number(valor) || 0) > 0;
  }
}
