import { Component, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';

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
  currentUser: any;

  constructor(
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
  }

  getCurrentUser() {
    if (typeof window === 'undefined') return; 
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    this.http.get<any>('http://localhost:3000/auth/me', { headers }).subscribe({
      next: (data) => {
        if (data) {
          this.currentUser = data;
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
