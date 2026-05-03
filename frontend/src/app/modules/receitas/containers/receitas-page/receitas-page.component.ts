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

  get receitasFixasPaginadas(): Receita[] {
    const all = this.receitasFixas;
    const start = (this.paginaFixas - 1) * this.tamanhoPagina;
    return all.slice(start, start + this.tamanhoPagina);
  }

  get receitasVariaveisPaginadas(): Receita[] {
    const all = this.receitasVariaveis;
    const start = (this.paginaVariaveis - 1) * this.tamanhoPagina;
    return all.slice(start, start + this.tamanhoPagina);
  }

  get totalPaginasFixas(): number {
    const n = this.receitasFixas.length;
    return n === 0 ? 0 : Math.ceil(n / this.tamanhoPagina);
  }

  get totalPaginasVariaveis(): number {
    const n = this.receitasVariaveis.length;
    return n === 0 ? 0 : Math.ceil(n / this.tamanhoPagina);
  }

  get exibindoDeFixas(): number {
    if (!this.receitasFixas.length) return 0;
    return (this.paginaFixas - 1) * this.tamanhoPagina + 1;
  }

  get exibindoAteFixas(): number {
    return (
      (this.paginaFixas - 1) * this.tamanhoPagina +
      this.receitasFixasPaginadas.length
    );
  }

  get exibindoDeVariaveis(): number {
    if (!this.receitasVariaveis.length) return 0;
    return (this.paginaVariaveis - 1) * this.tamanhoPagina + 1;
  }

  get exibindoAteVariaveis(): number {
    return (
      (this.paginaVariaveis - 1) * this.tamanhoPagina +
      this.receitasVariaveisPaginadas.length
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

  /** Garante página atual válida após mudar quantidade de linhas (ex.: excluir na última página). */
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

  /**
   * Atualiza lista e paginação após GET; OnPush + subscribe async precisa marcar CD explicitamente.
   */
  private aplicarResultadoCarregar(rows: Receita[], erro: string | null): void {
    this.receitas = [...rows];
    this.paginaFixas = 1;
    this.paginaVariaveis = 1;
    this.normalizarIndicesPagina();
    this.loading = false;
    this.erroCarregar = erro;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  get totalFixas(): number {
    return this.calcularTotalReceitas(this.receitasFixas);
  }

  get totalVariaveis(): number {
    return this.calcularTotalReceitas(this.receitasVariaveis);
  }

  get totalGeral(): number {
    return this.calcularTotalReceitas(this.receitas);
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
          this.aplicarResultadoCarregar(rows, null);
        },
        error: (e) => {
          this.log('carregar erro', e);
          this.aplicarResultadoCarregar(
            [],
            e?.error?.error ||
              e?.message ||
              'Não foi possível carregar receitas.',
          );
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

  calcularTotalReceitas(receitas: Receita[]): number {
    return receitas.reduce((total, r) => total + Number(r.valor) || 0, 0);
  }
}
