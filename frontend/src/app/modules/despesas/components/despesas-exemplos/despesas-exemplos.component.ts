import { Component } from '@angular/core';
import {
  EXEMPLOS_DICA_CATEGORIAS_FIXA,
  EXEMPLOS_DICA_CATEGORIAS_VARIAVEL,
} from '../../despesas-categorias.suggestions';

@Component({
  selector: 'app-despesas-exemplos',
  templateUrl: './despesas-exemplos.component.html',
  styleUrl: './despesas-exemplos.component.scss',
  standalone: false,
})
export class DespesasExemplosComponent {
  readonly exemplosCategoriasFixas = EXEMPLOS_DICA_CATEGORIAS_FIXA;
  readonly exemplosCategoriasVariaveis = EXEMPLOS_DICA_CATEGORIAS_VARIAVEL;
}
