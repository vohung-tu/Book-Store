import { Component, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { User } from '../../model/users-details.model';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [
    CardModule,
    CommonModule,
    ButtonModule,
    RouterModule
  ],
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss']
})
export class UserInfoComponent implements OnInit{
  currentUser: User | null = null;

  constructor(
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
  }

  getCurrentUser(): void {
    if (typeof window === 'undefined') return; 
    console.log(localStorage.getItem('token'))
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

  // Hàm để lấy địa chỉ mặc định
  getDefaultAddress() {
    if (!this.currentUser || !this.currentUser.address || this.currentUser.address.length === 0) {
      return '';
    }

    // Tìm địa chỉ mặc định (isDefault = true)
    const defaultAddress = this.currentUser.address.find((addr: any) => addr.isDefault);
    return defaultAddress ? defaultAddress.value : '';
  }
}
