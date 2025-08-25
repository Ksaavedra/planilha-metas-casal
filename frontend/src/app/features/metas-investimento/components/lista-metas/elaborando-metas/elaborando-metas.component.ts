import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Meta,
  MetaExtended,
  ModalAdicionarMeta,
} from '../../../../../core/interfaces/mes-meta';
import { MetasService } from '../../../services/metas.service';
import { SuccessModalComponent } from '../../modals/success-modal/success-modal.component';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';
import { ParabensModalComponent } from '../../modals/parabens-modal/parabens-modal.component';

@Component({
  selector: 'app-elaborando-metas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SuccessModalComponent,
    ConfirmModalComponent,
    ParabensModalComponent,
  ],
  templateUrl: './elaborando-metas.component.html',
  styleUrl: './elaborando-metas.component.scss',
})
export class ElaborandoMetasComponent {
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

  constructor(private metasService: MetasService) {}

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
    console.log('🔍 [removerMeta] Iniciando...', { id, tipo: typeof id });

    const meta = this.metas.find((m) => String(m.id) === String(id));
    if (!meta) {
      console.error('❌ [removerMeta] Meta não encontrada para ID:', id);
      console.log(
        '🔍 [removerMeta] Metas disponíveis:',
        this.metas.map((m) => ({ id: m.id, nome: m.nome }))
      );
      alert('Meta não encontrada.');
      return;
    }

    console.log('🔍 [removerMeta] Meta encontrada:', {
      id: meta.id,
      nome: meta.nome,
    });

    // Abrir modal de confirmação
    this.metaParaExcluir = meta;
    this.modalConfirmarDelete.isOpen = true;
  }

  confirmarExclusao(): void {
    if (!this.metaParaExcluir) return;

    const meta = this.metaParaExcluir;
    const id = meta.id;

    // Fechar modal de confirmação
    this.modalConfirmarDelete.isOpen = false;
    this.metaParaExcluir = null;

    // Se a meta tem nome vazio, provavelmente não existe no servidor
    if (!meta.nome || meta.nome.trim() === '') {
      console.log(
        '🔍 [confirmarExclusao] Meta parece ser temporária, removendo da lista local'
      );
      this.metas = this.metas.filter((m) => String(m.id) !== String(id));
      this.recalcResumo();
      this.metasAtualizadas.emit();
      this.modalSucessoDelete.isOpen = true;
      return;
    }

    if (meta._draft) {
      // não existe no servidor: só remove da lista
      this.metas = this.metas.filter((m) => m !== meta);
      console.log('✅ [confirmarExclusao] Meta draft removida da lista');
      this.recalcResumo();
      this.metasAtualizadas.emit();
      this.modalSucessoDelete.isOpen = true;
      return;
    }

    // existe no servidor: chama DELETE
    console.log('🔍 [confirmarExclusao] Chamando DELETE para ID:', id);
    this.metasService.deleteMeta(id).subscribe({
      next: () => {
        console.log('✅ [confirmarExclusao] Meta excluída com sucesso!');
        this.metasAtualizadas.emit();
        this.modalSucessoDelete.isOpen = true;
      },
      error: (e) => {
        console.error('❌ [confirmarExclusao] Erro ao excluir meta:', e);
        console.error('❌ [confirmarExclusao] Status:', e.status);
        console.error('❌ [confirmarExclusao] URL:', e.url);

        // Se for 404, a meta não existe no servidor, então remove da lista local
        if (e.status === 404) {
          console.log(
            '🔍 [confirmarExclusao] Meta não existe no servidor (404), removendo da lista local'
          );
          this.metas = this.metas.filter((m) => String(m.id) !== String(id));
          this.recalcResumo();
          this.metasAtualizadas.emit();
          this.modalSucessoDelete.isOpen = true;
        } else {
          alert('Não foi possível excluir. Tente novamente.');
        }
      },
    });
  }

  cancelarExclusao(): void {
    this.modalConfirmarDelete.isOpen = false;
    this.metaParaExcluir = null;
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
    const limpo = valor.replace(/[^\d,.-]/g, '');

    // Se tem vírgula e ponto, assume que vírgula é separador decimal
    if (limpo.includes(',') && limpo.includes('.')) {
      return parseFloat(limpo.replace(/\./g, '').replace(',', '.'));
    }

    // Se só tem vírgula, assume que é separador decimal
    if (limpo.includes(',')) {
      return parseFloat(limpo.replace(',', '.'));
    }

    // Caso contrário, tenta parseFloat normal
    return parseFloat(limpo) || 0;
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
        error: (e) => {
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
      error: (e) => {
        console.error('Erro ao atualizar valor:', e);
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

    console.log('🔍 [getProgressoRealMeta] Debug:', {
      metaId: meta.id,
      metaNome: meta.nome,
      valorMeta,
      valorAtual,
      valorPago,
      totalRealizado,
      progresso,
      temMesesPagos,
      jaMostrou,
      progressoAtingido: progresso >= 100,
      deveMostrarParabens: progresso >= 100 && temMesesPagos && !jaMostrou,
    });

    // Verificar se atingiu 100% E tem pelo menos um mês pago
    if (progresso >= 100 && temMesesPagos && !jaMostrou) {
      console.log(
        '🎉 [getProgressoRealMeta] Mostrando parabéns para:',
        meta.nome
      );
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
    console.log('🎉 [mostrarParabens] Abrindo modal para:', meta.nome);

    this.modalParabens = {
      isOpen: true,
      metaNome: meta.nome,
      valorMeta: meta.valorMeta,
    };

    console.log('🎉 [mostrarParabens] Modal configurado:', this.modalParabens);

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
      console.error('Erro ao salvar parabéns no localStorage:', error);
    }
  }

  // Verificar se já mostrou parabéns para uma meta
  private jaMostrouParabens(metaId: string | number): boolean {
    try {
      const parabensMostrados = this.getParabensMostrados();
      return parabensMostrados.includes(String(metaId));
    } catch (error) {
      console.error('Erro ao verificar parabéns no localStorage:', error);
      return false;
    }
  }

  // Obter lista de metas que já mostraram parabéns
  private getParabensMostrados(): string[] {
    try {
      const stored = localStorage.getItem('metas_parabens_mostrados');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao ler parabéns do localStorage:', error);
      return [];
    }
  }

  // Fechar modal de parabéns
  fecharParabens(): void {
    this.modalParabens.isOpen = false;
  }

  // Marcar meses restantes como "Finalizado" quando meta atinge 100%
  private marcarMesesComoFinalizado(meta: MetaExtended): void {
    console.log(
      '🏁 [marcarMesesComoFinalizado] Marcando meses como finalizado para:',
      meta.nome
    );

    if (!meta.meses || meta.meses.length === 0) return;

    // Encontrar meses que ainda não foram pagos (status diferente de 'Pago')
    const mesesParaFinalizar = meta.meses.filter(
      (mes) => mes.status !== 'Pago'
    );

    if (mesesParaFinalizar.length === 0) {
      console.log(
        '🏁 [marcarMesesComoFinalizado] Todos os meses já estão pagos'
      );
      return;
    }

    console.log(
      '🏁 [marcarMesesComoFinalizado] Meses para finalizar:',
      mesesParaFinalizar.length
    );

    // Marcar todos os meses restantes como "Finalizado"
    mesesParaFinalizar.forEach((mes) => {
      mes.status = 'Finalizado';
      mes.valor = 0; // Zerar o valor já que a meta foi completada
    });

    // Salvar no servidor (apenas os meses, pois mesesNecessarios é calculado dinamicamente)
    this.metasService
      .updateMeta(meta.id, {
        meses: meta.meses,
      })
      .subscribe({
        next: () => {
          console.log(
            '✅ [marcarMesesComoFinalizado] Meta finalizada com sucesso!'
          );
          this.metasAtualizadas.emit();
        },
        error: (error) => {
          console.error(
            '❌ [marcarMesesComoFinalizado] Erro ao finalizar meta:',
            error
          );
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
    this.modalAdicionarMeta.isOpen = true;
    this.modalAdicionarMeta.nome = '';
    this.modalAdicionarMeta.valorMeta = 0;
    this.modalAdicionarMeta.valorPorMes = 0;
    this.modalAdicionarMeta.valorAtual = 0;
  }

  fecharModalAdicionarMeta(): void {
    this.modalAdicionarMeta.isOpen = false;
    this.modalAdicionarMeta.nome = '';
    this.modalAdicionarMeta.valorMeta = 0;
    this.modalAdicionarMeta.valorPorMes = 0;
    this.modalAdicionarMeta.valorAtual = 0;
  }

  salvarMetaModal(): void {
    const { nome, valorMeta, valorPorMes, valorAtual } =
      this.modalAdicionarMeta;
    if (!nome.trim()) {
      this.fecharModalAdicionarMeta();
      return;
    }

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

    this.metasService
      .createMeta({
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
          status: 'Vazio',
        })),
      })
      .subscribe({
        next: () => {
          this.metasAtualizadas.emit();
          this.modalSucessoAdd.isOpen = true;
        },
        error: () => alert('Erro ao criar meta. Tente novamente.'),
        complete: () => this.fecharModalAdicionarMeta(),
      });
  }

  cancelarAdicionarMeta(): void {
    this.fecharModalAdicionarMeta();
  }

  // Métodos para o modal de adicionar meta
  onValorMetaChange(valor: any): void {
    this.modalAdicionarMeta.valorMeta = this.parseNumeroBR(valor);
  }

  onValorPorMesChange(valor: any): void {
    this.modalAdicionarMeta.valorPorMes = this.parseNumeroBR(valor);
  }

  onValorAtualChange(valor: any): void {
    this.modalAdicionarMeta.valorAtual = this.parseNumeroBR(valor);
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
    // Permitir: números (0-9), vírgula, ponto, backspace, delete, tab, enter, escape
    const teclasPermitidas = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      ',',
      '.',
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
    ];

    // Permitir teclas do teclado numérico
    if (event.code.startsWith('Numpad')) {
      return;
    }

    // Verificar se a tecla pressionada está na lista de permitidas
    if (!teclasPermitidas.includes(event.key)) {
      event.preventDefault();
    }
  }
}
