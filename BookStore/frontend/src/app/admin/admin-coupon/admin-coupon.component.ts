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
import { CategoryService } from '../../service/category.service';
import { Category } from '../../model/books-details.model';
import { MultiSelectModule } from 'primeng/multiselect';

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
      MultiSelectModule,
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
  categoryOptions: { label: string; value: string }[] = [];

  constructor(private couponService: CouponsService,
    private categoryService: CategoryService) {}

  ngOnInit() {
    this.loadCoupons();
    this.loadCategories();
  }

  loadCoupons() {
    this.couponService.getCoupons().subscribe(c => this.coupons = c);
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories: Category[]) => {
        this.categoryOptions = categories.map(c => ({
          label: c.name,
          value: c.slug // dùng slug để filter FE hoặc gửi lên BE
        }));
      },
      error: (err) => console.error('❌ Lỗi khi load categories:', err)
    });
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
