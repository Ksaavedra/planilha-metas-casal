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
  percentualUtilizadoCartao,
  statusCartao,
  statusCartaoClasse,
  statusCartaoLabel,
} from '@core/utils/cartoes.util';
import {
  calcularValorPagoAcumulado,
  parcelaMensalDivida,
  parcelasRestantesLabel,
  projetarDividasNoMes,
  statusParcelaMesClasse,
  statusParcelaMesLabel,
} from '@core/utils/dividas.util';
import {
  AdicionarCartaoDialogComponent,
  AdicionarCartaoDialogData,
} from '../../components/adicionar-cartao-dialog/adicionar-cartao-dialog.component';
import {
  AdicionarParcelamentoDialogComponent,
  AdicionarParcelamentoDialogData,
} from '../../components/adicionar-parcelamento-dialog/adicionar-parcelamento-dialog.component';
import {
  FaturaAtrasadaDialogComponent,
  FaturaAtrasadaDialogData,
  FaturaAtrasadaDialogResult,
} from '../../components/fatura-atrasada-dialog/fatura-atrasada-dialog.component';
import { ConfirmModalComponent } from 'shared/components/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from 'shared/components/success-modal/success-modal.component';
import { forkJoin } from 'rxjs';

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
  cartaoExpandidoId: number | null = null;
  carregando = false;
  erroCarregar: string | null = null;
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
    const disponivel = Math.max(0, limiteTotal - utilizado);
    const percentualUtilizado =
      limiteTotal > 0 ? Math.min(100, (utilizado / limiteTotal) * 100) : 0;

    return {
      limiteTotal: Math.round(limiteTotal * 100) / 100,
      utilizado: Math.round(utilizado * 100) / 100,
      totalAPagarMes: Math.round(totalAPagarMes * 100) / 100,
      disponivel: Math.round(disponivel * 100) / 100,
      percentualUtilizado,
      proximoVencimentoLabel: calcularResumoCartoes(cartoesResumo)
        .proximoVencimentoLabel,
    };
  }

  get exibirAvisoVazio(): boolean {
    return !this.carregando && this.cartoes.length === 0;
  }

  get cartoesComFaturaMes(): Cartao[] {
    return this.cartoes.filter((c) => this.valorPagarFatura(c) > 0);
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
    this.carregando = true;
    this.erroCarregar = null;
    forkJoin({
      cartoes: this.cartoesService.getCartoes({
        ano: this.anoRef,
        mes: this.mesRef,
      }),
      dividas: this.dividasService.getDividas(this.anoRef),
    }).subscribe({
      next: ({ cartoes, dividas }) => {
        this.cartoes = cartoes;
        this.parcelamentosAno = dividas.filter(
          (d) =>
            d.cartaoId != null &&
            [
              'parcelamento',
              'cartao_credito',
              'crediario',
              'pix_parcelado',
            ].includes(d.tipoDivida),
        );
        this.aplicarParcelamentosMes();
        this.paginaTabela = 1;
        this.normalizarIndicePagina();
        this.carregando = false;
        setTimeout(() => this.atualizarGraficos(), 0);
      },
      error: (err: unknown) => {
        this.carregando = false;
        this.erroCarregar = this.mensagemErroHttp(err);
        this.cartoes = [];
        this.parcelamentos = [];
        this.parcelamentosAno = [];
        this.paginaTabela = 1;
      },
    });
  }

  paginaAnteriorTabela(): void {
    if (this.paginaTabela > 1) this.paginaTabela--;
  }

  paginaProximaTabela(): void {
    if (this.paginaTabela < this.totalPaginasTabela) this.paginaTabela++;
  }

  mesAnterior(): void {
    const data = new Date(this.mesAtual);
    data.setMonth(data.getMonth() - 1);
    this.mesAtual = data;
    this.carregar();
  }

  proximoMes(): void {
    const data = new Date(this.mesAtual);
    data.setMonth(data.getMonth() + 1);
    this.mesAtual = data;
    this.carregar();
  }

  voltarParaMesAtual(): void {
    if (!this.estaForaDoMesAtual) return;
    this.mesAtual = new Date();
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

  podeParcelarCompra(c: Cartao): boolean {
    if (c.diaFechamento == null) return true;

    const hoje = new Date();
    const anoHoje = hoje.getFullYear();
    const mesHoje = hoje.getMonth();
    const anoSelecionado = this.mesAtual.getFullYear();
    const mesSelecionado = this.mesAtual.getMonth();

    if (
      anoSelecionado > anoHoje ||
      (anoSelecionado === anoHoje && mesSelecionado > mesHoje)
    ) {
      return true;
    }

    if (
      anoSelecionado < anoHoje ||
      (anoSelecionado === anoHoje && mesSelecionado < mesHoje)
    ) {
      return false;
    }

    return hoje.getDate() < c.diaFechamento;
  }

  parcelar(c: Cartao): void {
    if (!this.podeParcelarCompra(c)) return;

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
    return this.parcelamentos.filter((p) => p.cartaoId === c.id);
  }

  valorUtilizadoFatura(c: Cartao): number {
    if (c.totalAPagarMes != null) {
      const totalAPagarMes = Number(c.totalAPagarMes);
      return Math.max(0, Math.round(totalAPagarMes * 100) / 100);
    }

    const parcelamentos = this.parcelamentosDoCartao(c);
    if (parcelamentos.length > 0) {
      const totalParcelasMes = parcelamentos.reduce(
        (s, p) => s + parcelaMensalDivida(p),
        0,
      );
      return Math.round(totalParcelasMes * 100) / 100;
    }

    return Math.max(0, c.valorUtilizado || 0);
  }

  valorPagarFatura(c: Cartao): number {
    return this.valorUtilizadoFatura(c);
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
      return (
        statusParcelas === 'atrasada' ||
        (statusParcelas !== 'paga' &&
          statusParcelas !== 'quitada' &&
          this.statusDoCartao(c) === 'atrasado')
      );
    }

    return this.statusDoCartao(c) === 'atrasado';
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
    return this.faturaAtrasada(c) && this.valorUtilizadoFatura(c) > 0;
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
    if (c.faturaPaga) {
      return this.statusLabel(this.statusDoCartao(c));
    }

    const statusParcelas = this.statusResumoParcelasCartao(c);
    if (statusParcelas) {
      return this.statusParcelaLabel(statusParcelas);
    }

    return this.statusLabel(this.statusDoCartao(c));
  }

  statusLinhaClasse(c: Cartao): string {
    if (c.faturaPaga) {
      return this.statusClasse(this.statusDoCartao(c));
    }

    const statusParcelas = this.statusResumoParcelasCartao(c);
    if (statusParcelas) {
      return this.statusParcelaClasse(statusParcelas);
    }

    return this.statusClasse(this.statusDoCartao(c));
  }

  podePagarFatura(c: Cartao): boolean {
    return !c.faturaPaga && this.valorUtilizadoFatura(c) > 0;
  }

  podeDesfazerPagamento(c: Cartao): boolean {
    return (
      (Boolean(c.faturaPaga) && (c.valorFaturaPaga || 0) > 0) ||
      this.parcelamentosDoCartao(c).some((p) => p.parcelaMesPaga)
    );
  }

  mostrarBotaoPagar(c: Cartao): boolean {
    return !this.podeDesfazerPagamento(c);
  }

  abrirAcaoFaturaAtrasada(c: Cartao): void {
    const data: FaturaAtrasadaDialogData = {
      cartao: this.cartaoComValorUtilizadoAtual(c),
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
        this.registrarPagamentoAtrasado(c, result.valorPago);
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
    const valor = this.valorUtilizadoFatura(c);
    const ref = this.dialog.open(ConfirmModalComponent, {
      width: 'min(420px, 96vw)',
      data: {
        title: 'Pagar fatura?',
        message: `Deseja marcar a fatura de "${c.nome}" como paga (${this.formatarMoeda(valor)})?`,
        confirmText: 'Sim, pagar',
        cancelText: 'Não',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;

      const atualizacoes = [
        this.cartoesService.updateCartao(c.id, {
          valorUtilizado: 0,
          faturaPaga: this.parcelamentosDoCartao(c).length === 0,
          valorFaturaPaga: valor,
        }),
        ...this.atualizacoesParcelasPagas(c),
      ];

      forkJoin(atualizacoes).subscribe({
        next: () => {
          this.carregar();
          this.dialog.open(SuccessModalComponent, {
            width: 'min(420px, 96vw)',
            data: {
              title: 'Fatura paga!',
              message: 'O pagamento da fatura foi registrado com sucesso.',
              confirmText: 'OK',
            },
          });
        },
      });
    });
  }

  private registrarPagamentoAtrasado(c: Cartao, valorPago: number): void {
    const valorEmAberto = this.valorUtilizadoFatura(c);
    const valorPagoNormalizado = Math.min(
      Math.max(0, valorPago),
      valorEmAberto,
    );
    const novoValorUtilizado = Math.max(
      0,
      valorEmAberto - valorPagoNormalizado,
    );

    const temParcelamentos = this.parcelamentosDoCartao(c).length > 0;
    const atualizacoes = [
      this.cartoesService.updateCartao(c.id, {
        valorUtilizado: novoValorUtilizado,
        faturaPaga: !temParcelamentos && novoValorUtilizado <= 0,
        valorFaturaPaga: (c.valorFaturaPaga || 0) + valorPagoNormalizado,
        observacaoAtraso: null,
        previsaoPagamento: null,
      }),
      ...this.atualizacoesParcelasPagas(c),
    ];

    forkJoin(atualizacoes).subscribe({
      next: () => {
        this.carregar();
        this.dialog.open(SuccessModalComponent, {
          width: 'min(420px, 96vw)',
          data: {
            title: 'Fatura regularizada!',
            message: 'O pagamento foi registrado e o limite foi atualizado.',
            confirmText: 'OK',
          },
        });
      },
    });
  }

  confirmarDesfazerPagamento(c: Cartao): void {
    const ref = this.dialog.open(ConfirmModalComponent, {
      width: 'min(420px, 96vw)',
      data: {
        title: 'Desfazer pagamento',
        message: 'Deseja desfazer este pagamento?',
        confirmText: 'Sim, desfazer',
        cancelText: 'Não',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;

      const atualizacoes = [
        this.cartoesService.updateCartao(c.id, {
          valorUtilizado: c.valorFaturaPaga || 0,
          faturaPaga: false,
          valorFaturaPaga: 0,
        }),
        ...this.atualizacoesParcelasDesfeitas(c),
      ];

      forkJoin(atualizacoes).subscribe({
        next: () => {
          this.carregar();
          this.dialog.open(SuccessModalComponent, {
            width: 'min(420px, 96vw)',
            data: {
              title: 'Pagamento desfeito!',
              message: 'A fatura voltou para em aberto.',
              confirmText: 'OK',
            },
          });
        },
      });
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

  private atualizacoesParcelasPagas(c: Cartao) {
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
        );

        return this.dividasService.updateDivida(p.id, { valorPago });
      });
  }

  private atualizacoesParcelasDesfeitas(c: Cartao) {
    return this.parcelamentosDoCartao(c)
      .filter((p) => p.parcelaMesPaga || p.statusParcelaMes === 'quitada')
      .map((p) => {
        const valorPago = calcularValorPagoAcumulado(
          p.valorTotal,
          p.quantidadeParcelas,
          p.dataInicio || undefined,
          this.mesRef,
          0,
        );

        return this.dividasService.updateDivida(p.id, { valorPago });
      });
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
