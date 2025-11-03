import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { StoreBranch, StoreBranchService } from '../../service/store-branch.service';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-store-branch',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    DropdownModule
  ],
  providers: [MessageService],
  templateUrl: './store-branch.component.html',
  styleUrls: ['./store-branch.component.scss']
})
export class StoreBranchComponent implements OnInit {
  branches: StoreBranch[] = [];
  showDialog = false;
  editing = false;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private msg: MessageService,
    private branchService: StoreBranchService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      district: ['', Validators.required],
      city: ['', Validators.required],
      region: ['', Validators.required],
      phone: [''],
      mapUrl: [''],
    });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.branchService.list().subscribe({
      next: (res) => (this.branches = res),
      error: () =>
        this.msg.add({ severity: 'error', summary: 'Lỗi', detail: 'Không tải được danh sách chi nhánh' }),
    });
  }

  openNew() {
    this.form.reset();
    this.editing = false;
    this.showDialog = true;
  }

  edit(branch: StoreBranch) {
    this.form.patchValue(branch);
    this.editing = true;
    this.showDialog = true;
  }

  save() {
    if (this.form.invalid) {
      this.msg.add({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Vui lòng nhập đầy đủ dữ liệu.' });
      return;
    }

    const data = this.form.value;
    const isEdit = this.editing && !!data._id;

    const req = isEdit
      ? this.branchService.update(data._id!, data)
      : this.branchService.create(data);

    req.subscribe({
      next: (res) => {
        this.msg.add({
          severity: 'success',
          summary: 'Thành công',
          detail: isEdit ? `Đã cập nhật chi nhánh "${res.name}"` : `Đã thêm chi nhánh "${res.name}"`,
        });
        this.showDialog = false;
        this.load();
      },
      error: (err) => {
        console.error('❌ Lỗi lưu chi nhánh:', err);
        this.msg.add({
          severity: 'error',
          summary: 'Thất bại',
          detail: err?.error?.message || 'Không thể lưu chi nhánh',
        });
      },
    });
  }


  delete(branch: StoreBranch) {
    if (!confirm(`Bạn có chắc chắn muốn xóa chi nhánh "${branch.name}"?`)) return;

    this.branchService.delete(branch._id).subscribe({
      next: () => {
        this.msg.add({
          severity: 'success',
          summary: 'Đã xóa',
          detail: `Chi nhánh "${branch.name}" đã được xóa.`,
        });
        this.load();
      },
      error: (err) => {
        console.error('❌ Lỗi xóa chi nhánh:', err);
        this.msg.add({
          severity: 'error',
          summary: 'Thất bại',
          detail: err?.error?.message || 'Không thể xóa chi nhánh',
        });
      },
    });
  }
}
