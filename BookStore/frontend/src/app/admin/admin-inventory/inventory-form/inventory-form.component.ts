import { Component, OnInit, computed, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators, FormGroup, FormControl } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BookLite, BookLiteService } from '../../../service/book-lite.service';
import { InventoryService } from '../../../service/inventory.service';

// 📥 IMPORT EXCEL
import * as XLSX from 'xlsx';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DropdownModule,
    InputNumberModule,
    CalendarModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './inventory-form.component.html',
  styleUrls: ['./inventory-form.component.scss']
})
export class InventoryFormComponent implements OnInit {
  typeCtrl = new FormControl<'import' | 'export'>('import', { nonNullable: true });

  books: BookLite[] = [];
  userId = '64f8b0c2c0e2c9c6b2d8a111';
  branches: any[] = [];
  suppliers: any[] = [];
  form!: FormGroup;
  loading = signal(false);
  totalQty!: Signal<number>;
  totalAmt!: Signal<number>;

  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private api: InventoryService,
    private bookApi: BookLiteService,
    private msg: MessageService,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      date: [new Date(), Validators.required],
      branchId: [null, Validators.required],
      supplierId: [null],
      receiverName: [''],
      reason: [''],
      lines: this.fb.array([]),
    });
  }

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  ngOnInit() {
    this.bookApi.getAllLite().subscribe(list => this.books = list);
    this.addLine();
    this.http.get<any[]>('https://book-store-3-svnz.onrender.com/inventory/branches').subscribe({
      next: res => this.branches = res,
      error: err => console.error('Lỗi tải chi nhánh:', err)
    });

    this.http.get<any[]>('https://book-store-3-svnz.onrender.com/suppliers').subscribe({
      next: res => this.suppliers = res,
      error: err => console.error('Lỗi tải nhà cung cấp:', err)
    });


    this.totalQty = computed(() =>
      this.lines.controls.reduce((s, c) => s + (c.get('quantity')?.value || 0), 0)
    );
    this.totalAmt = computed(() =>
      this.lines.controls.reduce((s, c) =>
        s + (c.get('quantity')?.value || 0) * (c.get('unitPrice')?.value || 0), 0)
    );
  }

  addLine() {
    this.lines.push(this.fb.group({
      bookId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.min(0)]],
    }));
  }

  removeLine(i: number) {
    this.lines.removeAt(i);
  }

  // 📥 IMPORT EXCEL – đọc file Excel và thêm dòng chi tiết
  onExcelSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[sheetName]); // ✅ fix type

      if (!rows.length) {
        this.msg.add({ severity: 'warn', summary: 'File trống', detail: 'Không có dữ liệu trong file Excel' });
        return;
      }

      let added = 0;
      for (const row of rows) {
        const code = row['Mã sách'] || row['BookCode'] || row['Code'];
        const qty = Number(row['Số lượng'] || row['Quantity'] || 0);
        const price = Number(row['Giá nhập'] || row['ImportPrice'] || 0);

        if (!code || !qty) continue;

        // ✅ nếu BookLite có code
        const foundBook = this.books.find(b => b._id === code.trim());

        if (!foundBook) {
          console.warn(`⚠️ Không tìm thấy sách có mã: ${code}`);
          continue;
        }

        const line = this.fb.group({
          bookId: [foundBook._id, Validators.required],
          quantity: [qty, [Validators.required, Validators.min(1)]],
          unitPrice: [price, [Validators.min(0)]],
        });
        this.lines.push(line);
        added++;
      }

      if (added)
        this.msg.add({ severity: 'success', summary: 'Import thành công', detail: `Đã thêm ${added} dòng từ Excel` });
      else
        this.msg.add({ severity: 'warn', summary: 'Không hợp lệ', detail: 'Không có dòng nào hợp lệ trong file Excel' });
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
  }

  submit() {
    if (this.form.invalid) {
      this.msg.add({ severity: 'warn', summary: 'Thiếu dữ liệu', detail: 'Vui lòng nhập đủ thông tin.' });
      return;
    }

    const v = this.form.value as any;
    const type = this.typeCtrl.value;

    // ✅ Chuẩn bị body gửi kèm branchId
    const body: any = {
      date: (v.date as Date).toISOString(),
      branchId: v.branchId, // ✅ thêm branchId
      reason: v.reason,
      userId: this.userId,
      lines: (v.lines || []).map((l: any) => ({
        bookId: l.bookId?._id || l.bookId,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice || 0),
      })),
    };

    if (type === 'import') body.supplierName = v.supplierName;
    else body.receiverName = v.receiverName;

    this.loading.set(true);
    const req = type === 'import'
      ? this.api.createImport(body)
      : this.api.createExport(body);

    req.subscribe({
      next: (res) => {
        this.loading.set(false);
        this.msg.add({
          severity: 'success',
          summary: 'Thành công',
          detail: `${type === 'import' ? 'Nhập' : 'Xuất'} kho: ${res.code}`
        });
        while (this.lines.length) this.lines.removeAt(0);
        this.addLine();
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err?.error?.message || 'Có lỗi xảy ra';
        this.msg.add({ severity: 'error', summary: 'Thất bại', detail });
      }
    });
  }
}
