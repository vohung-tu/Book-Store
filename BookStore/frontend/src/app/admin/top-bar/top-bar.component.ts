import { Component, EventEmitter, Output } from '@angular/core';
import { LayoutService } from '../../service/layout.service';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
// import { AppConfiguratorComponent } from '../app-configurator/app-configurator.component';

@Component({
  selector: 'app-top-bar',
  imports: [
    RouterModule, CommonModule, StyleClassModule
  ],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  items!: MenuItem[];
  @Output() menuToggle = new EventEmitter<void>();

  constructor(public layoutService: LayoutService) {}

  onMenuToggle(): void {
    console.log('abc');
    this.menuToggle.emit(); // emit toggle to parent
  }

  isDarkTheme(): boolean | undefined {
    return this.layoutService.isDarkTheme();
  }

  toggleDarkMode() {
    this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
  }
}
