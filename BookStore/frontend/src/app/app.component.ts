import { Component, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './component/navbar/navbar.component';
import { FooterComponent } from './component/footer/footer.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    NavbarComponent,
    FooterComponent,
    ButtonModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'] // Sửa đây
})
export class AppComponent {
  showBackToTop = false; // Mặc định false

  constructor(public router: Router) {}

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.showBackToTop = scrollTop > 100;
    // console.log('ScrollTop:', scrollTop, 'showBackToTop:', this.showBackToTop);
  }

  scrollToTop() {
    const mainContent = document.querySelector('.main-content');
    if(mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
