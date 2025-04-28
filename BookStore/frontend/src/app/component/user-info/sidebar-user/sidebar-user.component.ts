import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { User } from '../../../model/users-details.model';
import { AuthService } from '../../../service/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar-user',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './sidebar-user.component.html',
  styleUrl: './sidebar-user.component.scss'
})
export class SidebarUserComponent {
  currentUser: User | null = null;

  constructor(
      private authService: AuthService
    ) {}
  
    ngOnInit(): void {
      this.getCurrentUser();
    }
  
    getCurrentUser(): void {
      if (typeof window === 'undefined') return; 
      const token = localStorage.getItem('token');
      if (!token) return;
      
      this.authService.getProfile().subscribe({
        next: (user) => {
          if (user) {
            this.currentUser = user;
          } else {
            console.error('Không thể lấy thông tin người dùng');
          }
        },
        error: (err) => {
          console.error('Lỗi khi lấy thông tin người dùng', err);
        }
      });
    }
}
