import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AdicionarReceitaDialogComponent,
  AdicionarReceitaDialogData,
} from '../../components/adicionar-receita-dialog/adicionar-receita-dialog.component';
import { ConfirmModalComponent } from 'app/shared/components/confirm-modal/confirm-modal.component';
import { ReceitasService } from 'app/core/services/receitas/receitas.service';
import {
  Receita,
  NaturezaReceita,
} from '@app/core/interfaces/receitas/receitas';
import { SuccessModalComponent } from '@app/shared/components/success-modal/success-modal.component';

@Component({
  selector: 'app-receitas-page',
  templateUrl: './receitas-page.component.html',
  styleUrls: ['./receitas-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ReceitasPageComponent implements OnInit {
  readonly tituloSecundario = 'Acompanhem tudo o que entra e construam juntos.';

  visaoReceitas: 'lista' | 'exemplos' | 'usuario' = 'lista';
  mesAtual: Date = new Date();
  receitas: Receita[] = [];
  loading = false;
  erroCarregar: string | null = null;
  confirmExcluirOpen = false;
  receitaParaExcluir: Receita | null = null;

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
    private receitasService: ReceitasService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
  ) {}

  private log(acao: string, payload?: unknown): void {
    if (payload === undefined) {
      console.log(`[ReceitasPage] ${acao}`);
      return;
    }
    console.log(`[ReceitasPage] ${acao}`, payload);
  }

  get nomeMesAtual(): string {
    const mes = this.mesAtual.getMonth();
    const ano = this.mesAtual.getFullYear();
    return `${this.meses[mes]} ${ano}`;
  }

  get receitasFixas(): Receita[] {
    return this.receitas.filter((r) => r.natureza === 'fixa');
  }

  get receitasVariaveis(): Receita[] {
    return this.receitas.filter((r) => r.natureza === 'variavel');
  }

  get totalFixas(): number {
    return this.receitasService.calcularTotalReceitas(this.receitasFixas);
  }

  get totalVariaveis(): number {
    return this.receitasService.calcularTotalReceitas(this.receitasVariaveis);
  }

  get totalGeral(): number {
    return this.receitasService.calcularTotalReceitas(this.receitas);
  }

  get anoRef(): number {
    return this.mesAtual.getFullYear();
  }

  get mesRef(): number {
    return this.mesAtual.getMonth() + 1;
  }

  ngOnInit(): void {
    this.log('ngOnInit');
    this.carregar();
  }

  mesAnterior(): void {
    const r = new Date(this.mesAtual);
    r.setMonth(r.getMonth() - 1);
    this.mesAtual = r;
    this.log('mesAnterior', { ano: this.anoRef, mes: this.mesRef });
    this.carregar();
  }

  proximoMes(): void {
    const r = new Date(this.mesAtual);
    r.setMonth(r.getMonth() + 1);
    this.mesAtual = r;
    this.log('proximoMes', { ano: this.anoRef, mes: this.mesRef });
    this.carregar();
  }

  selecionarVisao(visao: 'lista' | 'exemplos' | 'usuario'): void {
    this.visaoReceitas = visao;
    this.log('selecionarVisao', { visao });
    this.cdr.markForCheck();
  }

  abrirModalAdicionarReceita(): void {
    this.log('abrirModalAdicionarReceita');
    this.abrirDialogReceita(null);
  }

  editar(r: Receita): void {
    this.log('editar', r);
    this.abrirDialogReceita(r);
  }

  private abrirDialogReceita(receita: Receita | null): void {
    this.log('abrirDialogReceita', receita);
    const ref = this.abrirDialog(receita);
    ref.afterClosed().subscribe((saved) => {
      this.log('dialogFechado', { saved });
      if (saved) {
        this.porSalvarReceita(receita);
      }
    });
  }

  private abrirDialog(receita: Receita | null) {
    const data: AdicionarReceitaDialogData = {
      receita,
      ano: this.anoRef,
      mes: this.mesRef,
    };
    this.log('abrirDialog payload', data);
    return this.dialog.open(AdicionarReceitaDialogComponent, {
      width: 'min(520px, 96vw)',
      maxHeight: '90vh',
      data,
      autoFocus: 'dialog',
      restoreFocus: true,
    });
  }

  private porSalvarReceita(receita: Receita | null): void {
    this.log('porSalvarReceita', receita);
    this.carregar();

    const isEdicao = receita != null;

    this.abrirModalSucesso(isEdicao);

    this.cdr.markForCheck();
  }

  private abrirModalSucesso(isEdicao: boolean): void {
    this.log('abrirModalSucesso', { isEdicao });
    this.dialog.open(SuccessModalComponent, {
      width: 'min(520px, 96vw)',
      maxHeight: '90vh',
      data: {
        title: isEdicao ? 'Receita atualizada!' : 'Receita adicionada!',
        message: isEdicao
          ? 'A receita foi atualizada com sucesso.'
          : 'A receita foi adicionada com sucesso.',
        confirmText: 'OK',
      },
    });
  }

  carregar(): void {
    this.log('carregar inicio', { ano: this.anoRef, mes: this.mesRef });
    this.loading = true;
    this.erroCarregar = null;
    this.cdr.markForCheck();

    this.receitasService
      .getReceitas({ ano: this.anoRef, mes: this.mesRef })
      .subscribe({
        next: (rows) => {
          this.log('carregar sucesso', { total: rows.length, rows });
          this.receitas = [...rows];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.log('carregar erro', e);
          this.receitas = [];
          this.loading = false;
          this.erroCarregar =
            e?.error?.error ||
            e?.message ||
            'Não foi possível carregar receitas.';
          this.cdr.markForCheck();
        },
      });
  }

  abrirConfirmExcluir(r: Receita): void {
    this.log('abrirConfirmExcluir', r);
    const ref = this.dialog.open(ConfirmModalComponent, {
      width: 'min(520px, 96vw)',
      maxHeight: '90vh',
      data: {
        title: 'Excluir receita',
        message: `Tem certeza que deseja excluir "${r.categoria}" no valor de ${this.formatarValor(r.valor)}?`,
        confirmText: 'Sim, excluir',
        cancelText: 'Cancelar',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      this.log('confirmExcluir resultado', { confirmed, id: r.id });
      if (confirmed) {
        this.receitasService.deleteReceita(r.id).subscribe({
          next: () => {
            this.log('excluir sucesso', { id: r.id });
            this.carregar();
            this.dialog.open(SuccessModalComponent, {
              width: 'min(520px, 96vw)',
              maxHeight: '90vh',
              data: {
                title: 'Receita excluída',
                message: 'A receita foi excluída com sucesso.',
                confirmText: 'OK',
              },
            });
            this.cdr.markForCheck();
          },
          error: (e) => {
            this.log('excluir erro', e);
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

  labelPessoa(r: Receita): string {
    const p = r.pessoa?.trim();
    return p || '—';
  }

  labelNatureza(n: NaturezaReceita): string {
    return n === 'fixa' ? 'Fixa' : 'Variável';
  }
}
