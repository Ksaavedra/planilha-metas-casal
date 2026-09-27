import { Component } from '@angular/core';
import {
  EXEMPLOS_OBJETIVOS_FINANCEIROS,
  EXEMPLOS_OBJETIVOS_SONHOS,
} from '../../metas-exemplos.suggestions';

@Component({
  selector: 'app-metas-exemplos',
  templateUrl: './metas-exemplos.component.html',
  styleUrl: './metas-exemplos.component.scss',
  standalone: false,
})
export class MetasExemplosComponent {
  readonly exemplosSonhos = EXEMPLOS_OBJETIVOS_SONHOS;
  readonly exemplosFinanceiros = EXEMPLOS_OBJETIVOS_FINANCEIROS;
}
