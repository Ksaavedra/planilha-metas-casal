import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { MetaExtended } from '../../../../core/interfaces/metas/mes-meta';
import { AVAILABLE_META_ICONS } from '../../../../core/constants/meta-icons.constant';
import {
  getValorFaltanteMeta,
  getValorRealizadoMeta,
} from '@core/interfaces/metas/metas-parabens';

@Component({
  selector: 'app-progress-table',
  templateUrl: './progress-table.component.html',
  styleUrls: ['./progress-table.component.scss'],
  standalone: false,
})
export class ProgressTableComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  @Input() metas: MetaExtended[] = [];
  @ViewChild('wrapper') wrapperRef!: ElementRef<HTMLElement>;
  @ViewChild('content') contentRef!: ElementRef<HTMLElement>;

  currentIndex = 0;
  // cardsPerView = 3;
  private cardStep = 276;
  private maxTranslate = 0;
  private isPaused = false;
  private interval: any;
  private readonly MAX_CARDS = 15;
  private endOffset = 0;
  private visibleWidth = 0;

  // Filtra apenas metas com dados válidos
  get metasValidas(): MetaExtended[] {
    return this.metas.filter((meta) => {
      // Verifica se tem nome válido
      if (!meta.nome || meta.nome.trim() === '') {
        return false;
      }
      // Verifica se tem valorMeta válido
      if (!meta.valorMeta || meta.valorMeta <= 0) {
        return false;
      }
      // Não mostra drafts
      if (meta._draft === true) {
        return false;
      }
      return true;
    });
  }

  getProgressoRealMeta(meta: MetaExtended): number {
    const valorMeta = Number(meta.valorMeta) || 0;
    if (valorMeta <= 0) return 0;

    const totalRealizado = getValorRealizadoMeta(meta);
    const percentual = (totalRealizado / valorMeta) * 100;

    return Math.min(Number(percentual.toFixed(2)), 100);
  }

  getValorRealizadoMeta(meta: MetaExtended): number {
    return getValorRealizadoMeta(meta);
  }

  getValorFaltanteMeta(meta: MetaExtended): number {
    return getValorFaltanteMeta(meta);
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  getMetaIcon(meta: MetaExtended): string {
    // Se a meta tem um ícone salvo, usa ele diretamente
    if (meta.icon && meta.icon.trim() !== '') {
      return meta.icon;
    }

    // Caso contrário, tenta detectar pelo label da constante AVAILABLE_META_ICONS
    const nomeLower = meta.nome.toLowerCase();
    for (const iconItem of AVAILABLE_META_ICONS) {
      const labelLower = iconItem.label.toLowerCase();
      if (nomeLower.includes(labelLower) || labelLower.includes(nomeLower)) {
        return iconItem.value;
      }
    }

    // Padrão: retorna o primeiro ícone da constante AVAILABLE_META_ICONS (bi-bullseye)
    return AVAILABLE_META_ICONS[0].value;
  }

  getGradientColor(index: number): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    ];
    return gradients[index % gradients.length];
  }

  ngOnInit(): void {
    // Para 7-15 cards, inicia mostrando os últimos 3 cards (translateX fixo)
    // Define currentIndex inicial baseado no número de cards
    if (this.metasValidas.length >= 7 && this.metasValidas.length <= 15) {
      // Inicia no índice que mostra os últimos 3 cards visíveis
      // Mas como estamos usando translateX fixo, currentIndex começa em 0
      // e o translateX fixo já mostra os últimos cards
      this.currentIndex = 0;
      this.startCarousel();
    }

    if (this.hasCarousel()) {
      this.currentIndex = 0;
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.recalcLayout();
      if (this.hasCarousel()) this.currentIndex = 0;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['metas'] && !changes['metas'].firstChange) {
      if (this.metasValidas.length <= 6 || this.metasValidas.length > 15) {
        this.currentIndex = 0;
        this.stopCarousel();
        return;
      }

      setTimeout(() => {
        this.recalcLayout();

        if (this.hasCarousel()) {
          this.currentIndex = 0;
          this.startCarousel();
          return;
        }

        const maxIndex = this.getMaxIndex();
        this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));

        this.stopCarousel();
        this.startCarousel();
      });
    }
  }

  startCarousel(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (!this.hasCarousel()) return;
    if (this.isPaused) return;

    this.interval = setInterval(() => {
      if (this.isPaused) return;
      if (!this.isLastSlide()) {
        this.nextSlide();
      } else {
        this.currentIndex = 0;
      }
    }, 3000);
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  stopCarousel(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  pauseCarousel(): void {
    this.isPaused = true;
    this.stopCarousel();
  }

  resumeCarousel(): void {
    this.isPaused = false;
    if (this.hasCarousel()) this.startCarousel();
  }

  nextSlide(): void {
    if (!this.hasCarousel()) return;

    this.recalcLayout();
    const maxIndex = this.getMaxIndex();

    if (this.currentIndex >= maxIndex) {
      return;
    }

    this.currentIndex++;
    this.stopCarousel();
    this.startCarousel();
  }

  prevSlide(): void {
    if (!this.hasCarousel()) return;

    this.recalcLayout();
    const maxIndex = this.getMaxIndex();

    this.currentIndex =
      this.currentIndex > 0 ? this.currentIndex - 1 : maxIndex;

    this.stopCarousel();
    this.startCarousel();
  }

  goToSlide(index: number): void {
    // Com a nova lógica de 1 card por vez, index corresponde diretamente ao currentIndex
    const maxIndex = this.getMaxIndex();

    // Garante que o índice não ultrapasse o máximo
    if (index > maxIndex) {
      this.currentIndex = maxIndex;
    } else if (index < 0) {
      this.currentIndex = 0;
    } else {
      this.currentIndex = index;
    }

    this.recalcLayout();

    // Reinicia o carrossel automático quando clica em um indicador
    if (this.metasValidas.length > 6 && this.metasValidas.length <= 15) {
      this.stopCarousel();
      this.startCarousel();
    }
  }

  private hasCarousel(): boolean {
    const total = this.metasValidas.length;
    return total > 6 && total <= this.MAX_CARDS;
  }

  private getMaxIndex(): number {
    if (this.cardStep <= 0) return 0;
    const maxWithPadding = Math.max(0, this.maxTranslate + this.endOffset);
    return Math.max(0, Math.floor(maxWithPadding / this.cardStep));
  }

  isLastSlide(): boolean {
    return this.currentIndex >= this.getMaxIndex();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.recalcLayout();
  }

  private recalcLayout(): void {
    const wrapper = this.wrapperRef?.nativeElement;
    const content = this.contentRef?.nativeElement;
    if (!wrapper || !content) return;

    const firstCard = content.querySelector<HTMLElement>(
      '.meta-card:not(.placeholder-card)',
    );

    if (firstCard) {
      const contentStyles = getComputedStyle(content);
      const gap =
        parseFloat(contentStyles.gap || contentStyles.columnGap || '0') || 0;

      this.cardStep = firstCard.offsetWidth + gap;
    }

    const wrapperStyles = getComputedStyle(wrapper);
    const paddingLeft = parseFloat(wrapperStyles.paddingLeft || '0') || 0;
    const paddingRight = parseFloat(wrapperStyles.paddingRight || '0') || 0;

    this.visibleWidth = Math.max(
      0,
      wrapper.clientWidth - paddingLeft - paddingRight,
    );

    // ✅ AQUI ERA O BUG (faltava o "=")
    this.endOffset = paddingRight;

    this.maxTranslate = Math.max(0, content.scrollWidth - this.visibleWidth);

    const maxIndex = this.getMaxIndex();
    this.currentIndex = Math.max(0, Math.min(this.currentIndex, maxIndex));
  }

  getTranslateX(): string {
    if (!this.hasCarousel()) return 'translateX(0px)';

    const raw = this.currentIndex * this.cardStep;
    const maxWithPadding = Math.max(0, this.maxTranslate + this.endOffset);
    const safe = Math.min(raw, maxWithPadding);
    return `translateX(-${safe}px)`;
  }

  getPlaceholderCards(): number[] {
    // Se não há metas válidas, não mostra placeholders
    if (this.metasValidas.length === 0) {
      return [];
    }

    // Se tiver 8 ou mais cards (até 15), nunca mostra placeholders
    // Mostra todos os cards sem espaços vazios
    if (this.metasValidas.length >= 8 && this.metasValidas.length <= 15) {
      return [];
    }

    // Com 7 cards ou menos: sem carrossel, não mostra placeholders
    if (this.metasValidas.length <= 7) {
      return [];
    }

    // Para mais de 15 cards: não mostra placeholders (caso especial)
    if (this.metasValidas.length > 15) {
      return [];
    }

    return [];
  }
}
