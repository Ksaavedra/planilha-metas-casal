import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Investimento } from '@core/interfaces/investimentos/investimentos';
import { labelTipoInvestimento } from '@core/constants/investimentos-tipos.constant';
import { statusInvestimentoLabel } from '@core/utils/investimentos.util';

export interface LinhaUsuarioInvestimentosAno {
  usuario: string;
  emAndamento: number;
  finalizado: number;
  patrimonio: number;
}

@Component({
  selector: 'app-investimentos-usuario',
  templateUrl: './investimentos-usuario.component.html',
  styleUrl: './investimentos-usuario.component.scss',
  standalone: false,
})
export class InvestimentosUsuarioComponent implements OnChanges {
  @Input() investimentos: Investimento[] = [];
  @Input() anoReferencia = '';

  readonly labelTipo = labelTipoInvestimento;
  readonly statusLabel = statusInvestimentoLabel;

  usuarioFiltro = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['investimentos']) {
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

  get linhasPorUsuario(): LinhaUsuarioInvestimentosAno[] {
    const map = new Map<
      string,
      { emAndamento: number; finalizado: number; patrimonio: number }
    >();
    for (const inv of this.investimentos) {
      const nome = this.normalizarUsuario(inv);
      const patrimonio = Number(inv.valorAtual) || 0;
      const investido = Number(inv.valorInvestido) || 0;
      if (!map.has(nome)) {
        map.set(nome, { emAndamento: 0, finalizado: 0, patrimonio: 0 });
      }
      const cur = map.get(nome)!;
      cur.patrimonio += patrimonio;
      if (inv.statusInvestimento === 'finalizado') {
        cur.finalizado += investido;
      } else {
        cur.emAndamento += investido;
      }
    }
    return Array.from(map.entries())
      .map(([usuario, { emAndamento, finalizado, patrimonio }]) => ({
        usuario,
        emAndamento,
        finalizado,
        patrimonio,
      }))
      .sort((a, b) =>
        a.usuario.localeCompare(b.usuario, 'pt-BR', { sensitivity: 'base' }),
      );
  }

  get linhaSelecionada(): LinhaUsuarioInvestimentosAno | undefined {
    if (!this.usuarioFiltro) return undefined;
    return this.linhasPorUsuario.find((r) => r.usuario === this.usuarioFiltro);
  }

  get investimentosEmAndamentoUsuario(): Investimento[] {
    return this.investimentosFiltrados.filter(
      (i) => i.statusInvestimento !== 'finalizado',
    );
  }

  get investimentosFinalizadosUsuario(): Investimento[] {
    return this.investimentosFiltrados.filter(
      (i) => i.statusInvestimento === 'finalizado',
    );
  }

  private get investimentosFiltrados(): Investimento[] {
    if (!this.usuarioFiltro) return [];
    return [...this.investimentos]
      .filter((i) => this.normalizarUsuario(i) === this.usuarioFiltro)
      .sort((a, b) =>
        (a.descricao || '').localeCompare(b.descricao || '', 'pt-BR'),
      );
  }

  get subtotalEmAndamento(): number {
    return this.linhaSelecionada?.emAndamento ?? 0;
  }

  get subtotalFinalizado(): number {
    return this.linhaSelecionada?.finalizado ?? 0;
  }

  get patrimonioTotalUsuario(): number {
    return this.linhaSelecionada?.patrimonio ?? 0;
  }

  normalizarUsuario(inv: Investimento): string {
    return inv.pessoa?.trim() || '(Sem responsável)';
  }
}
