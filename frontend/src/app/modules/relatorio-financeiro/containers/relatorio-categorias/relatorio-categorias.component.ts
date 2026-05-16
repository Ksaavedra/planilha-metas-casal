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
}
