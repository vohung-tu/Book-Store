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
import { BooksService } from '../../service/books.service';
import { CarouselModule } from 'primeng/carousel';
import { ProductItemComponent } from '../product-item/product-item.component';

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
    DialogModule,
    CarouselModule,
    ProductItemComponent,
    
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
  responsiveOptions: any[] | undefined;

  // Coupon
  savedCoupons: Coupon[] = [];
  displayedCoupons: Coupon[] = [];
  appliedCoupons: Coupon[] = [];
  showAllCoupons = false;

  isLoadingRecommended = true;
  recommendedBooks: any[] = [];
  loginRequiredDialog = false;

  constructor(
    private cartService: CartService,
    private router: Router,
    private authService: AuthService,
    private bookService:BooksService,
    private messageService: MessageService
  ) {
    this.cart$ = this.cartService.getCart();
    this.cart$.subscribe(cart => {
      this.cartData = cart ?? [];
      this.updateTotalWithCoupons();
    });
  }

  ngOnInit(): void {
    this.responsiveOptions = [
      { breakpoint: '1600px', numVisible: 5, numScroll: 5 },
      { breakpoint: '1199px', numVisible: 4, numScroll: 4 },
      { breakpoint: '991px', numVisible: 3, numScroll: 3 },
      { breakpoint: '767px', numVisible: 2, numScroll: 2 },
      { breakpoint: '575px', numVisible: 1, numScroll: 1 }
    ];
    this.loadSavedCoupons();
    this.loadRecommendedBooks();

    this.cart$ = this.cartService.getCart();

    this.cart$.subscribe(cart => {
      this.cartData = cart ?? [];
      this.updateTotalWithCoupons();
    });
  }

  /** 🔄 Load coupons đã lưu */
  loadSavedCoupons() {
    const saved = localStorage.getItem('savedCoupons');
    this.savedCoupons = saved ? JSON.parse(saved) : [];
    this.displayedCoupons = this.savedCoupons.slice(0, 2);
  }

  

  loadRecommendedBooks() {
    this.isLoadingRecommended = true;
    this.bookService.getRecommendedBooks().subscribe({
      next: (books) => {
        this.recommendedBooks = books || [];
        this.isLoadingRecommended = false;
      },
      error: (err) => {
        console.error('❌ Lỗi tải sách gợi ý:', err);
        this.isLoadingRecommended = false;
      }
    });
  }

  handleToast(event: { severity: string; summary: string; detail: string }) {
    this.messageService.add({
      severity: event.severity || 'success',
      summary: event.summary || 'Thành công',
      detail: event.detail || 'Thao tác đã hoàn tất',
      key: 'tr',
    });
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

  getCouponActionLabel(coupon: Coupon): string {
    return this.canApplyCoupon(coupon) ? 'Áp mã' : 'Mua thêm';
  }

  onCouponAction(coupon: Coupon) {
    if (this.canApplyCoupon(coupon)) {
      this.applyCoupon(coupon);
    } else {
      this.goShopping();
    }
  }

  canApplyCoupon(coupon: Coupon): boolean {
    if (this.selectedBooks.length === 0) return false;

    const couponCategories = this.getCouponCategorySlugs(coupon);

    const applicableTotal = this.selectedBooks
      .filter(item => {
        if (couponCategories.length === 0) return true;
        return couponCategories.includes(this.getItemCategorySlug(item));
      })
      .reduce(
        (sum, item) =>
          sum + (item.flashsale_price || item.price) * (item.quantity || 1),
        0
      );

    if (coupon.minOrder && applicableTotal < coupon.minOrder) return false;

    return applicableTotal > 0;
  }


  goShopping() {
    this.router.navigate(['/']);
  }

  private getItemCategorySlug(item: any): string {
    const c = item.categoryName;

    if (!c) return '';

    // Nếu backend trả string
    if (typeof c === 'string') {
      return c.toLowerCase();
    }

    // Nếu TS vẫn nghĩ là Category object
    if (typeof c === 'object') {
      return (c.slug || c.name || '').toLowerCase();
    }

    return '';
  }


  /** Tiến trình đạt minOrder */
  getProgress(coupon: Coupon): number {
    if (!coupon.minOrder) return 100;

    const couponCategories = this.getCouponCategorySlugs(coupon);

    const applicableItems = this.cartData.filter(item => {
      if (couponCategories.length === 0) return true;
      return couponCategories.includes(this.getItemCategorySlug(item));
    });

    const applicableTotal = applicableItems.reduce(
      (sum, item) =>
        sum + (item.flashsale_price || item.price) * (item.quantity || 1),
      0
    );

    return Math.min(
      Math.round((applicableTotal / coupon.minOrder) * 100),
      100
    );
  }


  /** ✅ Áp dụng mã */
  applyCoupon(coupon: Coupon) {
    if (!this.canApplyCoupon(coupon)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Không thể áp mã',
        detail: 'Vui lòng chọn sản phẩm phù hợp và đủ điều kiện.',
      });
      return;
    }

    if (this.appliedCoupons.length > 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Chỉ áp dụng 1 mã',
        detail: 'Vui lòng gỡ mã hiện tại trước khi áp mã mới.',
      });
      return;
    }

    this.appliedCoupons = [coupon];

    // 🔥 đảm bảo pricing chạy theo selectedBooks
    this.updateTotalWithCoupons();

    // ✅ TOAST THÀNH CÔNG (giống logic cũ)
    this.messageService.add({
      severity: 'success',
      summary: 'Áp dụng thành công',
      detail: `Mã ${coupon.code} đã được áp dụng.`,
    });
  }


  private getCouponCategorySlugs(coupon: Coupon): string[] {
    if (!coupon.categories || coupon.categories.length === 0) return [];

    return coupon.categories.map(c =>
      c.toLowerCase().trim()
    );
  }
  

  /** ❌ Gỡ mã */
  removeAppliedCoupon(coupon: Coupon) {
    this.appliedCoupons = this.appliedCoupons.filter(c => c.code !== coupon.code);
    this.updateTotalWithCoupons();
  }

  /** 🚫 Check disable */
  isCouponDisabled(coupon: Coupon): boolean {
  // Chưa chọn sản phẩm → không cho áp
    if (this.selectedBooks.length === 0) return true;

    if (!coupon.minOrder) return false;

    const couponCategories = this.getCouponCategorySlugs(coupon);

    const applicableTotal = this.selectedBooks
      .filter(item => {
        if (couponCategories.length === 0) return true;
        return couponCategories.includes(this.getItemCategorySlug(item));
      })
      .reduce(
        (sum, item) =>
          sum + (item.flashsale_price || item.price) * (item.quantity || 1),
        0
      );

    return applicableTotal < coupon.minOrder;
  }

  get pricingItems(): BookDetails[] {
    return this.selectedBooks;
  }

  get activeSubtotal(): number {
    if (this.pricingItems.length === 0) return 0;

    return this.pricingItems.reduce(
      (sum, item) =>
        sum + (item.flashsale_price || item.price) * (item.quantity || 1),
      0
    );
  }

  private getCouponApplicableTotal(coupon: Coupon): number {
    const couponCategories = this.getCouponCategorySlugs(coupon);

    return this.pricingItems
      .filter(item => {
        if (couponCategories.length === 0) return true;
        return couponCategories.includes(this.getItemCategorySlug(item));
      })
      .reduce(
        (sum, item) =>
          sum + (item.flashsale_price || item.price) * (item.quantity || 1),
        0
      );
  }


  /** 🔄 Update tổng tiền khi áp dụng mã */
  updateTotalWithCoupons() {
  // 1️⃣ Không chọn gì
    if (this.selectedBooks.length === 0) {
      this.totalDiscount = 0;
      this.totalPrice = 0;
      return;
    }

    // 2️⃣ Luôn lấy tạm tính trước
    const subtotal = this.activeSubtotal;

    // 3️⃣ Nếu KHÔNG có coupon → tổng tiền = tạm tính
    if (this.appliedCoupons.length === 0) {
      this.totalDiscount = 0;
      this.totalPrice = subtotal;
      return;
    }

    // 4️⃣ Có coupon → tính giảm
    let discount = 0;

    for (const coupon of this.appliedCoupons) {
      const applicableTotal = this.getCouponApplicableTotal(coupon);

      if (coupon.minOrder && applicableTotal < coupon.minOrder) continue;

      if (coupon.type === 'percent') {
        discount += (applicableTotal * coupon.value) / 100;
      } else {
        discount += coupon.value;
      }
    }

    this.totalDiscount = discount;
    this.totalPrice = Math.max(subtotal - discount, 0);
  }


  /** Tăng giảm số lượng */
  increaseQuantity(book: BookDetails): void {
    if (this.authService.isLoggedIn()) {
      this.cartService.updateQuantity(book.cartItemId, 1).subscribe();
    } else {
      this.cartService.updateLocalQuantity(book._id!, 1);
    }
  }

  decreaseQuantity(book: BookDetails): void {
    if ((book.quantity ?? 1) <= 1) return;

    if (this.authService.isLoggedIn()) {
      this.cartService.updateQuantity(book.cartItemId, -1).subscribe();
    } else {
      this.cartService.updateLocalQuantity(book._id!, -1);
    }
  }

  /** 🗑 Xóa sản phẩm */
  removeItem(book: BookDetails): void {
    if (this.authService.isLoggedIn()) {
      if (!book.cartItemId) return;

      this.cartService.removeFromCart(book.cartItemId).subscribe();
    } else {
      if (!book._id) return;

      this.cartService.removeLocalItem(book._id);
    }
  }

  removeAllSelected(): void {
    this.selectedBooks.forEach(book => this.removeItem(book));
    this.selectedBooks = [];
  }
  
  deselectAll(): void {
    this.selectedBooks = [];
  }

  onSelectionChange() {
    this.updateTotalWithCoupons();
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

    // CHƯA ĐĂNG NHẬP → mở dialog
    if (!this.authService.isLoggedIn()) {
      this.loginRequiredDialog = true;
      return;
    }

    // ĐÃ LOGIN → tiếp tục như cũ
    localStorage.setItem('cart', JSON.stringify(this.selectedBooks));
    localStorage.setItem('appliedCoupons', JSON.stringify(this.appliedCoupons));
    localStorage.setItem('totalAmount', JSON.stringify(this.totalPrice));
    localStorage.setItem('totalDiscount', JSON.stringify(this.totalDiscount));

    this.router.navigate(['/checkout']);
  }

  goToLogin() {
    this.loginRequiredDialog = false;

    this.router.navigate(['/signin'], {
      queryParams: { returnUrl: '/cart' }
    });
  }

}
