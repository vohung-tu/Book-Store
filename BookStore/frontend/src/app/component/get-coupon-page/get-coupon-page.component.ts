import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Coupon } from '../../model/coupon.model';
import { CouponsService } from '../../service/coupon.service';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../service/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-get-coupon-page',
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    ToastModule
  ],
  templateUrl: './get-coupon-page.component.html',
  styleUrl: './get-coupon-page.component.scss',
  providers: [MessageService]
})
export class GetCouponPageComponent implements OnInit {
  coupons: Coupon[] = [];
  showDetailDialog = false;
  selectedCoupon: Coupon | null = null;
  fixedCoupons: Coupon[] = [];
  percentCoupons: Coupon[] = [];
  selectedCategorySlug: string | null = null;
  savedCoupons: Set<string> = new Set();

  constructor(private couponService: CouponsService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {} 
  
  ngOnInit(): void {
    this.loadCoupons();
    this.route.queryParams.subscribe(params => {
      this.selectedCategorySlug = params['category'] || null;
    });
  }
  
  loadCoupons() {
    this.couponService.getCoupons().subscribe({
      next: (res) => {
        this.coupons = res;

        // ✅ fixedCoupons: chỉ các coupon giảm tiền KHÔNG có category (áp dụng toàn bộ)
        this.fixedCoupons = res.filter(c =>
          c.type === 'amount' && (!c.categories || c.categories.length === 0)
        );

        // ✅ percentCoupons: các coupon có category (bất kể là percent hay amount)
        this.percentCoupons = res.filter(c =>
          c.categories && c.categories.length > 0
        );
      },
      error: (err) => console.error('❌ Lỗi khi tải coupons:', err)
    });
  }

  showCode(coupon: any) {
    this.selectedCoupon = coupon;
    this.showDetailDialog = true;
  }

  copyCode(code?: string) {
    if (!code) return;
    navigator.clipboard.writeText(code);
    this.messageService.add({
      severity: 'success',
      summary: 'Đã sao chép',
      detail: `Mã ${code} đã được sao chép!`
    });
  }

  saveCoupon(coupon: Coupon) {
    const user = this.authService.getCurrentUser();

    if (!user) {
      // ✅ Chuyển hướng đến login nếu chưa đăng nhập
      this.router.navigate(['/signin'], { queryParams: { returnUrl: '/coupons' } });
      return;
    }

   let savedCoupons: Coupon[] = JSON.parse(localStorage.getItem('savedCoupons') || '[]');

    // Tránh trùng lặp
    if (!savedCoupons.find(c => c.code === coupon.code)) {
      savedCoupons.push(coupon);
      localStorage.setItem('savedCoupons', JSON.stringify(savedCoupons));
      this.messageService.add({
        severity: 'success',
        summary: 'Đã lưu mã',
        detail: 'Hãy áp dụng trong trang giỏ hàng!'
      });
    }
  }

  getCouponsByCategory(slug: string) {
    return this.percentCoupons.filter(c => !c.categories || c.categories.includes(slug));
  }

  get conditionLines(): string[] {
    return this.selectedCoupon?.condition
      ? this.selectedCoupon.condition.split('\n')
      : [];
  }

  isSaved(coupon: Coupon): boolean {
    return this.savedCoupons.has(coupon.code);
  }
}