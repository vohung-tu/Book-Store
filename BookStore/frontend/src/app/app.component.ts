import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './component/navbar/navbar.component';
import { FooterComponent } from './component/footer/footer.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgIf,
    RouterOutlet, 
    NavbarComponent,
    FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(public router: Router) {}
  isAdminPage(): boolean {
    const url = this.router.url;
    // Mảng các route bạn muốn kiểm tra
    const prefixes = ['/admin', '/signin', '/signup'];
    return prefixes.some(prefix => url.startsWith(prefix));
  }
}
