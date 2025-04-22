import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookDetails } from '../../model/books-details.model';
import { Router } from '@angular/router';
import { OrderService } from '../../service/order.service';
import { AuthService } from '../../service/auth.service';
import { Address, User } from '../../model/users-details.model';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { NgSelectModule } from '@ng-select/ng-select';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButton } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { CascadeSelectModule } from 'primeng/cascadeselect';
import { DropdownModule } from 'primeng/dropdown';
export interface DiscountCode {
  code: string;
  minOrderAmount?: number;
  discountType: 'percentage' | 'fixed';
  value: number;
  applicableProductIds?: string[];
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    PaginatorModule,
    FormsModule,
    TextareaModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    SelectModule,
    RadioButton,
    NgSelectModule,
    CascadeSelectModule,
    ButtonModule,
    InputNumberModule,
    DividerModule,
    DropdownModule
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  selectedBooks: BookDetails[] = [];
  totalAmount: number = 0;
  discountedAmount: number = 0;
  userInfo: User | null = null;
  discountCode: string = '';
  discountMessage: string = '';
  isDiscountValid: boolean = false; // true nếu mã hợp l
  addresses: Address[] = [];
  selectedAddress: string = '';
  currentUser: any;
  discountCodes: DiscountCode[] = [
    {
      code: 'GIAM10',
      discountType: 'percentage',
      value: 10,
      minOrderAmount: 500,
    },
    {
      code: 'GIAM50K',
      discountType: 'fixed',
      value: 50,
      minOrderAmount: 300,
    },
    {
      code: 'MANGAONLY',
      discountType: 'percentage',
      value: 20,
      applicableProductIds: ['67d476cebc4adca790816959', '67d47799bc4adca79081695b', '67d477d6bc4adca79081695c'], // ID sản phẩm manga
    }
  ];

  orderInfo = {
    name: '',
    email: '',
    address: '',
    phone: '',
    note: '',
    payment: ''
  };

  shipping = {
    selected: 'other_provinces',  // This will hold the selected shipping method
  };
  selectedCountryCode: string = "+84"; // Mặc định Việt Nam
  shippingFee = 25;
  countryCodes = [
    { code: "+1", name: "🇺🇸 US" },
    { code: "+44", name: "🇬🇧 UK" },
    { code: "+84", name: "🇻🇳 VN" },
    { code: "+91", name: "🇮🇳 India" }
  ];
  availableCoupons = [
    { code: 'GIAM10', description: 'Giảm 10% cho đơn hàng trên 500.000đ' },
    { code: 'GIAM50K', description: 'Giảm 50K cho đơn hàng trên 300.000đ' },
    { code: 'MANGAONLY', description: 'Giảm 20% khi mua manga' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private orderService: OrderService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Lấy thông tin người dùng từ AuthService
    this.userInfo = this.authService.getCurrentUser();
    console.log('userInfo:', this.userInfo);
  
    if (!this.userInfo) {
      console.log('User not logged in, redirecting...');
      return;
    }
  
    // Lưu danh sách địa chỉ của người dùng
    this.addresses = this.userInfo.address || [];
    this.orderInfo.address = '';

    this.authService.getAddresses(this.userInfo._id).subscribe((data: any) => {
      // Thêm option "Địa chỉ khác" vào cuối mảng
      this.addresses = [...data.address, { value: 'other', label: 'Địa chỉ khác' }];
    });
  
    // Sắp xếp các địa chỉ sao cho địa chỉ mặc định (isDefault = true) luôn ở đầu
    this.addresses = this.addresses.sort((a: Address, b: Address) => {
      if (a.isDefault && !b.isDefault) return -1;  // Địa chỉ mặc định lên đầu
      if (!a.isDefault && b.isDefault) return 1;   // Địa chỉ mặc định xuống dưới
      return 0;  // Giữ nguyên thứ tự nếu cả hai đều hoặc đều không phải mặc định
    });
  
    // Gán địa chỉ mặc định hoặc địa chỉ đầu tiên (nếu không có địa chỉ mặc định)
    this.selectedAddress = this.addresses.length > 0 ? this.addresses[0].value : '';
  
    // Cập nhật thông tin đơn hàng từ thông tin người dùng
    this.orderInfo = {
      name: this.userInfo.full_name || '',
      email: this.userInfo.email || '',
      phone: String(this.userInfo.phone_number || ''),
      address: this.selectedAddress,  // Địa chỉ mặc định hoặc đầu tiên
      note: '',
      payment: this.userInfo.payment || ''
    };
  
    // Lấy giỏ hàng từ localStorage và tính toán tổng tiền
    const savedCart = localStorage.getItem('cart');
    this.selectedBooks = savedCart ? JSON.parse(savedCart) : [];
  
    // Tính tổng số tiền
    this.totalAmount = this.selectedBooks.reduce(
      (sum, item) => sum + (item.flashsale_price || item.price) * (item.quantity || 1),
      0
    );
    this.discountedAmount = this.totalAmount;
  }  
   
  submitOrder() {
  if (!this.userInfo?._id || !this.orderInfo.address) return;

  // Thêm địa chỉ nếu là "Địa chỉ khác"
  if (this.selectedAddress === 'Địa chỉ khác') {
    const newAddress = {
      value: this.orderInfo.address,
      isDefault: false
    };

    const exists = this.addresses.some(addr => addr.value === newAddress.value);
    if (!exists) {
      this.addresses.push(newAddress);
      this.authService.updateAddress(this.userInfo?._id, this.addresses).subscribe({
        next: res => console.log('Đã lưu địa chỉ mới'),
        error: err => console.error('Lỗi khi lưu địa chỉ', err)
      });
    }
  }
    if (!this.orderInfo.name || !this.orderInfo.email || !this.orderInfo.address || !this.orderInfo.phone) {
      alert('Vui lòng nhập đủ thông tin!');
      return;
    }
  
    // Kiểm tra userId có tồn tại
    if (!this.userInfo || !this.userInfo._id) {
      alert('Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại!');
      return;
    }
  
    // Kiểm tra danh sách sản phẩm
    console.log(this.selectedBooks);
    if (!this.selectedBooks || this.selectedBooks.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    const finalAddress = this.orderInfo.address || this.selectedAddress;
  
    const orderData = {
      userId: this.userInfo._id,
      products: this.selectedBooks,
      name: this.orderInfo.name,
      email: this.orderInfo.email,
      phone: this.orderInfo.phone,
      address: finalAddress,
      note: this.orderInfo.note,
      total: this.totalAmount,
      orderDate: new Date()
    };
  
    console.log('🚀 Gửi đơn hàng:', orderData); // Debug
  
    this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        alert('Đơn hàng đã được đặt thành công!');
        localStorage.removeItem('cart');
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('❌ Lỗi khi đặt hàng:', err);
        alert('Đặt hàng thất bại, vui lòng thử lại!');
      }
    });
  }
  
  onAddressChange() {
    if (this.selectedAddress !== 'Địa chỉ khác') {
      this.orderInfo.address = this.selectedAddress;
    } else {
      this.orderInfo.address = ''; // cho phép nhập
    }
  }

   // Hàm xử lý thay đổi khi người dùng nhập địa chỉ
   onAddressInput() {
    if (this.orderInfo.address) {
      // Khi có nhập địa chỉ khác, disable dropdown
      this.selectedAddress = ''; // Reset selectedAddress
    }
  }

  // Cập nhật địa chỉ người dùng
  updateUserAddress(userId: string) {
    // Giả sử orderInfo.address chứa địa chỉ người dùng nhập
    if (this.selectedAddress === 'other') {
      // Thêm địa chỉ mới vào mảng địa chỉ
      this.addresses.push({ value: this.orderInfo.address, isDefault: false });
    }

    // Gọi hàm updateAddress để gửi các địa chỉ mới lên backend
    this.authService.updateAddress(userId, this.addresses).subscribe(response => {
      console.log('Địa chỉ đã được cập nhật', response);
    }, error => {
      console.error('Có lỗi khi cập nhật địa chỉ', error);
    });
  }
  // Áp dụng mã giảm giá
  applyDiscountCode() {
    const codeInput = this.discountCode.trim().toUpperCase();
    const discount = this.discountCodes.find(d => d.code === codeInput);
  
    if (!discount) {
      this.discountedAmount = this.totalAmount;
      this.discountMessage = 'Mã giảm giá không hợp lệ.';
      this.isDiscountValid = false;
      return;
    }
  
    let applicableAmount = this.getApplicableAmount(discount);
  
    if (applicableAmount === 0) {
      this.discountedAmount = this.totalAmount;
      this.discountMessage = 'Mã chỉ áp dụng cho sản phẩm cụ thể.';
      this.isDiscountValid = false;
      return;
    }
  
    if (discount.minOrderAmount && applicableAmount < discount.minOrderAmount) {
      this.discountedAmount = this.totalAmount;
      this.discountMessage = `Đơn hàng cần tối thiểu ${discount.minOrderAmount.toLocaleString()}đ để áp dụng mã.`;
      this.isDiscountValid = false;
      return;
    }
  
    const discountAmount = this.calculateDiscountAmount(discount, applicableAmount);
  
    this.discountedAmount = Math.max(this.totalAmount - discountAmount, 0);
    this.discountMessage = `Đã áp dụng mã giảm: - ${discountAmount.toLocaleString()}000đ`;
    this.isDiscountValid = true;
  }
  
  // Tính tổng áp dụng cho mã giảm giá theo sản phẩm
  getApplicableAmount(discount: DiscountCode): number {
    if (discount.applicableProductIds) {
      return this.selectedBooks
        .filter(book => discount.applicableProductIds?.includes(book._id))
        .reduce((sum, item) => sum + (item.flashsale_price || item.price) * (item.quantity || 1), 0);
    }
    return this.totalAmount;
  }

  // Tính số tiền giảm theo loại mã giảm giá
  calculateDiscountAmount(discount: DiscountCode, applicableAmount: number): number {
    if (discount.discountType === 'percentage') {
      return applicableAmount * (discount.value / 100);
    } else if (discount.discountType === 'fixed') {
      return discount.value;
    }
    return 0;
  }

  selectCoupon(code: string) {
    this.discountCode = code;
    this.applyDiscountCode(); // gọi luôn hàm áp dụng nếu muốn
  }

  getDefaultAddress() {
    if (!this.currentUser || !this.currentUser.address || this.currentUser.address.length === 0) {
      return '';
    }

    // Tìm địa chỉ mặc định (isDefault = true)
    const defaultAddress = this.currentUser.address.find((addr: any) => addr.isDefault);
    return defaultAddress ? defaultAddress.value : '';
  }
}
