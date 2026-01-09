import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
} from '@angular/core';
import {
  Meta,
  MetaExtended,
  ModalAdicionarMeta,
} from '../../../../../core/interfaces/mes-meta';
import { MetasService } from '../../../../../core/services/metas/metas.service';
import { ModalAdicionarMetaService } from '../../../../../core/services/modal-adicionar-meta.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-elaborando-metas',
  templateUrl: './elaborando-metas.component.html',
  styleUrls: ['./elaborando-metas.component.scss'],
})
export class ElaborandoMetasComponent implements OnDestroy {
  @Input() metas: MetaExtended[] = [];
  @Input() percentualPagoView = 0;
  @Input() totalValorMetaView = 0;
  @Input() totalValorPorMesView = 0;
  @Input() totalMesesNecessariosView = 0;
  @Input() totalValorAtualView = 0;
  @Input() totalContribuicoesView = 0;
  @Output() addMeta = new EventEmitter<void>();
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
  modalParabens = { isOpen: false, metaNome: '', valorMeta: 0 };
  metaParaExcluir: any = null;

  trackById = (_: number, m: MetaExtended) => m.id;

  // Modal de adicionar meta
  modalAdicionarMeta: ModalAdicionarMeta = {
    isOpen: false,
    nome: '',
    valorMeta: 0,
    valorPorMes: 0,
    valorAtual: 0,
  };

  // Valores como string durante a digitação (sem formatação automática)
  valorMetaRaw: string = '';
  valorPorMesRaw: string = '';
  valorAtualRaw: string = '';

  private saveSubscription?: Subscription;
  private confirmDeleteSubscription?: Subscription;

  constructor(
    private metasService: MetasService,
    private modalService: ModalAdicionarMetaService
  ) {
    // Escuta eventos de save do modal
    this.saveSubscription = this.modalService.save$.subscribe(() => {
      this.salvarMetaModal();
    });

    // Escuta eventos de confirmação de exclusão
    this.confirmDeleteSubscription = this.modalService.confirmDelete$.subscribe(
      (metaId) => {
        console.log(
          '🔴 confirmDelete$ recebido no elaborando-metas com metaId:',
          metaId
        );
        this.processarExclusao(metaId);
      }
    );
  }

  ngOnDestroy(): void {
    this.saveSubscription?.unsubscribe();
    this.confirmDeleteSubscription?.unsubscribe();
  }

  // Métodos para edição de campos da Seção 1
  editarCampo(
    meta: MetaExtended,
    campo: 'nome' | 'valorMeta' | 'valorPorMes' | 'valorAtual'
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
    console.log('🔴 removerMeta() chamado com id:', id);
    const meta = this.metas.find((m) => String(m.id) === String(id));
    if (!meta) {
      alert('Meta não encontrada.');
      return;
    }

    console.log('📋 Meta encontrada:', meta);
    // Abrir modal de confirmação através do serviço
    this.metaParaExcluir = meta;
    this.modalService.openConfirmarDelete(meta.id, meta.nome || '');
    console.log('✅ Modal de confirmação aberto');
  }

  processarExclusao(metaId: number): void {
    console.log('🔴 processarExclusao() chamado com metaId:', metaId);
    const meta = this.metas.find((m) => String(m.id) === String(metaId));
    if (!meta) {
      console.error('❌ Meta não encontrada com id:', metaId);
      alert('Meta não encontrada.');
      return;
    }

    console.log('📋 Meta encontrada para exclusão:', meta);
    const id = meta.id;
    this.metaParaExcluir = null;

    // Se a meta tem nome vazio, provavelmente não existe no servidor
    if (!meta.nome || meta.nome.trim() === '') {
      console.log('⚠️ Meta sem nome - removendo localmente');
      this.metas = this.metas.filter((m) => String(m.id) !== String(id));
      this.recalcResumo();
      this.metasAtualizadas.emit();
      console.log('✅ Chamando showSucessoDelete()...');
      this.modalService.showSucessoDelete();
      return;
    }

    if (meta._draft) {
      console.log('⚠️ Meta é draft - removendo localmente');
      // não existe no servidor: só remove da lista
      this.metas = this.metas.filter((m) => m !== meta);
      this.recalcResumo();
      this.metasAtualizadas.emit();
      console.log('✅ Chamando showSucessoDelete()...');
      this.modalService.showSucessoDelete();
      return;
    }

    // existe no servidor: chama DELETE
    console.log('🌐 Chamando deleteMeta() no servidor para id:', id);
    this.metasService.deleteMeta(id).subscribe({
      next: () => {
        console.log('✅ Meta excluída com sucesso no servidor!');
        this.metasAtualizadas.emit();
        console.log('✅ Chamando showSucessoDelete()...');
        this.modalService.showSucessoDelete();
      },
      error: (e) => {
        console.error('❌ Erro ao excluir meta:', e);
        // Se for 404, a meta não existe no servidor, então remove da lista local
        if (e.status === 404) {
          console.log(
            '⚠️ Meta não encontrada no servidor (404) - removendo localmente'
          );
          this.metas = this.metas.filter((m) => String(m.id) !== String(id));
          this.recalcResumo();
          this.metasAtualizadas.emit();
          console.log('✅ Chamando showSucessoDelete()...');
          this.modalService.showSucessoDelete();
        } else {
          alert('Não foi possível excluir. Tente novamente.');
        }
      },
    });
  }

  confirmarExclusao(): void {
    // Método mantido para compatibilidade, mas não é mais usado
    // A confirmação agora é feita através do serviço
  }

  cancelarExclusao(): void {
    // Método mantido para compatibilidade, mas não é mais usado
    // O cancelamento agora é feito através do serviço
  }

  cancelarCampo(
    meta: MetaExtended,
    campo: 'valorMeta' | 'valorPorMes' | 'valorAtual' | 'nome'
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
    ev: Event
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
    campo: 'nome' | 'valorMeta' | 'valorPorMes' | 'valorAtual'
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
    const resultado = parseFloat(limpo);
    return isNaN(resultado) ? 0 : resultado;
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
    campo: 'valorMeta' | 'valorPorMes' | 'valorAtual' | 'nome'
  ) {
    // valida ID (string do json-server)
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

    // ====== 1) Atualização de NOME ======
    if (campo === 'nome') {
      const novoNome = String(tempVal ?? '').trim();
      if (!novoNome || novoNome === meta.nome) {
        this.cancelarCampo(meta, 'nome');
        return;
      }

      // aplica localmente
      meta.nome = novoNome;

      // salva (PATCH parcial)
      this.metasService.updateMeta(meta.id, { nome: novoNome }).subscribe({
        next: () => {
          meta.savedTickCampo = true;
          setTimeout(() => (meta.savedTickCampo = false), 1200);
          this.metasAtualizadas.emit();
        },
        error: (_e) => {
          alert('Erro ao salvar. Tente novamente.');
        },
      });

      // encerra estado de edição
      (meta as any)[flag] = false;
      (meta as any)[tempKey] = undefined;
      return;
    }

    // ====== 2) Atualização de CAMPOS NUMÉRICOS ======
    // Sempre parsear (suporta "3.123,00", "3123.00", "200")
    const novo = this.parseNumeroBR(tempVal);
    const atual = Number((meta as any)[campo]) || 0;

    if (novo === atual) {
      this.cancelarCampo(meta, campo);
      return;
    }

    // aplica localmente
    (meta as any)[campo] = novo;

    // monta patch; se mudar valorPorMes, recalc mesesNecessarios
    const patch: any = { [campo]: novo };
    if (campo === 'valorPorMes') {
      patch.mesesNecessarios =
        novo > 0 ? Math.ceil((meta.valorMeta || 0) / novo) : 0;
    }

    this.metasService.updateMeta(meta.id, patch).subscribe({
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

    // encerra estado de edição
    (meta as any)[flag] = false;
    (meta as any)[tempKey] = undefined;
  }

  private recalcResumo(): void {
    // Calcular todos os totais de uma vez
    this.totalValorMetaView = this.metas.reduce(
      (t, m) => t + (Number(m.valorMeta) || 0),
      0
    );

    this.totalValorPorMesView = this.metas.reduce(
      (t, m) => t + (Number(m.valorPorMes) || 0),
      0
    );

    this.totalMesesNecessariosView = this.metas.reduce(
      (t, m) => t + (Number(m.mesesNecessarios) || 0),
      0
    );

    this.totalValorAtualView = this.metas.reduce(
      (t, m) => t + (Number(m.valorAtual) || 0),
      0
    );

    this.totalContribuicoesView = this.metas.reduce(
      (total, meta) => total + this.getTotalContribuicoesMeta(meta as any),
      0
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

  // Calcular progresso real de uma meta (quanto já temos + quanto já pagamos)
  getProgressoRealMeta(meta: MetaExtended): number {
    const valorMeta = Number(meta.valorMeta) || 0;
    if (valorMeta <= 0) return 0;

    const valorAtual = Number(meta.valorAtual) || 0; // "Quanto já temos"
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + (Number(x.valor) || 0), 0); // "Quanto já pagamos"

    const totalRealizado = valorAtual + valorPago;
    const progresso = Number(((totalRealizado * 100) / valorMeta).toFixed(2));

    // Debug: verificar condições para parabéns
    const temMesesPagos = (meta.meses ?? []).some((x) => x.status === 'Pago');
    const jaMostrou = this.jaMostrouParabens(meta.id);

    // Verificar se atingiu 100% E tem pelo menos um mês pago
    if (progresso >= 100 && temMesesPagos && !jaMostrou) {
      this.mostrarParabens(meta);

      // Marcar meses restantes como "Finalizado" quando meta atinge 100%
      this.marcarMesesComoFinalizado(meta);
    }

    return progresso;
  }

  // Calcular meses restantes baseado nos meses pagos
  getMesesRestantes(meta: MetaExtended): number {
    const valorMeta = Number(meta.valorMeta) || 0;
    const valorPorMes = Number(meta.valorPorMes) || 0;

    if (valorMeta <= 0 || valorPorMes <= 0) return 0;

    // Calcular total realizado (quanto já temos + quanto já pagamos)
    const valorAtual = Number(meta.valorAtual) || 0;
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + (Number(x.valor) || 0), 0);

    const totalRealizado = valorAtual + valorPago;
    const valorRestante = Math.max(0, valorMeta - totalRealizado);

    // Calcular quantos meses ainda faltam pagar
    const mesesRestantes = Math.ceil(valorRestante / valorPorMes);

    return mesesRestantes;
  }

  // Calcular valor que ainda falta pagar
  getValorFaltanteMeta(meta: MetaExtended): number {
    const valorMeta = Number(meta.valorMeta) || 0;
    const valorAtual = Number(meta.valorAtual) || 0; // "Quanto já temos"
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + (Number(x.valor) || 0), 0); // "Quanto já pagamos"

    const totalRealizado = valorAtual + valorPago;
    return Math.max(0, valorMeta - totalRealizado);
  }

  // Calcular valor total realizado (quanto já temos + quanto já pagamos)
  getValorRealizadoMeta(meta: MetaExtended): number {
    const valorAtual = Number(meta.valorAtual) || 0; // "Quanto já temos"
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + (Number(x.valor) || 0), 0); // "Quanto já pagamos"

    return valorAtual + valorPago;
  }

  // Mostrar modal de parabéns quando meta atinge 100%
  private mostrarParabens(meta: MetaExtended): void {
    this.modalParabens = {
      isOpen: true,
      metaNome: meta.nome,
      valorMeta: meta.valorMeta,
    };
    // Marcar que já mostrou parabéns para esta meta (persistir no localStorage)
    this.marcarParabensMostrado(meta.id);
  }

  // Marcar que já mostrou parabéns para uma meta (persistir no localStorage)
  private marcarParabensMostrado(metaId: string | number): void {
    try {
      const parabensMostrados = this.getParabensMostrados();
      parabensMostrados.push(String(metaId));
      localStorage.setItem(
        'metas_parabens_mostrados',
        JSON.stringify(parabensMostrados)
      );
    } catch (error) {
      // Erro ao salvar parabéns no localStorage
    }
  }

  // Verificar se já mostrou parabéns para uma meta
  private jaMostrouParabens(metaId: string | number): boolean {
    try {
      const parabensMostrados = this.getParabensMostrados();
      return parabensMostrados.includes(String(metaId));
    } catch (error) {
      return false;
    }
  }

  // Obter lista de metas que já mostraram parabéns
  private getParabensMostrados(): string[] {
    try {
      const stored = localStorage.getItem('metas_parabens_mostrados');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  // Fechar modal de parabéns
  fecharParabens(): void {
    this.modalParabens.isOpen = false;
  }

  // Marcar meses restantes como "Finalizado" quando meta atinge 100%
  private marcarMesesComoFinalizado(meta: MetaExtended): void {
    if (!meta.meses || meta.meses.length === 0) return;

    // Encontrar meses que ainda não foram pagos (status diferente de 'Pago')
    const mesesParaFinalizar = meta.meses.filter(
      (mes) => mes.status !== 'Pago'
    );

    if (mesesParaFinalizar.length === 0) {
      return;
    }

    // Marcar todos os meses restantes como "Finalizado"
    mesesParaFinalizar.forEach((mes) => {
      mes.status = 'Finalizado';
      mes.valor = 0; // Zerar o valor já que a meta foi completada
    });

    // Salvar no servidor (apenas os meses, pois mesesNecessarios é calculado dinamicamente)
    this.metasService
      .updateMeta(meta.id, {
        meses: meta.meses.map((m) => ({ ...m })),
      })
      .subscribe({
        next: () => {
          this.metasAtualizadas.emit();
        },
        error: (_error) => {
          // Erro ao finalizar meta
        },
      });
  }

  private reloadMetas(): void {
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
        const metaExtended: MetaExtended = {
          ...m,
          id: m.id, // Padronizar todos os IDs como string
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
        return metaExtended;
      });
      this.recalcResumo();
    });
  }

  // Métodos para o modal de adicionar meta
  abrirModalAdicionarMeta(): void {
    console.log('🟢 ========================================');
    console.log('🟢 Abrir modal - abrirModalAdicionarMeta() chamado!');
    this.modalService.open();
    // Sincronizar estado local
    this.modalAdicionarMeta.isOpen = true;
    this.modalAdicionarMeta.nome = '';
    this.modalAdicionarMeta.valorMeta = 0;
    this.modalAdicionarMeta.valorPorMes = 0;
    this.modalAdicionarMeta.valorAtual = 0;
    this.valorMetaRaw = '';
    this.valorPorMesRaw = '';
    this.valorAtualRaw = '';
    console.log('📋 Modal inicializado com valores:');
    console.log('   - nome:', this.modalAdicionarMeta.nome);
    console.log('   - valorMeta:', this.modalAdicionarMeta.valorMeta);
    console.log('   - valorPorMes:', this.modalAdicionarMeta.valorPorMes);
    console.log('   - valorAtual:', this.modalAdicionarMeta.valorAtual);
    console.log('🟢 ========================================');
  }

  fecharModalAdicionarMeta(): void {
    this.modalService.close();
    // Sincronizar estado local
    this.modalAdicionarMeta.isOpen = false;
    this.modalAdicionarMeta.nome = '';
    this.modalAdicionarMeta.valorMeta = 0;
    this.modalAdicionarMeta.valorPorMes = 0;
    this.modalAdicionarMeta.valorAtual = 0;
    this.valorMetaRaw = '';
    this.valorPorMesRaw = '';
    this.valorAtualRaw = '';
  }

  salvarMetaModal(): void {
    console.log('🔵 ========================================');
    console.log('🔵 Adicionar meta - salvarMetaModal() chamado!');

    // Busca dados do serviço
    const modalState = this.modalService.getState();
    const nome = modalState.nome;
    const valorMeta = this.parseNumeroBR(modalState.valorMetaRaw);
    const valorPorMes = this.parseNumeroBR(modalState.valorPorMesRaw);
    // Se o checkbox não estiver marcado, valorAtual deve ser 0
    const valorAtual = modalState.temValorAtual
      ? this.parseNumeroBR(modalState.valorAtualRaw)
      : 0;

    console.log('📋 Dados do modal ANTES de processar:');
    console.log('   - nome:', nome);
    console.log('   - valorMeta:', valorMeta);
    console.log('   - valorPorMes:', valorPorMes);
    console.log('   - valorAtual:', valorAtual);

    console.log('🔍 Valores extraídos:');
    console.log('   - nome:', nome);
    console.log('   - valorMeta:', valorMeta);
    console.log('   - valorPorMes:', valorPorMes);
    console.log('   - valorAtual:', valorAtual);

    // Validação de campos obrigatórios
    if (!nome || !nome.trim()) {
      console.log('❌ ERRO: Nome da meta é obrigatório!');
      alert('Por favor, preencha o nome da meta.');
      return;
    }

    if (!valorMeta || valorMeta <= 0) {
      console.log(
        '❌ ERRO: Valor da meta é obrigatório e deve ser maior que zero!'
      );
      alert('Por favor, preencha o valor da meta (deve ser maior que zero).');
      return;
    }

    if (!valorPorMes || valorPorMes <= 0) {
      console.log(
        '❌ ERRO: Valor por mês é obrigatório e deve ser maior que zero!'
      );
      alert('Por favor, preencha o valor por mês (deve ser maior que zero).');
      return;
    }

    // Validação do valor atual (se o checkbox estiver marcado, deve ser preenchido)
    if (modalState.temValorAtual && (!valorAtual || valorAtual < 0)) {
      console.log(
        '❌ ERRO: Valor já temos é obrigatório quando o checkbox está marcado!'
      );
      alert(
        'Por favor, preencha o valor já temos (deve ser maior ou igual a zero).'
      );
      return;
    }

    console.log('✅ Validação do nome passou!');
    console.log('✅ Criando meta com os dados...');

    const mesesPadrao = [
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

    const dadosParaEnviar = {
      nome: nome.trim(),
      valorMeta: valorMeta || 0,
      valorPorMes: valorPorMes || 0,
      mesesNecessarios:
        valorPorMes > 0 ? Math.ceil((valorMeta || 0) / valorPorMes) : 0,
      valorAtual: valorAtual || 0,
      meses: mesesPadrao.map((n, i) => ({
        id: i + 1,
        nome: n,
        valor: 0,
        status: 'Vazio' as 'Vazio',
      })),
    };

    console.log('📤 Dados que serão enviados para a API:');
    console.log(JSON.stringify(dadosParaEnviar, null, 2));
    console.log('🚀 Chamando metasService.createMeta()...');

    this.metasService.createMeta(dadosParaEnviar).subscribe({
      next: (response) => {
        console.log('✅ Meta criada com sucesso!');
        console.log('📥 Resposta do servidor:', response);
        this.metasAtualizadas.emit();
        // Fecha o modal de adicionar primeiro
        this.modalService.close();
        this.modalService.reset();
        this.fecharModalAdicionarMeta();
        // Depois mostra modal de sucesso através do serviço (renderizado no app.component)
        this.modalService.showSucesso(
          'Meta adicionada!',
          'Sua meta foi criada com sucesso.'
        );
        console.log('🔵 ========================================');
      },
      error: (err) => {
        console.error('❌ Erro ao criar meta:', err);
        console.error('📋 Detalhes do erro:', {
          status: err.status,
          statusText: err.statusText,
          url: err.url,
          message: err.message,
        });

        // Mensagem de erro mais específica
        if (err.status === 0 || err.statusText === 'Unknown Error') {
          alert(
            '⚠️ Erro de conexão: Não foi possível conectar ao servidor.\n\n' +
              'Verifique se o backend está rodando em http://localhost:3000\n\n' +
              'Erro: ' +
              (err.message || 'Conexão recusada')
          );
        } else {
          alert('Erro ao criar meta: ' + (err.message || 'Tente novamente.'));
        }
      },
      complete: () => {
        console.log(
          '✅ Processo de adicionar meta completo (callback complete)'
        );
        console.log('🔵 ========================================');
      },
    });
  }

  cancelarAdicionarMeta(): void {
    this.fecharModalAdicionarMeta();
  }

  // Métodos para o modal de adicionar meta
  onValorMetaChange(valor: any): void {
    // Remove caracteres inválidos, mantém apenas números, vírgula e ponto
    const valorLimpo = String(valor || '').replace(/[^0-9,\.]/g, '');
    // Atualiza no serviço
    this.modalService.updateValorMetaRaw(valorLimpo);
    // Sincroniza estado local
    this.valorMetaRaw = valorLimpo;
    const valorProcessado = this.parseNumeroBR(valorLimpo);
    this.modalAdicionarMeta.valorMeta = valorProcessado;
  }

  onValorPorMesChange(valor: any): void {
    const valorLimpo = String(valor || '').replace(/[^0-9,\.]/g, '');
    this.modalService.updateValorPorMesRaw(valorLimpo);
    this.valorPorMesRaw = valorLimpo;
    const valorProcessado = this.parseNumeroBR(valorLimpo);
    this.modalAdicionarMeta.valorPorMes = valorProcessado;
  }

  onValorAtualChange(valor: any): void {
    const valorLimpo = String(valor || '').replace(/[^0-9,\.]/g, '');
    this.modalService.updateValorAtualRaw(valorLimpo);
    this.valorAtualRaw = valorLimpo;
    const valorProcessado = this.parseNumeroBR(valorLimpo);
    this.modalAdicionarMeta.valorAtual = valorProcessado;
  }

  onValorMetaChangeEvent(event: any): void {
    const valor = event.target?.value || event;
    console.log('🔄 (change) Campo: Valor da Meta | Valor:', valor);
    this.onValorMetaChange(valor);
  }

  onValorPorMesChangeEvent(event: any): void {
    const valor = event.target?.value || event;
    console.log('🔄 (change) Campo: Valor por Mês | Valor:', valor);
    this.onValorPorMesChange(valor);
  }

  onValorAtualChangeEvent(event: any): void {
    const valor = event.target?.value || event;
    console.log('🔄 (change) Campo: Valor Já Temos | Valor:', valor);
    this.onValorAtualChange(valor);
  }

  onKeyUp(
    ev: KeyboardEvent,
    meta: MetaExtended,
    campo: 'nome' | 'valorMeta' | 'valorPorMes' | 'valorAtual'
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
