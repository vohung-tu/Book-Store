// admin-category.component.ts (standalone v17+)
import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table'; // nếu dùng p-table
import { DialogModule } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { Tag } from 'primeng/tag';
import { CategoryService } from '../../service/category.service';
export interface AdminCategory {
  _id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    FormsModule, 
    TableModule, 
    DialogModule, 
    InputText, 
    ButtonModule,
    Tag
  ],
  templateUrl: './admin-category.component.html',
  styleUrls: ['./admin-category.component.scss']
})
export class AdminCategoryComponent implements OnInit {
  rows: AdminCategory[] = [];

  // dialog
  show = false;
  loading = false;
  editId: string | null = null;
  form = { name: '', slug: '' };

  // table
  rowsPerPage = 10;

  constructor(private api: CategoryService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.list().subscribe({
      next: (res: any[]) => {
        this.rows = res as AdminCategory[];
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        alert(e?.error?.message || 'Lỗi tải danh mục');
      },
    });
  }

  openCreate(): void {
    this.editId = null;
    this.form = { name: '', slug: '' };
    this.show = true;
  }

  openEdit(r: AdminCategory): void {
    this.editId = r._id;
    this.form = { name: r.name, slug: r.slug };
    this.show = true;
  }

  save(): void {
    const payload = { ...this.form };
    const req = this.editId
      ? this.api.update(this.editId, payload)
      : this.api.create(payload);

    this.loading = true;
    req.subscribe({
      next: () => {
        this.show = false;
        this.load();
      },
      error: (e) => {
        this.loading = false;
        alert(e?.error?.message || 'Lỗi lưu category');
      },
    });
  }

  del(r: AdminCategory): void {
    if (!confirm(`Xóa "${r.name}"?`)) return;
    this.api.remove(r._id).subscribe({
      next: () => this.load(),
      error: (e) => alert(e?.error?.message || 'Lỗi xóa category'),
    });
  }

  // Optional: trackBy để table render nhanh
  trackById = (_: number, item: AdminCategory) => item._id;
}