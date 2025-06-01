import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    CommonModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  providers: [MessageService],
})
export class ForgotPasswordComponent {
  form: FormGroup;
  isSubmitting = false;
  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private messageService: MessageService) {
        this.form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
      });
    }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting = true;

    const email = this.form.value.email;

    this.authService.requestPasswordReset(email).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: res.message || 'Vui lòng kiểm tra email để đặt lại mật khẩu.',
        });
        this.isSubmitting = false;
        this.form.reset();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: err.error?.message || 'Không thể gửi yêu cầu khôi phục mật khẩu.',
        });
        this.isSubmitting = false;
      },
    });
  }
}
