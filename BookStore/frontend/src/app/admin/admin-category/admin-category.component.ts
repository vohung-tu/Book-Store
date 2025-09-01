// admin-category.component.ts (standalone v17+)
import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table'; // nếu dùng p-table
import { DialogModule } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { Tag } from 'primeng/tag';
import { CategoryService } from '../../service/category.service';
import { DropdownModule } from 'primeng/dropdown';
export interface AdminCategory {
  _id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
  parentId?: string | null;
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
    DropdownModule,
    Tag
  ],
  templateUrl: './admin-category.component.html',
  styleUrls: ['./admin-category.component.scss']
})
export class AdminCategoryComponent implements OnInit {
  rows: AdminCategory[] = [];
  allRows: any[] = [];
  searchText: string = '';

  // dialog
  show = false;
  loading = false;
  editId: string | null = null;
  form: { name: string; slug: string; parentId: string | null } = {
    name: '',
    slug: '',
    parentId: null
  };

  // table
  rowsPerPage = 10;

  constructor(private api: CategoryService) {}

  ngOnInit(): void {
    this.load();
    this.fetchCategories();
  }

  fetchCategories() {
    this.api.getCategories().subscribe((data: any[]) => {
      this.allRows = data;
      this.rows = [...this.allRows]; // copy ra để hiển thị
    });
  }

  filterCategory() {
    const keyword = this.removeDiacritics(this.searchText.trim().toLowerCase());

    if (!keyword) {
      this.rows = [...this.allRows];
    } else {
      this.rows = this.allRows.filter(cat =>
        this.removeDiacritics(cat.name.toLowerCase()).includes(keyword)
      );
    }
  }

  private removeDiacritics(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  load(): void {
    this.loading = true;
    this.api.list().subscribe({
      next: (res: any[]) => {
        this.allRows = res as AdminCategory[];   // 🔥 luôn lưu vào allRows để filter
        this.rows = [...this.allRows];           // hiển thị ban đầu
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
    this.form = { name: '', slug: '', parentId: null };
    this.show = true;
  }

  openEdit(r: AdminCategory): void {
    this.editId = r._id;
    this.form = { 
      name: r.name, 
      slug: r.slug, 
      parentId: r.parentId || null 
    };
    this.show = true;
  }

  save(): void {
    const payload = { ...this.form,
      parentId: this.form.parentId || undefined
     };
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

  /** Tìm tên danh mục cha */
  parentNameOf(id?: string | null): string {
    if (!id) return '—';
    const found = this.rows.find(c => c._id === id);
    return found ? found.name : '—';
  }
}