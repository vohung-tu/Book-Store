import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

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

  constructor(private route: ActivatedRoute) {
    this.orderCode = this.route.snapshot.queryParamMap.get('orderCode');
    this.totalAmount = Number(this.route.snapshot.queryParamMap.get('amount'));
  }
}
