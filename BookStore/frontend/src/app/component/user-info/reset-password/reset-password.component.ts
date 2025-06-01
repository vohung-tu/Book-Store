import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule, 
    FloatLabel
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  resetForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.resetForm.valid) {
      const { currentPassword, newPassword, confirmPassword } = this.resetForm.value;

      if (newPassword !== confirmPassword) {
        alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
        return;
      }

      const userId = this.authService.getCurrentUser()?._id; // 🔹 Lấy ID từ session
      console.log('UserID từ frontend:', userId);

      if (!userId) {
        alert('Không tìm thấy ID người dùng!');
        return;
      }

      const payload = {
        userId,  // 🛠 Gửi ID người dùng kèm mật khẩu cũ và mới
        currentPassword,
        newPassword
      };

      this.authService.updatePassword(payload).subscribe({
        next: () => {
          alert('Mật khẩu đã được cập nhật thành công!');
          this.resetForm.reset(); // 🔹 Xóa dữ liệu sau khi cập nhật
        },
        error: (err) => {
          console.error('Lỗi cập nhật mật khẩu:', err);
          alert('Có lỗi xảy ra, vui lòng thử lại!');
        }
      });
    } else {
      alert('Vui lòng nhập đầy đủ thông tin hợp lệ!');
    }
  }

}