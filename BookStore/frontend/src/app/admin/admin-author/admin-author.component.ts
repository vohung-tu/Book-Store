import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Author } from '../../model/author.model';
import { AuthorService } from '../../service/author.service';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-admin-author',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    CommonModule,
    FormsModule,
    DialogModule
  ],
  templateUrl: './admin-author.component.html',
  styleUrl: './admin-author.component.scss'
})
export class AdminAuthorComponent implements OnInit{
  authors: Author[] = [];
  showAddDialog = false;
  showEditDialog = false;
  newAuthor: any = {
    name: '',
    description: '',
    avatar: null
  };
  previewImage: string | ArrayBuffer | null = null;

  constructor(private authorService: AuthorService) {}

  ngOnInit(): void {
    this.fetchAuthors();
  }

  fetchAuthors() {
    this.authorService.getAuthors().subscribe({
      next: (data) => this.authors = data,
      error: (err) => console.error(err)
    });
  }

  openAddDialog() {
    this.newAuthor = { name: '', description: '', avatar: '' };
    this.showAddDialog = true;
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
      reader.readAsDataURL(file); // Convert image file to base64 string for preview
    }
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

  updateAuthor(id: string) {
    const formData = new FormData();
    formData.append('name', this.newAuthor.name);
    formData.append('description', this.newAuthor.description);
    formData.append('dateUpdate', new Date().toISOString());

    if (this.newAuthor.avatar) {
      formData.append('avatar', this.newAuthor.avatar);
    }

    this.authorService.updateAuthor(id, formData).subscribe(() => {
      this.fetchAuthors();
      this.showEditDialog = false;
    });
  }

  onDelete(id: string) {
    if (confirm('Bạn có chắc muốn xóa tác giả này?')) {
      this.authorService.deleteAuthor(id).subscribe(() => {
        this.authors = this.authors.filter(a => a._id !== id);
      });
    }
  }

}
