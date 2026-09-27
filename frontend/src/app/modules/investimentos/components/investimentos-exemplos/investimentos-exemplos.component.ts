import { Component } from '@angular/core';
import {
  EXEMPLOS_OBJETIVOS_INVESTIMENTO,
  EXEMPLOS_TIPOS_INVESTIMENTO,
} from '../../investimentos-exemplos.suggestions';

@Component({
  selector: 'app-investimentos-exemplos',
  templateUrl: './investimentos-exemplos.component.html',
  styleUrl: './investimentos-exemplos.component.scss',
  standalone: false,
})
export class InvestimentosExemplosComponent {
  readonly exemplosObjetivos = EXEMPLOS_OBJETIVOS_INVESTIMENTO;
  readonly exemplosTipos = EXEMPLOS_TIPOS_INVESTIMENTO;
}
