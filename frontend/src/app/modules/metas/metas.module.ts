import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DSModule } from 'app/@ds';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MetasRoutingModule } from './metas.routing';
import { MetasPageComponent } from './containers/metas-page/metas-page.component';
import { ElaborandoMetasComponent } from './components/lista-metas/elaborando-metas/elaborando-metas.component';
import { ExecutandoMetasComponent } from './components/lista-metas/executando-metas/executando-metas.component';
import { EvolucaoMetasComponent } from './components/lista-metas/evolucao-metas/evolucao-metas.component';
import { EditarValorDialogComponent } from './components/editar-valor-dialog/editar-valor-dialog.component';
import { ParabensDialogComponent } from './components/parabens-dialog/parabens-dialog.component';
import { AdicionarMetaDialogComponent } from './components/adicionar-meta-dialog/adicionar-meta-dialog.component';
import { SharedModule } from 'shared/shared.module';

@NgModule({
  declarations: [
    MetasPageComponent,
    ElaborandoMetasComponent,
    ExecutandoMetasComponent,
    EvolucaoMetasComponent,
    EditarValorDialogComponent,
    ParabensDialogComponent,
    AdicionarMetaDialogComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MetasRoutingModule,
    DSModule,
    ReactiveFormsModule,
    SharedModule,
    FormsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MetasModule {}
