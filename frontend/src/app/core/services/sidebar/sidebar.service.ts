import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private isOpen$ = new BehaviorSubject<boolean>(false);
  private isMobile$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize() {
    const isMobile = window.innerWidth <= 768;
    this.isMobile$.next(isMobile);

    // Sidebar sempre fechada por padrão em todas as telas
    this.isOpen$.next(false);
  }

  changeStatus() {
    this.isOpen$.next(!this.isOpen$.value);
  }

  close(): void {
    this.isOpen$.next(false);
  }

  getStatus() {
    return this.isOpen$.asObservable();
  }

  isMobile() {
    return this.isMobile$.asObservable();
  }
}
