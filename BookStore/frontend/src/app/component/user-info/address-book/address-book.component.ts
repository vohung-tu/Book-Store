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
import { DropdownModule } from 'primeng/dropdown';

export interface Ward {
  Id: string;
  Name: string;
  Level: string;
}

export interface District {
  Id: string;
  Name: string;
  Wards: Ward[];
}

export interface City {
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
    DropdownModule
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
  defaultAddressIndex = -1; //là không có địa chỉ mặc định nào được chọn ban đầu
  addresses: Address[] = [
  ];
  editAddressIndex: number | null = null;
  editAddressData: { 
    value: string; 
    isDefault: boolean; 
    fullName: string; 
    phoneNumber?: number
    city?: City | undefined,
    district?: District | undefined,
    ward?: Ward | undefined
  } = {
    value: '',
    isDefault: false,
    fullName: '',
    phoneNumber: 0,
    city: undefined as City | undefined,
    district: undefined as District | undefined,
    ward: undefined as Ward | undefined
  };

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadUser();
    this.http.get<City[]>('/assets/json/vietnamAddress.json').subscribe((data) => {
      this.vietnamAddresses = data;
      this.cities = data; // Lấy danh sách tỉnh/thành phố
    });
  }

  onCityChange(): void {
    this.districts = this.selectedCity ? this.selectedCity.Districts : [];
    this.selectedDistrict = undefined;
    this.selectedWard = undefined;
  }

  onDistrictChange(): void {
    this.wards = this.selectedDistrict ? this.selectedDistrict.Wards : [];
    this.selectedWard = undefined;
  }

  onCityChangeFromEditDialog(): void {
    this.districts = this.editAddressData.city ? this.editAddressData.city.Districts : [];
    this.editAddressData.district = undefined;
    this.wards = [];
    this.editAddressData.ward = undefined;
  }

  onDistrictChangeFromEditDialog(): void {
    this.wards = this.editAddressData.district ? this.editAddressData.district.Wards : [];
    this.editAddressData.ward = undefined;
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

    this.editAddressIndex = index;

    const address = this.user.address[index];
    if (!address) return;

    console.log('Address value:', address.value);

    const parts = address.value.split(',').map(p => p.trim());
    const wardName = parts[1] || '';
    const districtName = parts[2] || '';
    const cityName = parts[3] || '';

    const foundCity = this.cities.find(c => c.Name === cityName);
    let foundDistrict: District | undefined;
    let foundWard: Ward | undefined;

    if (foundCity) {
      foundDistrict = foundCity.Districts.find(d => d.Name === districtName);
      if (foundDistrict) {
        foundWard = foundDistrict.Wards.find(w => w.Name === wardName);
      }
    }

    this.districts = foundCity?.Districts || [];
    this.wards = foundDistrict?.Wards || [];

    this.editAddressData = {
      value: address.value,
      isDefault: address.isDefault,
      fullName: address.fullName || '',
      phoneNumber: address.phoneNumber,
      city: foundCity,
      district: foundDistrict,
      ward: foundWard
    };

    this.displayEditAddressDialog = true;
  }


  onCancelEditAddress() {
    this.displayEditAddressDialog = false;
    this.editAddressIndex = null;
  }
  
  onSaveEditedAddress() {
      console.log('DEBUG EDIT:', this.editAddressData);
      console.log('Index:', this.editAddressIndex);
      console.log('Full name:', this.editAddressData.fullName);
      console.log('Phone:', this.editAddressData.phoneNumber);
      console.log('City:', this.editAddressData.city);
      console.log('District:', this.editAddressData.district);
      console.log('Ward:', this.editAddressData.ward);

    if (
      this.editAddressIndex === null ||
      !this.editAddressData.fullName.trim() ||
      !this.editAddressData.phoneNumber ||
      isNaN(this.editAddressData.phoneNumber) ||
      !this.editAddressData.city ||
      !this.editAddressData.district ||
      !this.editAddressData.ward
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng điền đầy đủ thông tin địa chỉ.'
      });
      return;
    }

    const fullAddress = `${this.editAddressData.value.trim()}, ${this.editAddressData.ward.Name}, ${this.editAddressData.district.Name}, ${this.editAddressData.city.Name}`;

    this.user.address[this.editAddressIndex] = {
      value: fullAddress,
      isDefault: this.editAddressData.isDefault,
      fullName: this.editAddressData.fullName.trim(),
      phoneNumber: this.editAddressData.phoneNumber
    };

    // Nếu đặt làm mặc định, reset các địa chỉ khác
    if (this.editAddressData.isDefault) {
      this.user.address.forEach((addr, idx) => {
        addr.isDefault = idx === this.editAddressIndex;
      });
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
        this.selectedCity = undefined;
        this.selectedDistrict = undefined;
        this.selectedWard = undefined;
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