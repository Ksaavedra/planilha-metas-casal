import { Component, Input } from '@angular/core';
import { MetaExtended } from '../../../../../core/interfaces/metas/mes-meta';
import { AVAILABLE_META_ICONS } from '../../../../../core/constants/meta-icons.constant';
import {
  getValorFaltanteMeta,
  getValorRealizadoMeta,
} from '@core/interfaces/metas/metas-parabens';

@Component({
  selector: 'app-evolucao-metas',
  templateUrl: './evolucao-metas.component.html',
  styleUrls: ['./evolucao-metas.component.scss'],
  standalone: false,
})
export class EvolucaoMetasComponent {
  @Input() metas: MetaExtended[] = [];

  get metasValidas(): MetaExtended[] {
    return this.metas.filter((meta) => {
      if (!meta.nome || meta.nome.trim() === '') {
        return false;
      }
      if (!meta.valorMeta || meta.valorMeta <= 0) {
        return false;
      }
      if (meta._draft === true) {
        return false;
      }
      return true;
    });
  }

  /** Converte rolagem vertical do mouse em horizontal quando os cards transbordam. */
  onWheel(event: WheelEvent): void {
    const el = event.currentTarget as HTMLElement;
    if (el.scrollWidth <= el.clientWidth + 1) {
      return;
    }
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      return;
    }

    event.preventDefault();
    el.scrollLeft += event.deltaY;
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
    if (meta.icon && meta.icon.trim() !== '') {
      return meta.icon;
    }

    const nomeLower = meta.nome.toLowerCase();
    for (const iconItem of AVAILABLE_META_ICONS) {
      const labelLower = iconItem.label.toLowerCase();
      if (nomeLower.includes(labelLower) || labelLower.includes(nomeLower)) {
        return iconItem.value;
      }
    }

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
}
