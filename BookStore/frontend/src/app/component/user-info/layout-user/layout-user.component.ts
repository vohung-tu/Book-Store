import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { User } from '../../../model/users-details.model';
import { AuthService } from '../../../service/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-layout-user',
  standalone: true,
  imports: [
    CardModule,
    CommonModule,
    ButtonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './layout-user.component.html',
  styleUrls: ['./layout-user.component.scss'] // ✅ Sửa từ `styleUrl` thành `styleUrls`
})
export class LayoutUserComponent implements OnInit {
  currentUser: User | null = null;
  
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.getCurrentUser();
  }

  getCurrentUser(): void {
    if (typeof window === 'undefined') return; 
    console.log(localStorage.getItem('token'));
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

    // Tìm địa chỉ mặc định hoặc lấy địa chỉ đầu tiên nếu không có isDefault
    const defaultAddress = this.currentUser.address.find((addr: any) => addr.isDefault) || this.currentUser.address[0];
    return defaultAddress ? defaultAddress.value : '';
  }
}
