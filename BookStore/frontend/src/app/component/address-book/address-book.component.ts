import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../service/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { RadioButtonModule } from 'primeng/radiobutton';
import { Address, User } from '../../model/users-details.model';

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
  displayEditAddressDialog = false;
  newAddress = '';
  fullName: string = '';
  phoneNumber!: number;
  user: User = {} as User;
  defaultAddressIndex = -1;
  addresses: Address[] = [
  ];
  editAddressIndex: number | null = null;
  editAddressData: { value: string; isDefault: boolean; fullName?: string; phoneNumber?: number } = {
    value: '',
    isDefault: false,
    fullName: '',
    phoneNumber: 0
  };

  constructor(
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    
    this.loadUser()
  }

  private loadUser(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = currentUser;
  
      // Chuẩn hoá tất cả thành Address { value, isDefault, fullName, phoneNumber }
      this.user.address = this.user.address.map((addr: Address | string): Address => {
        if (typeof addr === 'object') {
          return {
            value: addr.value,
            isDefault: addr.isDefault,
            // nếu object cũ đã có fullName/phoneNumber thì giữ lại,
            // nếu không thì dùng của user
            fullName: (addr as any).fullName ?? this.user.full_name,
            phoneNumber: (addr as any).phoneNumber ?? this.user.phone_number
          };
        }
        // trường hợp là string
        return {
          value: addr,
          isDefault: false,
          fullName: this.user.full_name,
          phoneNumber: this.user.phone_number
        };
      });
  
      this.defaultAddressIndex = this.user.address.findIndex(a => a.isDefault);
    }
  }
  
  openAddAddressDialog() {
    this.newAddress = '';
    this.displayAddAddressDialog = true;
  }

  onEditAddress(index: number) {
    const address = this.user.address[index];
    if (!address) return;
  
    this.editAddressIndex = index;
    this.editAddressData = {
      value: address.value || '',
      isDefault: address.isDefault || false,
      fullName: address.fullName || '',
      phoneNumber: address.phoneNumber || 0 // <- luôn là number
    };
    this.displayEditAddressDialog = true;
  }
  onCancelEditAddress() {
    this.displayEditAddressDialog = false;
    this.editAddressIndex = null;
  }
  

  onSaveEditedAddress() {
    if (this.editAddressIndex === null) return;

    // 1) Update local copy
    this.user.address[this.editAddressIndex] = {
      ...this.user.address[this.editAddressIndex],
      ...this.editAddressData
    };

    // 2) Persist to server
    this.authService.updateAddress(this.user._id, this.user.address)
      .subscribe({
        next: updatedUser => {
          // 3a) Update your local this.user
          this.user = updatedUser;
          // 3b) Also overwrite localStorage
          localStorage.setItem('user', JSON.stringify(this.user));
          // (optionally) notify AuthService subject:
          this.authService.setCurrentUser(this.user);

          this.defaultAddressIndex = this.user.address.findIndex(a => a.isDefault);
          this.messageService.add({ severity:'success', summary:'Cập nhật', detail:'Đã lưu địa chỉ.' });
          this.displayEditAddressDialog = false;
          this.editAddressIndex = null;
        },
        error: err => {
          console.error(err);
          this.messageService.add({ severity:'error', summary:'Lỗi', detail:'Không thể lưu địa chỉ.' });
          this.loadUser();  // rollback
        }
      });
  }

  onDeleteAddress(index: number) {
    if (!confirm('Bạn chắc không?')) return;

    // 1) Optimistically remove locally
    this.user.address.splice(index, 1);

    // 2) Persist
    this.authService.updateAddress(this.user._id, this.user.address)
      .subscribe({
        next: updatedUser => {
          this.user = updatedUser;
          localStorage.setItem('user', JSON.stringify(this.user));
          this.authService.setCurrentUser(this.user);

          this.defaultAddressIndex = this.user.address.findIndex(a => a.isDefault);
          this.messageService.add({ severity:'success', summary:'Xóa', detail:'Đã xóa địa chỉ.' });
        },
        error: err => {
          console.error(err);
          this.messageService.add({ severity:'error', summary:'Lỗi', detail:'Không thể xóa.' });
          this.loadUser();
        }
      });
  }

  addAddress() {
    // Kiểm tra xem các trường có hợp lệ không
    if (
      !this.newAddress.trim() ||
      !this.fullName.trim() ||
      this.phoneNumber == null ||
      isNaN(this.phoneNumber)
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ.'
      });
      return;
    }
  
    // Xác định xem đây có phải là địa chỉ đầu tiên không
    const isFirstAddress = this.user.address.length === 0;
  
    // Tạo đối tượng địa chỉ mới với phoneNumber kiểu number
    const newAddressObj: Address = {
      value: this.newAddress.trim(),
      isDefault: isFirstAddress,
      fullName: this.fullName.trim(),  // Thêm fullName cho địa chỉ mới
      phoneNumber: this.phoneNumber    // Thêm phoneNumber cho địa chỉ mới
    };
  
    // Thêm địa chỉ mới vào danh sách
    this.user.address.push(newAddressObj);
  
    // Gửi mảng địa chỉ lên backend
    this.authService.updateAddress(this.user._id, this.user.address).subscribe(
      (response: any) => {
        // Cập nhật lại user với response từ server
        this.user = {
          ...response,
          address: response.address  // backend trả về Address[]
        };
  
        // Tìm lại chỉ số địa chỉ mặc định
        this.defaultAddressIndex = this.user.address.findIndex(a => a.isDefault);
  
        // Lưu user mới vào localStorage
        localStorage.setItem('user', JSON.stringify(this.user));
  
        // Thông báo thành công
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Địa chỉ đã được thêm.'
        });
  
        // Reset form và đóng dialog
        this.displayAddAddressDialog = false;
        this.newAddress = '';
        this.fullName = '';
        this.phoneNumber = undefined as any;
      },
      () => {
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