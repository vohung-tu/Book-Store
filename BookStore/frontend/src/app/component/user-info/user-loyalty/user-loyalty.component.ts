import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-user-loyalty',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule],
  templateUrl: './user-loyalty.component.html',
  styleUrls: ['./user-loyalty.component.scss']
})
export class UserLoyaltyComponent implements OnInit {
  user: any = null;
  loading = true;
  progressPercent = 0;
  errorMsg = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadLoyaltyInfo();
  }

  loadLoyaltyInfo() {
    const token = this.authService.getToken();
    if (!token) {
      this.errorMsg = 'Vui lòng đăng nhập để xem thông tin khách hàng thân thiết.';
      this.loading = false;
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('https://book-store-3-svnz.onrender.com/auth/loyalty/me', { headers }).subscribe({
      next: (res: any) => {
        this.user = res;
        this.loading = false;

        // Hiệu ứng tăng dần thanh tiến độ
        const target = this.getProgressPercent(this.user.totalSpent);
        let current = 0;
        const interval = setInterval(() => {
          if (current >= target) {
            clearInterval(interval);
          } else {
            current += 1;
            this.progressPercent = current;
          }
        }, 20);
      },
      error: (err) => {
        console.error('Lỗi load loyalty:', err);
        this.loading = false;
        this.errorMsg = 'Không thể tải thông tin khách hàng thân thiết.';
      }
    });
  }
  getTagClass(level: string) {
    switch (level) {
      case 'silver': return 'tag-silver';
      case 'gold': return 'tag-gold';
      case 'diamond': return 'tag-diamond';
      default: return 'tag-member';
    }
  }

  getLevelName(level: string): string {
    switch (level) {
      case 'silver': return 'Thành viên Bạc';
      case 'gold': return 'Thành viên Vàng';
      case 'diamond': return 'Thành viên Kim cương';
      default: return 'Thành viên Thường';
    }
  }

  getNextLevel(level: string): string {
    switch (level) {
      case 'member': return 'Bạc';
      case 'silver': return 'Vàng';
      case 'gold': return 'Kim cương';
      default: return 'Kim cương';
    }
  }

  getProgressPercent(totalSpent: number): number {
    if (totalSpent >= 4_000_000) return 100;
    if (totalSpent >= 2_000_000) return 75;
    if (totalSpent >= 1_000_000) return 50;
    if (totalSpent > 0) return 25;
    return 5;
  }

  getRemaining(totalSpent: number): number {
    if (totalSpent >= 4_000_000) return 0;
    if (totalSpent >= 2_000_000) return 4_000_000 - totalSpent;
    if (totalSpent >= 1_000_000) return 2_000_000 - totalSpent;
    return 1_000_000 - totalSpent;
  }

  getBenefits(level: string) {
    const base = [
      {
        icon: 'assets/images/delivery-truck.svg',
        title: '6 mã Freeship mỗi tháng – tiết kiệm đến 400.000đ',
        desc: 'Áp dụng cho đơn từ 45.000đ.',
        link: '/coupons',
        linkText: 'Kho mã ưu đãi',
      },
      {
        icon: 'assets/images/coupon.svg',
        title: '3 mã giảm giá 8% mỗi tháng',
        desc: 'Đặc quyền Ngày Hội Thành Viên (5 & 20 hàng tháng): tặng thêm mã giảm 15%.',
        link: '/coupons',
        linkText: 'Kho mã ưu đãi',
      },
      {
        icon: 'assets/images/shopping.svg',
        title: 'Giảm thêm 10% cho hàng tiêu dùng',
        desc: 'Giá thành viên ưu đãi cho các sản phẩm Làm đẹp & Lưu niệm.',
      },
      {
        icon: 'assets/images/refund.png',
        title: 'Hoàn tiền (sắp ra mắt)',
        desc: 'Hoàn tiền trên mỗi giao dịch thành công.',
      },
    ];

    // Nếu là Gold hoặc Diamond, thêm đặc quyền riêng
    if (level === 'gold' || level === 'diamond') {
      base.push({
        icon: 'assets/images/gift.svg',
        title: 'Quà tri ân sinh nhật',
        desc: 'Nhận quà đặc biệt mỗi năm từ hệ thống BookStore.',
      });
    }

    if (level === 'diamond') {
      base.push({
        icon: 'assets/images/priority.png',
        title: 'Hỗ trợ ưu tiên 24/7',
        desc: 'Thành viên vàng & kim cương được hỗ trợ nhanh qua hotline riêng.',
      });
    }

    return base;
  }
}
