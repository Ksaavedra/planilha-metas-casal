import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { DividaNoMes } from '@core/interfaces/dividas/dividas';
import {
  statusCartao,
  statusCartaoClasse,
  statusCartaoLabel,
} from '@core/utils/cartoes.util';
import {
  diaMelhorCompraEfetivo,
  periodoFaturaCartao,
  PeriodoFaturaCartao,
} from '@core/utils/fatura-cartao.util';
import {
  compararLancamentosFaturaPorData,
  parcelaMensalDivida,
  parcelasRestantesLabel,
  formatarDataIsoPtBr,
  statusParcelaMesClasse,
  statusParcelaMesLabel,
  totalParcelaMensalPendenteNoMes,
} from '@core/utils/dividas.util';

export interface LinhaUsuarioFaturasMes {
  usuario: string;
  limite: number;
  utilizado: number;
  disponivel: number;
  totalCartoes: number;
}

@Component({
  selector: 'app-cartoes-usuario',
  templateUrl: './cartoes-usuario.component.html',
  styleUrl: './cartoes-usuario.component.scss',
  standalone: false,
})
export class CartoesUsuarioComponent implements OnChanges {
  readonly statusLabel = statusCartaoLabel;
  readonly statusClasse = statusCartaoClasse;
  readonly parcelasLabel = parcelasRestantesLabel;
  readonly valorParcela = parcelaMensalDivida;
  readonly statusParcelaLabel = statusParcelaMesLabel;
  readonly statusParcelaClasse = statusParcelaMesClasse;

  @Input() cartoes: Cartao[] = [];
  @Input() parcelamentos: DividaNoMes[] = [];
  @Input() nomeMesReferencia = '';
  @Input() mesReferencia: Date = new Date();

  usuarioFiltro = '';
  cartaoExpandidoId: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cartoes']) {
      this.reconciliarSelecaoAposMudancaLista();
    }
  }

  private reconciliarSelecaoAposMudancaLista(): void {
    const linhas = this.linhasPorUsuario;
    if (!linhas.length) {
      this.usuarioFiltro = '';
      this.cartaoExpandidoId = null;
      return;
    }

    if (!this.usuarioFiltro) return;

    const atualValido = linhas.some((r) => r.usuario === this.usuarioFiltro);
    if (!atualValido) {
      this.usuarioFiltro = '';
      this.cartaoExpandidoId = null;
    }
  }

  get linhasPorUsuario(): LinhaUsuarioFaturasMes[] {
    const map = new Map<
      string,
      { limite: number; utilizado: number; totalCartoes: number }
    >();

    for (const cartao of this.cartoes) {
      const usuario = this.normalizarUsuario(cartao);
      if (!map.has(usuario)) {
        map.set(usuario, { limite: 0, utilizado: 0, totalCartoes: 0 });
      }

      const atual = map.get(usuario)!;
      atual.limite += Math.max(0, cartao.limite || 0);
      atual.utilizado += this.valorUtilizadoLimite(cartao);
      atual.totalCartoes += 1;
    }

    return Array.from(map.entries())
      .map(([usuario, row]) => ({
        usuario,
        limite: Math.round(row.limite * 100) / 100,
        utilizado: Math.round(row.utilizado * 100) / 100,
        disponivel: Math.max(
          0,
          Math.round((row.limite - row.utilizado) * 100) / 100,
        ),
        totalCartoes: row.totalCartoes,
      }))
      .sort((a, b) =>
        a.usuario.localeCompare(b.usuario, 'pt-BR', { sensitivity: 'base' }),
      );
  }

  get linhasVisiveis(): LinhaUsuarioFaturasMes[] {
    if (!this.usuarioFiltro) return [];
    return this.linhasPorUsuario.filter(
      (r) => r.usuario === this.usuarioFiltro,
    );
  }

  get cartoesUsuario(): Cartao[] {
    if (!this.usuarioFiltro) return [];
    return this.cartoes
      .filter((c) => this.normalizarUsuario(c) === this.usuarioFiltro)
      .sort((a, b) => a.banco.localeCompare(b.banco, 'pt-BR'));
  }

  get totalLimiteUsuario(): number {
    return this.linhasVisiveis[0]?.limite ?? 0;
  }

  get totalUtilizadoUsuario(): number {
    return this.linhasVisiveis[0]?.utilizado ?? 0;
  }

  get totalDisponivelUsuario(): number {
    return this.linhasVisiveis[0]?.disponivel ?? 0;
  }

  get proximoVencimentoUsuario(): string {
    const vencimentos = this.cartoesUsuario
      .map((c) => c.diaVencimento)
      .filter((dia): dia is number => dia != null)
      .sort((a, b) => a - b);

    return vencimentos.length ? `Dia ${vencimentos[0]}` : '-';
  }

  onUsuarioChange(): void {
    this.cartaoExpandidoId = null;
  }

  normalizarUsuario(cartao: Cartao): string {
    return cartao.pessoa?.trim() || '(Sem usuário)';
  }

  alternarCartao(cartao: Cartao): void {
    this.cartaoExpandidoId =
      this.cartaoExpandidoId === cartao.id ? null : cartao.id;
  }

  cartaoExpandido(cartao: Cartao): boolean {
    return this.cartaoExpandidoId === cartao.id;
  }

  melhorDiaCompraLabel(c: Cartao): string {
    const dia = diaMelhorCompraEfetivo(c);
    return dia != null ? `Dia ${dia}` : '-';
  }

  periodoFatura(c: Cartao): PeriodoFaturaCartao | null {
    const ref = this.mesReferencia;
    return periodoFaturaCartao(c, ref.getFullYear(), ref.getMonth() + 1);
  }

  dataCompraExibicao(p: DividaNoMes): string {
    return (
      formatarDataIsoPtBr(p.dataCompra) ??
      formatarDataIsoPtBr(p.dataInicio) ??
      '-'
    );
  }

  parcelamentosDoCartao(cartao: Cartao): DividaNoMes[] {
    return this.parcelamentos
      .filter((p) => p.cartaoId === cartao.id)
      .sort(compararLancamentosFaturaPorData);
  }

  valorUtilizadoFatura(cartao: Cartao): number {
    const parcelamentos = this.parcelamentosDoCartao(cartao);
    if (parcelamentos.length > 0) {
      return totalParcelaMensalPendenteNoMes(parcelamentos);
    }

    if (cartao.totalAPagarMes != null) {
      const totalAPagarMes = Number(cartao.totalAPagarMes);
      return Math.max(0, Math.round(totalAPagarMes * 100) / 100);
    }

    return Math.max(0, cartao.valorUtilizado || 0);
  }

  valorDisponivelFatura(cartao: Cartao): number {
    const disponivel =
      Math.max(0, cartao.limite || 0) - this.valorUtilizadoLimite(cartao);
    return Math.max(0, Math.round(disponivel * 100) / 100);
  }

  valorUtilizadoLimite(cartao: Cartao): number {
    const parcelamentos = this.parcelamentosDoCartao(cartao);
    if (parcelamentos.length > 0) {
      const totalRestante = parcelamentos.reduce(
        (s, p) => s + Math.max(0, p.valorRestante || 0),
        0,
      );
      return Math.round(totalRestante * 100) / 100;
    }

    return Math.max(0, cartao.valorUtilizado || 0);
  }

  statusDoCartao(cartao: Cartao) {
    return statusCartao(
      {
        ...cartao,
        valorUtilizado: this.valorUtilizadoFatura(cartao),
        valorDisponivel: this.valorDisponivelFatura(cartao),
      },
      new Date(),
      this.mesReferencia,
    );
  }

  faturaAtrasada(cartao: Cartao): boolean {
    const statusParcelas = this.statusResumoParcelasCartao(cartao);
    if (statusParcelas) {
      if (statusParcelas === 'atrasada') {
        return true;
      }

      return (
        statusParcelas !== 'paga' &&
        statusParcelas !== 'quitada' &&
        this.statusDoCartao(cartao) === 'atrasado'
      );
    }

    return this.statusDoCartao(cartao) === 'atrasado';
  }

  statusLinhaLabel(cartao: Cartao): string {
    if (this.faturaAtrasada(cartao)) {
      return this.statusLabel(this.statusDoCartao(cartao));
    }

    if (cartao.faturaPaga) {
      return this.statusLabel(this.statusDoCartao(cartao));
    }

    const statusParcelas = this.statusResumoParcelasCartao(cartao);
    if (statusParcelas) {
      return this.statusParcelaLabel(statusParcelas);
    }

    return this.statusLabel(this.statusDoCartao(cartao));
  }

  statusLinhaClasse(cartao: Cartao): string {
    if (this.faturaAtrasada(cartao)) {
      return this.statusClasse(this.statusDoCartao(cartao));
    }

    if (cartao.faturaPaga) {
      return this.statusClasse(this.statusDoCartao(cartao));
    }

    const statusParcelas = this.statusResumoParcelasCartao(cartao);
    if (statusParcelas) {
      return this.statusParcelaClasse(statusParcelas);
    }

    return this.statusClasse(this.statusDoCartao(cartao));
  }

  private statusResumoParcelasCartao(
    cartao: Cartao,
  ): DividaNoMes['statusParcelaMes'] | null {
    const itens = this.parcelamentosDoCartao(cartao);
    if (!itens.length) return null;

    if (
      itens.every(
        (p) =>
          p.statusParcelaMes === 'paga' || p.statusParcelaMes === 'quitada',
      )
    ) {
      return 'paga';
    }

    const prioridade: DividaNoMes['statusParcelaMes'][] = [
      'atrasada',
      'pendente',
      'futura',
      'quitada',
      'paga',
    ];

    return (
      prioridade.find((status) =>
        itens.some((p) => p.statusParcelaMes === status),
      ) ?? null
    );
  }
}
