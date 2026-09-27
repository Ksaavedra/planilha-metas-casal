import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PasswordRecoveryStateService {
  email = '';
  resetToken = '';

  setEmail(email: string): void {
    this.email = email.trim();
  }

  setResetToken(resetToken: string): void {
    this.resetToken = resetToken;
  }

  clear(): void {
    this.email = '';
    this.resetToken = '';
  }
}
