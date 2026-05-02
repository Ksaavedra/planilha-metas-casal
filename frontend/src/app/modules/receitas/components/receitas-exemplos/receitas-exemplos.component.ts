import { Component } from '@angular/core';
import {
  EXEMPLOS_DICA_CATEGORIAS_FIXA,
  EXEMPLOS_DICA_CATEGORIAS_VARIAVEL,
} from '../../receitas-categorias.suggestions';

@Component({
  selector: 'app-receitas-exemplos',
  templateUrl: './receitas-exemplos.component.html',
  styleUrl: './receitas-exemplos.component.scss',
  standalone: false,
})
export class ReceitasExemplosComponent {
  readonly exemplosCategoriasFixas = EXEMPLOS_DICA_CATEGORIAS_FIXA;
  readonly exemplosCategoriasVariaveis = EXEMPLOS_DICA_CATEGORIAS_VARIAVEL;
}
