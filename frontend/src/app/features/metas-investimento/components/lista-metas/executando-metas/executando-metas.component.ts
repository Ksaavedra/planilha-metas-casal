import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  Meta,
  MetaExtended,
  ModalEdicao,
  StatusMeta,
} from '../../../../../core/interfaces/mes-meta';
import { MetasService } from '../../../services/metas.service';

@Component({
  selector: 'app-executando-metas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './executando-metas.component.html',
  styleUrls: ['./executando-metas.component.scss'],
})
export class ExecutandoMetasComponent implements OnInit, OnChanges {
  @Input() meses: string[] = [];
  @Input() metas: MetaExtended[] = [];
  @Input() percentualPagoView = 0;
  @Input() totalValorMetaView = 0;
  @Input() totalValorPorMesView = 0;
  @Input() totalMesesNecessariosView = 0;
  @Input() totalValorAtualView = 0;
  @Input() totalContribuicoesView = 0;

  @Output() alternarStatus = new EventEmitter<{
    metaId: number | string;
    mesId: number;
    status: 'Programado' | 'Pago' | 'Vazio';
  }>();
  @Output() salvarValor = new EventEmitter<{
    metaId: number | string;
    mesId: number;
    valor: number;
  }>();
  @Output() metaCompleta = new EventEmitter<{
    metaId: number | string;
    metaNome: string;
    valorMeta: number;
  }>();

  modalEdicao: ModalEdicao = {
    meta: {} as MetaExtended,
    mesId: -1,
    valor: 0,
    isOpen: false,
  };

  constructor(private metasService: MetasService) {}

  private readonly MESES_PADRAO = [
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

  ngOnInit() {
    // Componente de apresentação - dados vêm via @Input()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['metas']) {
      if (changes['metas'].currentValue) {
        this.setHeaderMesesFromData();
        this.metas.forEach((m) => this.normalizeMeses(m));
        this.recalcResumo();
      }
    }
  }

  setHeaderMesesFromData(): void {
    const nomes = this.metas.flatMap((m) => m.meses?.map((x) => x.nome) ?? []);
    const unicos = Array.from(new Set(nomes));
    this.meses = unicos.length ? unicos : [...this.MESES_PADRAO];
  }

  private normalizeMeses(meta: MetaExtended): void {
    const header = this.meses.length ? this.meses : this.MESES_PADRAO;
    const byName = new Map((meta.meses ?? []).map((m) => [m.nome, m]));
    meta.meses = header.map(
      (nome, i) =>
        byName.get(nome) ?? { id: i + 1, nome, valor: 0, status: 'Vazio' }
    );
  }

  // Métodos para edição de valores
  abrirModalEdicao(meta: MetaExtended, mesId: number): void {
    const mes = meta.meses.find((m) => m.id === mesId);
    if (!mes) return;
    this.modalEdicao = { meta, mesId, valor: mes.valor, isOpen: true };
  }

  // Métodos para formatação de moeda
  formatBR(n: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(n);
  }

  toggleDropdown(meta: MetaExtended, mesId: number): void {
    // Fechar todos os outros dropdowns primeiro
    this.metas.forEach((m) => {
      if (String(m.id) !== String(meta.id) || m.dropdownOpen !== mesId) {
        m.dropdownOpen = undefined;
      }
    });

    // Toggle do dropdown atual
    meta.dropdownOpen = meta.dropdownOpen === mesId ? undefined : mesId;

    if (meta.dropdownOpen !== mesId) return;

    setTimeout(() => {
      const anchor = document.querySelector(
        `[data-meta-id="${meta.id}"][data-mes-id="${mesId}"] .status-dropdown-container`
      ) as HTMLElement;

      const dd = document.querySelector('.status-dropdown') as HTMLElement;
      if (!anchor || !dd) return;

      const a = anchor.getBoundingClientRect();
      const margin = 8;

      // mede o dropdown (ele já está renderizado)
      dd.style.top = '0px';
      dd.style.left = '0px'; // reset
      const dw = dd.offsetWidth,
        dh = dd.offsetHeight;

      // POSIÇÃO: abaixo (sempre) e centralizado ao anchor
      let top = a.bottom + margin;
      let left = a.left + a.width / 2 - dw / 2;

      // LIMITES para não sair da tela (sem mudar pra cima)
      const maxLeft = window.innerWidth - dw - margin;
      const maxTop = window.innerHeight - dh - margin;

      left = Math.max(margin, Math.min(left, maxLeft));
      top = Math.min(top, maxTop); // se faltar espaço, apenas encosta no limite

      dd.style.top = `${top}px`;
      dd.style.left = `${left}px`;
    }, 0);
  }

  selecionarStatus(
    meta: MetaExtended,
    mesId: number,
    status: StatusMeta
  ): void {
    const mes = meta.meses.find((m) => m.id === mesId);
    if (!mes) return;

    mes.status = status;

    // Emitir evento para o pai
    this.alternarStatus.emit({
      metaId: meta.id,
      mesId: mesId,
      status: status as any,
    });

    // Verificar se a meta foi completada após alterar o status
    if (status === 'Pago') {
      this.verificarMetaCompleta(meta);
    }

    meta.dropdownOpen = undefined;
  }

  // Verificar se uma meta foi completada (atingiu 100%)
  private verificarMetaCompleta(meta: MetaExtended): void {
    const valorMeta = Number(meta.valorMeta) || 0;
    if (valorMeta <= 0) return;

    const valorAtual = Number(meta.valorAtual) || 0; // "Quanto já temos"
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + (Number(x.valor) || 0), 0); // "Quanto já pagamos"

    const totalRealizado = valorAtual + valorPago;
    const progresso = Number(((totalRealizado * 100) / valorMeta).toFixed(2));

    // Se atingiu 100% E tem pelo menos um mês pago E ainda não foi marcada como completa
    const temMesesPagos = (meta.meses ?? []).some((x) => x.status === 'Pago');
    if (progresso >= 100 && temMesesPagos && !this.jaMostrouParabens(meta.id)) {
      this.metaCompleta.emit({
        metaId: meta.id,
        metaNome: meta.nome,
        valorMeta: meta.valorMeta,
      });

      // Marcar que já mostrou parabéns para esta meta (persistir no localStorage)
      this.marcarParabensMostrado(meta.id);

      // Marcar meses restantes como "Finalizado" quando meta atinge 100%
      this.marcarMesesComoFinalizado(meta);
    }
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

  private recalcResumo(): void {
    // Componente de apresentação - os totais são calculados via getters
    // Este método é chamado apenas para forçar a detecção de mudanças
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
      (mes as any).status = 'Finalizado';
      mes.valor = 0; // Zerar o valor já que a meta foi completada
    });

    // Atualizar mesesNecessarios para 0 (meta finalizada)
    meta.mesesNecessarios = 0;

    // Salvar no servidor (meses + mesesNecessarios)
    this.metasService
      .updateMeta(meta.id, {
        meses: meta.meses,
        mesesNecessarios: 0,
      })
      .subscribe({
        next: () => {
          this.alternarStatus.emit({
            metaId: meta.id,
            mesId: 0, // Não é um mês específico, mas sim a meta toda
            status: 'Finalizado' as any,
          });
        },
        error: (_error) => {
          // Erro ao finalizar meta
        },
      });
  }

  getTotalContribuicoesMeta(meta: Meta): number {
    if (!meta.meses) return 0;
    return meta.meses.reduce((total, mes) => total + mes.valor, 0);
  }

  getTotalContribuicoesMetaExtended(meta: MetaExtended): number {
    return this.getTotalContribuicoesMeta(meta as any);
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

  get totalContribuicoesPorMes(): number[] {
    if (!this.metas.length || !this.metas[0].meses) return [];

    const mesesCount = this.metas[0].meses.length;
    const totais = new Array(mesesCount).fill(0);

    this.metas.forEach((meta) => {
      if (meta.meses) {
        meta.meses.forEach((mes, index) => {
          if (index < mesesCount) {
            totais[index] += mes.valor;
          }
        });
      }
    });

    return totais;
  }

  fecharModalEdicao(): void {
    this.modalEdicao.isOpen = false;
    this.modalEdicao.valor = 0;
    this.modalEdicao.mesId = -1;
    this.modalEdicao.meta = {} as MetaExtended;
  }

  // Métodos para o modal de edição de valores
  onValorChange(valor: any): void {
    this.modalEdicao.valor = this.parseNumeroBR(valor);
  }

  onValorBlur(): void {
    // Formatar o valor quando sair do campo
    this.modalEdicao.valor = this.parseNumeroBR(this.modalEdicao.valor);
  }

  private parseNumeroBR(v: any): number {
    if (v === null || v === undefined) return 0;

    // para garantir: transforma em string e tira espaços (inclui NBSP)
    let s = String(v).trim();
    if (!s) return 0;

    // remove tudo que não for dígito, vírgula, ponto ou sinal
    // (tira "R$", letras, etc.)
    s = s.replace(/\s+/g, '').replace(/[^\d.,-]+/g, '');

    // Se tem vírgula, tratamos vírgula como decimal e removemos pontos de milhar
    if (s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // sem vírgula: mantemos ponto como decimal (e se tiver só números, ok)
      // (se vier "2.000.000" com vários pontos, você pode remover todos menos o último)
      const parts = s.split('.');
      if (parts.length > 2) {
        const dec = parts.pop(); // último ponto vira decimal
        s = parts.join('') + '.' + dec; // remove pontos de milhar
      }
    }

    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }

  salvarValorModal(): void {
    const { meta, mesId, valor } = this.modalEdicao;
    const i = meta.meses.findIndex((m) => m.id === mesId);

    if (i === -1) {
      alert('Mês não encontrado. Reabra o modal e tente novamente.');
      return;
    }

    meta.meses[i].valor = valor;
    meta.meses[i].status = valor > 0 ? 'Programado' : 'Vazio';

    // Emitir evento para o pai
    this.salvarValor.emit({
      metaId: meta.id,
      mesId: mesId,
      valor: valor,
    });

    this.fecharModalEdicao();
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  cancelarEdicao(): void {
    this.fecharModalEdicao();
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
