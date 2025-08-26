import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta } from '../../../../core/interfaces/mes-meta';

@Component({
  selector: 'app-progress-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-table.component.html',
  styleUrls: ['./progress-table.component.scss'],
})
export class ProgressTableComponent implements OnInit, OnDestroy {
  @Input() metas: Meta[] = [];

  constructor() {}

  ngOnInit(): void {
    // Inicialização se necessário
  }

  ngOnDestroy(): void {
    // Cleanup se necessário
  }

  getProgressoRealMeta(meta: Meta): number {
    if (!meta || !meta.meses) return 0;

    const totalMeta = meta.valorMeta;
    const valorAtual = meta.valorAtual || 0;
    const valorPago = meta.meses
      .filter((mes) => mes.status === 'Pago')
      .reduce((sum, mes) => sum + (mes.valor || 0), 0);

    const totalRealizado = valorAtual + valorPago;
    const progresso = totalMeta > 0 ? (totalRealizado / totalMeta) * 100 : 0;

    return Math.min(progresso, 100);
  }

  getValorRealizadoMeta(meta: Meta): number {
    if (!meta || !meta.meses) return 0;

    const valorAtual = meta.valorAtual || 0;
    const valorPago = meta.meses
      .filter((mes) => mes.status === 'Pago')
      .reduce((sum, mes) => sum + (mes.valor || 0), 0);

    return valorAtual + valorPago;
  }

  getValorFaltanteMeta(meta: Meta): number {
    const totalMeta = meta.valorMeta;
    const valorRealizado = this.getValorRealizadoMeta(meta);
    return Math.max(0, totalMeta - valorRealizado);
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  // Métodos para o carrossel CSS puro
  scrollLeft(): void {
    const carousel = document.querySelector('.carousel') as HTMLElement;
    if (carousel) {
      carousel.scrollBy({
        left: -320,
        behavior: 'smooth',
      });
    }
  }

  scrollRight(): void {
    const carousel = document.querySelector('.carousel') as HTMLElement;
    if (carousel) {
      carousel.scrollBy({
        left: 320,
        behavior: 'smooth',
      });
    }
  }
}
