import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

registerLocaleData(localePt, 'pt-BR');

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
