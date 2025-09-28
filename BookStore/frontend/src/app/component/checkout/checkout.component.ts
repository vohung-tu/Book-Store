import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import { CartService } from '../../service/cart.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { DotSeparatorPipe } from '../../pipes/dot-separator.pipe';
import { BooksService } from '../../service/books.service';
import { City, District, Ward } from '../user-info/address-book/address-book.component';
import { Dialog, DialogModule } from 'primeng/dialog';
import QRCode from 'qrcode';
import { Coupon } from '../../model/coupon.model';
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
    DropdownModule,
    BreadcrumbComponent,
    DotSeparatorPipe,
    DialogModule
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  selectedBooks: BookDetails[] = [];
  totalAmount: number = 0;
  discountedAmount: number = 0;
  totalDiscount: number = 0;

  userInfo: User | null = null;
  addresses: Address[] = [];
  selectedAddress: string = '';
  currentUser: any;
  book: BookDetails = {} as BookDetails;
  cities: City[] = [];
  districts: District[] = [];
  wards: Ward[] = [];
  selectedCity: City | undefined;
  selectedDistrict: District | undefined;
  selectedWard: Ward | undefined;
  vietnamAddresses: City[] = [];

  appliedCoupons: Coupon[] = []; 

  orderInfo = {
    name: '',
    email: '',
    address: '',
    phone: '',
    note: '',
    payment: ''
  };

  @ViewChild('qrMomoCanvas') qrMomoCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('qrVnpayCanvas') qrVnpayCanvas!: ElementRef<HTMLCanvasElement>;

  momoValue = 'https://momo.vn/payment/your-order-id';   // link hoặc dữ liệu QR MoMo
  vnpayValue = 'https://vnpay.vn/payment/your-order-id'; // link hoặc dữ liệu QR VNPAY

  shipping = {
    selected: 'other_provinces',  // This will hold the selected shipping method
  };
  selectedCountryCode: string = "+84"; // Mặc định Việt Nam
  shippingFee = 25000;
  countries: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private orderService: OrderService,
    private http: HttpClient,
    private cartService: CartService,
    private booksService: BooksService
  ) {}

  ngOnInit(): void {
    // Lấy thông tin người dùng từ AuthService
    this.userInfo = this.authService.getCurrentUser();
    if (!this.userInfo) return;

    this.authService.getAddresses(this.userInfo._id).subscribe((res: any) => {
      const raw = res.address as Address[];
      // Chuyển về đúng shape cho p-dropdown:
      this.addresses = raw
        .map(a => ({
          label: a.value,    // hiển thị phần địa chỉ
          value: a.value,    // gán vào selectedAddress
          isDefault: a.isDefault
        }))
        // thêm option "Khác"
        .concat([{ label: 'Địa chỉ khác', value: 'other', isDefault: false }])
        // sort để default lên trước
        .sort((a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : 0));

      this.selectedAddress = this.addresses[0].value;
      this.orderInfo.address = this.selectedAddress;
    });
  
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

     // ✅ Lấy các mã đã applied từ localStorage
    const savedCoupons = localStorage.getItem('appliedCoupons');
    this.appliedCoupons = savedCoupons ? JSON.parse(savedCoupons) : [];

    this.updateTotalWithCoupons();
    
    this.http.get<City[]>('/assets/json/vietnamAddress.json').subscribe((data) => {
      this.vietnamAddresses = data;
      this.cities = data; // Lấy danh sách tỉnh/thành phố
    });
  }

  ngAfterViewInit() {
    // render QR mặc định nếu có chọn MoMo/VNPAY
    if (this.orderInfo.payment === 'momo') {
      this.generateMomoQR();
    }
    if (this.orderInfo.payment === 'vnpay') {
      this.generateVnpayQR();
    }
  }

  generateMomoQR() {
    if (this.qrMomoCanvas) {
      QRCode.toCanvas(this.qrMomoCanvas.nativeElement, this.momoValue, {
        width: 250,
      });
    }
  }

  generateVnpayQR() {
    if (this.qrVnpayCanvas) {
      QRCode.toCanvas(this.qrVnpayCanvas.nativeElement, this.vnpayValue, {
        width: 250,
      });
    }
  }

  onPaymentChange() {
    // render lại QR khi chọn phương thức thanh toán
    if (this.orderInfo.payment === 'momo') {
      this.generateMomoQR();
    } else if (this.orderInfo.payment === 'vnpay') {
      this.generateVnpayQR();
    }
  }

  get canSubmitOrder(): boolean {
    return (
      !!this.orderInfo.name &&
      !!this.orderInfo.email &&
      !!this.orderInfo.phone &&
      !!this.orderInfo.address &&
      !!this.orderInfo.payment
    );
  }

  updateTotalWithCoupons() {
    this.totalDiscount = 0;
    this.discountedAmount = this.totalAmount;

    this.appliedCoupons.forEach(c => {
      let discount = 0;
      if (c.type === 'percent') {
        discount = this.totalAmount * (c.value / 100);
      } else if (c.type === 'amount') {
        discount = c.value;
      }
      this.totalDiscount += discount;
    });

    this.discountedAmount = Math.max(this.totalAmount - this.totalDiscount, 0);
  }

  removeCoupon(coupon: Coupon) {
    this.appliedCoupons = this.appliedCoupons.filter(c => c.code !== coupon.code);
    localStorage.setItem('appliedCoupons', JSON.stringify(this.appliedCoupons));
    this.updateTotalWithCoupons();
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

  submitOrder() {
    if (!this.userInfo?._id || !this.orderInfo.address) {
      alert('Vui lòng nhập đủ thông tin!');
      return;
    }

    if (!this.selectedBooks || this.selectedBooks.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    const orderData = {
      userId: this.userInfo._id,
      products: this.selectedBooks.map(book => ({
        _id: book._id,
        quantity: book.quantity,
        title: book.title,
        price: book.price,
        flashsale_price: book.flashsale_price,
        coverImage: book.coverImage,
      })),
      name: this.orderInfo.name,
      email: this.orderInfo.email,
      phone: this.orderInfo.phone,
      address: this.orderInfo.address,
      total: this.totalAmount,
      orderDate: new Date(),
      payment: this.orderInfo.payment
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        console.log('✅ Order created:', response);

        if (this.orderInfo.payment === 'vnpay') {
          this.payWithVnpay();
        } else if (this.orderInfo.payment === 'cod') {
          alert('Đặt hàng thành công! Thanh toán COD');
          this.afterOrderSuccess();
        } else if (this.orderInfo.payment === 'bank') {
          alert('Đặt hàng thành công! Vui lòng chuyển khoản.');
          this.afterOrderSuccess();
        } else if (this.orderInfo.payment === 'momo') {
          alert('MoMo đang phát triển');
        }
      },
      error: (err) => {
        console.error('❌ Lỗi khi đặt hàng:', err);
        alert('Đặt hàng thất bại, vui lòng thử lại!');
      }
    });
    
  }
  

  payWithVnpay() {
    const orderId = Date.now().toString(); // tạo mã đơn hàng
    const amount = this.discountedAmount + this.shippingFee;

    this.http.get<{ url: string }>('http://https://book-store-3-svnz.onrender.com//vnpay/create-payment-url', {
      params: {
        amount: amount.toString(),
        orderId,
      }
    }).subscribe({
      next: (res) => {
        if (res.url) {
          // ✅ Điều hướng trực tiếp sang VNPAY
          window.location.href = res.url;
        }
      },
      error: (err) => {
        console.error('Lỗi khi gọi create-payment-url:', err);
      }
    });
  }

  afterOrderSuccess() {
    this.cartService.clearCart().subscribe({
      next: () => {
        console.log('🗑️ Giỏ hàng đã được xóa');
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('❌ Lỗi khi xóa giỏ hàng:', err);
      }
    });
  }
  updateBookQuantity() {
    this.booksService.getBookById(this.book.id!).subscribe((updatedBook) => {
      this.book.quantity = updatedBook.quantity; // 🔄 Cập nhật số lượng sách
    });
  }

  onAddressChange(event: any) {
    if (!this.userInfo) return;

    const selectedValue = event.value;
    const selected = this.userInfo.address.find((a: any) => a.value === selectedValue);

    if (selected) {
      this.orderInfo.name = selected.fullName ?? '';
      this.orderInfo.phone = String(selected.phoneNumber);

      // Tách lấy phần địa chỉ trước dấu ',' đầu tiên
      const addressPart = selected.value.split(',')[0].trim();
      this.orderInfo.address = addressPart;

      // Xử lý phần tỉnh thành, quận huyện, phường xã để hiển thị dropdown
      const parts = selected.value.split(',').map(p => p.trim());

      const cityName = parts.find(p => p.toLowerCase().includes('thành phố') || p.toLowerCase().includes('tp')) || '';
      const districtName = parts.find(p => p.toLowerCase().includes('quận') || p.toLowerCase().includes('huyện')) || '';
      const wardName = parts.find(p => p.toLowerCase().includes('phường') || p.toLowerCase().includes('xã')) || '';

      this.selectedCity = this.cities.find(c => cityName && c.Name.toLowerCase() === cityName.toLowerCase()) || undefined;
      this.onCityChange();

      this.selectedDistrict = this.districts.find(d => districtName && d.Name.toLowerCase() === districtName.toLowerCase()) || undefined;
      this.onDistrictChange();

      this.selectedWard = this.wards.find(w => wardName && w.Name.toLowerCase() === wardName.toLowerCase()) || undefined;
    } else if (selectedValue === 'other') {
      this.orderInfo.name = this.userInfo.full_name || '';
      this.orderInfo.phone = String(this.userInfo.phone_number || '');
      this.orderInfo.address = '';

      this.selectedCity = undefined;
      this.selectedDistrict = undefined;
      this.selectedWard = undefined;

      this.districts = [];
      this.wards = [];
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


  getDefaultAddress() {
    if (!this.currentUser || !this.currentUser.address || this.currentUser.address.length === 0) {
      return '';
    }

    // Tìm địa chỉ mặc định (isDefault = true)
    const defaultAddress = this.currentUser.address.find((addr: any) => addr.isDefault);
    return defaultAddress ? defaultAddress.value : '';
  }

  placeOrder() {
    if (this.orderInfo.payment === 'momo') {
      // logic mở dialog MoMo
      alert('Thanh toán bằng MOMO - hiển thị QR');
    } else if (this.orderInfo.payment === 'vnpay') {
      // logic mở dialog VNPAY
      alert('Thanh toán bằng VNPAY - hiển thị QR');
    } else if (this.orderInfo.payment === 'cod') {
      alert('Thanh toán COD');
    } else if (this.orderInfo.payment === 'bank') {
      alert('Chuyển khoản ngân hàng');
    }
  }
}
