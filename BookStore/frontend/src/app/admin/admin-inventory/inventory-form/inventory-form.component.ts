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

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,  // ❗ không cần FormsModule nữa
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
  // ❗ bỏ ngModel, dùng FormControl
  typeCtrl = new FormControl<'import' | 'export'>('import', { nonNullable: true });

  books: BookLite[] = [];
  userId = '64f8b0c2c0e2c9c6b2d8a111';

  form!: FormGroup;
  loading = signal(false);
  totalQty!: Signal<number>;
  totalAmt!: Signal<number>;

  constructor(
    private fb: FormBuilder,
    private api: InventoryService,
    private bookApi: BookLiteService,
    private msg: MessageService
  ) {
    this.form = this.fb.group({
      date: [new Date(), Validators.required],
      supplierName: [''],
      receiverName: [''],
      reason: [''],
      lines: this.fb.array([]),
    });
  }

  // 👉 nếu muốn template type chính xác: FormArray<FormGroup>
  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  ngOnInit() {
    this.bookApi.getAllLite().subscribe(list => this.books = list);
    this.addLine();

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

  submit() {
    if (this.form.invalid) {
      this.msg.add({ severity: 'warn', summary: 'Thiếu dữ liệu', detail: 'Vui lòng nhập đủ thông tin.' });
      return;
    }

    const v = this.form.value as any;
    const type = this.typeCtrl.value; // 'import' | 'export'
    const body: any = {
      date: (v.date as Date).toISOString(),
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
    const req = type === 'import' ? this.api.createImport(body) : this.api.createExport(body);
    req.subscribe({
      next: (res) => {
        this.loading.set(false);
        this.msg.add({ severity: 'success', summary: 'Thành công', detail: `${type === 'import' ? 'Nhập' : 'Xuất'} kho: ${res.code}` });
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
