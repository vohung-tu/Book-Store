import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Author } from '../../model/author.model';
import { AuthorService } from '../../service/author.service';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { Editor } from 'primeng/editor';

@Component({
  selector: 'app-admin-author',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    CommonModule,
    FormsModule,
    DialogModule,
    Editor
  ],
  templateUrl: './admin-author.component.html',
  styleUrl: './admin-author.component.scss'
})
export class AdminAuthorComponent implements OnInit{
  isExpanded = false;
  expandedRows: { [key: number]: boolean } = {};
  authors: Author[] = [];
  showAddDialog = false;
  showEditDialog = false;
  newAuthor: any = {
    name: '',
    description: '',
    avatar: null
  };
  searchText: string = '';
  filteredAuthors: Author[] = [];
  previewImage: string | ArrayBuffer | null = null;

  constructor(private authorService: AuthorService) {}

  ngOnInit(): void {
    this.fetchAuthors();
  }

  fetchAuthors() {
    this.authorService.getAuthors().subscribe({
      next: (data) => {
        this.authors = data;
        this.filteredAuthors = [...this.authors]; // 🔥 gán lại để có dữ liệu hiển thị
      },
      error: (err) => console.error(err)
    });
  }

  openAddDialog() {
    this.newAuthor = { name: '', description: '', avatar: '' };
    this.showAddDialog = true;
  }

  filterAuthors() {
    const keyword = this.searchText.toLowerCase();
    this.filteredAuthors = this.authors.filter(a =>
      a.name.toLowerCase().includes(keyword) ||
      (a.description?.toLowerCase().includes(keyword))
    );
  }

  onImageSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.newAuthor.avatar = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  toggleExpand(index: number) {
    console.log('Index:', index);
    this.expandedRows[index] = !this.expandedRows[index];
    console.log(this.expandedRows);
  }

  addAuthor() {
    const formData = new FormData();
    formData.append('name', this.newAuthor.name);
    formData.append('description', this.newAuthor.description);
    formData.append('dateUpdate', new Date().toISOString());

    if (this.newAuthor.avatar) {
      formData.append('avatar', this.newAuthor.avatar);
    }

    this.authorService.addAuthor(formData).subscribe(() => {
      this.fetchAuthors();
      this.showAddDialog = false;
    });
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/def_avatar.png';
  }

  updateAuthor(id: string) {
    const formData = new FormData();
    formData.append('name', this.newAuthor.name);
    formData.append('description', this.newAuthor.description);
    formData.append('dateUpdate', new Date().toISOString());

    if (this.newAuthor.avatar instanceof File) {
      formData.append('avatar', this.newAuthor.avatar); // Chỉ thêm nếu có tệp mới
    }

    this.authorService.updateAuthor(id, formData).subscribe(() => {
      this.fetchAuthors();
      this.showEditDialog = false;
    });
  }

  openEditDialog(author: Author) {
    this.newAuthor = { ...author }; // Sao chép dữ liệu tác giả vào biến mới
    this.previewImage = 'http://localhost:3000' + author.avatar; // Hiển thị ảnh cũ
    this.showEditDialog = true;
  }


  onDelete(id: string) {
    if (confirm('Bạn có chắc muốn xóa tác giả này?')) {
      this.authorService.deleteAuthor(id).subscribe(() => {
        this.authors = this.authors.filter(a => a._id !== id);
      });
    }
  }

}
