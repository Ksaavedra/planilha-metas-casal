import { Component, Input } from '@angular/core';

export interface NaturezaReportLinha {
  id: 'fixa' | 'variavel';
  label: string;
  valores: number[];
  total: number;
}

export interface ReceitaTipoReportLinha {
  tipo: string;
  valores: number[];
  total: number;
}

export interface DespesaCategoriaReportLinha {
  categoria: string;
  valores: number[];
  total: number;
}

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
