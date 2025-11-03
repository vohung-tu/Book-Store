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
import { DropdownModule } from 'primeng/dropdown';
import { Address } from '../../model/users-details.model';
import { AuthService } from '../../service/auth.service';

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
    ToastModule,
    DropdownModule
  ],
  providers: [MessageService],
  templateUrl: './admin-user.component.html',
  styleUrl: './admin-user.component.scss'
})
export class AdminUserComponent implements OnInit {
  users: any[] = [];
  user: any = this.getEmptyUser();
  displayDialog = false;
  isEditMode = false;
  selectedAddress: any = null;
  newAddress: string = '';
  searchText: string = '';
  filteredUsers: any[] = [];
  addresses: Address[] = [];
  roles = [
    { label: 'Admin', value: 'admin' },
    { label: 'User', value: 'user' }
  ];
  selectedUsers: any[] = [];
  constructor(
    private http: HttpClient, 
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fetchUsers();
    this.filteredUsers = this.users;
    this.addresses = this.user.address || [];

  }

//   deleteSelectedUsers() {
//   if (!this.selectedUsers.length) return;

//   const confirmDelete = confirm(`Bạn có chắc muốn xóa ${this.selectedUsers.length} người dùng này không?`);
//   if (!confirmDelete) return;

//   const ids = this.selectedUsers.map(u => u._id);
//   let deletedCount = 0;

//   ids.forEach(id => {
//     this.userService.deleteUser(id).subscribe({
//       next: () => {
//         deletedCount++;
//         if (deletedCount === ids.length) {
//           this.loadUsers();
//           this.selectedUsers = [];
//         }
//       },
//       error: (err) => console.error('❌ Lỗi khi xóa người dùng:', err)
//     });
//   });
// }

  fetchUsers() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any[]>('https://book-store-3-svnz.onrender.com/auth/', { headers }).subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = data; // để bảng hiển thị ban đầu
      },
      error: (err) => console.error('Lỗi khi lấy danh sách người dùng', err)
    });
  }

  loadUserAddresses(userId: string) {
    this.authService.getAddresses(userId).subscribe((data: any) => {
      // Thêm option "Địa chỉ khác" cuối danh sách
      const savedAddresses = data.address || [];
      this.addresses = [...savedAddresses, { value: 'other', label: 'Địa chỉ khác' }];
  
      // Sắp xếp mặc định lên đầu
      this.addresses.sort((a: Address, b: Address) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return 0;
      });
  
      this.selectedAddress = this.addresses.length > 0 ? this.addresses[0].value : '';
    });
  }
  

  getEmptyUser() {
    return {
      full_name: '',
      email: '',
      username: '',
      phone_number: '',
      address: [],
      birth: '',
      role: 'user'
    };
  }

  filterUser() {
    const query = this.searchText.toLowerCase();
    this.filteredUsers = this.users.filter(p =>
      (p.full_name?.toLowerCase().includes(query) || '') ||
      (p.email?.toLowerCase().includes(query) || '') ||
      (p.phone_number?.toLowerCase().includes(query) || '') ||
      (p.role?.toLowerCase().includes(query) || '') ||
      (Array.isArray(p.address) && p.address.some((addr: any) => addr?.value?.toLowerCase().includes(query)))
    );
  }

  openAddUserDialog() {
    this.isEditMode = false;
    this.user = this.getEmptyUser();
    this.selectedAddress = null;
    this.newAddress = '';
    this.displayDialog = true;
  }

  editUser(u: any) {
    this.user = { ...u };
    this.user.birth = this.formatDateToInput(this.user.birth);
    this.newAddress = '';
    this.isEditMode = true;
    this.displayDialog = true;

    if (this.user._id) {
      this.loadUserAddresses(this.user._id);
    } else {
      this.selectedAddress = null; // nếu không có user id thì reset
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.user = this.getEmptyUser();
    this.selectedAddress = null;
    this.newAddress = '';
    this.displayDialog = false;
  }

  onAddressChange(event: any) {
    if (event.value === 'other') {
      this.newAddress = '';
    }
  }

  onSubmit() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  
    let updatedAddress: Address[] = this.user.address || [];
  
    // Reset tất cả isDefault về false
    updatedAddress = updatedAddress.map((addr: Address) => ({ ...addr, isDefault: false }));
  
    if (this.newAddress.trim()) {
      updatedAddress.push({ value: this.newAddress.trim(), isDefault: true });
    } else if (this.selectedAddress) {
      updatedAddress = updatedAddress.map((addr: Address) => ({
        ...addr,
        isDefault: addr.value === this.selectedAddress
      }));
    }
  
    const updatedUser = {
      ...this.user,
      address: updatedAddress
    };  
  
    if (this.isEditMode) {
      this.http.put(`https://book-store-3-svnz.onrender.com/auth/${this.user._id}`, updatedUser, { headers }).subscribe(() => {
        this.fetchUsers();
        this.cancelEdit();
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật người dùng thành công!' });
        this.displayDialog = false;
      });
    } else {
      this.http.post('https://book-store-3-svnz.onrender.com/admin/create-user', updatedUser, { headers }).subscribe(() => {
        this.fetchUsers();
        this.user = this.getEmptyUser();
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Tạo người dùng thành công!' });
        this.displayDialog = false;
      });
    }
  }
  
  formatDateToInput(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    // Lấy YYYY-MM-DD
    return date.toISOString().substring(0, 10);
  }

  deleteUser(user: any) {
    const userId = user._id;
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      this.http.delete(`https://book-store-3-svnz.onrender.com/auth/${userId}`).subscribe(() => {
        this.fetchUsers();
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Xóa người dùng thành công'
        });
      });
    }
  }
}
