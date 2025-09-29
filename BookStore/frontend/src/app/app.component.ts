import { Component, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './component/navbar/navbar.component';
import { FooterComponent } from './component/footer/footer.component';
import { ButtonModule } from 'primeng/button';
import { ChatbotComponent } from './component/chatbot/chatbot.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    NavbarComponent,
    FooterComponent,
    ButtonModule,
    ChatbotComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'] // Sửa đây
})
export class AppComponent {

  constructor(public router: Router) {}

  isAdminPage(): boolean {
    const url = this.router.url;
    return url.startsWith('/admin');
  }

  isAuthPage(): boolean {
    const url = this.router.url;
    return url.startsWith('/signin') || url.startsWith('/signup');
  }
}
