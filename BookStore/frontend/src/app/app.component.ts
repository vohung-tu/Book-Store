import { Component, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './component/navbar/navbar.component';
import { FooterComponent } from './component/footer/footer.component';
import { NgIf } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgIf,
    RouterOutlet, 
    NavbarComponent,
    FooterComponent,
    ButtonModule

  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  showBackToTop = false;
  constructor(public router: Router) {}
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.showBackToTop = window.pageYOffset > 100;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isAdminPage(): boolean {
    const url = this.router.url;
    return url.startsWith('/admin');
  }

  isAuthPage(): boolean {
    const url = this.router.url;
    return url.startsWith('/signin') || url.startsWith('/signup');
  }
  
}
