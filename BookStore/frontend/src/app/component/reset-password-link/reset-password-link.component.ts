import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../service/auth.service';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-reset-password-link',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule, 
    Toast
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
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.matchPasswords });
  }

  matchPasswords(group: FormGroup) {
    return group.get('newPassword')?.value === group.get('confirmPassword')?.value
      ? null : { passwordMismatch: true };
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
