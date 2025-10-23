import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { AdminSupplierService, Supplier } from '../../service/admin-supplier.service';

@Component({
  selector: 'app-admin-supplier',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, ToastModule, FileUploadModule],
  providers: [MessageService],
  templateUrl: './admin-supplier.component.html',
  styleUrls: ['./admin-supplier.component.scss']
})
export class AdminSupplierComponent implements OnInit {
  suppliers: Supplier[] = [];
  loading = signal(false);

  showDialog = false;
  editing: Supplier | null = null;
  formModel: Supplier = { name: '', code: '', email: '' };

  constructor(private api: AdminSupplierService, private msg: MessageService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: res => { this.suppliers = res; this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.editing = null;
    this.formModel = { name: '', email: '', phone: '', address: '', note: '' };
    this.showDialog = true;
  }

  openEdit(s: Supplier) {
    this.editing = s;
    this.formModel = { ...s };
    this.showDialog = true;
  }

  save(f: NgForm) {
    if (f.invalid) return;

    const req = this.editing?._id
      ? this.api.update(this.editing._id!, this.formModel)
      : this.api.create(this.formModel);

    req.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Thành công', detail: 'Đã lưu thông tin NCC' });
        this.showDialog = false;
        this.load();
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Lỗi', detail: 'Không lưu được NCC' })
    });
  }

  remove(s: Supplier) {
    if (!s._id) return;
    if (confirm(`Xóa nhà cung cấp ${s.name}?`)) {
      this.api.remove(s._id).subscribe(() => {
        this.msg.add({ severity: 'success', summary: 'Đã xóa', detail: s.name });
        this.load();
      });
    }
  }

  exportExcel() {
    this.api.exportExcel().subscribe(blob => {
      const a = document.createElement('a');
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = 'suppliers.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  importExcel(event: any) {
    const file = event.files?.[0];
    if (!file) return;
    this.api.importExcel(file).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Đã nhập', detail: 'File Excel thành công' });
        this.load();
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Lỗi', detail: 'Không nhập được file' })
    });
  }
}
