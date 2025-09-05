import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { SidebarService } from '../../services/sidebar/sidebar.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Output() showOverlay: EventEmitter<boolean> = new EventEmitter();
  sidebarStatus!: boolean;

  constructor(private sidebar: SidebarService) {}

  ngOnInit(): void {
    this.sidebar.getStatus().subscribe((value) => {
      this.sidebarStatus = value;
      this.showOverlay.emit(value);
    });
  }

  onSidebarClick() {
    this.sidebar.changeStatus();
  }
}
