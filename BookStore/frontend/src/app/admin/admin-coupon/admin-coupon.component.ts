import { Component, OnInit } from '@angular/core';
import { Coupon } from '../../model/coupon.model';
import { CouponsService } from '../../service/coupon.service';
import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { CalendarModule } from 'primeng/calendar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';


@Component({
  selector: 'app-coupons',
  standalone: true,
    imports: [
      Dialog,
      TableModule,
      Tag,
      CalendarModule,
      CommonModule,
      FormsModule,
      ButtonModule,
      DropdownModule
    ],
  templateUrl: './admin-coupon.component.html',
  styleUrl: './admin-coupon.component.scss'
})
export class CouponsComponent implements OnInit {
  coupons: Coupon[] = [];
  show = false;
  loading = false;
  displayDialog = false;
  selectedCoupon: Coupon = {} as Coupon;
  isEdit = false;
  typeOptions = [
    { label: 'Giảm %', value: 'percent' },
    { label: 'Giảm tiền', value: 'amount' }
  ];

  constructor(private couponService: CouponsService) {}

  ngOnInit() {
    this.loadCoupons();
  }

  loadCoupons() {
    this.couponService.getCoupons().subscribe(c => this.coupons = c);
  }

  openDialog() {
    this.selectedCoupon = {} as Coupon;
    this.isEdit = false;
    this.displayDialog = true;
  }

  editCoupon(c: Coupon) {
    this.selectedCoupon = { ...c };
    this.isEdit = true;
    this.displayDialog = true;
  }

  saveCoupon() {
    if (this.isEdit && this.selectedCoupon._id) {
      this.couponService.updateCoupon(this.selectedCoupon._id, this.selectedCoupon)
        .subscribe(() => { this.loadCoupons(); this.displayDialog = false; });
    } else {
      this.couponService.createCoupon(this.selectedCoupon)
        .subscribe(() => { this.loadCoupons(); this.displayDialog = false; });
    }
  }

  deleteCoupon(id: string) {
    if (confirm('Bạn có chắc muốn xóa coupon này?')) {
      this.couponService.deleteCoupon(id)
        .subscribe(() => this.loadCoupons());
    }
  }
}
