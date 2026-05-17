import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  HostListener,
  Renderer2,
  Inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import {
  mesExecucaoDesabilitado,
  metaEstaConcluida,
} from '@core/interfaces/metas/metas-parabens';

import {
  Meta,
  MetaExtended,
  StatusMeta,
} from '@core/interfaces/metas/mes-meta';
import {
  EditarValorDialogData,
  EditarValorDialogResult,
} from '@core/interfaces/metas/editar-modal';
import { EditarValorDialogComponent } from '../../editar-valor-dialog/editar-valor-dialog.component';

export type ViewportSize = { width: number; height: number };
export type DropdownPos = { top: number; left: number };

@Component({
  selector: 'app-executando-metas',
  templateUrl: './executando-metas.component.html',
  styleUrls: ['./executando-metas.component.scss'],
  standalone: false,
})
export class ExecutandoMetasComponent implements OnChanges, OnDestroy {
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
  private dropdownElement: HTMLElement | null = null;

  /** Medidas aproximadas usadas no primeiro cálculo de posição (antes do layout real do DOM). */
  private readonly dropdownLayout = {
    margin: 8,
    estWidth: 120,
    estHeight: 100,
  } as const;

  constructor(
    private dialog: MatDialog,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['metas']?.currentValue || changes['meses']) {
      this.metas.forEach((m) => this.normalizeMeses(m));
    }
  }

  private normalizeMeses(meta: MetaExtended): void {
    const header = this.meses.length ? this.meses : this.MESES_PADRAO;
    const byName = new Map((meta.meses ?? []).map((m) => [m.nome, m]));
    meta.meses = header.map(
      (nome, i) =>
        byName.get(nome) ?? { id: i + 1, nome, valor: 0, status: 'Vazio' },
    );
  }

  formatBR(n: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(n);
  }

  mesEstaDesabilitado(meta: MetaExtended, mesIndex: number): boolean {
    return mesExecucaoDesabilitado(meta, mesIndex);
  }

  abrirModalEdicao(
    meta: MetaExtended,
    mesId: number,
    mesIndex: number,
    event?: MouseEvent,
  ): void {
    event?.stopPropagation();
    this.closeDropdown();

    if (this.mesEstaDesabilitado(meta, mesIndex)) return;

    const mes = meta.meses?.find((m) => m.id === mesId);
    if (!mes) return;

    const meses =
      this.meses.length > 0
        ? this.meses
        : (meta.meses?.map((m) => m.nome) ?? [...this.MESES_PADRAO]);

    const data: EditarValorDialogData = { meta, mesId, meses };
    const ref = this.dialog.open(EditarValorDialogComponent, {
      width: 'min(420px, 96vw)',
      maxHeight: '90vh',
      data,
      autoFocus: 'dialog',
      restoreFocus: true,
    });

    ref.afterClosed().subscribe((result?: EditarValorDialogResult) => {
      if (!result) return;
      this.aplicarValorSalvo(result);
    });
  }

  private aplicarValorSalvo(result: EditarValorDialogResult): void {
    const { metaId, mesId, valor } = result;
    const meta = this.metas.find((m) => String(m.id) === String(metaId));
    if (!meta) return;

    const mes = meta.meses.find((m) => m.id === mesId);
    if (!mes) return;

    mes.valor = valor;
    mes.status = valor > 0 ? 'Programado' : 'Vazio';

    this.salvarValor.emit({ metaId, mesId, valor });
    this.verificarMetaCompleta(meta);
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

  @HostListener('document:click', ['$event'])
  closeDropdown(event?: MouseEvent): void {
    if (event?.target) {
      const target = event.target as HTMLElement;

      if (target.closest('.status-dropdown-overlay')) {
        return;
      }

      if (
        target.closest('.status-indicator') ||
        target.closest('.status-indicator-wrapper')
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
  }

  private removeDropdownFromBody(): void {
    if (this.dropdownElement && this.dropdownElement.parentNode) {
      this.renderer.removeChild(this.document.body, this.dropdownElement);
      this.dropdownElement = null;
    }
  }

  private createDropdownInBody(): HTMLElement {
    this.removeDropdownFromBody();

    const dropdown = this.renderer.createElement('div');
    this.renderer.addClass(dropdown, 'status-dropdown-overlay');
    this.applyStatusDropdownHostStyles(dropdown);
    this.mountStatusOptionRows(dropdown);

    this.renderer.appendChild(this.document.body, dropdown);
    this.dropdownElement = dropdown;

    this.renderer.listen(dropdown, 'click', (e: Event) => {
      e.stopPropagation();
    });

    return dropdown;
  }

  private applyStatusDropdownHostStyles(host: HTMLElement): void {
    this.renderer.setStyle(host, 'position', 'fixed');
    this.renderer.setStyle(host, 'z-index', '99999');
    this.renderer.setStyle(host, 'min-width', '120px');
    this.renderer.setStyle(host, 'background', '#ffffff');
    this.renderer.setStyle(host, 'border', '2px solid #8b5cf6');
    this.renderer.setStyle(host, 'border-radius', '8px');
    this.renderer.setStyle(
      host,
      'box-shadow',
      '0 10px 22px rgba(0, 0, 0, 0.18)',
    );
    this.renderer.setStyle(host, 'display', 'block');
    this.renderer.setStyle(host, 'visibility', 'visible');
    this.renderer.setStyle(host, 'opacity', '1');
    this.renderer.setStyle(host, 'pointer-events', 'auto');
    this.renderer.setStyle(host, 'transform', 'none');
    this.renderer.setStyle(host, 'margin', '0');
    this.renderer.setStyle(host, 'padding', '0');
  }

  private mountStatusOptionRows(dropdown: HTMLElement): void {
    const options = ['Programado', 'Pago', 'Vazio'];
    options.forEach((option) => {
      const optionDiv = this.renderer.createElement('div');
      this.renderer.addClass(optionDiv, 'dropdown-option');
      this.renderer.setAttribute(optionDiv, 'data-status', option);

      const text = this.renderer.createText(option);
      this.renderer.appendChild(optionDiv, text);

      if (this.activeMeta && this.getActiveMes()?.status === option) {
        this.renderer.addClass(optionDiv, 'selected');
      }

      this.renderer.listen(optionDiv, 'click', (e: Event) => {
        e.stopPropagation();
        this.selecionarStatusByOverlay(option as StatusMeta);
      });

      this.renderer.appendChild(dropdown, optionDiv);
    });
  }

  selecionarStatusByOverlay(status: StatusMeta): void {
    if (!this.activeMeta || this.activeMesId === null) return;
    const mesIndex =
      this.activeMeta.meses?.findIndex((m) => m.id === this.activeMesId) ?? -1;
    if (mesIndex < 0) return;
    this.selecionarStatus(this.activeMeta, this.activeMesId, mesIndex, status);
    this.closeDropdown();
  }

  toggleDropdown(
    meta: MetaExtended,
    mesId: number,
    mesIndex: number,
    event: MouseEvent,
  ): void {
    event?.stopPropagation();
    event?.preventDefault();

    if (this.mesEstaDesabilitado(meta, mesIndex)) return;

    const key = this.getCellKey(meta.id, mesId);
    if (this.openDropdownKey === key) {
      this.closeDropdown();
      return;
    }

    const anchor = this.resolveStatusIndicatorAnchor(event);
    if (!anchor) {
      return;
    }

    const { margin, estWidth, estHeight } = this.dropdownLayout;
    const anchorRect = anchor.getBoundingClientRect();
    const { width: vw, height: vh } = this.getWindowViewport();

    const { top, left } = this.computeInitialClampedDropdownPosition(
      anchorRect,
      vw,
      vh,
      estWidth,
      estHeight,
      margin,
    );

    this.dropdownPos = { top, left };
    this.openDropdownKey = key;
    this.activeMeta = meta;
    this.activeMesId = mesId;

    const dd = this.createDropdownInBody();
    this.setDropdownElementPosition(dd, top, left);
    this.scheduleDropdownRefinement(anchor, dd, margin, estWidth, estHeight);
  }

  computeInitialClampedDropdownPosition(
    anchorRect: DOMRect,
    viewportWidth: number,
    viewportHeight: number,
    estW: number,
    estH: number,
    margin: number,
  ): DropdownPos {
    const minLeft = margin;
    const maxLeft = viewportWidth - estW - margin;
    const minTop = margin;
    const maxTop = viewportHeight - estH - margin;

    let top = anchorRect.bottom + margin;
    let left = anchorRect.left + anchorRect.width / 2 - estW / 2;

    if (left < minLeft) {
      left = minLeft;
    } else if (left > maxLeft) {
      left = maxLeft;
    }

    if (top + estH > viewportHeight) {
      top = anchorRect.top - estH - margin;
      if (top < minTop) {
        top = Math.max(minTop, Math.min(maxTop, anchorRect.top));
      }
    } else if (top < minTop) {
      top = minTop;
    }

    const finalTop = Math.max(
      margin,
      Math.min(top, viewportHeight - estH - margin),
    );
    const finalLeft = Math.max(
      margin,
      Math.min(left, viewportWidth - estW - margin),
    );
    return { top: finalTop, left: finalLeft };
  }

  private resolveStatusIndicatorAnchor(event: MouseEvent): HTMLElement | null {
    const targetElement =
      (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
    if (!targetElement) {
      return null;
    }

    let anchor = targetElement.closest(
      '.status-indicator-wrapper',
    ) as HTMLElement;

    if (!anchor && event.currentTarget) {
      anchor = (event.currentTarget as HTMLElement).closest(
        '.status-indicator-wrapper',
      ) as HTMLElement;
    }

    if (!anchor) {
      const cell = targetElement.closest(
        '[data-meta-id][data-mes-id]',
      ) as HTMLElement;
      if (cell) {
        anchor = cell.querySelector('.status-indicator-wrapper') as HTMLElement;
      }
    }

    return anchor;
  }

  private getWindowViewport(): { width: number; height: number } {
    return {
      width: this.document.documentElement.clientWidth || window.innerWidth,
      height: this.document.documentElement.clientHeight || window.innerHeight,
    };
  }

  private setDropdownElementPosition(
    dd: HTMLElement,
    top: number,
    left: number,
  ): void {
    this.renderer.setStyle(dd, 'top', `${top}px`);
    this.renderer.setStyle(dd, 'left', `${left}px`);
  }

  private scheduleDropdownRefinement(
    anchor: HTMLElement,
    dd: HTMLElement,
    margin: number,
    estW: number,
    estH: number,
  ): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.refineDropdownPositionAfterLayout(anchor, dd, margin, estW, estH);
      });
    });
  }

  private refineDropdownPositionAfterLayout(
    anchor: HTMLElement,
    dd: HTMLElement,
    margin: number,
    estW: number,
    estH: number,
  ): void {
    if (!this.document.contains(anchor) || !this.document.body.contains(dd)) {
      return;
    }

    const realAnchorRect = anchor.getBoundingClientRect();
    const realW = dd.offsetWidth || estW;
    const realH = dd.offsetHeight || estH;
    const viewport = this.getWindowViewport();

    const pos = this.computeRefinedClampedDropdownPosition(
      realAnchorRect,
      viewport,
      realW,
      realH,
      margin,
    );

    this.dropdownPos = pos;
    this.setDropdownElementPosition(dd, pos.top, pos.left);

    setTimeout(() => {
      this.applyNudgeAfterPaint(dd, margin, pos.top, pos.left, realW, realH);
    }, 100);
  }

  computeRefinedClampedDropdownPosition(
    anchorRect: DOMRect,
    viewport: ViewportSize,
    realW: number,
    realH: number,
    margin: number,
  ): DropdownPos {
    const { width: vw, height: vh } = viewport;

    let adjustedTop = anchorRect.bottom + margin;
    let adjustedLeft = anchorRect.left + anchorRect.width / 2 - realW / 2;

    if (adjustedLeft < margin) {
      adjustedLeft = margin;
    } else if (adjustedLeft + realW > vw - margin) {
      adjustedLeft = vw - realW - margin;
    }

    if (adjustedTop + realH > vh - margin) {
      adjustedTop = anchorRect.top - realH - margin;
      if (adjustedTop < margin) {
        adjustedTop = margin;
      }
    }
    if (adjustedTop < margin) {
      adjustedTop = margin;
    }

    if (adjustedTop + realH > vh - margin) {
      adjustedTop = vh - realH - margin;
    }
    adjustedTop = Math.max(margin, Math.min(adjustedTop, vh - realH - margin));
    adjustedLeft = Math.max(
      margin,
      Math.min(adjustedLeft, vw - realW - margin),
    );

    return { top: adjustedTop, left: adjustedLeft };
  }

  private applyNudgeAfterPaint(
    dd: HTMLElement,
    margin: number,
    adjustedTop: number,
    adjustedLeft: number,
    realW: number,
    realH: number,
  ): void {
    const painted = dd.getBoundingClientRect();
    const viewportWidth =
      this.document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight =
      this.document.documentElement.clientHeight || window.innerHeight;

    const nudged = this.computeNudgePositionIfClipped(
      painted,
      viewportWidth,
      viewportHeight,
      adjustedTop,
      adjustedLeft,
      realW,
      realH,
      margin,
    );
    if (!nudged) {
      return;
    }

    this.dropdownPos = nudged;
    this.setDropdownElementPosition(dd, nudged.top, nudged.left);
  }

  isRectFullyInViewport(
    rect: DOMRect,
    viewportHeight: number,
    viewportWidth: number,
  ): boolean {
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= viewportHeight &&
      rect.right <= viewportWidth
    );
  }

  computeNudgePositionIfClipped(
    paintedRect: DOMRect,
    viewportWidth: number,
    viewportHeight: number,
    adjustedTop: number,
    adjustedLeft: number,
    realW: number,
    realH: number,
    margin: number,
  ): DropdownPos | null {
    if (
      this.isRectFullyInViewport(paintedRect, viewportHeight, viewportWidth)
    ) {
      return null;
    }

    let fixedTop = adjustedTop;
    let fixedLeft = adjustedLeft;

    if (paintedRect.top < 0) {
      fixedTop = margin;
    }
    if (paintedRect.left < 0) {
      fixedLeft = margin;
    }
    if (paintedRect.bottom > viewportHeight) {
      fixedTop = viewportHeight - realH - margin;
    }
    if (paintedRect.right > viewportWidth) {
      fixedLeft = viewportWidth - realW - margin;
    }

    return {
      top: Math.max(margin, fixedTop),
      left: Math.max(margin, fixedLeft),
    };
  }

  selecionarStatus(
    meta: MetaExtended,
    mesId: number,
    mesIndex: number,
    status: StatusMeta,
  ): void {
    if (this.mesEstaDesabilitado(meta, mesIndex)) return;

    const mes = meta.meses.find((m) => m.id === mesId);
    if (!mes) return;

    mes.status = status;

    this.alternarStatus.emit({
      metaId: meta.id,
      mesId: mesId,
      status: status as any,
    });

    if (status === 'Pago') {
      this.verificarMetaCompleta(meta);
    }

    meta.dropdownOpen = undefined;
  }

  private verificarMetaCompleta(meta: MetaExtended): void {
    if (!metaEstaConcluida(meta)) return;

    this.metaCompleta.emit({
      metaId: meta.id,
      metaNome: meta.nome,
      valorMeta: meta.valorMeta,
    });
  }

  getTotalContribuicoesMeta(meta: Meta): number {
    if (!meta.meses) return 0;
    return meta.meses.reduce((total, mes) => total + mes.valor, 0);
  }

  getTotalContribuicoesMetaExtended(meta: MetaExtended): number {
    return this.getTotalContribuicoesMeta(meta as any);
  }

  getMesesRestantes(meta: MetaExtended): number {
    const valorMeta = Number(meta.valorMeta) || 0;
    const valorPorMes = Number(meta.valorPorMes) || 0;

    if (valorMeta <= 0 || valorPorMes <= 0) return 0;

    const valorAtual = Number(meta.valorAtual) || 0;
    const valorPago = (meta.meses ?? [])
      .filter((x) => x.status === 'Pago')
      .reduce((s, x) => s + (Number(x.valor) || 0), 0);

    const totalRealizado = valorAtual + valorPago;
    const valorRestante = Math.max(0, valorMeta - totalRealizado);

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
