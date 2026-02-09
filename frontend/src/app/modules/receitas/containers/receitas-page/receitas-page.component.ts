import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  CategoriaReceita,
  ReceitaMensal,
  TipoReceita,
} from '../../../../core/interfaces/receitas';
import { ReceitasService } from '../../../../core/services/receitas/receitas.service';

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
      const pessoa = r.pessoa.trim();
      if (!pessoa) continue;
      const key = pessoa.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { nome: this.toTitleCase(pessoa), receitas: [] });
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
    private receitasService: ReceitasService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.carregarReceitasDoMes();
    this.saveSubscription = this.receitasService.save$.subscribe(
      (data: {
        nomeUsuario: string;
        valorSalario: number;
        tipo: TipoReceita;
        categoria: CategoriaReceita;
        meses: number[];
        ano: number;
        receitaId?: number;
      }) => {
        if (data.receitaId != null) {
          this.atualizarReceita(
            data.receitaId,
            data.nomeUsuario,
            data.valorSalario,
            data.tipo,
            data.categoria,
          );
        } else {
          this.salvarUsuario(data);
        }
      },
    );

    this.deleteSubscription = this.receitasService.confirmDelete$.subscribe(
      (receitaId) => {
        this.receitasService.delete(receitaId).subscribe({
          next: () => {
            this.erroCarregar = null;
            this.receitasService.openSuccess();
            this.carregarReceitasDoMes();
            this.receitasService.loadPessoasDistintas().subscribe();
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.erroCarregar = err?.error?.error || 'Erro ao excluir.';
            this.cdr.markForCheck();
          },
        });
      },
    );
  }

  ngOnDestroy(): void {
    this.saveSubscription?.unsubscribe();
    this.deleteSubscription?.unsubscribe();
  }

  private toTitleCase(value: string): string {
    if (!value || !value.trim()) return value;
    return value
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  abrirModalAdicionarUsuario(): void {
    this.receitasService.open();
  }

  salvarUsuario(data: {
    nomeUsuario: string;
    valorSalario: number;
    tipo: TipoReceita;
    categoria: CategoriaReceita;
    meses: number[];
    ano: number;
  }): void {
    this.loading = true;
    this.erroCarregar = null;
    this.cdr.markForCheck();

    this.receitasService
      .createReceitasParaUsuario(
        data.nomeUsuario,
        data.valorSalario,
        data.tipo,
        data.categoria,
        data.meses,
        data.ano,
      )
      .subscribe({
        next: () => {
          this.receitasService.addPessoaToCache(data.nomeUsuario);
          this.receitasService.loadPessoasDistintas().subscribe();
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

    this.receitasService.getPorMesAno(ano, mes).subscribe({
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
    this.receitasService.openForEdit({
      id: receita.id,
      pessoa: receita.pessoa,
      valor: receita.valor,
      tipo: receita.tipo,
      categoria: receita.categoria,
      ano: receita.ano,
      mes: receita.mes,
    });
  }

  atualizarReceita(
    receitaId: number,
    nomeUsuario: string,
    valorSalario: number,
    tipo: TipoReceita,
    categoria: CategoriaReceita,
  ): void {
    this.loading = true;
    this.erroCarregar = null;
    this.cdr.markForCheck();
    this.receitasService
      .update(receitaId, {
        pessoa: nomeUsuario.trim(),
        valor: valorSalario,
        tipo,
        categoria,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.erroCarregar = null;
          this.receitasService.loadPessoasDistintas().subscribe();
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
    this.receitasService.openConfirm(receita);
  }
}
