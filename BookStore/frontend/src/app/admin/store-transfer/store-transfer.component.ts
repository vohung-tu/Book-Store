import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';

import { StoreTransferService } from '../../service/store-transfer.service';
import { BookLite, BookLiteService } from '../../service/book-lite.service';
import { StoreBranch, StoreBranchService } from '../../service/store-branch.service';

@Component({
  selector: 'app-store-transfer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DropdownModule,
    InputNumberModule,
    CalendarModule,
    ButtonModule,
    TableModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './store-transfer.component.html',
  styleUrls: ['./store-transfer.component.scss']
})
export class StoreTransferComponent implements OnInit {
  
  form!: FormGroup;
  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  loading = signal(false);
  totalQty = computed(() =>
    this.items.controls.reduce((s, c) => s + Number(c.get('quantity')?.value || 0), 0)
  );

  books: BookLite[] = [];
  warehouses: any[] = [];
  storeBranches: StoreBranch[] = [];
  transfers: any[] = [];

  constructor(
    private fb: FormBuilder,
    private msg: MessageService,
    private http: HttpClient,
    private transferApi: StoreTransferService,
    private bookApi: BookLiteService,
    private storeBranchApi: StoreBranchService
  ) {
    this.form = this.fb.group({
    date: [new Date(), Validators.required],
    fromWarehouse: [null as string | null, Validators.required],
    toStore: [null as string | null, Validators.required],
    note: [''],
    items: this.fb.array([])
  });
  }

  ngOnInit(): void {
    this.addLine();
    this.loadBooks();
    this.loadWarehouses();
    this.loadStoreBranches();
    this.loadTransfers();
  }

  loadBooks() {
    this.bookApi.getAllLite().subscribe({
      next: (res) => (this.books = res || []),
      error: () => this.toastError('Không tải được danh sách sách')
    });
  }

  loadWarehouses() {
    this.http.get<any[]>('https://book-store-3-svnz.onrender.com/inventory/branches').subscribe({
      next: (res) => (this.warehouses = res || []),
      error: () => this.toastError('Không tải được danh sách kho')
    });
  }

  loadStoreBranches() {
    this.storeBranchApi.list().subscribe({
      next: (res) => (this.storeBranches = res || []),
      error: () => this.toastError('Không tải được danh sách cửa hàng')
    });
  }

  loadTransfers() {
    this.transferApi.list().subscribe({
      next: (res) => (this.transfers = res || []),
      error: () => this.toastError('Không tải được danh sách phiếu chuyển')
    });
  }

  addLine() {
    this.items.push(
      this.fb.group({
        bookId: [null, Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]]
      })
    );
  }

  removeLine(i: number) {
    if (this.items.length > 1) this.items.removeAt(i);
  }

  submit() {
    if (this.form.invalid) {
      this.toastWarn('Vui lòng điền đủ thông tin.');
      return;
    }
    if (!this.items.value?.length) {
      this.toastWarn('Cần ít nhất 1 dòng sách.');
      return;
    }

    const v = this.form.value as any;
    const body = {
      fromWarehouse: v.fromWarehouse,
      toStore: v.toStore,
      items: (v.items || []).map((x: any) => ({
        bookId: typeof x.bookId === 'object' ? x.bookId?._id : x.bookId,
        quantity: Number(x.quantity || 0)
      })),
      note: v.note || ''
    };

    this.loading.set(true);
    this.transferApi.create(body).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.toastOk(`Đã tạo phiếu: ${res?.code || ''}`);
        this.form.reset({
          date: new Date(),
          fromWarehouse: null,
          toStore: null,
          note: ''
        });
        while (this.items.length) this.items.removeAt(0);
        this.addLine();
        this.loadTransfers();
      },
      error: (err) => {
        this.loading.set(false);
        this.toastError(err?.error?.message || 'Tạo phiếu thất bại');
      }
    });
  }

  bookLabel(idOrObj: any): string {
    const id = typeof idOrObj === 'object' ? idOrObj?._id : idOrObj;
    const b = this.books.find(x => x._id === id);
    return b ? b.title : '—';
  }

  toastOk(detail: string) {
    this.msg.add({ severity: 'success', summary: 'Thành công', detail });
  }
  toastWarn(detail: string) {
    this.msg.add({ severity: 'warn', summary: 'Thiếu dữ liệu', detail });
  }
  toastError(detail: string) {
    this.msg.add({ severity: 'error', summary: 'Lỗi', detail });
  }
}
