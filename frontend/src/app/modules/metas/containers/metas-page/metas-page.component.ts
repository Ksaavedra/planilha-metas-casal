import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MetasService } from '../../../../core/services/metas/metas.service';
import { AdicionarMetaDialogComponent } from '../../components/adicionar-meta-dialog/adicionar-meta-dialog.component';
import { SuccessModalComponent } from 'shared/components/success-modal/success-modal.component';
import { Meta, MetaExtended } from '@core/interfaces/metas/mes-meta';
import { UpdateMetaRequest } from '@core/interfaces/metas/metas-modais';
import { ModalEdicao } from '@core/interfaces/metas/editar-modal';
import {
  finalizarMesesRestantesDaMeta,
  getValorRealizadoMeta,
  jaMostrouParabens,
  marcarParabensMostrado,
  metaEstaConcluida,
} from '@app/core/utils';
import { ParabensDialogComponent } from '../../components/parabens-dialog/parabens-dialog.component';
import {
  buildAnosComparacaoParaMetas,
  filtrarMesesPorAno,
  gerarMesesPlanejamento,
  mesesPadraoDoAno,
  mesesTotaisDoPlano,
  migrarMesesLegado,
  metaVisivelNoExercicio,
  ordenarNomesMeses,
  quantidadeMesesPlanejamento,
  regenerarMesesMeta,
} from '@core/utils/metas-meses.util';

type StatusMeta = 'Programado' | 'Pago' | 'Vazio' | 'Finalizado';

const ANO_REFERENCIA_MIN = 2020;

@Component({
  selector: 'app-metas-page',
  templateUrl: './metas-page.component.html',
  styleUrls: ['./metas-page.component.scss'],
  standalone: false,
})
export class MetasPageComponent implements OnInit {
  readonly tituloSecundario = 'Construindo sonhos juntos, passo a passo';

  private parabensDialogAberto = false;

  meses: string[] = [];
  modalEdicao: ModalEdicao = {
    meta: {} as MetaExtended,
    mesId: -1,
    valor: 0,
    isOpen: false,
  };

  metas: MetaExtended[] = [];
  carregandoMetas = false;
  percentualPagoView = 0;
  isProcessingEdit = false;
  totalValorMetaView = 0;
  totalValorPorMesView = 0;
  totalMesesNecessariosView = 0;
  totalValorAtualView = 0;
  totalContribuicoesView = 0;
  camposProcessados = new Set<string>();

  constructor(
    private metasService: MetasService,
    private dialog: MatDialog,
  ) {}

  anosComparacao: number[] = [];
  readonly anoAtual = new Date().getFullYear();

  anoSelecionado = this.metasService.getAnoSelecionado();

  get exibirAvisoAnoVazio(): boolean {
    return !this.carregandoMetas && this.metas.length === 0;
  }

  /** Cabeçalho: link rápido ao exercício atual (ex.: navegou para 2030). */
  get estaEmAnoFuturo(): boolean {
    return Number(this.anoSelecionado) > this.anoAtual;
  }

  /** Ano vazio diferente do calendário atual (ex.: 2024 sem metas → ir para 2026). */
  get exibirBotaoVoltarExercicioAtual(): boolean {
    return (
      this.exibirAvisoAnoVazio && Number(this.anoSelecionado) !== this.anoAtual
    );
  }

  /** Sem metas no ano: mostra só o aviso (layout do print). */
  get ocultarSecoesMetas(): boolean {
    return this.exibirAvisoAnoVazio;
  }

  get podeAnoAnterior(): boolean {
    const min = this.anosComparacao[0];
    return Number(this.anoSelecionado) > min;
  }

  /** Futuro livre: metas longas (ex.: carro em 100+ meses) podem ir além de qualquer teto fixo. */
  get podeProximoAno(): boolean {
    return true;
  }

  anoAnterior(): void {
    if (!this.podeAnoAnterior) {
      return;
    }
    this.anoSelecionado = Number(this.anoSelecionado) - 1;
    this.onAnoChange();
  }

  proximoAno(): void {
    this.anoSelecionado = Number(this.anoSelecionado) + 1;
    this.onAnoChange();
  }

  onAnoChange(): void {
    const ano = Number(this.anoSelecionado);
    if (!Number.isFinite(ano) || ano < ANO_REFERENCIA_MIN) {
      return;
    }
    this.anoSelecionado = ano;
    this.metasService.setAnoSelecionado(ano);
    this.limparMetasDoAno();
    this.carregarMetas();
  }

  private limparMetasDoAno(): void {
    this.metas = [];
    this.meses = mesesPadraoDoAno(this.anoSelecionado);
    this.recalcResumo();
  }

  irParaAno(ano: number): void {
    if (!Number.isFinite(ano) || Number(this.anoSelecionado) === ano) {
      return;
    }
    this.anoSelecionado = ano;
    this.metasService.setAnoSelecionado(ano);
    this.limparMetasDoAno();
    this.carregarMetas();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  voltarParaAnoAtual(): void {
    this.irParaAno(this.anoAtual);
  }

  ngOnInit(): void {
    this.anoSelecionado = this.clampAnoReferencia(
      this.metasService.getAnoSelecionado(),
    );
    this.anosComparacao = buildAnosComparacaoParaMetas([], this.anoAtual);
    this.metasService.setAnoSelecionado(this.anoSelecionado);
    this.carregarMetas();
  }

  private clampAnoReferencia(ano: number): number {
    if (!Number.isFinite(ano)) {
      return this.anoAtual;
    }
    return Math.max(ANO_REFERENCIA_MIN, Math.round(ano));
  }

  private carregarMetas(): void {
    const ano = Number(this.anoSelecionado);
    this.carregandoMetas = true;
    this.metasService.getMetas(ano).subscribe({
      next: (metas: Meta[]) => {
        this.aplicarMetasCarregadas(metas);
        this.carregandoMetas = false;
      },
      error: () => {
        this.limparMetasDoAno();
        this.carregandoMetas = false;
        alert('Não foi possível carregar as metas deste ano. Tente novamente.');
      },
    });
  }

  private aplicarMetasCarregadas(metas: Meta[]): void {
    const anoExercicio = Number(this.anoSelecionado);
    const metasValidas = metas.filter((meta) => {
      const idValido =
        meta.id && meta.id !== 0 && String(meta.id).trim() !== '';

      const nomeValido =
        meta.nome && meta.nome.trim().length > 0 && meta.nome !== 'undefined';

      const pertenceAoAno = this.metaPertenceAoExercicio(meta, anoExercicio);

      return idValido && nomeValido && pertenceAoAno;
    });

    this.metas = metasValidas.map((m) => {
      const metaExtended: MetaExtended = {
        ...m,
        id: m.id,
        valorMeta: this.toNum(m.valorMeta),
        valorPorMes: this.toNum(m.valorPorMes),
        valorAtual: this.toNum(m.valorAtual),
        mesesNecessarios: this.toNum(m.mesesNecessarios),
        editandoNome: false,
        nomeTemp: '',
        savingNome: false,
        savedTick: false,
        editandoValorMeta: false,
        editandoValorPorMes: false,
        editandoValorAtual: false,
        savedTickCampo: false,
        dropdownOpen: undefined,
      };
      migrarMesesLegado(metaExtended, metaExtended.ano ?? this.anoSelecionado);
      this.sincronizarMesesComPlanejamento(metaExtended);
      return metaExtended;
    });

    this.atualizarAnosComparacao();
    this.setHeaderMesesFromData();
    this.metas.forEach((m) => this.normalizeMeses(m));
    this.recalcResumo();
  }

  private atualizarAnosComparacao(): void {
    const selecionado = Number(this.anoSelecionado);
    this.anosComparacao = buildAnosComparacaoParaMetas(
      this.metas,
      this.anoAtual,
    );
    const fimLista =
      this.anosComparacao[this.anosComparacao.length - 1] ?? this.anoAtual;
    if (selecionado > fimLista) {
      const extras: number[] = [];
      for (let y = fimLista + 1; y <= selecionado; y++) {
        extras.push(y);
      }
      this.anosComparacao = [...this.anosComparacao, ...extras];
    }
  }

  /** Garante 18 parcelas (etc.) na memória para Executando, mesmo se o banco ainda tiver só 12. */
  private sincronizarMesesComPlanejamento(meta: MetaExtended): void {
    const qtd = quantidadeMesesPlanejamento(meta);
    const anoInicio = meta.ano ?? this.anoSelecionado;
    const atual = meta.meses?.length ?? 0;
    const precisaExpandir = qtd > atual;
    const semAnoNoNome = !(meta.meses ?? []).some((m) => m.nome.includes('/'));

    if (!precisaExpandir && !semAnoNoNome) {
      return;
    }

    meta.meses = regenerarMesesMeta(
      meta,
      anoInicio,
      Math.max(qtd, 12),
      Number(meta.valorPorMes) || 0,
    );
  }

  private metaPertenceAoExercicio(meta: Meta, anoExercicio: number): boolean {
    return metaVisivelNoExercicio(meta, anoExercicio, this.anoAtual);
  }

  private comAnoDoExercicio(
    meta: MetaExtended,
    patch: UpdateMetaRequest,
  ): UpdateMetaRequest {
    if (meta.ano == null || meta.ano === undefined) {
      return { ...patch, ano: Number(this.anoSelecionado) };
    }
    return patch;
  }

  abrirModalAdicionarMeta(): void {
    if (this.metas.length >= 15) return;

    const ref = this.dialog.open(AdicionarMetaDialogComponent, {
      width: 'min(520px, 96vw)',
      maxHeight: '90vh',
      autoFocus: 'dialog',
      restoreFocus: true,
    });

    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.reloadMetas();
        this.dialog.open(SuccessModalComponent, {
          width: 'min(420px, 96vw)',
          data: {
            title: 'Meta adicionada!',
            message: 'Sua meta foi criada com sucesso.',
            confirmText: 'OK',
          },
        });
      }
    });
  }

  reloadMetas(): void {
    const savedTickStates = new Map<string | number, boolean>();
    this.metas.forEach((meta) => {
      if (meta.savedTickCampo && meta.id) {
        savedTickStates.set(meta.id, true);
      }
    });

    const anoExercicio = Number(this.anoSelecionado);
    this.metasService.getMetas(anoExercicio).subscribe((metas: Meta[]) => {
      const metasValidas = metas.filter((meta) => {
        const idValido =
          meta.id && meta.id !== 0 && String(meta.id).trim() !== '';
        const nomeValido =
          meta.nome && meta.nome.trim().length > 0 && meta.nome !== 'undefined';
        const pertenceAoAno = this.metaPertenceAoExercicio(meta, anoExercicio);
        return idValido && nomeValido && pertenceAoAno;
      });

      this.metas = metasValidas.map((m) => {
        const shouldPreserveTick = savedTickStates.has(m.id);
        const savedTickValue = shouldPreserveTick
          ? savedTickStates.get(m.id)
          : false;

        const metaExtended: MetaExtended = {
          ...m,
          id: m.id,
          valorMeta: this.toNum(m.valorMeta),
          valorPorMes: this.toNum(m.valorPorMes),
          valorAtual: this.toNum(m.valorAtual),
          mesesNecessarios: this.toNum(m.mesesNecessarios),
          icon: m.icon || 'bi-bullseye',
          meses: m.meses ? [...m.meses] : [],
          editandoNome: false,
          nomeTemp: '',
          savingNome: false,
          savedTick: false,
          editandoValorMeta: false,
          editandoValorPorMes: false,
          editandoValorAtual: false,
          savedTickCampo: savedTickValue || false,
          dropdownOpen: undefined,
        };

        if (shouldPreserveTick && savedTickValue) {
          setTimeout(() => {
            const currentMeta = this.metas.find(
              (meta) => String(meta.id) === String(m.id),
            );
            if (currentMeta) {
              currentMeta.savedTickCampo = false;
            }
          }, 5000);
        }

        migrarMesesLegado(
          metaExtended,
          metaExtended.ano ?? this.anoSelecionado,
        );
        this.sincronizarMesesComPlanejamento(metaExtended);
        return metaExtended;
      });

      this.atualizarAnosComparacao();
      this.setHeaderMesesFromData();
      this.metas.forEach((m) => this.normalizeMeses(m));
      this.recalcResumo();
    });
  }

  private processarMetaConcluida(
    meta: MetaExtended,
    acabouDeConcluir: boolean,
  ): void {
    if (!metaEstaConcluida(meta)) return;

    if (acabouDeConcluir) {
      this.abrirParabens(meta, true);
    }

    if (!finalizarMesesRestantesDaMeta(meta)) return;

    this.metasService
      .updateMeta(meta.id, {
        meses: meta.meses.map((m) => ({ ...m })),
        mesesNecessarios: 0,
      })
      .subscribe();
  }

  private abrirParabens(meta: MetaExtended, acabouDeConcluir = false): void {
    if (!metaEstaConcluida(meta)) return;
    if (!acabouDeConcluir && jaMostrouParabens(meta.id)) return;
    if (this.parabensDialogAberto) return;

    this.parabensDialogAberto = true;

    setTimeout(() => {
      const ref = this.dialog.open(ParabensDialogComponent, {
        width: 'min(520px, 96vw)',
        maxWidth: '96vw',
        panelClass: 'parabens-dialog-panel',
        disableClose: false,
        data: {
          metaNome: meta.nome,
          valorMeta: meta.valorMeta,
          valorRealizado: getValorRealizadoMeta(meta),
        },
      });

      ref.afterClosed().subscribe(() => {
        marcarParabensMostrado(meta.id);
        this.parabensDialogAberto = false;
      });
    }, 0);
  }

  private toNum(v: any): number {
    return typeof v === 'number' ? v : Number(v ?? 0) || 0;
  }

  setHeaderMesesFromData(): void {
    const todosNomes = this.metas.flatMap(
      (m) => m.meses?.map((x) => x.nome) ?? [],
    );
    const doAno = filtrarMesesPorAno(
      todosNomes,
      this.anoSelecionado,
      this.anoSelecionado,
    );
    const ordenados = ordenarNomesMeses(doAno, this.anoSelecionado);
    this.meses = ordenados.length
      ? ordenados
      : mesesPadraoDoAno(this.anoSelecionado);
  }

  private normalizeMeses(meta: MetaExtended): void {
    const header = this.meses.length
      ? this.meses
      : mesesPadraoDoAno(this.anoSelecionado);
    const byName = new Map((meta.meses ?? []).map((m) => [m.nome, m]));
    meta.meses = header.map(
      (nome, i) =>
        byName.get(nome) ?? { id: i + 1, nome, valor: 0, status: 'Vazio' },
    );
  }

  private recalcResumo(): void {
    this.totalValorMetaView = this.metas.reduce(
      (t, m) => t + (Number(m.valorMeta) || 0),
      0,
    );

    this.totalValorPorMesView = this.metas.reduce(
      (t, m) => t + (Number(m.valorPorMes) || 0),
      0,
    );

    this.totalMesesNecessariosView = this.metas.reduce(
      (t, m) => t + mesesTotaisDoPlano(m),
      0,
    );

    this.totalValorAtualView = this.metas.reduce(
      (t, m) => t + (Number(m.valorAtual) || 0),
      0,
    );

    this.totalContribuicoesView = this.metas.reduce(
      (total, meta) => total + this.getTotalContribuicoesMeta(meta as any),
      0,
    );

    const totalRealizado = this.metas.reduce((t, m) => {
      const valorAtual = Number(m.valorAtual) || 0;
      const valorPago = (m.meses ?? [])
        .filter((x) => x.status === 'Pago')
        .reduce((s, x) => s + (Number(x.valor) || 0), 0);
      return t + valorAtual + valorPago;
    }, 0);

    this.percentualPagoView =
      this.totalValorMetaView > 0
        ? Number(((totalRealizado * 100) / this.totalValorMetaView).toFixed(2))
        : 0;
  }

  getTotalContribuicoesMeta(meta: Meta): number {
    if (!meta.meses) return 0;
    return meta.meses.reduce((total, mes) => total + mes.valor, 0);
  }

  getProgressoRealMeta(meta: MetaExtended): number {
    const valorMeta = Number(meta.valorMeta) || 0;
    if (valorMeta <= 0) return 0;

    const valorAtual = Number(meta.valorAtual) || 0;
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + (Number(x.valor) || 0), 0);

    const totalRealizado = valorAtual + valorPago;
    return Number(((totalRealizado * 100) / valorMeta).toFixed(2));
  }

  getValorFaltanteMeta(meta: MetaExtended): number {
    const valorMeta = Number(meta.valorMeta) || 0;
    const valorAtual = Number(meta.valorAtual) || 0;
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + (Number(x.valor) || 0), 0);

    const totalRealizado = valorAtual + valorPago;
    return Math.max(0, valorMeta - totalRealizado);
  }

  getValorRealizadoMeta(meta: MetaExtended): number {
    const valorAtual = Number(meta.valorAtual) || 0;
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + (Number(x.valor) || 0), 0);

    return valorAtual + valorPago;
  }

  adicionarMeta(): void {
    if (this.metas.length >= 15) return;

    const proximoNumero = this.metas.length + 1;
    const nomePadrao = `Sua ${proximoNumero}ª Meta aqui`;

    const body = {
      ano: this.anoSelecionado,
      nome: nomePadrao,
      valorMeta: 0,
      valorPorMes: 0,
      mesesNecessarios: 0,
      valorAtual: 0,
      meses: gerarMesesPlanejamento(this.anoSelecionado, 12, 0),
    };

    this.metasService.createMeta(body).subscribe({
      next: (_created) => {
        this.reloadMetas();
      },
      error: (_e) => {
        alert('Erro ao criar meta. Tente novamente.');
      },
    });
  }

  onConfirmarCampo(event: {
    meta: MetaExtended;
    campo: 'nome' | 'valorMeta' | 'valorPorMes' | 'valorAtual';
    withEvent?: Event;
  }): void {
    if (event.withEvent) {
      this.confirmarCampoComValor(event.meta, event.campo, event.withEvent);
    } else {
      this.confirmarCampo(event.meta, event.campo);
    }
  }

  confirmarCampoComValor(
    meta: MetaExtended,
    campo: 'valorMeta' | 'valorPorMes' | 'valorAtual' | 'nome',
    ev: Event,
  ) {
    ev.preventDefault();
    ev.stopPropagation();

    const chave = `${meta.id}-${campo}`;
    this.camposProcessados.add(chave);

    this.confirmarCampo(meta, campo);
  }

  confirmarCampo(
    meta: MetaExtended,
    campo: 'valorMeta' | 'valorPorMes' | 'valorAtual' | 'nome',
  ) {
    if (!meta.id || String(meta.id).trim() === '') {
      alert('Erro: Meta sem ID válido. Recarregue a página e tente novamente.');
      return;
    }

    const flag = `editando${campo.charAt(0).toUpperCase() + campo.slice(1)}` as
      | 'editandoNome'
      | 'editandoValorMeta'
      | 'editandoValorPorMes'
      | 'editandoValorAtual';

    const tempKey = `${campo}Temp` as
      | 'nomeTemp'
      | 'valorMetaTemp'
      | 'valorPorMesTemp'
      | 'valorAtualTemp';

    const tempVal = (meta as any)[tempKey];

    if (campo === 'nome') {
      const novoNome = String(tempVal ?? '').trim();
      if (!novoNome || novoNome === meta.nome) {
        this.cancelarCampo(meta, 'nome');
        return;
      }

      meta.nome = novoNome;

      this.metasService
        .updateMeta(meta.id, this.comAnoDoExercicio(meta, { nome: novoNome }))
        .subscribe({
          next: () => {
            meta.savedTickCampo = true;
            setTimeout(() => (meta.savedTickCampo = false), 1200);
            this.reloadMetas();
          },
          error: (_e) => {
            alert('Erro ao salvar. Tente novamente.');
          },
        });

      (meta as any)[flag] = false;
      (meta as any)[tempKey] = undefined;
      return;
    }

    const novo = this.parseNumeroBR(tempVal);
    const atual = Number((meta as any)[campo]) || 0;

    if (novo === atual) {
      this.cancelarCampo(meta, campo);
      return;
    }

    const estavaConcluida = metaEstaConcluida(meta);

    (meta as any)[campo] = novo;
    this.recalcResumo();
    this.processarMetaConcluida(
      meta,
      !estavaConcluida && metaEstaConcluida(meta),
    );

    const patch: UpdateMetaRequest = { [campo]: novo };
    const anoInicio = meta.ano ?? this.anoSelecionado;

    if (campo === 'valorPorMes') {
      const mesesNecessarios =
        novo > 0 ? Math.ceil((meta.valorMeta || 0) / novo) : 0;
      patch.mesesNecessarios = mesesNecessarios;
      if (mesesNecessarios > 0) {
        patch.meses = regenerarMesesMeta(
          meta,
          anoInicio,
          mesesNecessarios,
          novo,
        );
      }
    }

    if (campo === 'valorMeta' && meta.valorPorMes > 0) {
      const mesesNecessarios = Math.ceil(novo / meta.valorPorMes);
      patch.mesesNecessarios = mesesNecessarios;
      patch.meses = regenerarMesesMeta(
        meta,
        anoInicio,
        mesesNecessarios,
        meta.valorPorMes,
      );
    }

    this.metasService
      .updateMeta(meta.id, this.comAnoDoExercicio(meta, patch))
      .subscribe({
        next: () => {
          meta.savedTickCampo = true;
          setTimeout(() => (meta.savedTickCampo = false), 1200);
          this.recalcResumo();
          this.reloadMetas();
        },
        error: (_e) => {
          alert('Erro ao salvar. Tente novamente.');
        },
      });

    (meta as any)[flag] = false;
    (meta as any)[tempKey] = undefined;
  }

  cancelarCampo(
    meta: MetaExtended,
    campo: 'valorMeta' | 'valorPorMes' | 'valorAtual' | 'nome',
  ) {
    const flag = `editando${campo.charAt(0).toUpperCase() + campo.slice(1)}` as
      | 'editandoNome'
      | 'editandoValorMeta'
      | 'editandoValorPorMes'
      | 'editandoValorAtual';
    const temp = `${campo}Temp` as
      | 'nomeTemp'
      | 'valorMetaTemp'
      | 'valorPorMesTemp'
      | 'valorAtualTemp';

    (meta as any)[flag] = false;
    (meta as any)[temp] = undefined;
  }

  private parseNumeroBR(v: any): number {
    if (v === null || v === undefined) return 0;

    let s = String(v).trim();
    if (!s) return 0;

    s = s.replace(/\s+/g, '').replace(/[^\d.,-]+/g, '');

    if (s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      const parts = s.split('.');
      if (parts.length > 2) {
        const dec = parts.pop();
        s = parts.join('') + '.' + dec;
      }
    }

    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }

  removerMeta(id: any): void {
    this.metasService.deleteMeta(id).subscribe({
      next: () => {
        this.reloadMetas();
      },
    });
  }

  onAlterarStatus(e: {
    metaId: number | string;
    mesId: number;
    status: StatusMeta;
  }) {
    const meta = this.metas.find((m) => String(m.id) === String(e.metaId));
    if (!meta) return;
    const mes = meta.meses.find((m) => m.id === e.mesId);
    if (!mes) return;

    mes.status = e.status;
    this.recalcResumo();

    const deveParabenizar = e.status === 'Pago' && metaEstaConcluida(meta);
    if (deveParabenizar) {
      this.processarMetaConcluida(meta, true);
    } else if (metaEstaConcluida(meta)) {
      this.processarMetaConcluida(meta, false);
    }

    this.metasService
      .updateMeta(meta.id, { meses: meta.meses.map((m) => ({ ...m })) })
      .subscribe(() => this.recalcResumo());
  }

  onSalvarValorMes(e: {
    metaId: number | string;
    mesId: number;
    valor: number;
  }) {
    const meta = this.metas.find((m) => String(m.id) === String(e.metaId));
    if (!meta) return;
    const i = meta.meses.findIndex((m) => m.id === e.mesId);
    if (i < 0) return;

    const estavaConcluida = metaEstaConcluida(meta);
    meta.meses[i].valor = e.valor;
    meta.meses[i].status = e.valor > 0 ? 'Programado' : 'Vazio';
    this.recalcResumo();
    this.processarMetaConcluida(
      meta,
      !estavaConcluida && metaEstaConcluida(meta),
    );

    this.metasService
      .updateMeta(meta.id, { meses: meta.meses.map((m) => ({ ...m })) })
      .subscribe(() => this.recalcResumo());
  }

  onMetaCompleta(event: {
    metaId: string | number;
    metaNome: string;
    valorMeta: number;
  }): void {
    const meta = this.metas.find((m) => String(m.id) === String(event.metaId));
    if (meta) {
      this.processarMetaConcluida(meta, true);
    }
  }
}
