import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthRoutingModule } from './auth.routing';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { RecuperarSenhaComponent } from './recuperar-senha/recuperar-senha.component';
import { VerificarCodigoComponent } from './verificar-codigo/verificar-codigo.component';
import { NovaSenhaComponent } from './nova-senha/nova-senha.component';

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    RecuperarSenhaComponent,
    VerificarCodigoComponent,
    NovaSenhaComponent,
  ],
  imports: [CommonModule, RouterModule, ReactiveFormsModule, AuthRoutingModule],
})
export class AuthModule {}
