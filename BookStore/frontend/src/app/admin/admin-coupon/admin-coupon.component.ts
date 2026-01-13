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

  // ✅ Thêm lựa chọn cấp độ
  levelOptions = [
    { label: 'Thành viên Thường', value: 'member' },
    { label: 'Thành viên Bạc', value: 'silver' },
    { label: 'Thành viên Vàng', value: 'gold' },
    { label: 'Thành viên Kim cương', value: 'diamond' }
  ];

  categoryOptions: { label: string; value: string }[] = [];

  constructor(
    private couponService: CouponsService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.loadCoupons();
    this.loadCategories();
  }

  loadCoupons() {
    this.couponService.getCoupons().subscribe(c => (this.coupons = c));
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories: Category[]) => {
        this.categoryOptions = categories.map(c => ({
          label: c.name,
          value: c.slug
        }));
      },
      error: err => console.error('❌ Lỗi khi load categories:', err)
    });
  }

  openDialog() {
    this.selectedCoupon = {} as Coupon;
    this.isEdit = false;
    this.displayDialog = true;
  }

  editCoupon(c: Coupon) {
    this.selectedCoupon = {
      ...c,
      startDate: c.startDate ? new Date(c.startDate) : undefined,
      endDate: c.endDate ? new Date(c.endDate) : undefined
    };

    this.isEdit = true;
    this.displayDialog = true;
  }

  saveCoupon() {
    const payload: Coupon = {
      ...this.selectedCoupon,
      startDate:
        this.selectedCoupon.startDate instanceof Date
          ? this.selectedCoupon.startDate.toISOString()
          : this.selectedCoupon.startDate,
      endDate:
        this.selectedCoupon.endDate instanceof Date
          ? this.selectedCoupon.endDate.toISOString()
          : this.selectedCoupon.endDate
    };

    const op = this.isEdit
      ? this.couponService.updateCoupon(payload._id!, payload)
      : this.couponService.createCoupon(payload);

    op.subscribe(() => {
      this.loadCoupons();
      this.displayDialog = false;
    });
  }

  deleteCoupon(id: string) {
    if (confirm('Bạn có chắc muốn xóa coupon này?')) {
      this.couponService.deleteCoupon(id).subscribe(() => this.loadCoupons());
    }
  }

  // ✅ Helper hiển thị cấp độ
  getLevelName(level: string) {
    switch (level) {
      case 'silver': return 'Thành viên Bạc';
      case 'gold': return 'Thành viên Vàng';
      case 'diamond': return 'Thành viên Kim cương';
      default: return 'Thành viên Thường';
    }
  }

  getLevelSeverity(level: string) {
    switch (level) {
      case 'silver': return 'info';
      case 'gold': return 'warn';
      case 'diamond': return 'success';
      default: return 'secondary';
    }
  }
}
