import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Despesa } from '@app/core/interfaces/despesas/despesas';

export interface LinhaUsuarioDespesasMes {
  usuario: string;
  fixa: number;
  variavel: number;
  total: number;
}

@Component({
  selector: 'app-despesas-usuario',
  templateUrl: './despesas-usuario.component.html',
  styleUrl: './despesas-usuario.component.scss',
  standalone: false,
})
export class DespesasUsuarioComponent implements OnChanges {
  @Input() despesas: Despesa[] = [];
  @Input() nomeMesReferencia = '';

  usuarioFiltro = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['despesas']) {
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

  get linhasPorUsuario(): LinhaUsuarioDespesasMes[] {
    const map = new Map<string, { fixa: number; variavel: number }>();
    for (const d of this.despesas) {
      const nome = this.normalizarUsuario(d);
      const v = Number(d.valor) || 0;
      if (!map.has(nome)) map.set(nome, { fixa: 0, variavel: 0 });
      const cur = map.get(nome)!;
      if (d.natureza === 'variavel') cur.variavel += v;
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

  get linhasVisiveis(): LinhaUsuarioDespesasMes[] {
    if (!this.usuarioFiltro) return [];
    return this.linhasPorUsuario.filter(
      (r) => r.usuario === this.usuarioFiltro,
    );
  }

  get despesasDetalhesFiltradas(): Despesa[] {
    if (!this.usuarioFiltro) return [];
    const list = this.despesas.filter(
      (d) => this.normalizarUsuario(d) === this.usuarioFiltro,
    );
    return list.sort((a, b) => {
      const ta = a.data ? Date.parse(a.data) : 0;
      const tb = b.data ? Date.parse(b.data) : 0;
      if (ta !== tb) return ta - tb;
      return (a.descricao || '').localeCompare(b.descricao || '', 'pt-BR');
    });
  }

  get despesasFixasUsuario(): Despesa[] {
    return this.despesasDetalhesFiltradas.filter((d) => d.natureza === 'fixa');
  }

  get despesasVariaveisUsuario(): Despesa[] {
    return this.despesasDetalhesFiltradas.filter(
      (d) => d.natureza === 'variavel',
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

  normalizarUsuario(d: Despesa): string {
    return d.pessoa?.trim() || '(Sem usuário)';
  }
}
