import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AdicionarDespesaDialogComponent,
  AdicionarDespesaDialogData,
} from '../../components/adicionar-despesa-dialog/adicionar-despesa-dialog.component';
import { ConfirmModalComponent } from 'app/shared/components/confirm-modal/confirm-modal.component';
import { DespesasService } from 'app/core/services/despesas/despesas.service';
import {
  Despesa,
  NaturezaDespesa,
} from '@app/core/interfaces/despesas/despesas';
import { SuccessModalComponent } from '@app/shared/components/success-modal/success-modal.component';

@Component({
  selector: 'app-despesas-page',
  templateUrl: './despesas-page.component.html',
  styleUrls: ['./despesas-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DespesasPageComponent implements OnInit {
  readonly tituloSecundario = 'Tudo que você gasta no dia a dia';

  visaoDespesas: 'lista' | 'exemplos' | 'usuario' = 'lista';
  mesAtual: Date = new Date();
  despesas: Despesa[] = [];
  loading = false;
  erroCarregar: string | null = null;
  confirmExcluirOpen = false;
  despesaParaExcluir: Despesa | null = null;

  tamanhoPagina = 5;
  paginaFixas = 1;
  paginaVariaveis = 1;

  meses = [
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

  constructor(
    private despesasService: DespesasService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
  ) {}

  get nomeMesAtual(): string {
    const m = this.mesAtual.getMonth();
    const a = this.mesAtual.getFullYear();
    return `${this.meses[m]} ${a}`;
  }

  get despesasFixas(): Despesa[] {
    return this.despesas.filter((d) => d.natureza === 'fixa');
  }

  get despesasVariaveis(): Despesa[] {
    return this.despesas.filter((d) => d.natureza === 'variavel');
  }

  get despesasFixasPaginadas(): Despesa[] {
    const all = this.despesasFixas;
    const start = (this.paginaFixas - 1) * this.tamanhoPagina;
    return all.slice(start, start + this.tamanhoPagina);
  }

  get despesasVariaveisPaginadas(): Despesa[] {
    const all = this.despesasVariaveis;
    const start = (this.paginaVariaveis - 1) * this.tamanhoPagina;
    return all.slice(start, start + this.tamanhoPagina);
  }

  get totalPaginasFixas(): number {
    const n = this.despesasFixas.length;
    return n === 0 ? 0 : Math.ceil(n / this.tamanhoPagina);
  }

  get totalPaginasVariaveis(): number {
    const n = this.despesasVariaveis.length;
    return n === 0 ? 0 : Math.ceil(n / this.tamanhoPagina);
  }

  get exibindoDeFixas(): number {
    if (!this.despesasFixas.length) return 0;
    return (this.paginaFixas - 1) * this.tamanhoPagina + 1;
  }

  get exibindoAteFixas(): number {
    return (
      (this.paginaFixas - 1) * this.tamanhoPagina +
      this.despesasFixasPaginadas.length
    );
  }

  get exibindoDeVariaveis(): number {
    if (!this.despesasVariaveis.length) return 0;
    return (this.paginaVariaveis - 1) * this.tamanhoPagina + 1;
  }

  get exibindoAteVariaveis(): number {
    return (
      (this.paginaVariaveis - 1) * this.tamanhoPagina +
      this.despesasVariaveisPaginadas.length
    );
  }

  paginaAnteriorFixas(): void {
    if (this.paginaFixas > 1) {
      this.paginaFixas--;
      this.cdr.markForCheck();
    }
  }

  paginaProximaFixas(): void {
    if (this.paginaFixas < this.totalPaginasFixas) {
      this.paginaFixas++;
      this.cdr.markForCheck();
    }
  }

  paginaAnteriorVariaveis(): void {
    if (this.paginaVariaveis > 1) {
      this.paginaVariaveis--;
      this.cdr.markForCheck();
    }
  }

  paginaProximaVariaveis(): void {
    if (this.paginaVariaveis < this.totalPaginasVariaveis) {
      this.paginaVariaveis++;
      this.cdr.markForCheck();
    }
  }

  private normalizarIndicesPagina(): void {
    const pf = this.totalPaginasFixas;
    if (pf === 0) {
      this.paginaFixas = 1;
    } else if (this.paginaFixas > pf) {
      this.paginaFixas = pf;
    }

    const pv = this.totalPaginasVariaveis;
    if (pv === 0) {
      this.paginaVariaveis = 1;
    } else if (this.paginaVariaveis > pv) {
      this.paginaVariaveis = pv;
    }
  }

  private aplicarResultadoCarregar(rows: Despesa[], erro: string | null): void {
    this.despesas = [...rows];
    this.paginaFixas = 1;
    this.paginaVariaveis = 1;
    this.normalizarIndicesPagina();
    this.loading = false;
    this.erroCarregar = erro;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  get totalFixas(): number {
    return this.despesasService.calcularTotalDespesas(this.despesasFixas);
  }

  get totalVariaveis(): number {
    return this.despesasService.calcularTotalDespesas(this.despesasVariaveis);
  }

  get totalGeral(): number {
    return this.despesasService.calcularTotalDespesas(this.despesas);
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

  mesAnterior(): void {
    const d = new Date(this.mesAtual);
    d.setMonth(d.getMonth() - 1);
    this.mesAtual = d;
    this.carregar();
  }

  proximoMes(): void {
    const d = new Date(this.mesAtual);
    d.setMonth(d.getMonth() + 1);
    this.mesAtual = d;
    this.carregar();
  }

  selecionarVisao(visao: 'lista' | 'exemplos' | 'usuario'): void {
    this.visaoDespesas = visao;
    this.cdr.markForCheck();
  }

  abrirModalAdicionarDespesa(): void {
    this.abrirDialogDespesa(null);
  }

  editar(d: Despesa): void {
    this.abrirDialogDespesa(d);
  }

  private abrirDialogDespesa(despesa: Despesa | null): void {
    const ref = this.abrirDialog(despesa);
    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.porSalvarDespesa(despesa);
      }
    });
  }

  private abrirDialog(despesa: Despesa | null) {
    const data: AdicionarDespesaDialogData = {
      despesa,
      ano: this.anoRef,
      mes: this.mesRef,
    };
    return this.dialog.open(AdicionarDespesaDialogComponent, {
      width: 'min(520px, 96vw)',
      maxHeight: '90vh',
      data,
      autoFocus: 'dialog',
      restoreFocus: true,
    });
  }

  private porSalvarDespesa(despesa: Despesa | null): void {
    this.carregar();

    const isEdicao = despesa != null;

    this.abrirModalSucesso(isEdicao);

    this.cdr.markForCheck();
  }

  private abrirModalSucesso(isEdicao: boolean): void {
    this.dialog.open(SuccessModalComponent, {
      width: 'min(520px, 96vw)',
      maxHeight: '90vh',
      data: {
        title: isEdicao ? 'Despesa atualizada!' : 'Despesa adicionada!',
        message: isEdicao
          ? 'A despesa foi atualizada com sucesso.'
          : 'A despesa foi adicionada com sucesso.',
        confirmText: 'OK',
      },
    });
  }

  carregar(): void {
    this.loading = true;
    this.erroCarregar = null;
    this.cdr.markForCheck();

    this.despesasService
      .getDespesas({ ano: this.anoRef, mes: this.mesRef })
      .subscribe({
        next: (rows) => {
          this.aplicarResultadoCarregar(rows, null);
        },
        error: (e) => {
          this.aplicarResultadoCarregar(
            [],
            e?.error?.error ||
              e?.message ||
              'Não foi possível carregar despesas.',
          );
        },
      });
  }

  abrirConfirmExcluir(d: Despesa): void {
    const ref = this.dialog.open(ConfirmModalComponent, {
      width: 'min(520px, 96vw)',
      maxHeight: '90vh',
      data: {
        title: 'Excluir despesa',
        message: `Tem certeza que deseja excluir "${d.descricao}" (${d.categoria}) no valor de ${this.formatarValor(d.valor)}?`,
        confirmText: 'Sim, excluir',
        cancelText: 'Cancelar',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.despesasService.deleteDespesa(d.id).subscribe({
          next: () => {
            this.carregar();
            this.dialog.open(SuccessModalComponent, {
              width: 'min(520px, 96vw)',
              maxHeight: '90vh',
              data: {
                title: 'Despesa excluída',
                message: 'A despesa foi excluída com sucesso.',
                confirmText: 'OK',
              },
            });
            this.cdr.markForCheck();
          },
          error: (e) => {
            this.erroCarregar =
              e?.error?.error || e?.message || 'Erro ao excluir.';
            this.cdr.markForCheck();
          },
        });
      }
    });
  }

  private formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  labelPessoa(d: Despesa): string {
    const p = d.pessoa?.trim();
    return p || '—';
  }

  labelNatureza(n: NaturezaDespesa): string {
    return n === 'fixa' ? 'Fixa' : 'Variável';
  }
}
