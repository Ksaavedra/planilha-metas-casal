import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { RecuperarSenhaComponent } from './recuperar-senha/recuperar-senha.component';
import { VerificarCodigoComponent } from './verificar-codigo/verificar-codigo.component';
import { NovaSenhaComponent } from './nova-senha/nova-senha.component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'recuperar-senha',
    component: RecuperarSenhaComponent,
  },
  {
    path: 'recuperar-senha/verificar',
    component: VerificarCodigoComponent,
  },
  {
    path: 'recuperar-senha/nova-senha',
    component: NovaSenhaComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
