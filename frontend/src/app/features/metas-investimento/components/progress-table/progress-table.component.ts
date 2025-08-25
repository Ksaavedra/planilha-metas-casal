import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetaExtended } from '../../../../core/interfaces/mes-meta';

@Component({
  selector: 'app-progress-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-table.component.html',
  styleUrls: ['./progress-table.component.scss'],
})
export class ProgressTableComponent implements OnInit, OnDestroy {
  @Input() metas: MetaExtended[] = [];

  currentIndex = 0;
  private interval: any;

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

  ngOnInit(): void {
    this.startCarousel();
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  startCarousel(): void {
    this.interval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide(): void {
    if (this.metas.length <= 2) return;

    this.currentIndex = (this.currentIndex + 2) % this.metas.length;
    if (this.currentIndex >= this.metas.length - 1) {
      this.currentIndex = 0;
    }
  }

  prevSlide(): void {
    if (this.metas.length <= 2) return;

    this.currentIndex = this.currentIndex - 2;
    if (this.currentIndex < 0) {
      this.currentIndex = Math.max(0, this.metas.length - 2);
    }
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
  }

  getVisibleMetas(): MetaExtended[] {
    return this.metas.slice(this.currentIndex, this.currentIndex + 2);
  }

  getTotalSlides(): number {
    return Math.ceil(this.metas.length / 2);
  }

  getCurrentSlideNumber(): number {
    return Math.floor(this.currentIndex / 2) + 1;
  }
}
