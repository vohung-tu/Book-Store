import { Component, OnInit } from '@angular/core';
import { Coupon } from '../../model/coupon.model';
import { CouponsService } from '../../service/coupon.service';


@Component({
  selector: 'app-coupons',
  templateUrl: './coupons.component.html',
})
export class CouponsComponent implements OnInit {
  coupons: Coupon[] = [];
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
