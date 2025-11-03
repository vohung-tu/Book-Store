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
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-get-coupon-page',
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    ToastModule,
    TooltipModule     
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
  userLevel: string = 'member'; // mặc định khách thường

  constructor(
    private couponService: CouponsService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCoupons();

    // lấy thông tin user từ AuthService (nếu đã login)
    const user = this.authService.getCurrentUser();
    if (user && user.level) {
      this.userLevel = user.level;
    }

    this.route.queryParams.subscribe(params => {
      this.selectedCategorySlug = params['category'] || null;
    });
  }

  loadCoupons() {
    this.couponService.getValidCoupons().subscribe({
      next: (res) => {
        this.coupons = res;

        this.fixedCoupons = res.filter(c =>
          c.type === 'amount' && (!c.categories || c.categories.length === 0)
        );

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
      this.router.navigate(['/signin'], { queryParams: { returnUrl: '/coupons' } });
      return;
    }

    // ✅ kiểm tra quyền trước khi lưu
    if (!this.canSaveCoupon(coupon)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Không đủ cấp độ',
        detail: 'Cấp độ tài khoản của bạn không thể sử dụng mã này!'
      });
      return;
    }

    let savedCoupons: Coupon[] = JSON.parse(localStorage.getItem('savedCoupons') || '[]');

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

  //kiểm tra xem user có được phép lấy coupon không
  canSaveCoupon(coupon: Coupon): boolean {
    const order = ['member', 'silver', 'gold', 'diamond'];
    const requiredLevels = Array.isArray(coupon.requiredLevel)
      ? coupon.requiredLevel
      : [coupon.requiredLevel ?? 'member'];

    const userLevel = this.userLevel ?? 'member';

    return requiredLevels.some(req =>
      order.indexOf(userLevel) >= order.indexOf(req ?? 'member')
    );
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

  getTooltipText(coupon: Coupon): string {
    if (!coupon.requiredLevel || coupon.requiredLevel.length === 0)
      return 'Dành cho tất cả thành viên';

    return 'Chỉ dành cho: ' + coupon.requiredLevel.join(', ');
  }
}
