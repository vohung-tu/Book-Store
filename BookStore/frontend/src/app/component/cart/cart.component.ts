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
import { DialogModule } from 'primeng/dialog';

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
    DialogModule
    
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
  showCouponDialog = false;
  couponDialogVisible = false;
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
    this.couponDialogVisible = true;
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
  // ✅ Kiểm tra category trước (nếu coupon có yêu cầu category)
  if (coupon.categories && coupon.categories.length > 0) {
    const hasCategory = this.cartData.some(item =>
      coupon.categories!.includes(item.categoryName?._id ?? '')
    );

    if (!hasCategory) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Không áp dụng được',
        detail: `Giỏ hàng không có sản phẩm thuộc danh mục yêu cầu để áp dụng mã.`,
      });
      return;
    }
  }

  // ✅ Kiểm tra minOrder với hàm isCouponDisabled (chỉ tính các sản phẩm thuộc category)
  if (this.isCouponDisabled(coupon)) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Không áp dụng được',
      detail: 'Đơn hàng chưa đủ điều kiện để áp dụng mã này.',
    });
    return;
  }

  // ✅ Chỉ cho phép 1 coupon giảm giá cùng lúc
  if (this.appliedCoupons.length > 0) {
    this.messageService.add({
      severity: 'info',
      summary: 'Chỉ áp dụng 1 mã giảm giá',
      detail: 'Vui lòng xóa mã hiện tại trước khi áp mã mới.',
    });
    return;
  }

  // ✅ Lưu coupon vào appliedCoupons
  this.appliedCoupons.push(coupon);
  localStorage.setItem('appliedCoupons', JSON.stringify(this.appliedCoupons));
  this.updateTotalWithCoupons();

  this.messageService.add({
    severity: 'success',
    summary: 'Đã áp dụng',
    detail: `Mã ${coupon.code} đã được áp dụng!`,
  });
}


  /** ❌ Gỡ mã */
  removeAppliedCoupon(coupon: Coupon) {
    this.appliedCoupons = this.appliedCoupons.filter(c => c.code !== coupon.code);
    this.updateTotalWithCoupons();
  }

  /** 🚫 Check disable */
  isCouponDisabled(coupon: Coupon): boolean {
  // Nếu coupon có categories -> chỉ tính tổng của những sản phẩm thuộc categories đó
  const applicableItems = this.cartData.filter(item => {
    if (!coupon.categories || coupon.categories.length === 0) return true; // áp dụng cho mọi sản phẩm

    // So sánh dựa vào tên category (hoặc slug, tùy bạn)
    const itemCategoryName = item.categoryName?.name?.toLowerCase() ?? '';
    return coupon.categories.some(c => c.toLowerCase() === itemCategoryName);
  });

  const applicableTotal = applicableItems.reduce(
    (sum, item) => sum + (item.flashsale_price || item.price) * (item.quantity || 1),
    0
  );

  return coupon.minOrder ? applicableTotal < coupon.minOrder : false;
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
