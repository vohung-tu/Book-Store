import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CustomerLoyaltyService } from '../../service/customer-loyalty.service';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

interface Customer {
  _id: string;
  fullName: string;
  email: string;
  totalSpent: number;
  level: 'member' | 'silver' | 'gold' | 'diamond';
}

@Component({
  selector: 'app-customer-loyalty',
  templateUrl: './customer-loyalty.component.html',
  standalone: true,
  imports: [
    FormsModule,
    DropdownModule,
    TableModule,
    DialogModule,
    CommonModule,
    ButtonModule,
    TagModule
  ],
  styleUrls: ['./customer-loyalty.component.scss'],
  providers: [MessageService]
})
export class CustomerLoyaltyComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];

  levelOptions = [
    { label: 'Tất cả', value: '' },
    { label: 'Member', value: 'member' },
    { label: 'Silver', value: 'silver' },
    { label: 'Gold', value: 'gold' },
    { label: 'Diamond', value: 'diamond' },
  ];

  selectedLevel = '';
  displayDialog = false;

  // ✅ Luôn có giá trị mặc định, không undefined/null
  selectedCustomer: Customer = {
    _id: '',
    fullName: '',
    email: '',
    totalSpent: 0,
    level: 'member'
  };

  constructor(
    private loyaltyService: CustomerLoyaltyService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadCustomers();
  }

  /** 🔹 Lấy danh sách khách hàng */
  loadCustomers() {
    this.loyaltyService.getCustomers().subscribe({
      next: (res) => {
        this.customers = res;
        this.filteredCustomers = res;
      },
      error: (err) => {
        console.error('Lỗi tải khách hàng:', err);
      }
    });
  }

  /** 🔹 Lọc theo cấp độ */
  filterByLevel() {
    if (!this.selectedLevel) {
      this.filteredCustomers = this.customers;
    } else {
      this.filteredCustomers = this.customers.filter(
        c => c.level === this.selectedLevel
      );
    }
  }

  /** 🔹 Màu tag PrimeNG theo cấp độ */
  getSeverity(level: string) {
    switch (level) {
      case 'silver': return 'info';
      case 'gold': return 'warn';
      case 'diamond': return 'success';
      default: return 'secondary';
    }
  }

  /** 🔹 Mở dialog chỉnh sửa */
  openEditDialog(customer: Customer) {
    this.selectedCustomer = { ...customer };
    this.displayDialog = true;
  }

  /** 🔹 Cập nhật cấp độ khách hàng */
  updateCustomerLevel() {
    if (!this.selectedCustomer || !this.selectedCustomer._id) return;

    this.loyaltyService
      .updateCustomerLevel(this.selectedCustomer._id, this.selectedCustomer.level)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Cập nhật thành công!',
            detail: `${this.selectedCustomer.fullName} → ${this.selectedCustomer.level.toUpperCase()}`
          });
          this.displayDialog = false;
          this.loadCustomers();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'danger',
            summary: 'Lỗi!',
            detail: 'Không thể cập nhật khách hàng.'
          });
          console.error(err);
        }
      });
  }

  getLevelName(level: string): string {
  switch (level) {
    case 'silver': return 'Thành viên Bạc';
    case 'gold': return 'Thành viên Vàng';
    case 'diamond': return 'Thành viên Kim Cương';
    default: return 'Thành viên';
  }
}

}
