import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookDetails } from '../../model/books-details.model';
import { Router } from '@angular/router';
import { OrderService } from '../../service/order.service';
import { AuthService } from '../../service/auth.service';
import { User } from '../../model/users-details.model';
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
import { District, Province, Ward } from '../../model/location.model';
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
    DividerModule
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  selectedBooks: BookDetails[] = [];
  totalAmount: number = 0;
  discountedAmount: number = 0;
  userInfo: User | null = null;
  selectedProvince: number | null = null;
  selectedDistrict: number | null = null;
  selectedWard: number | null = null;
  discountCode: string = '';
  discountMessage: string = '';
  isDiscountValid: boolean = false; // true nếu mã hợp lệ
  provinces: Province[] = [];
  districts: District[] = [];
  wards: Ward[] = [];
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
    province: '',
    district: '',
    ward: '',
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
    this.userInfo = this.authService.getCurrentUser();
    console.log('userInfo:', this.userInfo);
  
    if (!this.userInfo) {
      console.log('User not logged in, redirecting...');
      return;
    }
  
    this.orderInfo = {
      name: this.userInfo.full_name || '',
      email: this.userInfo.email || '',
      phone: String(this.userInfo.phone_number || ''),
      address: (this.userInfo.address || []).join(', '),
      note: '',
      province: this.userInfo.province || '',
      district: this.userInfo.district || '',
      ward: this.userInfo.ward || '',
      payment: this.userInfo.payment || ''
    };
  
    const savedCart = localStorage.getItem('cart');
    this.selectedBooks = savedCart ? JSON.parse(savedCart) : [];
  
    this.totalAmount = this.selectedBooks.reduce(
      (sum, item) => sum + (item.flashsale_price || item.price) * (item.quantity || 1),
      0
    );
    this.discountedAmount = this.totalAmount;
  
    this.loadProvinces();
  }
   
  submitOrder() {
    if (!this.orderInfo.name || !this.orderInfo.email || !this.orderInfo.address || !this.orderInfo.phone) {
      alert('Vui lòng nhập đủ thông tin!');
      return;
    }
  
    // Kiểm tra userId có tồn tại
    if (!this.userInfo || !this.userInfo.id) {
      alert('Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại!');
      return;
    }
  
    // Kiểm tra danh sách sản phẩm
    console.log(this.selectedBooks);
    if (!this.selectedBooks || this.selectedBooks.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }
  
    const orderData = {
      userId: this.userInfo.id,
      products: this.selectedBooks,
      name: this.orderInfo.name,
      email: this.orderInfo.email,
      phone: this.orderInfo.phone,
      address: this.orderInfo.address,
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
  

   // Hàm tải tỉnh thành từ file provinces.json
  loadProvinces(): void {
  this.http.get<Province[]>('assets/json/provinces.json').subscribe((data: Province[]) => {
    this.provinces = data; // Gán dữ liệu vào provinces
    }, error => {
      console.error('Error loading provinces:', error);
    });
  }

  getDistricts(selectedProvinceId: string | null): void {
    if (selectedProvinceId !== null) {
      const selectedProvince = this.provinces.find(p => p.id === selectedProvinceId);
      if (selectedProvince) {
        this.districts = selectedProvince.data2;
      }
    }
    this.selectedDistrict = null;
    this.selectedWard = null;
  }

  
      
  getWards(selectedDistrictId: number | null): void {
    if (selectedDistrictId !== null) {
      // Chuyển đổi số thành chuỗi nếu cần
      const districtIdStr = selectedDistrictId.toString();
      const selectedDistrict = this.districts.find(d => d.id.toString() === districtIdStr);
      if (selectedDistrict) {
        this.wards = selectedDistrict.data3; // Lấy danh sách phường của quận
      }
    }
    this.selectedWard = null; // Reset ward khi thay đổi district
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
}
