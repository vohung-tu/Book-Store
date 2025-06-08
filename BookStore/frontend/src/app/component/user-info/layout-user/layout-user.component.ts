import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { User } from '../../../model/users-details.model';
import { AuthService } from '../../../service/auth.service';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-layout-user',
  standalone: true,
  imports: [
    CardModule,
    CommonModule,
    ButtonModule,
    RouterModule,
    FormsModule,
    ToastModule
  ],
  templateUrl: './layout-user.component.html',
  styleUrls: ['./layout-user.component.scss'],
  providers: [MessageService]
})
export class LayoutUserComponent implements OnInit {
  currentUser: User | null = null;
  birthDate!: string;
  today: string = new Date().toISOString().split('T')[0];
  
  constructor(private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
    if (this.currentUser?.birth) {
      const date = new Date(this.currentUser.birth);
      this.birthDate = date.toISOString().split('T')[0]; // "yyyy-MM-dd"
    }

  }

  getCurrentUser(): void {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    this.authService.getProfile().subscribe({
      next: (user) => {
        if (user) {
          this.currentUser = user;

          // ✅ Di chuyển xử lý birthDate vào đây
          if (this.currentUser.birth) {
            const date = new Date(this.currentUser.birth);
            this.birthDate = date.toISOString().split('T')[0]; // "yyyy-MM-dd"
          }
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

  onSaveChanges(): void {
    if (!this.currentUser) return;

    this.authService.updateUser(this.currentUser).subscribe({
      next: (updatedUser) => {
        this.currentUser = updatedUser as User;
        localStorage.setItem('user', JSON.stringify(updatedUser));

        this.messageService.add({
          severity: 'success',
          summary: 'Cập nhật thành công',
          detail: 'Thông tin của bạn đã được lưu.'
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Cập nhật thất bại',
          detail: 'Đã xảy ra lỗi khi lưu thông tin.'
        });
      }
    });
  }

}
