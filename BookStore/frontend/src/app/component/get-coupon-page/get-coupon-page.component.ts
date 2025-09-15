import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Coupon } from '../../model/coupon.model';
import { CouponsService } from '../../service/coupon.service';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../service/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-get-coupon-page',
  imports: [
    CommonModule,
    DialogModule
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

  constructor(private couponService: CouponsService,
    private messageService: MessageService,
    private route: ActivatedRoute
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
        this.fixedCoupons = res.filter(c => c.type === 'amount');
        this.percentCoupons = res.filter(c => c.type === 'percent');
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
    // Bạn có thể lưu vào localStorage hoặc clipboard
    navigator.clipboard.writeText(coupon.code);
    alert(`Đã sao chép mã: ${coupon.code}`);
  }

  getCouponsByCategory(slug: string) {
    return this.percentCoupons.filter(c => !c.categories || c.categories.includes(slug));
  }

  get conditionLines(): string[] {
    return this.selectedCoupon?.condition
      ? this.selectedCoupon.condition.split('\n')
      : [];
  }
}