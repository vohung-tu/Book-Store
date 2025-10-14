import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { PaginatorModule } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InventoryReceipt, Paginated } from '../../../model/inventory.model';
import { InventoryService } from '../../../service/inventory.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DropdownModule,
    CalendarModule,
    PaginatorModule,
    InputTextModule,
    ButtonModule,
    DialogModule
  ],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  type: 'import' | 'export' | '' = '';
  from?: Date;
  to?: Date;
  q = '';
  page = 1;
  limit = 10;
  total = 0;
  items: InventoryReceipt[] = [];

  // popup chi tiết
  showDetail = false;
  selected?: InventoryReceipt;

  loading = signal(false);

  constructor(private api: InventoryService) {}

  ngOnInit() {
    // ✅ Ngày hiện tại
    const today = new Date();

    // ✅ Lùi lại 3 tháng từ ngày hiện tại
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    // Gán vào bộ lọc
    this.from = threeMonthsAgo;
    this.to = today;

    // ✅ Gọi API load dữ liệu
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api
      .listReceipts({
        type: this.type || undefined,
        from: this.from ? this.from.toISOString() : undefined,
        to: this.to ? this.to.toISOString() : undefined,
        q: this.q || undefined,
        page: this.page,
        limit: this.limit
      })
      .subscribe({
        next: (res: Paginated<InventoryReceipt>) => {
          this.items = res.items;
          this.total = res.total;
          this.limit = res.limit;
          this.page = res.page;
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  onPageChange(e: any) {
    this.page = (e.page ?? 0) + 1;
    this.limit = e.rows ?? 10;
    this.load();
  }

  openDetail(row: any) {
    this.api.getReceiptById(row._id).subscribe({
      next: (res) => {
        this.selected = res;
        this.showDetail = true;
      },
      error: (err) => console.error('❌ Lỗi load chi tiết phiếu:', err)
    });
  }
}
