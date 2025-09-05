import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [CommonModule],
  declarations: [],
  exports: [],
})
export class NgxEchartsModule {}

export const NGX_ECHARTS_CONFIG = {
  echarts: () => import('echarts'),
};
