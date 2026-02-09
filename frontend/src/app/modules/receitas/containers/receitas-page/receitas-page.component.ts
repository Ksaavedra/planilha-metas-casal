import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ModalAdicionarUsuarioService } from '../../../../core/services/modal-adicionar-usuario.service';
import { ModalExcluirReceitaService } from '../../../../core/services/modal-excluir-receita.service';
import {
  ReceitaMensal,
  ReceitasMensaisService,
} from '../../../../core/services/receitas-mensais/receitas-mensais.service';

@Component({
  selector: 'app-receitas-page',
  templateUrl: './receitas-page.component.html',
  styleUrls: ['./receitas-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ReceitasPageComponent implements OnInit, OnDestroy {
  mesAtual: Date = new Date();
  receitasMensal: ReceitaMensal[] = [];
  loading = false;
  erroCarregar: string | null = null;

  private saveSubscription?: Subscription;
  private deleteSubscription?: Subscription;

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

  get nomeMesAtual(): string {
    const mes = this.mesAtual.getMonth();
    const ano = this.mesAtual.getFullYear();
    return `${this.meses[mes]} ${ano}`;
  }

  /** Cards por pessoa (dados da API): agrupa por nome ignorando maiúsculas. Ordem alfabética. */
  get cardsPorPessoa(): {
    nome: string;
    receitas: ReceitaMensal[];
    total: number;
  }[] {
    const map = new Map<string, { nome: string; receitas: ReceitaMensal[] }>();
    for (const r of this.receitasMensal) {
      const key = r.pessoa.trim().toLowerCase();
      if (!map.has(key)) {
        const nomeExibir = r.pessoa.trim();
        const nomeNormalizado =
          nomeExibir.charAt(0).toUpperCase() +
          nomeExibir.slice(1).toLowerCase();
        map.set(key, { nome: nomeNormalizado, receitas: [] });
      }
      map.get(key)!.receitas.push(r);
    }
    const nomesOrdenados = [...map.keys()].sort((a, b) => a.localeCompare(b));
    return nomesOrdenados.map((key) => {
      const { nome, receitas } = map.get(key)!;
      const total = receitas.reduce((s, r) => s + r.valor, 0);
      return { nome, receitas, total };
    });
  }

  get totalMensal(): number {
    return this.receitasMensal.reduce((s, r) => s + r.valor, 0);
  }

  constructor(
    private modalAdicionarUsuarioService: ModalAdicionarUsuarioService,
    private modalExcluirReceitaService: ModalExcluirReceitaService,
    private receitasMensaisService: ReceitasMensaisService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.carregarReceitasDoMes();
    this.saveSubscription = this.modalAdicionarUsuarioService.save$.subscribe(
      (data: {
        nomeUsuario: string;
        valorSalario: number;
        meses: number[];
        ano: number;
        receitaId?: number;
      }) => {
        if (data.receitaId != null) {
          this.atualizarReceita(
            data.receitaId,
            data.nomeUsuario,
            data.valorSalario,
          );
        } else {
          this.salvarUsuario(data);
        }
      },
    );

    this.deleteSubscription =
      this.modalExcluirReceitaService.confirmDelete$.subscribe((receitaId) => {
        this.receitasMensaisService.delete(receitaId).subscribe({
          next: () => {
            this.erroCarregar = null;
            this.modalExcluirReceitaService.openSuccess();
            this.carregarReceitasDoMes();
            this.receitasMensaisService.loadPessoasDistintas().subscribe();
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.erroCarregar = err?.error?.error || 'Erro ao excluir.';
            this.cdr.markForCheck();
          },
        });
      });
  }

  ngOnDestroy(): void {
    this.saveSubscription?.unsubscribe();
    this.deleteSubscription?.unsubscribe();
  }

  abrirModalAdicionarUsuario(): void {
    this.modalAdicionarUsuarioService.open();
  }

  salvarUsuario(data: {
    nomeUsuario: string;
    valorSalario: number;
    meses: number[];
    ano: number;
  }): void {
    this.loading = true;
    this.erroCarregar = null;
    this.cdr.markForCheck();

    this.receitasMensaisService
      .createSalariosParaUsuario(
        data.nomeUsuario,
        data.valorSalario,
        data.meses,
        data.ano,
      )
      .subscribe({
        next: () => {
          this.receitasMensaisService.addPessoaToCache(data.nomeUsuario);
          this.loading = false;
          this.carregarReceitasDoMes();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.erroCarregar = err?.error?.error || 'Erro ao salvar receitas.';
          this.cdr.markForCheck();
        },
      });
  }

  carregarReceitasDoMes(): void {
    const ano = this.mesAtual.getFullYear();
    const mes = this.mesAtual.getMonth() + 1;

    this.loading = true;
    this.erroCarregar = null;
    this.cdr.markForCheck();

    this.receitasMensaisService.getPorMesAno(ano, mes).subscribe({
      next: (lista) => {
        this.receitasMensal = lista;
        this.loading = false;
        this.erroCarregar = null;
        this.cdr.markForCheck();
        // Console: mostrar dados do mês
        // const nomeMes = this.meses[mes - 1];
        // console.log(`📅 Receitas – ${nomeMes} ${ano}`, {
        //   mes: mes,
        //   ano: ano,
        //   totalRegistros: lista.length,
        //   totalValor: lista.reduce((s, r) => s + r.valor, 0),
        //   dados: lista,
        // });
      },
      error: (err) => {
        this.receitasMensal = [];
        this.loading = false;
        this.erroCarregar = err?.error?.error || 'Erro ao carregar receitas.';
        this.cdr.markForCheck();
      },
    });
  }

  mesAnterior(): void {
    const d = new Date(this.mesAtual);
    d.setMonth(d.getMonth() - 1);
    this.mesAtual = d;
    this.carregarReceitasDoMes();
  }

  proximoMes(): void {
    const d = new Date(this.mesAtual);
    d.setMonth(d.getMonth() + 1);
    this.mesAtual = d;
    this.carregarReceitasDoMes();
  }

  onDateChange(event: { value?: Date }): void {
    if (event?.value) {
      this.mesAtual = event.value;
      this.carregarReceitasDoMes();
    }
  }

  editarReceita(receita: ReceitaMensal): void {
    if (receita.id == null) return;
    this.modalAdicionarUsuarioService.openForEdit({
      id: receita.id,
      pessoa: receita.pessoa,
      valor: receita.valor,
      ano: receita.ano,
      mes: receita.mes,
    });
  }

  private atualizarReceita(
    receitaId: number,
    nomeUsuario: string,
    valorSalario: number,
  ): void {
    this.loading = true;
    this.erroCarregar = null;
    this.cdr.markForCheck();
    this.receitasMensaisService
      .update(receitaId, {
        pessoa: nomeUsuario.trim(),
        valor: valorSalario,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.erroCarregar = null;
          this.carregarReceitasDoMes();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.erroCarregar = err?.error?.error || 'Erro ao atualizar.';
          this.cdr.markForCheck();
        },
      });
  }

  excluirReceita(receita: ReceitaMensal): void {
    if (!receita.id) return;
    this.modalExcluirReceitaService.openConfirm(receita);
  }
}
