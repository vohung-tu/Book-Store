import { Component, EventEmitter, Output } from '@angular/core';
import { LayoutService } from '../../service/layout.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  @Output() menuToggle = new EventEmitter<void>();

  constructor(public layoutService: LayoutService) {}

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  isDarkTheme(): boolean | undefined {
    return this.layoutService.isDarkTheme();
  }

  toggleDarkMode(): void {
    this.layoutService.layoutConfig.update((state) => ({
      ...state,
      darkTheme: !state.darkTheme
    }));
  }
}
