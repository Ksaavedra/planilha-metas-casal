import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  OnDestroy,
  Output,
  SimpleChanges,
  HostListener,
  Renderer2,
  Inject,
  DOCUMENT
} from '@angular/core';

import {
  Meta,
  MetaExtended,
  StatusMeta,
} from '../../../../../core/interfaces/mes-meta';
import { MetasService } from '../../../../../core/services/metas/metas.service';
import { ModalEditarValorService } from '../../../../../core/services/modal-editar-valor.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-executando-metas',
    templateUrl: './executando-metas.component.html',
    styleUrls: ['./executando-metas.component.scss'],
    standalone: false
})
export class ExecutandoMetasComponent implements OnInit, OnChanges, OnDestroy {
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
  openDropdownKey: string | null = null;
  dropdownPos = { top: 0, left: 0 };

  private activeMeta: MetaExtended | null = null;
  private activeMesId: number | null = null;
  private editarValorSubscription?: Subscription;
  private dropdownElement: HTMLElement | null = null;

  constructor(
    private metasService: MetasService,
    private modalEditarValorService: ModalEditarValorService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

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

  trackByMetaId(_: number, meta: any): string | number {
    return meta.id;
  }
  trackByMesId(_: number, mes: any): string | number {
    return mes.id;
  }

  ngOnInit() {
    // Componente de apresentação - dados vêm via @Input()
    // Escutar eventos de save da modal de editar valor
    this.editarValorSubscription = this.modalEditarValorService.save$.subscribe(
      (data: { metaId: number | string; mesId: number; valor: number }) => {
        const { metaId, mesId, valor } = data;
        const meta = this.metas.find((m) => String(m.id) === String(metaId));
        if (!meta) return;

        const mes = meta.meses.find((m) => m.id === mesId);
        if (!mes) return;

        mes.valor = valor;
        mes.status = valor > 0 ? 'Programado' : 'Vazio';

        // Emitir evento para o pai
        this.salvarValor.emit({
          metaId,
          mesId,
          valor,
        });
      }
    );
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
    this.modalEditarValorService.open(meta, mesId, this.meses);
  }

  // Métodos para formatação de moeda
  formatBR(n: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(n);
  }

  private getCellKey(metaId: string | number, mesId: string | number): string {
    return `${metaId}_${mesId}`;
  }

  isDropdownOpen(metaId: number | string, mesId: number): boolean {
    return this.openDropdownKey === this.getCellKey(metaId, mesId);
  }

  getActiveMes() {
    if (!this.activeMeta || this.activeMesId === null) return null;
    return this.activeMeta.meses?.find((m) => m.id === this.activeMesId);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.closeDropdown();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.closeDropdown();
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event?: MouseEvent): void {
    // Não fechar se clicar no próprio dropdown ou no botão de status
    if (event?.target) {
      const target = event.target as HTMLElement;
      // Verificar se clicou no dropdown ou em qualquer elemento dentro dele
      if (target.closest('.status-dropdown-overlay')) {
        return;
      }
      // Verificar se clicou no botão de status (status-indicator) ou na seta
      if (
        target.closest('.status-indicator') ||
        target.closest('.status-indicator-wrapper')
      ) {
        return;
      }
      // Verificar se clicou no ícone material-icons dentro do status-indicator
      if (
        target.classList.contains('material-icons') &&
        target.closest('.status-indicator')
      ) {
        return;
      }
    }
    this.removeDropdownFromBody();
    this.openDropdownKey = null;
    this.activeMeta = null;
    this.activeMesId = null;
    this.dropdownPos = { top: 0, left: 0 };
  }

  ngOnDestroy(): void {
    this.removeDropdownFromBody();
    if (this.editarValorSubscription) {
      this.editarValorSubscription.unsubscribe();
    }
  }

  private removeDropdownFromBody(): void {
    if (this.dropdownElement && this.dropdownElement.parentNode) {
      this.renderer.removeChild(this.document.body, this.dropdownElement);
      this.dropdownElement = null;
    }
  }

  private createDropdownInBody(): HTMLElement {
    // Remove dropdown anterior se existir
    this.removeDropdownFromBody();

    // Criar elemento dropdown
    const dropdown = this.renderer.createElement('div');
    this.renderer.addClass(dropdown, 'status-dropdown-overlay');

    // Aplicar estilos diretamente via Renderer2
    this.renderer.setStyle(dropdown, 'position', 'fixed');
    this.renderer.setStyle(dropdown, 'z-index', '99999');
    this.renderer.setStyle(dropdown, 'min-width', '120px');
    this.renderer.setStyle(dropdown, 'background', '#ffffff');
    this.renderer.setStyle(dropdown, 'border', '2px solid #8b5cf6');
    this.renderer.setStyle(dropdown, 'border-radius', '8px');
    this.renderer.setStyle(
      dropdown,
      'box-shadow',
      '0 10px 22px rgba(0, 0, 0, 0.18)'
    );
    this.renderer.setStyle(dropdown, 'display', 'block');
    this.renderer.setStyle(dropdown, 'visibility', 'visible');
    this.renderer.setStyle(dropdown, 'opacity', '1');
    this.renderer.setStyle(dropdown, 'pointer-events', 'auto');
    this.renderer.setStyle(dropdown, 'transform', 'none');
    this.renderer.setStyle(dropdown, 'margin', '0');
    this.renderer.setStyle(dropdown, 'padding', '0');

    // Criar opções
    const options = ['Programado', 'Pago', 'Vazio'];
    options.forEach((option) => {
      const optionDiv = this.renderer.createElement('div');
      this.renderer.addClass(optionDiv, 'dropdown-option');
      this.renderer.setAttribute(optionDiv, 'data-status', option);

      const text = this.renderer.createText(option);
      this.renderer.appendChild(optionDiv, text);

      // Adicionar classe selected se for o status atual
      if (this.activeMeta && this.getActiveMes()?.status === option) {
        this.renderer.addClass(optionDiv, 'selected');
      }

      // Adicionar evento de click
      this.renderer.listen(optionDiv, 'click', (e: Event) => {
        e.stopPropagation();
        this.selecionarStatusByOverlay(option as StatusMeta);
      });

      this.renderer.appendChild(dropdown, optionDiv);
    });

    // Adicionar ao body
    this.renderer.appendChild(this.document.body, dropdown);
    this.dropdownElement = dropdown;

    // Adicionar evento para não fechar ao clicar dentro
    this.renderer.listen(dropdown, 'click', (e: Event) => {
      e.stopPropagation();
    });

    return dropdown;
  }

  selecionarStatusByOverlay(status: StatusMeta): void {
    if (!this.activeMeta || this.activeMesId === null) return;
    this.selecionarStatus(this.activeMeta, this.activeMesId, status);
    this.closeDropdown();
  }

  toggleDropdown(meta: MetaExtended, mesId: number, event: MouseEvent): void {
    // Prevenir que o evento de click do document feche o dropdown imediatamente
    event?.stopPropagation();
    event?.preventDefault();

    const key = this.getCellKey(meta.id, mesId);

    // Se o dropdown já está aberto para esta célula, fechar
    if (this.openDropdownKey === key) {
      this.closeDropdown();
      return;
    }

    // Usar currentTarget (o elemento com o evento) ou target (onde foi clicado)
    const targetElement =
      (event?.currentTarget as HTMLElement) || (event?.target as HTMLElement);
    if (!targetElement) {
      return;
    }

    // Buscar o wrapper que contém o status-indicator
    // Pode estar no próprio elemento ou em algum parent
    let anchor = targetElement.closest(
      '.status-indicator-wrapper'
    ) as HTMLElement;

    // Se não encontrou no target, tentar no currentTarget
    if (!anchor && event?.currentTarget) {
      anchor = (event.currentTarget as HTMLElement).closest(
        '.status-indicator-wrapper'
      ) as HTMLElement;
    }

    // Se ainda não encontrou, buscar pela célula da tabela
    if (!anchor) {
      const cell = targetElement.closest(
        '[data-meta-id][data-mes-id]'
      ) as HTMLElement;
      if (cell) {
        anchor = cell.querySelector('.status-indicator-wrapper') as HTMLElement;
      }
    }

    if (!anchor) {
      return;
    }

    // Calcular posição inicial ANTES de abrir o dropdown
    const anchorRect = anchor.getBoundingClientRect();
    const margin = 8;
    const estimatedDropdownWidth = 120;
    const estimatedDropdownHeight = 100;

    // Calcular posição estimada
    let top = anchorRect.bottom + margin;
    let left =
      anchorRect.left + anchorRect.width / 2 - estimatedDropdownWidth / 2;

    // Limites da viewport - usar document.documentElement para valores mais precisos
    const viewportWidth =
      document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight =
      document.documentElement.clientHeight || window.innerHeight;
    const minLeft = margin;
    const maxLeft = viewportWidth - estimatedDropdownWidth - margin;
    const minTop = margin;
    const maxTop = viewportHeight - estimatedDropdownHeight - margin;

    // Ajustar horizontalmente
    if (left < minLeft) {
      left = minLeft;
    } else if (left > maxLeft) {
      left = maxLeft;
    }

    // Ajustar verticalmente
    if (top + estimatedDropdownHeight > viewportHeight) {
      top = anchorRect.top - estimatedDropdownHeight - margin;
      if (top < minTop) {
        top = Math.max(minTop, Math.min(maxTop, anchorRect.top));
      }
    } else if (top < minTop) {
      top = minTop;
    }

    // Garantir que top e left sejam valores válidos e dentro da viewport
    const finalTop = Math.max(
      margin,
      Math.min(top, viewportHeight - estimatedDropdownHeight - margin)
    );
    const finalLeft = Math.max(
      margin,
      Math.min(left, viewportWidth - estimatedDropdownWidth - margin)
    );

    // Definir posição inicial ANTES de abrir
    this.dropdownPos = { top: finalTop, left: finalLeft };

    // Agora abrir o dropdown
    this.openDropdownKey = key;
    this.activeMeta = meta;
    this.activeMesId = mesId;

    // Criar dropdown diretamente no body para evitar problemas de posicionamento
    const dd = this.createDropdownInBody();

    // Aplicar posição inicial
    this.renderer.setStyle(dd, 'top', `${finalTop}px`);
    this.renderer.setStyle(dd, 'left', `${finalLeft}px`);

    // Ajustar posição após renderização com dimensões reais
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!anchor || !this.document.contains(anchor)) {
          return;
        }

        if (!dd || !this.document.body.contains(dd)) {
          return;
        }

        // Recalcular com dimensões reais
        const realAnchorRect = anchor.getBoundingClientRect();
        const realDropdownWidth = dd.offsetWidth || estimatedDropdownWidth;
        const realDropdownHeight = dd.offsetHeight || estimatedDropdownHeight;

        // Usar getBoundingClientRect que já retorna coordenadas relativas à viewport
        let adjustedTop = realAnchorRect.bottom + margin;
        let adjustedLeft =
          realAnchorRect.left +
          realAnchorRect.width / 2 -
          realDropdownWidth / 2;

        // Obter dimensões reais da viewport
        const realViewportWidth =
          document.documentElement.clientWidth || window.innerWidth;
        const realViewportHeight =
          document.documentElement.clientHeight || window.innerHeight;

        // Ajustar horizontalmente - garantir que não saia da tela
        if (adjustedLeft < margin) {
          adjustedLeft = margin;
        } else if (
          adjustedLeft + realDropdownWidth >
          realViewportWidth - margin
        ) {
          adjustedLeft = realViewportWidth - realDropdownWidth - margin;
        }

        // Ajustar verticalmente - tentar embaixo primeiro
        if (adjustedTop + realDropdownHeight > realViewportHeight - margin) {
          // Não coube embaixo, colocar em cima
          adjustedTop = realAnchorRect.top - realDropdownHeight - margin;
          // Se ainda não couber em cima, ajustar para dentro da viewport
          if (adjustedTop < margin) {
            adjustedTop = margin;
          }
        }
        // Garantir que não fique muito alto
        if (adjustedTop < margin) {
          adjustedTop = margin;
        }

        if (adjustedTop + realDropdownHeight > realViewportHeight - margin) {
          adjustedTop = realViewportHeight - realDropdownHeight - margin;
        }
        // Garantir valores finais válidos
        adjustedTop = Math.max(
          margin,
          Math.min(
            adjustedTop,
            realViewportHeight - realDropdownHeight - margin
          )
        );
        adjustedLeft = Math.max(
          margin,
          Math.min(adjustedLeft, realViewportWidth - realDropdownWidth - margin)
        );

        // Atualizar posição com valores reais
        this.dropdownPos = {
          top: adjustedTop,
          left: adjustedLeft,
        };

        // Aplicar via Renderer2 para garantir que os estilos sejam aplicados
        this.renderer.setStyle(dd, 'top', `${adjustedTop}px`);
        this.renderer.setStyle(dd, 'left', `${adjustedLeft}px`);

        // Ajustar se estiver fora da viewport
        setTimeout(() => {
          const finalRect = dd.getBoundingClientRect();
          const viewportHeight =
            document.documentElement.clientHeight || window.innerHeight;
          const viewportWidth =
            document.documentElement.clientWidth || window.innerWidth;

          const isInViewport =
            finalRect.top >= 0 &&
            finalRect.left >= 0 &&
            finalRect.bottom <= viewportHeight &&
            finalRect.right <= viewportWidth;

          if (!isInViewport) {
            let fixedTop = adjustedTop;
            let fixedLeft = adjustedLeft;

            if (finalRect.top < 0) {
              fixedTop = margin;
            }
            if (finalRect.left < 0) {
              fixedLeft = margin;
            }
            if (finalRect.bottom > viewportHeight) {
              fixedTop = viewportHeight - realDropdownHeight - margin;
            }
            if (finalRect.right > viewportWidth) {
              fixedLeft = viewportWidth - realDropdownWidth - margin;
            }

            this.dropdownPos = {
              top: Math.max(margin, fixedTop),
              left: Math.max(margin, fixedLeft),
            };

            this.renderer.setStyle(dd, 'top', `${this.dropdownPos.top}px`);
            this.renderer.setStyle(dd, 'left', `${this.dropdownPos.left}px`);
          }
        }, 100);
      });
    });
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
        meses: meta.meses.map((m) => ({ ...m })),
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
}
