import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../service/auth.service';
import { Observable } from 'rxjs';

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
    CommonModule
  ],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit{
  signinForm: FormGroup;
  hidePassword = true;
  isLoading$!: Observable<boolean>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute, // Inject ActivatedRoute
    private router: Router 
    ) {
    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Email phải có định dạng hợp lệ
      password: ['', [Validators.required, Validators.minLength(6)]], // Password ít nhất 6 ký tự
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // this.isLoading$ = this.authService.isLoading$; // Observable theo dõi trạng thái loading
  }
  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  // Xử lý đăng nhập
  onSubmit() {
    if (this.signinForm.valid) {
      const { email, password, rememberMe } = this.signinForm.value;
  
      this.authService.signin({ email, password }, rememberMe).subscribe(
        (res) => {
          const user = res.user;
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
  
          // Lưu vào localStorage (nếu bạn chưa làm trong service)
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(user));
  
          // ✅ Điều hướng dựa trên vai trò
          if (user.role === 'admin') {
            this.router.navigate(['/admin']);
          } else if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          } else {
            this.router.navigate(['/home']);
          }
        },
        (err) => {
          console.error('Đăng nhập thất bại', err);
        }
      );
    }
  }  
}
