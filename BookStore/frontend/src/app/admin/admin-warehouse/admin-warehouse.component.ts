// BookStore/frontend/src/app/admin/admin-warehouse/admin-warehouse.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AdminWarehouseService, Warehouse } from '../../service/admin-warehouse.service';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-admin-warehouse',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, DialogModule, ButtonModule,
    InputTextModule, DropdownModule,
    ConfirmDialogModule, ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './admin-warehouse.component.html',
  styleUrls: ['./admin-warehouse.component.scss']
})
export class AdminWarehouseComponent implements OnInit {
  // list
  items: Warehouse[] = [];
  loading = signal(false);
  q = '';
  selectedBranch: Warehouse | null = null;
  branchStocks: any[] = [];
  showStockDialog = false;
  loadingStock = false;

  // dialog
  showDialog = false;
  editing: Warehouse | null = null;
  formModel: Warehouse = {
    name: '',
    region: 'Miền Bắc',
    address: '',
    managerName:'',
    managerEmail: '',
    managerPhone: ''
  };

  regions = ['Miền Bắc', 'Miền Trung', 'Miền Nam'];

  constructor(
    private api: AdminWarehouseService,
    private confirm: ConfirmationService,
    private msg: MessageService,
    private http: HttpClient
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: res => {
        this.items = res;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.msg.add({ severity: 'error', summary: 'Lỗi', detail: 'Không tải được danh sách kho.' });
      }
    });
  }

  // filter client-side
  get filtered(): Warehouse[] {
    const k = this.q.trim().toLowerCase();
    if (!k) return this.items;
    return this.items.filter(x =>
      (x.code || '').toLowerCase().includes(k) ||
      (x.name || '').toLowerCase().includes(k) ||
      (x.region || '').toLowerCase().includes(k) ||
      (x.address || '').toLowerCase().includes(k) || 
      (x.managerName || '').toLowerCase().includes(k) ||
      (x.managerEmail || '').toLowerCase().includes(k) ||
      (x.managerPhone || '').toLowerCase().includes(k)
    );
  }

  openCreate() {
    this.editing = null;
    this.formModel = {
      name: '',
      region: 'Miền Bắc',
      address: '',
      managerName:'',
      managerEmail: '',
      managerPhone: ''
    };
    this.showDialog = true;
  }

  openEdit(row: Warehouse) {
    this.editing = row;
    this.formModel = { ...row };
    this.showDialog = true;
  }

  save(f: NgForm) {
    if (f.invalid) {
      this.msg.add({ severity: 'warn', summary: 'Thiếu dữ liệu', detail: 'Vui lòng nhập đủ các trường bắt buộc.' });
      return;
    }

    const emailOk = this.validateEmail(this.formModel.managerEmail);
    if (!emailOk) {
      this.msg.add({ severity: 'warn', summary: 'Email không hợp lệ', detail: 'Vui lòng nhập email quản lý hợp lệ.' });
      return;
    }

    if (this.editing?._id) {
      this.api.update(this.editing._id, this.formModel).subscribe({
        next: () => {
          this.msg.add({ severity: 'success', summary: 'Thành công', detail: 'Đã cập nhật chi nhánh.' });
          this.showDialog = false;
          this.load();
        },
        error: (err) => {
          const detail = err?.error?.message || 'Cập nhật thất bại';
          this.msg.add({ severity: 'error', summary: 'Lỗi', detail });
        }
      });
    } else {
      this.api.create(this.formModel).subscribe({
        next: () => {
          this.msg.add({ severity: 'success', summary: 'Thành công', detail: 'Đã tạo chi nhánh.' });
          this.showDialog = false;
          this.load();
        },
        error: (err) => {
          const detail = err?.error?.message || 'Tạo thất bại';
          this.msg.add({ severity: 'error', summary: 'Lỗi', detail });
        }
      });
    }
  }

  remove(row: Warehouse) {
    if (!row._id) return;
    this.confirm.confirm({
      header: 'Xác nhận xoá',
      message: `Bạn chắc chắn muốn xoá kho <b>${row.name}</b>?`,
      acceptLabel: 'Xoá',
      rejectLabel: 'Huỷ',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(row._id!).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Đã xoá', detail: 'Xoá chi nhánh thành công.' });
            this.load();
          },
          error: (err) => {
            const detail = err?.error?.message || 'Xoá thất bại';
            this.msg.add({ severity: 'error', summary: 'Lỗi', detail });
          }
        });
      }
    });
  }

  validateEmail(v: string): boolean {
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  viewStock(branch: Warehouse) {
    this.selectedBranch = branch;
    this.showStockDialog = true;
    this.loadingStock = true;

    this.http
      .get<any[]>(`https://book-store-3-svnz.onrender.com/inventory/branch-stock/${branch._id}`)
      .subscribe({
        next: (data) => {
          console.log('📦 Dữ liệu tồn kho nhận được:', data);
          this.branchStocks = data;
          this.loadingStock = false;
        },
        error: (err) => {
          console.error('❌ Lỗi lấy tồn kho:', err);
          this.loadingStock = false;
          this.msg.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không tải được tồn kho chi nhánh.'
          });
        }
      });
  }

}
