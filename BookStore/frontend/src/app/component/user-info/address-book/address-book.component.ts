import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { RadioButtonModule } from 'primeng/radiobutton';
import { Address, User } from '../../../model/users-details.model';
import { AuthService } from '../../../service/auth.service';
import { Select } from 'primeng/select';
import { HttpClient } from '@angular/common/http';

interface Ward {
  Id: string;
  Name: string;
  Level: string;
}

interface District {
  Id: string;
  Name: string;
  Wards: Ward[];
}

interface City {
  Id: string;
  Name: string;
  Districts: District[];
}

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
    RadioButtonModule,
    Select
  ],
  providers: [MessageService],
  templateUrl: './address-book.component.html',
  styleUrl: './address-book.component.scss'
})
export class AddressBookComponent implements OnInit {
  
  vietnamAddresses: City[] = [];
  showAddressBook = false;
  displayAddAddressDialog = false;
  displayEditAddressDialog = false;
  newAddress = '';
  countries = [{ name: 'Việt Nam', code: 'VN' }];
  cities: City[] = [];
  districts: District[] = [];
  wards: Ward[] = [];
  selectedCountry = this.countries[0];
  selectedCity: City | undefined;
  selectedDistrict: District | undefined;
  selectedWard: Ward | undefined;
  fullName: string = '';
  phoneNumber!: number;
  user: User = {} as User;
  defaultAddressIndex = -1;
  addresses: Address[] = [
  ];
  editAddressIndex: number | null = null;
  editAddressData: { value: string; isDefault: boolean; fullName: string; phoneNumber?: number } = {
    value: '',
    isDefault: false,
    fullName: '',
    phoneNumber: 0
  };

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.http.get<City[]>('/assets/json/vietnamAddress.json').subscribe((data) => {
      this.vietnamAddresses = data;
      this.cities = data; // Lấy danh sách tỉnh/thành phố
    });
    this.loadUser()
  }

  onCityChange(): void {
    this.districts = this.selectedCity ? this.selectedCity.Districts : [];
    this.selectedDistrict = null as any;
    this.selectedWard = null as any;
  }

  onDistrictChange(): void {
    this.wards = this.selectedDistrict ? this.selectedDistrict.Wards : [];
    this.selectedWard = null as any;
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

    // Phân tích địa chỉ cũ
    const addressParts = address.value.split(', ').reverse();
    const wardName = addressParts[0];   // Phường/Xã
    const districtName = addressParts[1]; // Quận/Huyện
    const cityName = addressParts[2];     // Tỉnh/Thành phố

    // Gán lại thông tin
    this.editAddressData = {
      value: address.value || '',
      isDefault: address.isDefault || false,
      fullName: address.fullName || '',
      phoneNumber: address.phoneNumber || 0
    };

    // Tìm dữ liệu phù hợp trong danh sách
    this.selectedCity = this.cities.find(city => city.Name === cityName) || null as any;
    this.selectedDistrict = this.selectedCity?.Districts.find(district => district.Name === districtName) || null as any;
    this.selectedWard = this.selectedDistrict?.Wards.find(ward => ward.Name === wardName) || null as any;

    this.displayEditAddressDialog = true;
  }
  onCancelEditAddress() {
    this.displayEditAddressDialog = false;
    this.editAddressIndex = null;
  }
  

  onSaveEditedAddress() {
  if (
    this.editAddressIndex === null ||
    !this.editAddressData.fullName.trim() ||
    !this.editAddressData.phoneNumber ||
    isNaN(this.editAddressData.phoneNumber) ||
    !this.selectedCity ||
    !this.selectedDistrict ||
    !this.selectedWard
  ) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Cảnh báo',
      detail: 'Vui lòng điền đầy đủ thông tin địa chỉ.'
    });
    return;
  }

  // Tạo địa chỉ mới đầy đủ
  const fullAddress = `${this.editAddressData.value.trim()}, ${this.selectedWard.Name}, ${this.selectedDistrict.Name}, ${this.selectedCity.Name}`;

  // Cập nhật dữ liệu
  this.user.address[this.editAddressIndex] = {
    ...this.editAddressData,
    value: fullAddress // Cập nhật địa chỉ mới đầy đủ
  };

  // Cập nhật địa chỉ mặc định nếu cần
  if (this.editAddressData.isDefault) {
    this.user.address.forEach(addr => addr.isDefault = false);
    this.user.address[this.editAddressIndex].isDefault = true;
  }

  // Gửi lên server
  this.authService.updateAddress(this.user._id, this.user.address).subscribe({
    next: updatedUser => {
      this.user = updatedUser;
      localStorage.setItem('user', JSON.stringify(this.user));
      this.authService.setCurrentUser(this.user);

      this.defaultAddressIndex = this.user.address.findIndex(a => a.isDefault);
      this.messageService.add({ severity: 'success', summary: 'Cập nhật', detail: 'Địa chỉ đã được lưu.' });

      this.displayEditAddressDialog = false;
      this.editAddressIndex = null;
    },
    error: err => {
      console.error(err);
      this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể lưu địa chỉ.' });
      this.loadUser(); // rollback
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
  // Kiểm tra nếu các trường bắt buộc không hợp lệ
  if (
    !this.newAddress.trim() ||
    !this.fullName.trim() ||
    this.phoneNumber == null ||
    isNaN(this.phoneNumber) ||
    !this.selectedCity ||
    !this.selectedDistrict ||
    !this.selectedWard
  ) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Cảnh báo',
      detail: 'Vui lòng điền đầy đủ thông tin địa chỉ, bao gồm tỉnh, quận, phường.'
    });
    return;
  }

  // Xác định xem đây có phải là địa chỉ đầu tiên không
  const isFirstAddress = this.user.address.length === 0;

  // Tạo địa chỉ đầy đủ
  const fullAddress = `${this.newAddress.trim()}, ${this.selectedWard.Name}, ${this.selectedDistrict.Name}, ${this.selectedCity.Name}`;

  // Tạo đối tượng địa chỉ mới
  const newAddressObj: Address = {
    value: fullAddress, // Địa chỉ đầy đủ
    isDefault: isFirstAddress,
    fullName: this.fullName.trim(),
    phoneNumber: this.phoneNumber
  };

  // Thêm địa chỉ vào danh sách
  this.user.address.push(newAddressObj);

  // Gửi mảng địa chỉ lên backend
  this.authService.updateAddress(this.user._id, this.user.address).subscribe(
    (response: any) => {
      // Cập nhật lại user với response từ server
      this.user = {
        ...response,
        address: response.address // backend trả về Address[]
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
      this.selectedCity = null as any;
      this.selectedDistrict = null as any;
      this.selectedWard = null as any;
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