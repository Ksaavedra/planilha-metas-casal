import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { MetaExtended } from '../../../../core/interfaces/mes-meta';
import { AVAILABLE_META_ICONS } from '../../../../core/constants/meta-icons.constant';

@Component({
  selector: 'app-progress-table',
  templateUrl: './progress-table.component.html',
  styleUrls: ['./progress-table.component.scss'],
})
export class ProgressTableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() metas: MetaExtended[] = [];

  currentIndex = 0;
  cardsPerView = 3;
  private interval: any;
  private isPaused = false;

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
    const valorAtual = meta.valorAtual || 0;
    const valorPago = meta.meses
      .filter((mes) => mes.status === 'Pago')
      .reduce((total, mes) => total + (mes.valor || 0), 0);

    const totalRealizado = valorAtual + valorPago;
    const percentual = (totalRealizado / meta.valorMeta) * 100;

    return Math.min(percentual, 100);
  }

  getValorRealizadoMeta(meta: MetaExtended): number {
    const valorAtual = meta.valorAtual || 0;
    const valorPago = meta.meses
      .filter((mes) => mes.status === 'Pago')
      .reduce((total, mes) => total + (mes.valor || 0), 0);

    return valorAtual + valorPago;
  }

  getValorFaltanteMeta(meta: MetaExtended): number {
    const valorRealizado = this.getValorRealizadoMeta(meta);
    return Math.max(meta.valorMeta - valorRealizado, 0);
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
    // Inicia carrossel automático se tiver mais de 6 metas válidas (até 15)
    if (this.metasValidas.length > 6 && this.metasValidas.length <= 15) {
      this.startCarousel();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset currentIndex quando as metas mudam
    if (changes['metas'] && !changes['metas'].firstChange) {
      // Se não tem carrossel (6 ou menos, ou mais de 15), sempre reseta para 0
      if (this.metasValidas.length <= 6 || this.metasValidas.length > 15) {
        this.currentIndex = 0;
        this.stopCarousel();
      } else {
        // Com carrossel (7-15 cards), ajusta currentIndex se necessário
        const maxIndex = Math.max(
          0,
          this.metasValidas.length - this.cardsPerView
        );
        if (this.currentIndex > maxIndex) {
          this.currentIndex = maxIndex;
        }
        this.stopCarousel();
        this.startCarousel();
      }
    }
  }

  startCarousel(): void {
    // Limpa intervalo anterior se existir
    if (this.interval) {
      clearInterval(this.interval);
    }

    // Só inicia se tiver entre 7 e 15 metas válidas
    if (this.metasValidas.length <= 6 || this.metasValidas.length > 15) {
      return;
    }

    // Só inicia se não estiver pausado
    if (this.isPaused) {
      return;
    }

    // Avança automaticamente a cada 3 segundos
    this.interval = setInterval(() => {
      // Verifica novamente se não está pausado antes de avançar
      if (!this.isPaused) {
        if (!this.isLastSlide()) {
          this.nextSlide();
        } else {
          // Volta para o início quando chega no final
          this.currentIndex = 0;
        }
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
    // Só retoma se tiver entre 7 e 15 metas válidas
    if (this.metasValidas.length > 6 && this.metasValidas.length <= 15) {
      this.startCarousel();
    }
  }

  nextSlide(): void {
    // Só avança se tiver carrossel ativo (7-15 cards)
    if (this.metasValidas.length <= 6 || this.metasValidas.length > 15) {
      return;
    }

    // Avança apenas 1 card por vez, considerando apenas metas válidas
    const maxIndex = Math.max(0, this.metasValidas.length - this.cardsPerView);

    if (this.currentIndex < maxIndex) {
      this.currentIndex = this.currentIndex + 1;
    } else {
      // Já está no último slide possível
      this.currentIndex = maxIndex;
    }

    // Reinicia o carrossel automático quando navega manualmente
    this.stopCarousel();
    this.startCarousel();
  }

  prevSlide(): void {
    // Só volta se tiver carrossel ativo (7-15 cards)
    if (this.metasValidas.length <= 6 || this.metasValidas.length > 15) {
      return;
    }

    // Volta apenas 1 card por vez
    if (this.currentIndex > 0) {
      this.currentIndex = this.currentIndex - 1;
    } else {
      // Já está no início
      this.currentIndex = 0;
    }

    // Reinicia o carrossel automático quando navega manualmente
    this.stopCarousel();
    this.startCarousel();
  }

  goToSlide(index: number): void {
    // Com a nova lógica de 1 card por vez, index corresponde diretamente ao currentIndex
    const maxIndex = Math.max(0, this.metasValidas.length - this.cardsPerView);

    // Garante que o índice não ultrapasse o máximo
    if (index > maxIndex) {
      this.currentIndex = maxIndex;
    } else if (index < 0) {
      this.currentIndex = 0;
    } else {
      this.currentIndex = index;
    }

    // Reinicia o carrossel automático quando clica em um indicador
    if (this.metasValidas.length > 6 && this.metasValidas.length <= 15) {
      this.stopCarousel();
      this.startCarousel();
    }
  }

  isLastSlide(): boolean {
    // Verifica se já está no último slide possível
    // Com 3 cards visíveis, o último índice é (metasValidas.length - 3)
    const maxIndex = Math.max(0, this.metasValidas.length - this.cardsPerView);
    return this.currentIndex >= maxIndex;
  }

  getTranslateX(): string {
    // Volta para navegação normal baseada no currentIndex
    // Só aplica translateX se tiver carrossel ativo (7-15 metas válidas)
    if (this.metasValidas.length > 6 && this.metasValidas.length <= 15) {
      // Calcula o translateX baseado no currentIndex: cada card tem 260px + 16px de gap = 276px
      if (this.currentIndex > 0) {
        const translateValue = this.currentIndex * 276;
        return `translateX(-${translateValue}px)`;
      }
      return 'translateX(0)';
    }

    // Sem carrossel: sempre retorna translateX(0)
    return 'translateX(0)';
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
