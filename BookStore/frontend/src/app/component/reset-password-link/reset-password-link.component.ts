import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../service/auth.service';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { Toast, ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-reset-password-link',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule, 
    FloatLabel,
    ToastModule
  ],
  templateUrl: './reset-password-link.component.html',
  styleUrls: ['./reset-password-link.component.scss'],
  providers: [MessageService]
})
export class ResetPasswordLinkComponent {
  form!: FormGroup;
  token: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Token không hợp lệ hoặc đã hết hạn!' });
      this.router.navigate(['/signin']);
    }

    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6),this.passwordStrengthValidator]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator });
  }

  passwordStrengthValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const validLength = value.length >= 6;

    const passwordValid =
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar &&
      validLength;

    return passwordValid ? null : { weakPassword: true };
  }

  passwordsMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const { newPassword } = this.form.value;

    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Mật khẩu đã được đặt lại!' });
        setTimeout(() => this.router.navigate(['/signin']), 2000);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể đặt lại mật khẩu.' });
      }
    });
  }
}
