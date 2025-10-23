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
import { forkJoin, map } from 'rxjs';

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

  // tồn chi nhánh từng sách
  branchStocks: Record<string, { branchName: string; quantity: number }[]> = {};

  loading = signal(false);

  constructor(private api: InventoryService) {}

  ngOnInit() {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    this.from = threeMonthsAgo;
    this.to = today;
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

        // 🧠 Chuẩn bị load tồn kho cho từng sách trong chi tiết phiếu
        const requests: Record<string, any> = {};
        for (const d of res.details) {
          const bookId = d.bookId?._id || d.bookId;
          if (bookId) {
            // Lưu observable lại, không gọi subscribe trong vòng for
            requests[bookId] = this.api.getBranchStock(bookId);
          }
        }

        // ✅ Gọi tất cả request song song bằng forkJoin
        forkJoin(requests)
          .pipe(
            map((result) =>
              Object.fromEntries(
                Object.entries(result).map(([id, stocks]) => [id, (stocks as any[]) ?? []])
              ) as Record<string, { branchName: string; quantity: number }[]>
            )
          )
          .subscribe({
            next: (data) => {
              this.branchStocks = data;

              // 👇 Thêm log này để xem dữ liệu tồn kho thực tế
              console.log('📦 Dữ liệu tồn kho chi tiết:', this.branchStocks);
            },
            error: (err) => console.error('❌ Lỗi tải tồn kho:', err),
          });
      },
      error: (err) => {
        console.error('❌ Lỗi load chi tiết phiếu:', err);
      },
    });
  }
}
