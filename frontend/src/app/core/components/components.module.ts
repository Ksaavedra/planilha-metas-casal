import {
  CUSTOM_ELEMENTS_SCHEMA,
  NgModule,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { LoggedComponent } from './logged/logged.component';
import { ApiTestComponent } from '../../components/api-test/api-test.component';
import { TesteMetasComponent } from '../../components/teste-metas/teste-metas.component';

@NgModule({
  declarations: [
    HeaderComponent,
    SidebarComponent,
    LoggedComponent,
    ApiTestComponent,
    TesteMetasComponent,
  ],
  imports: [CommonModule, RouterModule],
  exports: [
    HeaderComponent,
    SidebarComponent,
    LoggedComponent,
    ApiTestComponent,
    TesteMetasComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class ComponentsModule {}
