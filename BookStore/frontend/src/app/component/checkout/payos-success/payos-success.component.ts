import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../../service/order.service';
import { catchError, interval, of, Subject, switchMap, takeUntil, takeWhile } from 'rxjs';

@Component({
  selector: 'app-payos-success',
  templateUrl: './payos-success.component.html',
  standalone:true,
  imports: [
    CommonModule,
    RouterModule
  ],
  styleUrls: ['./payos-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  orderCode: string | null = null;
  currentStatus: string = 'pending_payment'; 
  private destroy$ = new Subject<void>();
  cdr: any;

  constructor(private route: ActivatedRoute, private orderService: OrderService) {
  }
  ngOnInit() {
    this.orderCode = this.route.snapshot.queryParamMap.get('orderCode');
    const status = this.route.snapshot.queryParamMap.get('status');

    if (status === 'PAID' && this.orderCode) {
      // Option 1: Gọi một API lấy chi tiết đơn hàng để xác nhận trạng thái mới nhất
      // this.orderService.getOrderByPayosCode(this.orderCode).subscribe(...)
      
      // Option 2: Hiển thị thông báo "Đang xử lý" nếu status backend chưa kịp nhảy
      console.log("Thanh toán thành công, hệ thống đang cập nhật trạng thái đơn hàng.");
    }
  }

  startPollingStatus() {
    console.log('Bắt đầu kiểm tra trạng thái đơn hàng...');
    
    interval(3000).pipe(
      // Chuyển sang gọi API check status
      switchMap(() => this.orderService.getOrderByPayosCode(this.orderCode!)),
      
      // Tiếp tục lặp lại NẾU status vẫn là pending_payment
      // Khi status chuyển sang 'processing', 'completed', v.v. thì dừng lại
      takeWhile((order) => order?.status === 'pending_payment', true),
      
      // Bảo vệ: Dừng nếu user thoát trang
      takeUntil(this.destroy$),
      
      catchError(err => {
        console.error('Lỗi Polling:', err);
        return of(null);
      })
    ).subscribe((order) => {
      if (order) {
        this.currentStatus = order.status;
        console.log('Trạng thái hiện tại:', this.currentStatus);
        
        // Nếu đã cập nhật thành công, Angular sẽ render lại giao diện nhờ detectChanges
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
