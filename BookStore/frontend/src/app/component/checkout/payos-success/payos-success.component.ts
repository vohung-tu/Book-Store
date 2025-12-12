import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../service/order.service';

@Component({
  selector: 'app-payos-success',
  templateUrl: './payos-success.component.html',
  standalone:true,
  imports: [
    CommonModule
  ],
  styleUrls: ['./payos-success.component.scss']
})
export class PaymentSuccessComponent {
  orderCode: string | null = null;
  totalAmount: number = 0;

  constructor(private route: ActivatedRoute, private orderService: OrderService) {
  }
  ngOnInit() {
    this.orderCode = this.route.snapshot.queryParamMap.get('orderCode');

    if (this.orderCode) {
      this.orderService.getOrderByCode(this.orderCode).subscribe({
        next: (order) => {
          this.totalAmount = order.totalPrice; // lấy từ DB
        },
        error: (err) => {
          console.error('Lỗi lấy đơn hàng:', err);
        },
      });
    }
  }
}
