import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../service/auth.service';
import { catchError, debounceTime, map, of, switchMap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-signup', //selector: Tên selector để gắn component trong HTML.
  standalone: true,  //standalone: true: Sử dụng Angular Standalone Component (không cần module riêng).
  imports: [ //imports: Các module cần thiết để chạy template HTML.
    NgIf,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ToastModule
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  providers: [MessageService]  //providers: Khai báo service toast dùng riêng cho component.
})
export class SignupComponent {
  signupForm!: FormGroup;
  hidePassword = true;           // Ẩn/hiện mật khẩu
  hideConfirmPassword = true;    // Ẩn/hiện xác nhận mật khẩu
  maxDate: Date = new Date(); // Ngày hiện tại, chặn các ngày trong tương lai


  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router) {
      this.signupForm = this.fb.group({
        full_name: ['', Validators.required],
        username: ['', [Validators.required, Validators.minLength(4)]],
        password: ['', [Validators.required, Validators.minLength(6),this.passwordStrengthValidator]],
        re_password: ['', Validators.required],
        birth: [''],        // Ngày sinh
        address: [''],                        // Địa chỉ
        email: ['', [Validators.required, Validators.email], [this.emailTakenValidator()]],
        phone_number: ['', Validators.required],
      }, {
        validators: this.passwordMatchValidator // Kiểm tra mật khẩu khớp
      });
    }
  // Hàm kiểm tra mật khẩu có khớp không
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const re_password = form.get('re_password')?.value; 
    //?. cho phép gọi .value chỉ khi form.get('password') không phải null/undefined. Nếu form.get('password') là null, nó sẽ không báo lỗi, thay vào đó trả về undefined.
    return password === re_password ? null : { passwordMismatch: true };
  }

  emailTakenValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      return of(control.value).pipe(
        debounceTime(500), // đợi người dùng dừng gõ
        switchMap(email =>
          this.authService.checkEmailExists(email).pipe(
            map(isTaken => (isTaken ? { emailTaken: true } : null)),
            catchError(() => of(null)) // nếu lỗi server, không chặn
          )
        )
      );
    };
  }

  passwordStrengthValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const validLength = value.length >= 6;

    const passwordValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && validLength;

    return passwordValid ? null : { weakPassword: true };
  }

  // Submit form
  onSubmit(): void {
    if (this.signupForm.valid) {
      const formValue = this.signupForm.value;

      // 1. Khởi tạo mảng địa chỉ rỗng
      let userAddress: { value: string; isDefault: boolean; fullName?: string; phoneNumber?: any }[] = [];

      // 2. Chỉ thêm vào mảng nếu người dùng thực sự nhập gì đó vào ô địa chỉ
      if (formValue.address && formValue.address.trim() !== '') {
        userAddress = [
          {
            value: formValue.address.trim(),
            isDefault: true,
            fullName: formValue.full_name, // Nên lưu kèm tên để tiện giao hàng
            phoneNumber: formValue.phone_number
          }
        ];
      }

      // 3. Tạo object data để gửi đi
      const userData = {
        ...formValue,
        role: 'user',
        address: userAddress // Sẽ là [] nếu không nhập địa chỉ
      };

      this.authService.signup(userData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đăng ký thành công'
          });
          setTimeout(() => this.router.navigate(['/signin']), 1500);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: err.error?.message || 'Đăng ký thất bại'
          });
        }
      });
    }
  }

}
