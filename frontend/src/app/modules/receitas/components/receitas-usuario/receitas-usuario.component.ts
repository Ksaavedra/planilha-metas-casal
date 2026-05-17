import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Receita } from '@app/core';

export interface LinhaUsuarioReceitasMes {
  usuario: string;
  fixa: number;
  variavel: number;
  total: number;
}

@Component({
  selector: 'app-receitas-usuario',
  templateUrl: './receitas-usuario.component.html',
  styleUrl: './receitas-usuario.component.scss',
  standalone: false,
})
export class ReceitasUsuarioComponent implements OnChanges {
  @Input() receitas: Receita[] = [];
  @Input() nomeMesReferencia = '';

  usuarioFiltro = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['receitas']) {
      this.reconciliarSelecaoAposMudancaLista();
    }
  }

  private reconciliarSelecaoAposMudancaLista(): void {
    const linhas = this.linhasPorUsuario;
    if (!linhas.length) {
      this.usuarioFiltro = '';
      return;
    }
    if (!this.usuarioFiltro) return;
    const atualValido = linhas.some((r) => r.usuario === this.usuarioFiltro);
    if (!atualValido) this.usuarioFiltro = '';
  }

  get linhasPorUsuario(): LinhaUsuarioReceitasMes[] {
    const map = new Map<string, { fixa: number; variavel: number }>();
    for (const r of this.receitas) {
      const nome = this.normalizarUsuario(r);
      const v = Number(r.valor) || 0;
      if (!map.has(nome)) map.set(nome, { fixa: 0, variavel: 0 });
      const cur = map.get(nome)!;
      if (r.natureza === 'variavel') cur.variavel += v;
      else cur.fixa += v;
    }
    return Array.from(map.entries())
      .map(([usuario, { fixa, variavel }]) => ({
        usuario,
        fixa,
        variavel,
        total: fixa + variavel,
      }))
      .sort((a, b) =>
        a.usuario.localeCompare(b.usuario, 'pt-BR', { sensitivity: 'base' }),
      );
  }

  get linhasVisiveis(): LinhaUsuarioReceitasMes[] {
    if (!this.usuarioFiltro) return [];
    return this.linhasPorUsuario.filter(
      (r) => r.usuario === this.usuarioFiltro,
    );
  }

  private ordenarPorDataDesc(receitas: Receita[]): Receita[] {
    return [...receitas].sort((a, b) => {
      const dataA = new Date(a.data || '').getTime();
      const dataB = new Date(b.data || '').getTime();

      return dataB - dataA;
    });
  }

  get receitasFixasUsuario(): Receita[] {
    return this.ordenarPorDataDesc(
      this.receitas.filter(
        (r) =>
          this.normalizarUsuario(r) === this.usuarioFiltro &&
          r.natureza === 'fixa',
      ),
    );
  }

  get receitasVariaveisUsuario(): Receita[] {
    return this.ordenarPorDataDesc(
      this.receitas.filter(
        (r) =>
          this.normalizarUsuario(r) === this.usuarioFiltro &&
          r.natureza === 'variavel',
      ),
    );
  }

  get subtotalFixasUsuario(): number {
    return this.linhasVisiveis[0]?.fixa ?? 0;
  }

  get subtotalVariaveisUsuario(): number {
    return this.linhasVisiveis[0]?.variavel ?? 0;
  }

  get totalGeralUsuario(): number {
    return this.linhasVisiveis[0]?.total ?? 0;
  }

  normalizarUsuario(r: Receita): string {
    return r.pessoa?.trim() || '(Sem usuário)';
  }
}
