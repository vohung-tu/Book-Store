import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { CommonModule, NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subject } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CartService } from '../../service/cart.service';
import { BookDetails } from '../../model/books-details.model';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { ButtonModule } from 'primeng/button';

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
    RouterModule,
    BadgeModule,
    OverlayBadgeModule,
    ButtonModule
  ],
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn$!: Observable<boolean>;
  isLoading$!: Observable<boolean>;
  username$!: Observable<string | null>;
  cartItemCount: number = 0;
  private destroy$ = new Subject<void>();
  cart$: Observable<BookDetails[]>;

  constructor(private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {
    this.cart$ = this.cartService.getCart();
  }

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    // this.isLoading$ = this.authService.isLoading$;
    this.username$ = this.authService.username$;
    

    // Kiểm tra và lấy thông tin user khi reload
    this.authService.getUserInfo().subscribe();
    this.cart$.subscribe(cart => {
      this.cartItemCount = cart ? cart.length : 0;
    });
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

  navigateToCategory(category: string) {
    if (!category) {
    }
    this.router.navigate(['/category', category]);
  }
}
