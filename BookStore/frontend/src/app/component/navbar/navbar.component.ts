import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { CommonModule, NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: true,
  imports: [
    NgIf,
    MatMenuModule, 
    MatButtonModule,
    MatFormFieldModule, 
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    CommonModule, 
    RouterModule
  ],
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn$!: Observable<boolean>;
  isLoading$!: Observable<boolean>;
  username$!: Observable<string | null>;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    // this.isLoading$ = this.authService.isLoading$;
    this.username$ = this.authService.username$;

    // Kiểm tra và lấy thông tin user khi reload
    this.authService.getUserInfo().subscribe();
  }

  signout(): void {
    this.authService.signout();
  }

  changeLanguage(lang: string) {
    console.log('Selected language:', lang);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
