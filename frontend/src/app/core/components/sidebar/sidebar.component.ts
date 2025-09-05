import { Component, OnInit } from '@angular/core';
import { SidebarService } from '../../services/sidebar/sidebar.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  sidebarStatus: boolean = false;
  isMobile: boolean = false;

  constructor(private sidebar: SidebarService) {}

  ngOnInit() {
    this.sidebar.getStatus().subscribe((status) => {
      this.sidebarStatus = status;
    });

    this.sidebar.isMobile().subscribe((mobile) => {
      this.isMobile = mobile;
    });
  }

  onSidebarClick() {
    this.sidebar.changeStatus();
  }
}
