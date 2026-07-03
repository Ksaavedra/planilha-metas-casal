import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import * as echarts from 'echarts';
import { Cartao } from '@core/interfaces/cartoes/cartoes';
import { Divida, DividaNoMes } from '@core/interfaces/dividas/dividas';
import { CartoesService } from '@core/services/cartoes/cartoes.service';
import { DividasService } from '@core/services/dividas/dividas.service';
import { PerfilFinanceiroService } from '@core/services/perfis/perfil-financeiro.service';
import {
  calcularResumoCartoes,
  mesReferenciaAnteriorAoAtual,
  percentualUtilizadoCartao,
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
  calcularResumoFaturaCartao,
  arredondarMoeda,
  isAjusteFatura,
  isCompraFatura,
  labelCategoriaAjuste,
  ResumoFaturaCartao,
} from '@core/utils/fatura-resumo.util';
import {
  calcularValorPagoAcumulado,
  calcularValorPagoAposDesfazerMes,
  compararLancamentosFaturaPorData,
  dataPagamentoAposDesfazerMes,
  dividaVisivelNoMesReferencia,
  formatarDataIsoPtBr,
  parcelaMensalDivida,
  parcelasRestantesLabel,
  projetarDividasNoMes,
  resolverDataPagamentoCartao,
  statusParcelaMesClasse,
  statusParcelaMesLabel,
} from '@core/utils/dividas.util';
import {
  AdicionarCartaoDialogComponent,
  AdicionarCartaoDialogData,
} from '../../components/adicionar-cartao-dialog/adicionar-cartao-dialog.component';
import {
  AdicionarAjusteFaturaDialogComponent,
  AdicionarAjusteFaturaDialogData,
} from '../../components/adicionar-ajuste-fatura-dialog/adicionar-ajuste-fatura-dialog.component';
import {
  AdicionarParcelamentoDialogComponent,
  AdicionarParcelamentoDialogData,
} from '../../components/adicionar-parcelamento-dialog/adicionar-parcelamento-dialog.component';
import {
  FaturaAtrasadaDialogComponent,
  FaturaAtrasadaDialogData,
  FaturaAtrasadaDialogResult,
} from '../../components/fatura-atrasada-dialog/fatura-atrasada-dialog.component';
import {
  ConfirmModalComponent,
  ConfirmModalPaymentDetails,
} from 'shared/components/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from 'shared/components/success-modal/success-modal.component';
import { forkJoin, map, Observable, tap, finalize, catchError } from 'rxjs';

@Component({
  selector: 'app-cartoes-page',
  templateUrl: './cartoes-page.component.html',
  styleUrls: ['./cartoes-page.component.scss'],
  standalone: false,
})
export class CartoesPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartUsoLimite') chartUsoLimite!: ElementRef<HTMLDivElement>;
  @ViewChild('chartEvolucaoFatura')
  chartEvolucaoFatura!: ElementRef<HTMLDivElement>;
  @ViewChild('chartPorBanco') chartPorBanco!: ElementRef<HTMLDivElement>;
  @ViewChild('chartComparacao') chartComparacao!: ElementRef<HTMLDivElement>;

  readonly statusLabel = statusCartaoLabel;
  readonly statusClasse = statusCartaoClasse;
  readonly percentualUtilizado = percentualUtilizadoCartao;
  readonly parcelasLabel = parcelasRestantesLabel;
  readonly valorParcela = parcelaMensalDivida;
  readonly statusParcelaLabel = statusParcelaMesLabel;
  readonly statusParcelaClasse = statusParcelaMesClasse;

  cartoes: Cartao[] = [];
  parcelamentos: DividaNoMes[] = [];
  private parcelamentosAno: Divida[] = [];
  ajustes: Divida[] = [];
  private ajustesAno: Divida[] = [];
  cartaoExpandidoId: number | null = null;
  carregando = false;
  erroCarregar: string | null = null;
  acaoFaturaProcessando: {
    cartaoId: number;
    tipo: 'pagar' | 'desfazer';
  } | null = null;
  visaoFaturas: 'lista' | 'usuario' | 'exemplos' = 'lista';
  mesAtual: Date = new Date();

  readonly tamanhoPagina = 6;
  paginaTabela = 1;
  readonly temGrupoFamiliar$ = this.perfilService.temGrupoFamiliar$;

  readonly meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  private charts: echarts.ECharts[] = [];

  constructor(
    private cartoesService: CartoesService,
    private dividasService: DividasService,
    private dialog: MatDialog,
    private perfilService: PerfilFinanceiroService,
  ) {}

  get resumo() {
    const cartoesResumo = this.cartoesComFaturaMes;
    const limiteTotal = cartoesResumo.reduce(
      (s, c) => s + Math.max(0, c.limite || 0),
      0,
    );
    const utilizado = cartoesResumo.reduce(
      (s, c) => s + this.valorUtilizadoLimite(c),
      0,
    );
    const totalAPagarMes = cartoesResumo.reduce(
      (s, c) => s + this.valorPagarFatura(c),
      0,
    );
    const totalValorFaturas = cartoesResumo.reduce(
      (s, c) => s + this.resumoFatura(c).valorFatura,
      0,
    );
    const disponivel = Math.max(0, limiteTotal - utilizado);
    const percentualUtilizado =
      limiteTotal > 0 ? Math.min(100, (utilizado / limiteTotal) * 100) : 0;

    return {
      limiteTotal: Math.round(limiteTotal * 100) / 100,
      utilizado: Math.round(utilizado * 100) / 100,
      totalValorFaturas: Math.round(totalValorFaturas * 100) / 100,
      totalAPagarMes: Math.round(totalAPagarMes * 100) / 100,
      disponivel: Math.round(disponivel * 100) / 100,
      percentualUtilizado,
      proximoVencimentoLabel:
        calcularResumoCartoes(cartoesResumo).proximoVencimentoLabel,
    };
  }

  get exibirAvisoVazio(): boolean {
    return !this.carregando && this.cartoes.length === 0;
  }

  get cartoesComFaturaMes(): Cartao[] {
    return this.cartoes;
  }

  get cartoesPaginados(): Cartao[] {
    const start = (this.paginaTabela - 1) * this.tamanhoPagina;
    return this.cartoesComFaturaMes.slice(start, start + this.tamanhoPagina);
  }

  get totalPaginasTabela(): number {
    const n = this.cartoesComFaturaMes.length;
    return n === 0 ? 0 : Math.ceil(n / this.tamanhoPagina);
  }

  get exibirPaginacaoTabela(): boolean {
    return this.cartoesComFaturaMes.length > this.tamanhoPagina;
  }

  get exibindoDeTabela(): number {
    if (!this.cartoesComFaturaMes.length) return 0;
    return (this.paginaTabela - 1) * this.tamanhoPagina + 1;
  }

  get exibindoAteTabela(): number {
    return (
      (this.paginaTabela - 1) * this.tamanhoPagina +
      this.cartoesPaginados.length
    );
  }

  get nomeMesAtual(): string {
    const mes = this.mesAtual.getMonth();
    const ano = this.mesAtual.getFullYear();
    return `${this.meses[mes]} ${ano}`;
  }

  get nomeMesHoje(): string {
    const hoje = new Date();
    return `${this.meses[hoje.getMonth()]} ${hoje.getFullYear()}`;
  }

  get estaForaDoMesAtual(): boolean {
    const hoje = new Date();
    return (
      this.mesAtual.getFullYear() !== hoje.getFullYear() ||
      this.mesAtual.getMonth() !== hoje.getMonth()
    );
  }

  get anoRef(): number {
    return this.mesAtual.getFullYear();
  }

  get mesRef(): number {
    return this.mesAtual.getMonth() + 1;
  }

  ngOnInit(): void {
    this.carregar();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.atualizarGraficos(), 0);
  }

  ngOnDestroy(): void {
    this.charts.forEach((c) => c.dispose());
    this.charts = [];
  }

  carregar(): void {
    this.carregarObservable().subscribe({
      error: (err: unknown) => {
        this.erroCarregar = this.mensagemErroHttp(err);
      },
    });
  }

  private carregarObservable(): Observable<void> {
    this.carregando = true;
    this.erroCarregar = null;
    const anosDividas = [...new Set([this.anoRef - 1, this.anoRef])].filter(
      (a) => a > 0,
    );

    return forkJoin({
      cartoes: this.cartoesService.getCartoes({
        ano: this.anoRef,
        mes: this.mesRef,
      }),
      dividas: forkJoin(
        anosDividas.map((ano) => this.dividasService.getDividas(ano)),
      ).pipe(map((listas) => listas.flat())),
    }).pipe(
      tap(({ cartoes, dividas }) => {
        this.cartoes = cartoes;
        this.parcelamentosAno = dividas
          .filter((d) => d.cartaoId != null && isCompraFatura(d))
          .map((d) => this.enriquecerParcelamentoComCartao(d, cartoes));
        this.ajustesAno = dividas
          .filter((d) => d.cartaoId != null && isAjusteFatura(d))
          .map((d) => this.enriquecerParcelamentoComCartao(d, cartoes));
        this.aplicarParcelamentosMes();
        this.aplicarAjustesMes();
        this.paginaTabela = 1;
        this.normalizarIndicePagina();
        setTimeout(() => this.atualizarGraficos(), 0);
      }),
      map(() => void 0),
      catchError((err: unknown) => {
        this.cartoes = [];
        this.parcelamentos = [];
        this.parcelamentosAno = [];
        this.ajustes = [];
        this.ajustesAno = [];
        this.paginaTabela = 1;
        throw err;
      }),
      finalize(() => {
        this.carregando = false;
      }),
    );
  }

  private cartaoAtual(c: Cartao): Cartao {
    return this.cartoes.find((item) => item.id === c.id) ?? c;
  }

  private valorPagoTotalFatura(resumo: ResumoFaturaCartao): number {
    return Math.min(
      resumo.valorFatura,
      arredondarMoeda(resumo.pagamentosRealizados + resumo.valorAPagar),
    );
  }

  paginaAnteriorTabela(): void {
    if (this.paginaTabela > 1) this.paginaTabela--;
  }

  paginaProximaTabela(): void {
    if (this.paginaTabela < this.totalPaginasTabela) this.paginaTabela++;
  }

  mesAnterior(): void {
    this.mesAtual = new Date(
      this.mesAtual.getFullYear(),
      this.mesAtual.getMonth() - 1,
      1,
    );
    this.carregar();
  }

  proximoMes(): void {
    this.mesAtual = new Date(
      this.mesAtual.getFullYear(),
      this.mesAtual.getMonth() + 1,
      1,
    );
    this.carregar();
  }

  voltarParaMesAtual(): void {
    if (!this.estaForaDoMesAtual) return;
    const hoje = new Date();
    this.mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    this.carregar();
  }

  selecionarVisao(visao: 'lista' | 'usuario' | 'exemplos'): void {
    this.visaoFaturas = visao;
  }

  abrirModalAdicionar(): void {
    this.abrirDialog(null);
  }

  editar(c: Cartao): void {
    this.abrirDialog(c);
  }

  /** Fatura do mês quitada: pagamento registrado e sem saldo em aberto. */
  isFaturaPaga(c: Cartao): boolean {
    if (this.valorUtilizadoFatura(c) > 0) return false;

    const temLancamentos =
      this.parcelamentosDoCartao(c).length > 0 ||
      this.ajustesDoCartao(c).length > 0;

    if (temLancamentos) {
      return this.podeDesfazerPagamento(c);
    }

    return Boolean(c.faturaPaga) && (c.valorFaturaPaga || 0) > 0;
  }

  podeEditarLancamentosFatura(c: Cartao): boolean {
    return !this.isFaturaPaga(c);
  }

  estaProcessandoAcaoFatura(c: Cartao, tipo?: 'pagar' | 'desfazer'): boolean {
    if (
      !this.acaoFaturaProcessando ||
      this.acaoFaturaProcessando.cartaoId !== c.id
    ) {
      return false;
    }

    return tipo ? this.acaoFaturaProcessando.tipo === tipo : true;
  }

  podeParcelarCompra(c: Cartao): boolean {
    return !this.isFaturaPaga(c);
  }

  melhorDiaCompraLabel(c: Cartao): string {
    const dia = diaMelhorCompraEfetivo(c);
    return dia != null ? `Dia ${dia}` : '-';
  }

  periodoFatura(c: Cartao): PeriodoFaturaCartao | null {
    return periodoFaturaCartao(c, this.anoRef, this.mesRef);
  }

  dataCompraExibicao(p: DividaNoMes): string {
    return (
      formatarDataIsoPtBr(p.dataCompra) ??
      formatarDataIsoPtBr(p.dataInicio) ??
      '-'
    );
  }

  parcelar(c: Cartao): void {
    if (this.isFaturaPaga(c)) return;

    const data: AdicionarParcelamentoDialogData = {
      cartao: c,
      ano: this.anoRef,
      mes: this.mesRef,
    };
    const ref = this.dialog.open(AdicionarParcelamentoDialogComponent, {
      width: 'min(560px, 96vw)',
      maxHeight: '90vh',
      data,
      autoFocus: 'dialog',
    });

    ref.afterClosed().subscribe((saved) => {
      if (!saved) return;
      this.carregar();
      this.dialog.open(SuccessModalComponent, {
        width: 'min(420px, 96vw)',
        data: {
          title: 'Compra parcelada adicionada!',
          message: 'A compra será acompanhada mês a mês na fatura.',
          confirmText: 'OK',
        },
      });
    });
  }

  adicionarAjuste(c: Cartao): void {
    if (this.isFaturaPaga(c)) return;

    const data: AdicionarAjusteFaturaDialogData = {
      cartao: c,
      ano: this.anoRef,
      mes: this.mesRef,
    };
    const ref = this.dialog.open(AdicionarAjusteFaturaDialogComponent, {
      width: 'min(560px, 96vw)',
      maxHeight: '90vh',
      data,
      autoFocus: 'dialog',
    });

    ref.afterClosed().subscribe((saved) => {
      if (!saved) return;
      this.carregar();
      this.dialog.open(SuccessModalComponent, {
        width: 'min(420px, 96vw)',
        data: {
          title: 'Ajuste adicionado!',
          message: 'O lançamento foi aplicado ao cálculo da fatura.',
          confirmText: 'OK',
        },
      });
    });
  }

  editarAjuste(c: Cartao, ajuste: Divida): void {
    const data: AdicionarAjusteFaturaDialogData = {
      cartao: c,
      ano: this.anoRef,
      mes: this.mesRef,
      ajuste,
    };
    const ref = this.dialog.open(AdicionarAjusteFaturaDialogComponent, {
      width: 'min(560px, 96vw)',
      maxHeight: '90vh',
      data,
      autoFocus: 'dialog',
    });

    ref.afterClosed().subscribe((saved) => {
      if (!saved) return;
      this.carregar();
    });
  }

  editarAjusteResumo(c: Cartao): void {
    if (this.isFaturaPaga(c)) return;

    const itens = this.ajustesDoCartao(c);
    if (itens.length >= 1) {
      this.editarAjuste(c, itens[0]);
      return;
    }

    this.adicionarAjuste(c);
  }

  tituloEditarAjusteResumo(c: Cartao): string {
    if (this.isFaturaPaga(c)) {
      return this.motivoEdicaoLancamentosDesabilitada();
    }

    const qtd = this.ajustesDoCartao(c).length;
    if (qtd === 0) return 'Adicionar crédito ou ajuste';
    if (qtd === 1) return 'Editar crédito ou ajuste';
    return 'Editar ajuste (use a tabela para os demais)';
  }

  confirmarExcluirAjuste(ajuste: Divida): void {
    const ref = this.dialog.open(ConfirmModalComponent, {
      width: 'min(420px, 96vw)',
      data: {
        title: 'Excluir ajuste',
        message: `Deseja excluir "${this.labelAjuste(ajuste)}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
      },
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.dividasService.deleteDivida(ajuste.id).subscribe({
        next: () => this.carregar(),
      });
    });
  }

  editarParcelamento(c: Cartao, p: DividaNoMes): void {
    const data: AdicionarParcelamentoDialogData = {
      cartao: c,
      ano: this.anoRef,
      mes: this.mesRef,
      parcelamento: p,
    };
    const ref = this.dialog.open(AdicionarParcelamentoDialogComponent, {
      width: 'min(560px, 96vw)',
      maxHeight: '90vh',
      data,
      autoFocus: 'dialog',
    });

    ref.afterClosed().subscribe((saved) => {
      if (!saved) return;
      this.carregar();
      this.dialog.open(SuccessModalComponent, {
        width: 'min(420px, 96vw)',
        data: {
          title: 'Compra atualizada!',
          message: 'Os dados da compra parcelada foram atualizados.',
          confirmText: 'OK',
        },
      });
    });
  }

  confirmarExcluirParcelamento(p: DividaNoMes): void {
    const ref = this.dialog.open(ConfirmModalComponent, {
      width: 'min(420px, 96vw)',
      data: {
        title: 'Excluir compra parcelada',
        message: `Deseja excluir "${p.objetivo}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.dividasService.deleteDivida(p.id).subscribe({
        next: () => {
          this.carregar();
          this.dialog.open(SuccessModalComponent, {
            width: 'min(420px, 96vw)',
            data: {
              title: 'Compra excluída!',
              message: 'A compra parcelada foi removida da fatura.',
              confirmText: 'OK',
            },
          });
        },
      });
    });
  }

  alternarCartao(c: Cartao): void {
    this.cartaoExpandidoId = this.cartaoExpandido(c) ? null : c.id;
  }

  cartaoExpandido(c: Cartao): boolean {
    return this.cartaoExpandidoId === c.id;
  }

  parcelamentosDoCartao(c: Cartao): DividaNoMes[] {
    return this.parcelamentos
      .filter((p) => p.cartaoId === c.id)
      .sort(compararLancamentosFaturaPorData);
  }

  ajustesDoCartao(c: Cartao): Divida[] {
    return this.ajustes
      .filter((a) => a.cartaoId === c.id)
      .sort(compararLancamentosFaturaPorData);
  }

  resumoFatura(c: Cartao): ResumoFaturaCartao {
    return calcularResumoFaturaCartao(
      this.parcelamentosDoCartao(c),
      this.ajustesDoCartao(c),
      c,
    );
  }

  labelAjuste(a: Divida): string {
    return labelCategoriaAjuste(a.objetivo);
  }

  valorUtilizadoFatura(c: Cartao): number {
    const temLancamentos =
      this.parcelamentosDoCartao(c).length > 0 ||
      this.ajustesDoCartao(c).length > 0;

    if (temLancamentos) {
      return this.resumoFatura(c).valorAPagar;
    }

    if (c.totalAPagarMes != null) {
      return Math.max(0, Math.round(Number(c.totalAPagarMes) * 100) / 100);
    }

    return Math.max(0, c.valorUtilizado || 0);
  }

  valorPagarFatura(c: Cartao): number {
    return this.valorUtilizadoFatura(c);
  }

  valorFaturaCartao(c: Cartao): number {
    return this.resumoFatura(c).valorFatura;
  }

  valorUtilizadoLimite(c: Cartao): number {
    const parcelamentos = this.parcelamentosDoCartao(c);
    if (parcelamentos.length > 0) {
      const totalRestante = parcelamentos.reduce(
        (s, p) => s + Math.max(0, p.valorRestante || 0),
        0,
      );
      return Math.round(totalRestante * 100) / 100;
    }

    return Math.max(0, c.valorUtilizado || 0);
  }

  valorDisponivelFatura(c: Cartao): number {
    const disponivel = Math.max(
      0,
      Math.max(0, c.limite || 0) - this.valorUtilizadoLimite(c),
    );
    return Math.round(disponivel * 100) / 100;
  }

  confirmarExcluir(c: Cartao): void {
    const ref = this.dialog.open(ConfirmModalComponent, {
      width: 'min(420px, 96vw)',
      data: {
        title: 'Excluir cartão',
        message: `Deseja excluir "${c.nome}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
      },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.cartoesService.deleteCartao(c.id).subscribe({
          next: () => this.carregar(),
        });
      }
    });
  }

  statusDoCartao(c: Cartao) {
    return statusCartao(
      this.cartaoComValorUtilizadoAtual(c),
      new Date(),
      this.mesAtual,
    );
  }

  faturaAtrasada(c: Cartao): boolean {
    const statusParcelas = this.statusResumoParcelasCartao(c);
    if (statusParcelas) {
      if (statusParcelas === 'atrasada') {
        return true;
      }

      return (
        statusParcelas !== 'paga' &&
        statusParcelas !== 'quitada' &&
        this.statusDoCartao(c) === 'atrasado'
      );
    }

    return this.statusDoCartao(c) === 'atrasado';
  }

  statusFaturaClicavel(c: Cartao): boolean {
    if (this.carregando) return false;
    if (this.estaProcessandoAcaoFatura(c, 'pagar')) return true;
    if (this.estaProcessandoAcaoFatura(c)) return false;
    if (this.valorUtilizadoFatura(c) <= 0) return false;

    if (this.faturaAtrasada(c)) return true;

    const statusParcelas = this.statusResumoParcelasCartao(c);
    if (statusParcelas === 'pendente' || statusParcelas === 'atrasada') {
      return true;
    }

    if (this.podeDesfazerPagamento(c)) return false;

    const status = this.statusDoCartao(c);
    return status === 'fatura_fechada';
  }

  tituloAcaoPagamentoFatura(c: Cartao): string {
    if (this.estaProcessandoAcaoFatura(c, 'pagar')) {
      return 'Processando pagamento...';
    }

    return this.faturaAtrasada(c) ? 'Resolver fatura atrasada' : 'Pagar fatura';
  }

  motivoParcelarCompraDesabilitado(): string {
    return 'Disponível somente para faturas não pagas.';
  }

  tituloParcelarCompra(c: Cartao): string {
    if (this.isFaturaPaga(c)) {
      return this.motivoParcelarCompraDesabilitado();
    }

    return 'Parcelar compra';
  }

  motivoEdicaoLancamentosDesabilitada(): string {
    return 'Não é possível editar uma fatura já paga.';
  }

  motivoExclusaoLancamentosDesabilitada(): string {
    return 'Não é possível excluir uma fatura já paga.';
  }

  motivoJurosAjusteDesabilitado(): string {
    return 'Disponível somente para faturas não pagas.';
  }

  tituloJurosAjuste(c: Cartao): string {
    if (this.isFaturaPaga(c)) {
      return this.motivoJurosAjusteDesabilitado();
    }

    return 'Juros, crédito ou ajuste';
  }

  tooltipDesfazerPagamento(_c: Cartao): string {
    return 'Desfazer pagamento';
  }

  tooltipEditarFatura(_c: Cartao): string {
    return 'Editar fatura';
  }

  tooltipExcluirFatura(_c: Cartao): string {
    return 'Excluir fatura';
  }

  tooltipExpandirDetalhes(c: Cartao): string {
    return this.cartaoExpandido(c) ? 'Recolher detalhes' : 'Expandir detalhes';
  }

  tooltipEditarCompra(c: Cartao): string {
    return this.podeEditarLancamentosFatura(c)
      ? 'Editar compra'
      : this.motivoEdicaoLancamentosDesabilitada();
  }

  tooltipExcluirCompra(c: Cartao): string {
    return this.podeEditarLancamentosFatura(c)
      ? 'Excluir compra'
      : this.motivoExclusaoLancamentosDesabilitada();
  }

  tooltipEditarAjuste(c: Cartao): string {
    return this.podeEditarLancamentosFatura(c)
      ? 'Editar ajuste'
      : this.motivoEdicaoLancamentosDesabilitada();
  }

  tooltipExcluirAjuste(c: Cartao): string {
    return this.podeEditarLancamentosFatura(c)
      ? 'Excluir ajuste'
      : this.motivoExclusaoLancamentosDesabilitada();
  }

  abrirAcaoPagamentoFatura(c: Cartao): void {
    if (this.estaProcessandoAcaoFatura(c)) return;

    if (this.faturaAtrasada(c)) {
      this.abrirAcaoFaturaAtrasada(c);
      return;
    }

    this.confirmarPagarFatura(c);
  }

  previsaoPagamentoVencida(c: Cartao): boolean {
    if (!c.previsaoPagamento || this.valorUtilizadoFatura(c) <= 0) return false;

    const previsao = this.dataLocal(c.previsaoPagamento);
    if (!previsao) return false;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return previsao.getTime() <= hoje.getTime();
  }

  mostrarAlertaPrevisao(c: Cartao): boolean {
    if (mesReferenciaAnteriorAoAtual(this.mesAtual)) {
      return false;
    }

    return this.faturaAtrasada(c) && this.valorUtilizadoFatura(c) > 0;
  }

  mostrarAlertaPagamento(c: Cartao): boolean {
    if (this.faturaAtrasada(c) && this.valorUtilizadoFatura(c) > 0)
      return false;
    return !!this.dataPagamentoExibicao(c);
  }

  textoAlertaPagamento(c: Cartao): string {
    const data = this.dataPagamentoExibicao(c);
    return data ? `${data} foi pago` : '';
  }

  mostrarIconePagoStatus(c: Cartao): boolean {
    const classe = this.statusLinhaClasse(c);
    return (
      classe === 'status--parcela-paga' ||
      classe === 'status--quitada' ||
      classe === 'status--fatura-paga'
    );
  }

  textoAlertaPrevisao(c: Cartao): string {
    const previsao = this.dataLocal(c.previsaoPagamento);
    if (!previsao) return 'Sem previsão';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (previsao.getTime() === hoje.getTime()) return 'Pagar hoje';
    if (previsao.getTime() < hoje.getTime()) return 'Previsão vencida';

    return `Previsão ${this.formatarData(previsao)}`;
  }

  statusLinhaLabel(c: Cartao): string {
    const statusParcelas = this.statusResumoParcelasCartao(c);
    if (statusParcelas) {
      return this.statusParcelaLabel(statusParcelas);
    }

    if (c.faturaPaga) {
      return this.statusLabel(this.statusDoCartao(c));
    }

    return this.statusLabel(this.statusDoCartao(c));
  }

  statusLinhaClasse(c: Cartao): string {
    const statusParcelas = this.statusResumoParcelasCartao(c);
    if (statusParcelas) {
      return this.statusParcelaClasse(statusParcelas);
    }

    if (c.faturaPaga) {
      return this.statusClasse(this.statusDoCartao(c));
    }

    return this.statusClasse(this.statusDoCartao(c));
  }

  podePagarFatura(c: Cartao): boolean {
    if (this.parcelamentosDoCartao(c).length > 0) {
      return this.valorUtilizadoFatura(c) > 0;
    }

    return !c.faturaPaga && this.valorUtilizadoFatura(c) > 0;
  }

  podeDesfazerPagamento(c: Cartao): boolean {
    if (Boolean(c.faturaPaga) && (c.valorFaturaPaga || 0) > 0) {
      return true;
    }

    return this.parcelamentosDoCartao(c).some(
      (p) =>
        p.parcelaMesPaga ||
        p.statusParcelaMes === 'paga' ||
        p.statusParcelaMes === 'quitada',
    );
  }

  /** Desfazer só quando a fatura do mês está quitada; com saldo atrasado, use o badge Atrasada. */
  mostrarBotaoDesfazer(c: Cartao): boolean {
    if (!this.podeDesfazerPagamento(c)) return false;
    if (this.faturaAtrasada(c) && this.valorUtilizadoFatura(c) > 0)
      return false;
    return true;
  }

  mostrarBotaoPagar(c: Cartao): boolean {
    return !this.podeDesfazerPagamento(c);
  }

  tituloDesfazerPagamento(c: Cartao): string {
    if (!this.podeDesfazerPagamento(c)) {
      return '';
    }

    const data = this.dataPagamentoExibicao(c);
    if (data) {
      return `Pagamento de ${data}. Clique para desfazer.`;
    }

    if (Boolean(c.faturaPaga) && (c.valorFaturaPaga || 0) > 0) {
      return 'Fatura paga. Clique para desfazer.';
    }

    return 'Desfazer pagamento';
  }

  mensagemConfirmarDesfazerPagamento(c: Cartao): string {
    const data = this.dataPagamentoExibicao(c);
    if (data) {
      return `Deseja desfazer o pagamento de ${data}?`;
    }

    return 'Deseja desfazer este pagamento?';
  }

  abrirAcaoFaturaAtrasada(c: Cartao): void {
    const resumo = this.resumoFatura(c);
    const data: FaturaAtrasadaDialogData = {
      cartao: this.cartaoComValorUtilizadoAtual(c),
      valorEmAberto: resumo.valorAPagar,
    };
    const ref = this.dialog.open(FaturaAtrasadaDialogComponent, {
      width: 'min(520px, 96vw)',
      maxHeight: '90vh',
      data,
      autoFocus: 'dialog',
    });

    ref.afterClosed().subscribe((result?: FaturaAtrasadaDialogResult) => {
      if (!result) return;

      if (result.acao === 'pagar') {
        this.registrarPagamentoAtrasado(
          c,
          result.valorPago,
          result.previsaoPagamento,
        );
        return;
      }

      this.cartoesService
        .updateCartao(c.id, {
          observacaoAtraso: result.observacaoAtraso ?? null,
          previsaoPagamento: result.previsaoPagamento ?? null,
          faturaPaga: false,
        })
        .subscribe({
          next: () => {
            this.carregar();
            this.dialog.open(SuccessModalComponent, {
              width: 'min(420px, 96vw)',
              data: {
                title: 'Combinado!',
                message:
                  'A fatura continua atrasada e a previsão foi registrada.',
                confirmText: 'OK',
              },
            });
          },
        });
    });
  }

  confirmarPagarFatura(c: Cartao): void {
    if (this.estaProcessandoAcaoFatura(c)) return;

    const resumo = this.resumoFatura(c);
    const valor = resumo.valorAPagar;
    const paymentDetails = this.dadosConfirmarPagarFatura(c, valor);
    const ref = this.dialog.open(ConfirmModalComponent, {
      width: 'min(420px, 96vw)',
      data: {
        title: 'Confirmar pagamento da fatura',
        message: `Deseja confirmar o pagamento da fatura do cartão ${paymentDetails.nomeCartao}?`,
        paymentDetails,
        confirmText: 'Pagar fatura',
        cancelText: 'Cancelar',
        variant: 'payment',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;

      const cartaoAtual = this.cartaoAtual(c);
      const resumo = this.resumoFatura(cartaoAtual);
      this.executarPagamentoFatura(cartaoAtual, {
        valorFatura: resumo.valorFatura,
        valorPago: this.valorPagoTotalFatura(resumo),
        tituloSucesso: 'Fatura paga!',
        mensagemSucesso: 'O pagamento da fatura foi registrado com sucesso.',
      });
    });
  }

  private registrarPagamentoAtrasado(
    c: Cartao,
    valorPago: number,
    dataPagamentoRef?: string,
  ): void {
    if (this.estaProcessandoAcaoFatura(c)) return;

    const cartaoAtual = this.cartaoAtual(c);
    const resumo = this.resumoFatura(cartaoAtual);
    const valorEmAberto = resumo.valorAPagar;
    const valorPagoNormalizado = Math.min(
      Math.max(0, valorPago),
      valorEmAberto,
    );
    const valorPagoAcumulado = Math.min(
      resumo.valorFatura,
      arredondarMoeda(resumo.pagamentosRealizados + valorPagoNormalizado),
    );
    const quitada = valorPagoAcumulado >= resumo.valorFatura - 0.01;

    this.executarPagamentoFatura(cartaoAtual, {
      valorFatura: resumo.valorFatura,
      valorPago: valorPagoAcumulado,
      dataPagamento: dataPagamentoRef,
      observacaoAtraso: quitada ? null : (cartaoAtual.observacaoAtraso ?? null),
      previsaoPagamento: quitada
        ? null
        : (cartaoAtual.previsaoPagamento ?? null),
      tituloSucesso: 'Fatura regularizada!',
      mensagemSucesso: 'O pagamento foi registrado com sucesso.',
    });
  }

  private executarPagamentoFatura(
    c: Cartao,
    opcoes: {
      valorFatura: number;
      valorPago: number;
      dataPagamento?: string;
      observacaoAtraso?: string | null;
      previsaoPagamento?: string | null;
      tituloSucesso: string;
      mensagemSucesso: string;
    },
  ): void {
    if (this.estaProcessandoAcaoFatura(c) || this.carregando) return;

    this.acaoFaturaProcessando = { cartaoId: c.id, tipo: 'pagar' };

    const valorFatura = arredondarMoeda(opcoes.valorFatura);
    const valorPago = Math.min(
      valorFatura,
      arredondarMoeda(Math.max(0, opcoes.valorPago)),
    );
    const dataPagamento = this.dataPagamentoAoRegistrarCartao(
      c,
      opcoes.dataPagamento,
    );

    const atualizacoes = [
      this.cartoesService.registrarPagamentoFatura(c.id, {
        ano: this.anoRef,
        mes: this.mesRef,
        valorFatura,
        valorPago,
        dataPagamento,
        observacaoAtraso: opcoes.observacaoAtraso ?? null,
        previsaoPagamento: opcoes.previsaoPagamento ?? null,
      }),
      ...this.atualizacoesParcelasPagas(c, dataPagamento),
    ];

    forkJoin(atualizacoes).subscribe({
      next: () =>
        this.finalizarAcaoFatura(opcoes.tituloSucesso, opcoes.mensagemSucesso),
      error: () => {
        this.acaoFaturaProcessando = null;
      },
    });
  }

  confirmarDesfazerPagamento(c: Cartao): void {
    if (this.estaProcessandoAcaoFatura(c)) return;

    const ref = this.dialog.open(ConfirmModalComponent, {
      width: 'min(420px, 96vw)',
      data: {
        title: 'Desfazer pagamento',
        message: this.mensagemConfirmarDesfazerPagamento(c),
        confirmText: 'Sim, desfazer',
        cancelText: 'Não',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.executarDesfazerPagamentoFatura(c);
    });
  }

  private executarDesfazerPagamentoFatura(c: Cartao): void {
    if (this.estaProcessandoAcaoFatura(c)) return;

    this.acaoFaturaProcessando = { cartaoId: c.id, tipo: 'desfazer' };

    forkJoin([
      this.cartoesService.desfazerPagamentoFatura(
        c.id,
        this.anoRef,
        this.mesRef,
      ),
      ...this.atualizacoesParcelasDesfeitas(c),
    ]).subscribe({
      next: () => {
        this.sincronizarEstadoLocalAposDesfazer(c);
        this.finalizarAcaoFatura(
          'Pagamento desfeito!',
          'A fatura deste mês voltou para em aberto.',
        );
      },
      error: () => {
        this.acaoFaturaProcessando = null;
      },
    });
  }

  private sincronizarEstadoLocalAposDesfazer(c: Cartao): void {
    const idx = this.cartoes.findIndex((item) => item.id === c.id);
    if (idx >= 0) {
      this.cartoes[idx] = {
        ...this.cartoes[idx],
        faturaPaga: false,
        valorFaturaPaga: 0,
        observacaoAtraso: null,
        previsaoPagamento: null,
      };
    }

    const parcelasDesfeitas = this.parcelamentosDoCartao(c).filter(
      (p) =>
        p.parcelaMesPaga ||
        p.statusParcelaMes === 'paga' ||
        p.statusParcelaMes === 'quitada',
    );

    for (const parcela of parcelasDesfeitas) {
      const divida = this.parcelamentosAno.find((d) => d.id === parcela.id);
      if (!divida) continue;

      const valorPago = calcularValorPagoAposDesfazerMes(
        divida,
        this.anoRef,
        this.mesRef,
      );
      if (valorPago == null) continue;

      divida.valorPago = valorPago;
      divida.dataPagamento = dataPagamentoAposDesfazerMes(divida, valorPago);
      divida.statusDivida = 'pagando';
    }

    this.aplicarParcelamentosMes();
  }

  private finalizarAcaoFatura(titulo: string, mensagem: string): void {
    this.carregarObservable().subscribe({
      next: () => {
        this.acaoFaturaProcessando = null;
        this.dialog.open(SuccessModalComponent, {
          width: 'min(420px, 96vw)',
          data: {
            title: titulo,
            message: mensagem,
            confirmText: 'OK',
          },
        });
      },
      error: () => {
        this.acaoFaturaProcessando = null;
      },
    });
  }

  private abrirDialog(cartao: Cartao | null): void {
    const data: AdicionarCartaoDialogData = { cartao };
    const ref = this.dialog.open(AdicionarCartaoDialogComponent, {
      width: 'min(540px, 96vw)',
      maxHeight: '90vh',
      data,
      autoFocus: 'dialog',
    });
    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.carregar();
        this.dialog.open(SuccessModalComponent, {
          width: 'min(420px, 96vw)',
          data: {
            title: cartao ? 'Cartão atualizado!' : 'Cartão adicionado!',
            message: 'Os dados foram salvos com sucesso.',
            confirmText: 'OK',
          },
        });
      }
    });
  }

  private normalizarIndicePagina(): void {
    const total = this.totalPaginasTabela;
    if (total === 0) this.paginaTabela = 1;
    else if (this.paginaTabela > total) this.paginaTabela = total;
  }

  private aplicarParcelamentosMes(): void {
    this.parcelamentos = projetarDividasNoMes(
      this.parcelamentosAno,
      this.anoRef,
      this.mesRef,
    );
  }

  private aplicarAjustesMes(): void {
    this.ajustes = this.ajustesAno.filter((d) =>
      dividaVisivelNoMesReferencia(d, this.anoRef, this.mesRef),
    );
  }

  private enriquecerParcelamentoComCartao(
    divida: Divida,
    cartoes: Cartao[],
  ): Divida {
    if (divida.diaMelhorCompra != null && divida.diaVencimento != null) {
      return divida;
    }

    const cartao = cartoes.find((c) => c.id === divida.cartaoId);
    if (!cartao) return divida;

    return {
      ...divida,
      diaMelhorCompra: divida.diaMelhorCompra ?? cartao.diaMelhorCompra ?? null,
      diaVencimento: divida.diaVencimento ?? cartao.diaVencimento ?? null,
    };
  }

  private statusResumoParcelasCartao(
    c: Cartao,
  ): DividaNoMes['statusParcelaMes'] | null {
    const itens = this.parcelamentosDoCartao(c);
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

  private dataLocal(valor?: string | null): Date | null {
    if (!valor) return null;
    const [ano, mes, dia] = valor.split('-').map((v) => Number(v));
    if (!ano || !mes || !dia) return null;
    const data = new Date(ano, mes - 1, dia);
    data.setHours(0, 0, 0, 0);
    return data;
  }

  private formatarData(data: Date): string {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private cartaoComValorUtilizadoAtual(c: Cartao): Cartao {
    return {
      ...c,
      valorUtilizado: this.valorUtilizadoFatura(c),
      valorDisponivel: this.valorDisponivelFatura(c),
    };
  }

  private atualizacoesParcelasPagas(c: Cartao, dataPagamentoRef?: string) {
    const dataPagamento = this.dataPagamentoAoRegistrarCartao(
      c,
      dataPagamentoRef,
    );

    return this.parcelamentosDoCartao(c)
      .filter(
        (p) =>
          p.statusParcelaMes !== 'paga' && p.statusParcelaMes !== 'quitada',
      )
      .map((p) => {
        const valorPago = calcularValorPagoAcumulado(
          p.valorTotal,
          p.quantidadeParcelas,
          p.dataInicio || undefined,
          this.mesRef,
          parcelaMensalDivida(p),
          this.anoRef,
          p,
        );

        return this.dividasService.updateDivida(p.id, {
          valorPago,
          dataPagamento,
        });
      });
  }

  private atualizacoesParcelasDesfeitas(c: Cartao) {
    return this.parcelamentosDoCartao(c)
      .filter(
        (p) =>
          p.parcelaMesPaga ||
          p.statusParcelaMes === 'paga' ||
          p.statusParcelaMes === 'quitada',
      )
      .flatMap((p) => {
        const divida = this.parcelamentosAno.find((d) => d.id === p.id) ?? p;
        const valorPago = calcularValorPagoAposDesfazerMes(
          divida,
          this.anoRef,
          this.mesRef,
        );
        if (valorPago == null) return [];

        return [
          this.dividasService.updateDivida(p.id, {
            valorPago,
            dataPagamento: dataPagamentoAposDesfazerMes(divida, valorPago),
            statusDivida: 'pagando',
          }),
        ];
      });
  }

  private dataPagamentoAoRegistrarCartao(
    c: Cartao,
    dataPagamentoRef?: string,
  ): string {
    if (dataPagamentoRef && dataPagamentoRef.length >= 10) {
      return dataPagamentoRef.slice(0, 10);
    }

    if (c.previsaoPagamento && c.previsaoPagamento.length >= 10) {
      return c.previsaoPagamento.slice(0, 10);
    }

    if (!mesReferenciaAnteriorAoAtual(this.mesAtual)) {
      return this.formatarDataIso(new Date());
    }

    const ultimoDia = new Date(this.anoRef, this.mesRef, 0).getDate();
    const dia = Math.min(c.diaVencimento ?? ultimoDia, ultimoDia);
    return `${this.anoRef}-${String(this.mesRef).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  private formatarDataIso(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private dadosConfirmarPagarFatura(
    c: Cartao,
    valor: number,
  ): ConfirmModalPaymentDetails {
    const dataIso = this.dataPagamentoAoRegistrarCartao(c);
    const dataLabel = formatarDataIsoPtBr(dataIso) ?? dataIso;
    const vencimentoLabel =
      this.periodoFatura(c)?.vencimentoLabel ?? this.vencimentoFaturaLabel(c);
    const valorLabel = valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return {
      nomeCartao: c.nome,
      dataPagamento: dataLabel,
      vencimento: vencimentoLabel,
      valor: valorLabel,
    };
  }

  private vencimentoFaturaLabel(c: Cartao): string {
    const ultimoDia = new Date(this.anoRef, this.mesRef, 0).getDate();
    const dia = Math.min(c.diaVencimento ?? ultimoDia, ultimoDia);
    const iso = `${this.anoRef}-${String(this.mesRef).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return formatarDataIsoPtBr(iso) ?? iso;
  }

  private dataPagamentoExibicao(c: Cartao): string | null {
    return resolverDataPagamentoCartao(this.parcelamentosDoCartao(c));
  }

  private atualizarGraficos(): void {
    if (!this.cartoes.length) return;
    this.initChart(this.chartUsoLimite, this.opcaoGraficoUsoLimite());
    this.initChart(this.chartEvolucaoFatura, this.opcaoGraficoEvolucao());
    this.initChart(this.chartPorBanco, this.opcaoGraficoPorBanco());
    this.initChart(this.chartComparacao, this.opcaoGraficoComparacao());
  }

  private initChart(
    ref: ElementRef<HTMLDivElement> | undefined,
    option: Record<string, unknown>,
  ): void {
    if (!ref?.nativeElement) return;
    const existente = echarts.getInstanceByDom(ref.nativeElement);
    const chart = existente ?? echarts.init(ref.nativeElement);
    chart.setOption(option, { notMerge: true });
    if (!this.charts.includes(chart)) this.charts.push(chart);
  }

  private formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  private eixoValorGrafico() {
    return {
      type: 'value' as const,
      axisLabel: {
        formatter: (v: number) => this.formatarMoeda(v),
        fontSize: 10,
        color: '#64748b',
      },
    };
  }

  private tooltipEixoValor() {
    return {
      trigger: 'axis' as const,
      valueFormatter: (v: number) => this.formatarMoeda(Number(v) || 0),
    };
  }

  private opcaoGraficoUsoLimite(): Record<string, unknown> {
    return {
      title: {
        text: 'Uso do limite',
        left: 'center',
        textStyle: { fontSize: 13 },
      },
      tooltip: {
        trigger: 'item',
        valueFormatter: (v: number) => this.formatarMoeda(Number(v) || 0),
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          data: [
            { name: 'Utilizado', value: this.resumo.utilizado },
            { name: 'Disponível', value: this.resumo.disponivel },
          ],
          color: ['#7c3aed', '#22c55e'],
          label: { fontSize: 11 },
        },
      ],
    };
  }

  private opcaoGraficoEvolucao(): Record<string, unknown> {
    const total = this.resumo.utilizado;
    const dados = Array.from(
      { length: 12 },
      (_, i) => Math.round(total * ((i + 1) / 12) * 100) / 100,
    );
    return {
      title: {
        text: 'Evolução da fatura',
        left: 'center',
        textStyle: { fontSize: 13 },
      },
      tooltip: this.tooltipEixoValor(),
      grid: { left: 56, right: 16, bottom: 56, top: 48 },
      xAxis: {
        type: 'category',
        data: [
          'Jan',
          'Fev',
          'Mar',
          'Abr',
          'Mai',
          'Jun',
          'Jul',
          'Ago',
          'Set',
          'Out',
          'Nov',
          'Dez',
        ],
        axisLabel: { rotate: 40, fontSize: 10, color: '#64748b' },
      },
      yAxis: this.eixoValorGrafico(),
      series: [
        {
          type: 'line',
          smooth: true,
          data: dados,
          lineStyle: { color: '#7c3aed', width: 2 },
          itemStyle: { color: '#7c3aed' },
        },
      ],
    };
  }

  private opcaoGraficoPorBanco(): Record<string, unknown> {
    const porBanco = new Map<string, number>();
    this.cartoes.forEach((c) => {
      porBanco.set(
        c.banco,
        (porBanco.get(c.banco) ?? 0) + this.valorUtilizadoLimite(c),
      );
    });
    return {
      title: {
        text: 'Gastos por banco',
        left: 'center',
        textStyle: { fontSize: 13 },
      },
      tooltip: {
        trigger: 'item',
        valueFormatter: (v: number) => this.formatarMoeda(Number(v) || 0),
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          data: [...porBanco.entries()].map(([name, value]) => ({
            name,
            value,
          })),
          color: ['#7c3aed', '#8b5cf6', '#a78bfa', '#22c55e', '#f59e0b'],
          label: { fontSize: 11 },
        },
      ],
    };
  }

  private opcaoGraficoComparacao(): Record<string, unknown> {
    const dados = this.cartoes.map((c) => ({
      name: c.nome,
      utilizado: this.valorUtilizadoLimite(c),
      disponivel: this.valorDisponivelFatura(c),
    }));
    return {
      title: {
        text: 'Comparação das faturas',
        left: 'center',
        textStyle: { fontSize: 13 },
      },
      tooltip: this.tooltipEixoValor(),
      legend: { bottom: 4, textStyle: { fontSize: 10 } },
      grid: { left: 56, right: 16, bottom: 56, top: 48 },
      xAxis: {
        type: 'category',
        data: dados.map((d) => d.name),
        axisLabel: { rotate: 25, fontSize: 10, color: '#64748b' },
      },
      yAxis: this.eixoValorGrafico(),
      series: [
        {
          name: 'Utilizado',
          type: 'bar',
          data: dados.map((d) => d.utilizado),
          itemStyle: { color: '#7c3aed', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'Disponível',
          type: 'bar',
          data: dados.map((d) => d.disponivel),
          itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }

  private mensagemErroHttp(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Servidor indisponível. Inicie o backend: cd backend && npm start';
      }
      if (err.status === 404) {
        return 'API de faturas não encontrada. Reinicie o servidor backend.';
      }
    }
    return 'Não foi possível carregar as faturas.';
  }
}
