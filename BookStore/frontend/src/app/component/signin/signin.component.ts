import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../service/auth.service';
import { Observable } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { CartService } from '../../service/cart.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    NgIf, 
    MatFormFieldModule,   // Material Form Field
    MatInputModule,       // Material Input
    MatButtonModule,       // Material Button
    MatIcon,
    ReactiveFormsModule,
    RouterModule,
    MatCheckboxModule,
    CommonModule,
    DialogModule
  ],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit{
  signinForm: FormGroup;
  hidePassword = true;
  isLoading$!: Observable<boolean>;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cartService: CartService,
    private route: ActivatedRoute, // Inject ActivatedRoute
    private router: Router 
    ) {
    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Email phải có định dạng hợp lệ
      password: ['', [Validators.required, Validators.minLength(6),this.passwordStrengthValidator]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // this.isLoading$ = this.authService.isLoading$; // Observable theo dõi trạng thái loading
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
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

  // Xử lý đăng nhập
  onSubmit() {
  if (this.signinForm.invalid) return;

  const { email, password } = this.signinForm.value;

  this.authService.signin({ email, password }).subscribe({
    next: (res) => {
      // 1 Lưu token & user
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));

      // 2 MERGE guest cart → server cart
      this.cartService.mergeGuestCart();

      // 3 Reload cart từ server
      this.cartService.loadCart();

      // 4 Điều hướng
      const returnUrl =
        this.route.snapshot.queryParamMap.get('returnUrl') || '/home';

      this.router.navigateByUrl(returnUrl);

      this.errorMessage = null;
    },
    error: (err) => {
      console.error('Đăng nhập thất bại', err);
      this.errorMessage =
        'Nhập sai email hoặc mật khẩu, vui lòng thử lại.';
    },
  });
}


}
