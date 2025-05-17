import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-vnpay-return',
  standalone: true,
  imports: [
    CommonModule
  ],
  template: `
    <div class="text-center">
      <h2>Kết quả thanh toán</h2>
      <p *ngIf="status === '00'">✅ Thanh toán thành công!</p>
      <p *ngIf="status !== '00'">❌ Thanh toán thất bại hoặc bị hủy.</p>
    </div>
  `
})
export class VnpayReturnComponent implements OnInit {
  status: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.status = params['vnp_TransactionStatus'];
    });
  }
}
