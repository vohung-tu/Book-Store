import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../service/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { RadioButtonModule } from 'primeng/radiobutton';
import { Address, User } from '../model/users-details.model';

@Component({
  selector: 'app-address-book',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    DialogModule,
    FormsModule,
    ToastModule,
    RouterModule,
    RadioButtonModule
  ],
  providers: [MessageService],
  templateUrl: './address-book.component.html',
  styleUrl: './address-book.component.scss'
})
export class AddressBookComponent implements OnInit {
  showAddressBook = false;
  displayAddAddressDialog = false;
  newAddress = '';
  user: User = {} as User;
  defaultAddressIndex = -1;

  constructor(
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = currentUser;

      this.user.address = this.user.address.map((addr: Address | string): Address => {
        if (typeof addr === 'object') return addr;

         // Nếu là chuỗi nhưng trông giống JSON, mới parse
        if (addr.trim().startsWith('{')) {
          try {
            return JSON.parse(addr);
          } catch (e) {
            console.error('Không thể parse địa chỉ JSON:', addr, e);
          }
        }

        // Trường hợp là chuỗi thông thường
        return { value: addr, isDefault: false };
        
      });

      this.defaultAddressIndex = this.user.address.findIndex((a: Address) => a.isDefault);
    }
  }

  openAddAddressDialog() {
    this.newAddress = '';
    this.displayAddAddressDialog = true;
  }

  addAddress() {
    // Kiểm tra xem địa chỉ mới có hợp lệ không
    if (!this.newAddress.trim()) return;
  
    // Xác định xem đây có phải là địa chỉ đầu tiên không
    const isFirstAddress = this.user.address.length === 0;
    
    // Tạo đối tượng địa chỉ mới
    const newAddressObj: Address = {
      value: this.newAddress.trim(),
      isDefault: isFirstAddress
    };
  
    // Thêm địa chỉ mới vào danh sách
    this.user.address.push(newAddressObj);
  
    // Gửi trực tiếp mảng địa chỉ (không cần serialize)
    this.authService.updateAddress(this.user._id, this.user.address).subscribe(
      (response: any) => {
        // Cập nhật lại dữ liệu người dùng từ response
        this.user = {
          ...response,
          address: response.address // Giả sử backend trả về mảng Address[]
        };
  
        // Cập nhật chỉ số địa chỉ mặc định
        this.defaultAddressIndex = this.user.address.findIndex((a: Address) => a.isDefault);
  
        // Lưu người dùng vào localStorage
        localStorage.setItem('user', JSON.stringify(this.user));
  
        // Hiển thị thông báo thành công
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Địa chỉ đã được thêm.'
        });
  
        // Đóng dialog thêm địa chỉ
        this.displayAddAddressDialog = false;
        this.newAddress = ''; // Xóa địa chỉ đã nhập
      },
      () => {
        // Hiển thị thông báo lỗi nếu không thể thêm địa chỉ
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể thêm địa chỉ.'
        });
      }
    );
  }  

  setDefaultAddress(index: number) {
    // Đặt cờ 'isDefault' cho tất cả địa chỉ
    this.user.address.forEach((addr: Address, i: number) => {
      addr.isDefault = i === index;
    });
  
    // Lưu lại index của địa chỉ mặc định
    this.defaultAddressIndex = index;
  
    // Không cần serialize, gửi trực tiếp Address[]
    this.authService.updateAddress(this.user._id, this.user.address).subscribe(
      (response: any) => {
        // Cập nhật địa chỉ từ response
        this.user = {
          ...response,
          address: response.address // Giả sử backend trả về mảng Address[]
        };
  
        // Lưu lại user mới vào localStorage
        localStorage.setItem('user', JSON.stringify(this.user));
  
        // Hiển thị thông báo thành công
        this.messageService.add({
          severity: 'success',
          summary: 'Cập nhật',
          detail: 'Đã đặt địa chỉ mặc định.'
        });
      },
      () => {
        // Hiển thị thông báo lỗi nếu có sự cố
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể cập nhật địa chỉ mặc định.'
        });
      }
    );
  }
  
}

// import { Component, OnInit } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { RouterModule } from '@angular/router';
// import { MessageService } from 'primeng/api';
// import { DialogModule } from 'primeng/dialog';
// import { TableModule } from 'primeng/table';
// import { CheckboxModule } from 'primeng/checkbox';
// import { FormsModule } from '@angular/forms';
// import { CardModule } from 'primeng/card';

// @Component({
//   selector: 'app-address-book',
//   standalone: true,
//   imports: [
//     ButtonModule,
//     RouterModule,
//     CommonModule,
//     DialogModule,
//     TableModule,
//     CheckboxModule,
//     FormsModule,
//     CardModule 
//   ],
//   templateUrl: './address-book.component.html',
//   styleUrls: ['./address-book.component.scss'],
//   providers: [MessageService]
// })
// export class AddressBookComponent implements OnInit {
//   currentUser: any;
//   editDialogVisible: boolean = false;
//   selectedAddress: any = null;

//   constructor(private http: HttpClient, private messageService: MessageService) {}

//   ngOnInit(): void {
//     this.getCurrentUser();
//   }

//   getCurrentUser() {
//     const token = localStorage.getItem('token');
//     if (!token) return;
    
//     const headers = new HttpHeaders({
//       'Authorization': `Bearer ${token}`
//     });

//     this.http.get<any>('http://localhost:3000/auth/me', { headers }).subscribe({
//       next: (data) => {
//         if (data) {
//           this.currentUser = data;
//         } else {
//           console.error('Không thể lấy thông tin người dùng');
//         }
//       },
//       error: (err) => {
//         console.error('Lỗi khi lấy thông tin người dùng', err);
//       }
//     });
//   }

//   // Chỉnh sửa thông tin người dùng
//   updateUserInfo() {
//     const token = localStorage.getItem('token');
//     if (!token) return;

//     const headers = new HttpHeaders({
//       'Authorization': `Bearer ${token}`
//     });

//     this.http.patch<any>(`http://localhost:3000/auth/${this.currentUser._id}`, this.currentUser, { headers }).subscribe({
//       next: (data) => {
//         this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Thông tin người dùng đã được cập nhật' });
//       },
//       error: (err) => {
//         this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Cập nhật thông tin thất bại' });
//       }
//     });
//   }

//   // Chỉnh sửa địa chỉ
//   editAddress(address: any) {
//     this.selectedAddress = { ...address };  // Sao chép để tránh thay đổi trực tiếp
//     this.editDialogVisible = true;
//   }

//   // Lưu địa chỉ đã chỉnh sửa
//   saveAddress() {
//     const updatedAddress = this.selectedAddress;
//     const token = localStorage.getItem('token');
//     if (!token) return;

//     const headers = new HttpHeaders({
//       'Authorization': `Bearer ${token}`
//     });

//     this.http.patch<any>(`http://localhost:3000/auth/${this.currentUser._id}/address`, { address: [updatedAddress] }, { headers }).subscribe({
//       next: (data) => {
//         this.currentUser = data; // Cập nhật lại dữ liệu người dùng
//         this.editDialogVisible = false;
//         this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Địa chỉ đã được cập nhật' });
//       },
//       error: (err) => {
//         this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Cập nhật địa chỉ thất bại' });
//       }
//     });
//   }

//   // Xóa địa chỉ
//   deleteAddress(address: any) {
//     const updatedAddresses = this.currentUser.address.filter((addr: any) => addr !== address);
//     const token = localStorage.getItem('token');
//     if (!token) return;

//     const headers = new HttpHeaders({
//       'Authorization': `Bearer ${token}`
//     });

//     this.http.patch<any>(`http://localhost:3000/auth/${this.currentUser._id}/address`, { address: updatedAddresses }, { headers }).subscribe({
//       next: (data) => {
//         this.currentUser = data;  // Cập nhật lại dữ liệu người dùng
//         this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Địa chỉ đã được xóa' });
//       },
//       error: (err) => {
//         this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Xóa địa chỉ thất bại' });
//       }
//     });
//   }
// }
