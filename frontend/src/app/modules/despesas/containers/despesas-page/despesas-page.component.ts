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
import {
  Despesa,
  DespesasService,
  NaturezaDespesa,
} from 'app/core/services/despesas/despesas.service';
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

  visaoDespesas: 'lista' | 'exemplos' = 'lista';
  mesAtual: Date = new Date();
  despesas: Despesa[] = [];
  loading = false;
  erroCarregar: string | null = null;
  confirmExcluirOpen = false;
  despesaParaExcluir: Despesa | null = null;

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

  selecionarVisao(visao: 'lista' | 'exemplos'): void {
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
    const data: AdicionarDespesaDialogData = {
      despesa,
      ano: this.anoRef,
      mes: this.mesRef,
    };
    const ref = this.dialog.open(AdicionarDespesaDialogComponent, {
      width: 'min(520px, 96vw)',
      maxHeight: '90vh',
      data,
      autoFocus: 'dialog',
      restoreFocus: true,
    });
    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.carregar();

        const isEdicao = despesa != null;

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
        this.cdr.markForCheck();
      }
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
          this.despesas = [...rows];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.despesas = [];
          this.loading = false;
          this.erroCarregar =
            e?.error?.error ||
            e?.message ||
            'Não foi possível carregar despesas.';
          this.cdr.markForCheck();
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

  cancelarExcluir(): void {
    this.confirmExcluirOpen = false;
    this.despesaParaExcluir = null;
    this.cdr.markForCheck();
  }

  confirmarExcluir(): void {
    if (!this.despesaParaExcluir) return;

    const id = this.despesaParaExcluir.id;

    this.despesasService.deleteDespesa(id).subscribe({
      next: () => {
        this.confirmExcluirOpen = false;
        this.despesaParaExcluir = null;
        this.carregar();
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.confirmExcluirOpen = false;
        this.erroCarregar = e?.error?.error || e?.message || 'Erro ao excluir.';
        this.cdr.markForCheck();
      },
    });
  }

  labelPessoa(d: Despesa): string {
    const p = d.pessoa?.trim();
    return p || '—';
  }

  labelNatureza(n: NaturezaDespesa): string {
    return n === 'fixa' ? 'Fixa' : 'Variável';
  }
}
