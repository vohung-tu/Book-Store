import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { map, Observable, of } from 'rxjs';
import { BookDetails } from '../../model/books-details.model';
import { CartService } from '../../service/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { DotSeparatorPipe } from '../../pipes/dot-separator.pipe';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, 
    MatButtonModule,
    FormsModule, // Cần để sử dụng [(ngModel)]
    
    // PrimeNG Modules
    TableModule,
    PaginatorModule,
    CheckboxModule,
    ButtonModule,
    BreadcrumbComponent,
    DotSeparatorPipe,
    DividerModule,
    Toast,
    
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  providers: [MessageService]
})
export class CartComponent implements OnInit {
  cart$: Observable<BookDetails[]>
  totalPrice: number = 0;
  selectedBooks: BookDetails[] = [];

  constructor(
    private cartService: CartService,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.cart$ = this.cartService.getCart();
    this.cart$.subscribe(cart => {
      this.totalPrice = (cart ?? []).reduce((s, it) =>
        s + (it.flashsale_price || it.price) * (it.quantity || 1), 0);
    });
  } 

  ngOnInit(): void {
    // Tự động cập nhật tổng tiền khi cart thay đổi
    this.cart$.subscribe(cart => {
      this.totalPrice = (cart ?? []).reduce(
        (sum, item) => sum + (item.flashsale_price || item.price) * (item.quantity || 1),
        0
      );
    });
  }

  increaseQuantity(book: BookDetails): void {
    this.cartService.updateQuantity(book.cartItemId, 1).subscribe();
  }

  decreaseQuantity(book: BookDetails): void {
    if ((book.quantity ?? 1) > 1) {
      this.cartService.updateQuantity(book.cartItemId, -1).subscribe();
    }
  }

  removeItem(cartItemId: string): void {
    this.cartService.removeFromCart(cartItemId).subscribe();
  }

  onCheckboxChange(book: BookDetails, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedBooks.push(book);
    } else {
      this.selectedBooks = this.selectedBooks.filter(b => b._id !== book._id);
    }
  }
  
  removeAllSelected(): void {
    this.selectedBooks.forEach(book => this.removeItem(book._id));
    this.selectedBooks = [];
  }
  
  deselectAll(): void {
    this.selectedBooks = [];
  }

  goToCheckout() {
  
    if (this.selectedBooks.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Chú ý',
        detail: 'Vui lòng chọn ít nhất một sản phẩm để thanh toán.',
      });
      return;
    }
  
    // Kiểm tra nếu người dùng đã đăng nhập
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      // Nếu chưa đăng nhập, lưu lại URL trang checkout và chuyển hướng đến trang login
      this.router.navigate(['/signin'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
  
    // Nếu đã đăng nhập, tiến hành thanh toán
    localStorage.setItem('cart', JSON.stringify(this.selectedBooks));
    localStorage.setItem('totalAmount', JSON.stringify(this.totalPrice));
  
    this.router.navigate(['/checkout'], { 
      state: { cart: this.selectedBooks, total: this.calculateTotalSelectedPrice() } 
    });
  }
  
  
  // Tính tổng tiền chỉ cho các sách đã chọn
  calculateTotalSelectedPrice(): number {
    return this.selectedBooks.reduce((sum, item) => sum + (item.flashsale_price || item.price) * (item.quantity || 1), 0);
  }
}
