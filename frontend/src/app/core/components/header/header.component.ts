import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Usuario } from '@core/interfaces/auths/auth';
import { AuthService } from '@core/services/auth/auth.service';
import { SidebarService } from '../../services/sidebar/sidebar.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: false
})
export class HeaderComponent implements OnInit {
  @Output() showOverlay: EventEmitter<boolean> = new EventEmitter();
  sidebarStatus!: boolean;
  currentUser$: Observable<Usuario | null>;

  constructor(
    private sidebar: SidebarService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.sidebar.getStatus().subscribe((value) => {
      this.sidebarStatus = value;
      this.showOverlay.emit(value);
    });
  }

  onSidebarClick() {
    this.sidebar.changeStatus();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
