import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BookDetails } from '../../model/books-details.model';
import { Coupon } from '../../model/coupon.model';
import { CartService } from '../../service/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../service/auth.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { DotSeparatorPipe } from '../../pipes/dot-separator.pipe';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
  cart$: Observable<BookDetails[]>;
  cartData: BookDetails[] = []; // dữ liệu giỏ hàng
  totalPrice: number = 0;       // tổng tiền sau giảm giá
  originalTotal: number = 0;    // tổng gốc chưa giảm
  totalDiscount: number = 0;

  selectedBooks: BookDetails[] = [];

  // Coupon
  savedCoupons: Coupon[] = [];
  displayedCoupons: Coupon[] = [];
  appliedCoupons: Coupon[] = [];
  showAllCoupons = false;

  constructor(
    private cartService: CartService,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.cart$ = this.cartService.getCart();
    this.cart$.subscribe(cart => {
      this.cartData = cart ?? [];
      this.originalTotal = this.calculateCartTotal();
      this.updateTotalWithCoupons();
    });
  }

  ngOnInit(): void {
    this.loadSavedCoupons();
  }

  /** 🔄 Load coupons đã lưu */
  loadSavedCoupons() {
    const saved = localStorage.getItem('savedCoupons');
    this.savedCoupons = saved ? JSON.parse(saved) : [];
    this.displayedCoupons = this.savedCoupons.slice(0, 2);
  }

  toggleCouponView() {
    this.showAllCoupons = !this.showAllCoupons;
    this.displayedCoupons = this.showAllCoupons
      ? this.savedCoupons
      : this.savedCoupons.slice(0, 2);
  }

  /** 🧮 Tính tổng giá gốc */
  calculateCartTotal(): number {
    return this.cartData.reduce(
      (sum, item) => sum + (item.flashsale_price || item.price) * (item.quantity || 1),
      0
    );
  }

  /** 📊 Tiến trình đạt minOrder */
  getProgress(coupon: Coupon): number {
    if (!coupon.minOrder) return 100;
    const progress = Math.min((this.originalTotal / coupon.minOrder) * 100, 100);
    return Math.round(progress);
  }

  /** ✅ Áp dụng mã */
  applyCoupon(coupon: Coupon) {
    if (this.isCouponDisabled(coupon)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Không áp dụng được',
        detail: 'Đơn hàng chưa đủ điều kiện để áp dụng mã này.'
      });
      return;
    }

    if (!this.appliedCoupons.find(c => c.code === coupon.code)) {
      this.appliedCoupons.push(coupon);

      // ✅ Lưu appliedCoupons vào localStorage để checkout đọc lại được
      localStorage.setItem('appliedCoupons', JSON.stringify(this.appliedCoupons));

      this.updateTotalWithCoupons();

      this.messageService.add({
        severity: 'success',
        summary: 'Đã áp dụng',
        detail: `Mã ${coupon.code} đã được áp dụng!`
      });
    }
  }


  /** ❌ Gỡ mã */
  removeAppliedCoupon(coupon: Coupon) {
    this.appliedCoupons = this.appliedCoupons.filter(c => c.code !== coupon.code);
    this.updateTotalWithCoupons();
  }

  /** 🚫 Check disable */
  isCouponDisabled(coupon: Coupon): boolean {
    if (!coupon.minOrder) return false;
    return this.originalTotal < coupon.minOrder;
  }

  /** 🔄 Update tổng tiền khi áp dụng mã */
  updateTotalWithCoupons() {
    let total = this.originalTotal;
    let discount = 0;

    for (const coupon of this.appliedCoupons) {
      if (coupon.minOrder && total < coupon.minOrder) continue;

      if (coupon.type === 'percent') {
        discount += (total * coupon.value) / 100;
      } else if (coupon.type === 'amount') {
        discount += coupon.value;
      }
    }

    this.totalDiscount = discount;
    this.totalPrice = Math.max(total - discount, 0);
  }

  /** 🔼/🔽 Tăng giảm số lượng */
  increaseQuantity(book: BookDetails): void {
    this.cartService.updateQuantity(book.cartItemId, 1).subscribe();
  }
  decreaseQuantity(book: BookDetails): void {
    if ((book.quantity ?? 1) > 1) {
      this.cartService.updateQuantity(book.cartItemId, -1).subscribe();
    }
  }

  /** 🗑 Xóa sản phẩm */
  removeItem(cartItemId: string): void {
    this.cartService.removeFromCart(cartItemId).subscribe();
  }
  removeAllSelected(): void {
    this.selectedBooks.forEach(book => this.removeItem(book.cartItemId));
    this.selectedBooks = [];
  }
  deselectAll(): void {
    this.selectedBooks = [];
  }

  /** 🧾 Chuyển sang thanh toán */
  goToCheckout() {
    if (this.selectedBooks.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Chú ý',
        detail: 'Vui lòng chọn ít nhất một sản phẩm để thanh toán.',
      });
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/signin'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    localStorage.setItem('cart', JSON.stringify(this.selectedBooks));
    localStorage.setItem('totalAmount', JSON.stringify(this.totalPrice));

    this.router.navigate(['/checkout'], {
      state: { cart: this.selectedBooks, total: this.totalPrice }
    });
  }
}
