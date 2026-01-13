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
  displayAddress: string = '';
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

          this.displayAddress = this.getDefaultAddress();

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

    // Nếu người dùng nhập địa chỉ vào ô input
    if (this.displayAddress && this.displayAddress.trim() !== '') {
      // Nếu user đã có mảng address, cập nhật cái mặc định. Nếu chưa, tạo mới.
      if (!this.currentUser.address || this.currentUser.address.length === 0) {
        this.currentUser.address = [{
          value: this.displayAddress,
          isDefault: true,
          fullName: this.currentUser.full_name,
          phoneNumber: Number(this.currentUser.phone_number)
        }];
      } else {
        // Tìm địa chỉ mặc định để cập nhật giá trị mới từ input
        const defaultIdx = this.currentUser.address.findIndex((addr: any) => addr.isDefault);
        if (defaultIdx !== -1) {
          this.currentUser.address[defaultIdx].value = this.displayAddress;
        } else {
          this.currentUser.address[0].value = this.displayAddress;
        }
      }
    }

    // Cập nhật ngày sinh từ biến tạm birthDate vào object trước khi gửi
    if (this.birthDate) {
      this.currentUser.birth = new Date(this.birthDate);
    }

    this.authService.updateUser(this.currentUser).subscribe({
      next: (updatedUser) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Thông tin của bạn đã được lưu.'
        });
      },
      error: (err) => { /* Xử lý lỗi */ }
    });
  }

}
