import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
} from '@angular/core';
import { Meta, MetaExtended } from '../../../../../core/interfaces/metas/mes-meta';
import { MetasService } from '../../../../../core/services/metas/metas.service';
import { Subscription } from 'rxjs';
import {
  getValorFaltanteMeta as calcularValorFaltante,
  getValorRealizadoMeta as calcularValorRealizado,
  metaEstaConcluida,
} from '@core/interfaces/metas/metas-parabens';

@Component({
  selector: 'app-elaborando-metas',
  templateUrl: './elaborando-metas.component.html',
  styleUrls: ['./elaborando-metas.component.scss'],
  standalone: false,
})
export class ElaborandoMetasComponent implements OnDestroy {
  @Input() metas: MetaExtended[] = [];
  @Input() percentualPagoView = 0;
  @Input() totalValorMetaView = 0;
  @Input() totalValorPorMesView = 0;
  @Input() totalMesesNecessariosView = 0;
  @Input() totalValorAtualView = 0;
  @Input() totalContribuicoesView = 0;
  @Output() editar = new EventEmitter<{
    meta: MetaExtended;
    campo: 'nome' | 'valorMeta' | 'valorPorMes' | 'valorAtual';
  }>();
  @Output() cancelar = new EventEmitter<{
    meta: MetaExtended;
    campo: 'nome' | 'valorMeta' | 'valorPorMes' | 'valorAtual';
  }>();
  @Output() confirmar = new EventEmitter<{
    meta: MetaExtended;
    campo: 'nome' | 'valorMeta' | 'valorPorMes' | 'valorAtual';
    withEvent?: Event;
  }>();
  @Output() remover = new EventEmitter<number>();
  // @Output() abrirEditarNome = new EventEmitter<MetaExtended>();
  @Output() metasAtualizadas = new EventEmitter<void>();
  camposProcessados = new Set<string>();
  modalSucessoAdd = { isOpen: false };
  modalSucessoDelete = { isOpen: false };
  modalConfirmarDelete = { isOpen: false };
  metaParaExcluir: any = null;

  trackById = (_: number, m: MetaExtended) => m.id;

  private confirmDeleteSubscription?: Subscription;

  constructor(private metasService: MetasService) {
    this.confirmDeleteSubscription = this.metasService.confirmDelete$.subscribe(
      (metaId) => {
        this.processarExclusao(metaId);
      },
    );
  }

  ngOnDestroy(): void {
    this.confirmDeleteSubscription?.unsubscribe();
  }

  // Métodos para edição de campos da Seção 1
  editarCampo(
    meta: MetaExtended,
    campo: 'nome' | 'valorMeta' | 'valorPorMes' | 'valorAtual',
  ): void {
    // Limpar estado anterior
    this.limparEstadosEdicao(meta);

    // Configurar edição do campo específico
    switch (campo) {
      case 'nome':
        meta.editandoNome = true;
        meta.nomeTemp = meta.nome || '';
        break;
      case 'valorMeta':
        meta.editandoValorMeta = true;
        meta.valorMetaTemp = meta.valorMeta?.toString() || '0';
        break;
      case 'valorPorMes':
        meta.editandoValorPorMes = true;
        meta.valorPorMesTemp = meta.valorPorMes?.toString() || '0';
        break;
      case 'valorAtual':
        meta.editandoValorAtual = true;
        meta.valorAtualTemp = meta.valorAtual?.toString() || '0';
        break;
    }
  }

  removerMeta(id: any): void {
    const meta = this.metas.find((m) => String(m.id) === String(id));
    if (!meta) {
      alert('Meta não encontrada.');
      return;
    }

    // Abrir modal de confirmação através do serviço
    this.metaParaExcluir = meta;
    this.metasService.openConfirmarDelete(meta.id, meta.nome || '');
  }

  processarExclusao(metaId: number): void {
    const meta = this.metas.find((m) => String(m.id) === String(metaId));
    if (!meta) {
      alert('Meta não encontrada.');
      return;
    }

    const id = meta.id;
    this.metaParaExcluir = null;

    // Se a meta tem nome vazio, provavelmente não existe no servidor
    if (!meta.nome || meta.nome.trim() === '') {
      this.metas = this.metas.filter((m) => String(m.id) !== String(id));
      this.recalcResumo();
      this.metasAtualizadas.emit();
      this.metasService.showSucessoDelete();
      return;
    }

    if (meta._draft) {
      // não existe no servidor: só remove da lista
      this.metas = this.metas.filter((m) => m !== meta);
      this.recalcResumo();
      this.metasAtualizadas.emit();
      this.metasService.showSucessoDelete();
      return;
    }

    // existe no servidor: chama DELETE
    this.metasService.deleteMeta(id).subscribe({
      next: () => {
        this.metasAtualizadas.emit();
        this.metasService.showSucessoDelete();
      },
      error: (e) => {
        // Se for 404, a meta não existe no servidor, então remove da lista local
        if (e.status === 404) {
          this.metas = this.metas.filter((m) => String(m.id) !== String(id));
          this.recalcResumo();
          this.metasAtualizadas.emit();
          this.metasService.showSucessoDelete();
        } else {
          alert('Não foi possível excluir. Tente novamente.');
        }
      },
    });
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

  private limparEstadosEdicao(meta: MetaExtended): void {
    meta.editandoNome = false;
    meta.editandoValorMeta = false;
    meta.editandoValorPorMes = false;
    meta.editandoValorAtual = false;
    meta.nomeTemp = '';
    meta.valorMetaTemp = '';
    meta.valorPorMesTemp = '';
    meta.valorAtualTemp = '';
  }

  // Método para confirmar campo com evento (como no metas-page original)
  confirmarCampoComValor(
    meta: MetaExtended,
    campo: 'nome' | 'valorMeta' | 'valorPorMes' | 'valorAtual',
    ev: Event,
  ) {
    ev.preventDefault();
    ev.stopPropagation();
    // Emitir evento para o pai
    const chave = `${meta.id}-${campo}`;
    this.camposProcessados.add(chave);
    this.confirmarCampo(meta, campo);
  }

  // Método para confirmar campo no blur (como no metas-page original)
  confirmarCampoBlur(
    meta: MetaExtended,
    campo: 'nome' | 'valorMeta' | 'valorPorMes' | 'valorAtual',
  ): void {
    const chave = `${meta.id}-${campo}`;

    if (this.camposProcessados.has(chave)) {
      this.camposProcessados.delete(chave);
      return;
    }
    // Emitir evento para o pai
    this.confirmarCampo(meta, campo);
  }

  // Métodos utilitários para formatação
  parseNumeroBR(valor: string): number {
    if (!valor || valor.trim() === '') return 0;

    // Remove todos os caracteres exceto números, vírgula e ponto
    let limpo = String(valor)
      .trim()
      .replace(/[^\d,\.]/g, '');

    if (!limpo) return 0;

    // Se tem vírgula, trata vírgula como separador decimal
    if (limpo.includes(',')) {
      // Remove pontos de milhar (se houver)
      limpo = limpo.replace(/\./g, '');
      // Substitui vírgula por ponto para parseFloat
      limpo = limpo.replace(',', '.');
      const resultado = parseFloat(limpo);
      return isNaN(resultado) ? 0 : resultado;
    }

    // Se só tem ponto, precisa verificar se é separador de milhar ou decimal
    if (limpo.includes('.')) {
      const partes = limpo.split('.');
      // Se tem mais de 2 partes, assume que o último ponto é decimal
      if (partes.length > 2) {
        const decimal = partes.pop();
        limpo = partes.join('') + '.' + decimal;
      }
      const resultado = parseFloat(limpo);
      return isNaN(resultado) ? 0 : resultado;
    }

    // Se não tem vírgula nem ponto, é só número
    return parseFloat(limpo);
  }

  formatBR(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  toNum(valor: any): number {
    if (valor === null || valor === undefined || valor === '') return 0;
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') {
      const num = parseFloat(valor.replace(/[^\d,.-]/g, '').replace(',', '.'));
      return isNaN(num) ? 0 : num;
    }
    return 0;
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
      this.confirmarCampoNome(meta, tempVal);
    } else {
      this.confirmarCampoNumerico(meta, campo, tempVal);
    }

    (meta as any)[flag] = false;
    (meta as any)[tempKey] = undefined;
  }

  private confirmarCampoNome(meta: MetaExtended, tempVal: any): void {
    const novoNome = String(tempVal ?? '').trim();
    if (!novoNome || novoNome === meta.nome) {
      this.cancelarCampo(meta, 'nome');
      return;
    }

    meta.nome = novoNome;

    this.metasService.updateMeta(meta.id, { nome: novoNome }).subscribe({
      next: () => this.onUpdateMetaSuccessNome(meta),
      error: () => this.onUpdateMetaError(),
    });
  }

  private onUpdateMetaSuccessNome(meta: MetaExtended): void {
    meta.savedTickCampo = true;
    setTimeout(() => (meta.savedTickCampo = false), 5000);
    this.metasAtualizadas.emit();
  }

  private confirmarCampoNumerico(
    meta: MetaExtended,
    campo: 'valorMeta' | 'valorPorMes' | 'valorAtual',
    tempVal: any,
  ): void {
    const novo = this.parseNumeroBR(tempVal);
    const atual = Number((meta as any)[campo]) || 0;

    if (novo === atual) {
      this.cancelarCampo(meta, campo);
      return;
    }

    (meta as any)[campo] = novo;

    const patch = this.buildPatchCampoNumerico(meta, campo, novo);

    this.metasService.updateMeta(meta.id, patch).subscribe({
      next: () => this.onUpdateMetaSuccessNumerico(meta, campo, novo),
      error: () => this.onUpdateMetaError(),
    });
  }

  private buildPatchCampoNumerico(
    meta: MetaExtended,
    campo: 'valorMeta' | 'valorPorMes' | 'valorAtual',
    novo: number,
  ): Record<string, unknown> {
    const patch: Record<string, unknown> = { [campo]: novo };

    if (campo === 'valorPorMes') {
      patch.mesesNecessarios =
        novo > 0 ? Math.ceil((meta.valorMeta || 0) / novo) : 0;

      if (meta.meses && meta.meses.length > 0) {
        patch.meses = meta.meses.map((mes) => ({
          ...mes,
          valor: novo > 0 ? novo : 0,
          status: novo > 0 ? 'Programado' : 'Vazio',
        }));
      }
    }

    return patch;
  }

  private onUpdateMetaSuccessNumerico(
    meta: MetaExtended,
    campo: 'valorMeta' | 'valorPorMes' | 'valorAtual',
    novo: number,
  ): void {
    if (campo === 'valorPorMes' && meta.meses && meta.meses.length > 0) {
      meta.meses.forEach((mes) => {
        mes.valor = novo > 0 ? novo : 0;
        mes.status = novo > 0 ? 'Programado' : 'Vazio';
      });
    }

    meta.savedTickCampo = true;
    const savedMetaId = meta.id;
    const shouldPreserveTick = true;

    setTimeout(() => {
      const currentMeta = this.metas.find(
        (m) => String(m.id) === String(savedMetaId),
      );
      if (currentMeta) {
        currentMeta.savedTickCampo = false;
      }
    }, 5000);

    this.recalcResumo();

    setTimeout(() => {
      this.metasAtualizadas.emit();
      this.reloadMetas(savedMetaId, shouldPreserveTick);
    }, 200);
  }

  private onUpdateMetaError(): void {
    alert('Erro ao salvar. Tente novamente.');
  }

  private recalcResumo(): void {
    // Calcular todos os totais de uma vez
    this.totalValorMetaView = this.metas.reduce(
      (t, m) => t + (Number(m.valorMeta) || 0),
      0,
    );

    this.totalValorPorMesView = this.metas.reduce(
      (t, m) => t + (Number(m.valorPorMes) || 0),
      0,
    );

    this.totalMesesNecessariosView = this.metas.reduce(
      (t, m) => t + (Number(m.mesesNecessarios) || 0),
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

    // Calcular percentual pago
    const totalPago = this.metas.reduce((t, m) => {
      const pago = (m.meses ?? [])
        .filter((x) => x.status === 'Pago')
        .reduce((s, x) => s + (Number(x.valor) || 0), 0);
      return t + pago;
    }, 0);

    this.percentualPagoView =
      this.totalValorMetaView > 0
        ? Number(((totalPago * 100) / this.totalValorMetaView).toFixed(2))
        : 0;
  }

  getTotalContribuicoesMeta(meta: Meta): number {
    if (!meta.meses) return 0;
    return meta.meses.reduce((total, mes) => total + mes.valor, 0);
  }

  metaConcluida(meta: MetaExtended): boolean {
    return metaEstaConcluida(meta);
  }

  // Calcular progresso real de uma meta (quanto já temos + quanto já pagamos)
  getProgressoRealMeta(meta: MetaExtended): number {
    const valorMeta = Number(meta.valorMeta) || 0;
    if (valorMeta <= 0) return 0;

    const totalRealizado = calcularValorRealizado(meta);
    return Number(((totalRealizado * 100) / valorMeta).toFixed(2));
  }

  // Calcular meses restantes baseado nos meses pagos
  getMesesRestantes(meta: MetaExtended): number {
    const valorMeta = Number(meta.valorMeta) || 0;
    const valorPorMes = Number(meta.valorPorMes) || 0;

    // Se não tem valorPorMes, retornar null para distinguir de "Finalizado"
    if (valorMeta <= 0 || valorPorMes <= 0) return -1;

    // Calcular total realizado (quanto já temos + quanto já pagamos)
    const valorAtual = Number(meta.valorAtual) || 0;
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + (Number(x.valor) || 0), 0);

    const totalRealizado = valorAtual + valorPago;
    const valorRestante = Math.max(0, valorMeta - totalRealizado);

    // Se não falta mais nada, retornar 0 (Finalizado)
    if (valorRestante <= 0) return 0;

    // Calcular quantos meses ainda faltam pagar
    const mesesRestantes = Math.ceil(valorRestante / valorPorMes);

    return mesesRestantes;
  }

  getValorFaltanteMeta(meta: MetaExtended): number {
    return calcularValorFaltante(meta);
  }

  getValorRealizadoMeta(meta: MetaExtended): number {
    return calcularValorRealizado(meta);
  }

  private reloadMetas(
    savedMetaId?: string | number,
    preserveSavedTick?: boolean,
  ): void {
    // Preservar estado savedTickCampo da meta que acabou de ser salva
    const savedMetaState = Boolean(preserveSavedTick && savedMetaId);

    this.metasService.getMetas().subscribe((metas: Meta[]) => {
      // Filtrar apenas metas válidas (com ID válido e nome não vazio)
      const metasValidas = metas.filter((meta) => {
        // Aceitar qualquer ID válido (não vazio, não 0, não undefined)
        const idValido =
          meta.id && meta.id !== 0 && String(meta.id).trim() !== '';
        // Aceitar nomes válidos (não vazios, não undefined)
        const nomeValido =
          meta.nome && meta.nome.trim().length > 0 && meta.nome !== 'undefined';
        return idValido && nomeValido;
      });

      this.metas = metasValidas.map((m) => {
        // Preservar savedTickCampo se for a meta que acabou de ser salva
        const shouldPreserveTick = Boolean(
          savedMetaId && String(m.id) === String(savedMetaId) && savedMetaState,
        );

        const metaExtended: MetaExtended = {
          ...m,
          id: m.id, // Padronizar todos os IDs como string
          valorMeta: this.toNum(m.valorMeta),
          valorPorMes: this.toNum(m.valorPorMes),
          valorAtual: this.toNum(m.valorAtual),
          mesesNecessarios: this.toNum(m.mesesNecessarios),
          icon: m.icon || 'bi-bullseye', // Preservar o ícone da meta
          editandoNome: false,
          nomeTemp: '',
          savingNome: false,
          savedTick: false,
          editandoValorMeta: false,
          editandoValorPorMes: false,
          editandoValorAtual: false,
          savedTickCampo: shouldPreserveTick,
          dropdownOpen: undefined,
        };
        return metaExtended;
      });
      this.recalcResumo();
    });
  }

  onKeyUp(
    ev: KeyboardEvent,
    meta: MetaExtended,
    campo: 'nome' | 'valorMeta' | 'valorPorMes' | 'valorAtual',
  ): void {
    // Enter (inclui o do teclado numérico)
    if (ev.key === 'Enter' || ev.code === 'NumpadEnter') {
      ev.preventDefault();
      ev.stopPropagation();

      const chave = `${meta.id}-${campo}`;
      this.camposProcessados.add(chave);

      this.confirmarCampo(meta, campo);
      return;
    }

    // Escape
    if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.stopPropagation();
      this.cancelarCampo(meta, campo);
    }
  }

  // Método para validar apenas números nos campos de valor do modal
  validarApenasNumeros(event: KeyboardEvent): void {
    // Permitir teclas de controle (não precisam validação)
    const teclasControle = [
      'Backspace',
      'Delete',
      'Tab',
      'Enter',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'Ctrl',
      'Alt',
      'Shift',
      'Meta',
      'Cmd',
    ];

    if (teclasControle.includes(event.key)) {
      return; // Permite teclas de controle
    }

    // Permitir teclas do teclado numérico (Numpad)
    if (event.code.startsWith('Numpad')) {
      // Verificar se é número do numpad (0-9) ou vírgula/ponto
      if (
        event.code.includes('Comma') ||
        event.code.includes('Period') ||
        (event.code >= 'Numpad0' && event.code <= 'Numpad9')
      ) {
        return; // Permite números do numpad, vírgula e ponto
      }
    }

    // Permitir apenas: números (0-9), vírgula (,) e ponto (.)
    const teclasPermitidas = /^[0-9,\.]$/;

    if (!teclasPermitidas.test(event.key)) {
      event.preventDefault(); // Bloqueia qualquer outro caractere
    }
  }
}
