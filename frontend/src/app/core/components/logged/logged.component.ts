import { Component, OnInit } from '@angular/core';
import { SidebarService } from '../../services/sidebar/sidebar.service';

@Component({
  selector: 'app-logged',
  templateUrl: './logged.component.html',
  styleUrls: ['./logged.component.scss'],
})
export class LoggedComponent implements OnInit {
  sidebarStatus: boolean = false;
  isMobile: boolean = false;
  showOverlay: boolean = false;

  constructor(private sidebar: SidebarService) {}

  ngOnInit() {
    this.sidebar.getStatus().subscribe((status) => {
      this.sidebarStatus = status;
    });

    this.sidebar.isMobile().subscribe((mobile) => {
      this.isMobile = mobile;
    });
  }

  onShowOverlay(show: boolean) {
    this.showOverlay = show;
  }
}
