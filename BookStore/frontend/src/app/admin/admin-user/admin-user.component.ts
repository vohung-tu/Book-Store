import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-user',
  standalone: true,
  imports: [
    TableModule,
    CommonModule,
    ButtonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './admin-user.component.html',
  styleUrl: './admin-user.component.scss'
})
export class AdminUserComponent implements OnInit{
  users: any[] = [];
  user: any = this.getEmptyUser();
  displayDialog = false;
  isEditMode: boolean = false;

  constructor(private http: HttpClient, private messageService: MessageService) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    this.http.get<any[]>('http://localhost:3000/auth/', { headers }).subscribe({
      next: (data) => this.users = data,
      error: (err) => console.error('Lỗi khi lấy danh sách người dùng', err)
    });
  }

  getEmptyUser() {
    return {
      full_name: '',
      email: '',
      username: '',
      phone_number: '',
      address: '',
      birth: '',
      role: 'user'
    };
  }

  openAddUserDialog() {
    this.isEditMode = false;
    this.user = this.getEmptyUser();
    this.displayDialog = true;
  }

  editUser(u: any) {
    this.user = { ...u };
    this.isEditMode = true;
  }

  cancelEdit() {
    this.isEditMode = false;
    this.user = this.getEmptyUser();
  }

  onSubmit() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    if (this.isEditMode) {
      this.http.put(`http://localhost:3000/auth/${this.user._id}`, this.user, { headers }).subscribe(() => {
        this.fetchUsers();
        this.cancelEdit();
        this.messageService.add({severity: 'success', summary: 'Thành công', detail: 'Cập nhật người dùng thành công!'});
        this.displayDialog = false;
      });
    } else {
      this.http.post('http://localhost:3000/admin/create-user', this.user, { headers }).subscribe(() => {
        this.fetchUsers();
        this.user = this.getEmptyUser();
        this.messageService.add({severity: 'success', summary: 'Thành công', detail: 'Tạo người dùng thành công!'});
        this.displayDialog = false;  // Đóng dialog sau khi tạo thành công 
      });
    }
  }
  
  deleteUser(id: string) {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      this.http.delete(`http://localhost:3000/auth/${id}`).subscribe(() => {
        this.fetchUsers();
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Xóa người dùng thành công' });
      });
    }
  }
}
