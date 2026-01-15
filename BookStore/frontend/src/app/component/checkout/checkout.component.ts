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
import { PayOSCreatePaymentApiResponse, PayOSCreatePaymentRes, PayOSPaymentService } from '../../service/payos-payment.service';
import { Observable } from 'rxjs';
import { CartItem } from '../../model/cart.model';
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
  selectedBranch: any = null;
  // cart$: Observable<CartItem[]>;
  selectedBooks: CartItem[] = [];
  totalAmount: number = 0;
  discountedAmount: number = 0;
  totalDiscount: number = 0;
  subtotalAmount = 0;   // tổng gốc
  finalAmount = 0;

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
  payosValue: string = '';
  vnpayValue: string = '';
  appliedCoupons: Coupon[] = []; 
  isProcessingPayOS = false;
  shippingInfo: {
    fee: number;
    address: string;
    region: string;
    deliveryTime: string;
  } | null = null;

  deliveryTime = '';
  shippingFee = 0;

  orderInfo: {
    name: string;
    email: string;
    address: string;
    phone: string;
    note: string;
    payment: string;
    storeBranch: { _id?: string; name?: string; city?: string } | null; 
  } = {
    name: '',
    email: '',
    address: '',
    phone: '',
    note: '',
    payment: '',
    storeBranch: null
  };

  payosCheckoutUrl: string | null = null;
  lastPayosOrderCode: string | null = null;

  @ViewChild('qrPayosCanvas', { static: false })
  qrPayosCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('qrVnpayCanvas') qrVnpayCanvas!: ElementRef<HTMLCanvasElement>;

  selectedCountryCode: string = "+84"; // Mặc định Việt Nam
  countries: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private orderService: OrderService,
    private http: HttpClient,
    private cartService: CartService,
    private booksService: BooksService,
    private payosService: PayOSPaymentService
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
      this.onAddressChange({ value: this.selectedAddress });

      const savedBranch = localStorage.getItem('selectedBranch');
      if (savedBranch) {
        this.selectedBranch = JSON.parse(savedBranch);
        this.orderInfo.storeBranch = this.selectedBranch;
        console.log(' Đã load chi nhánh từ localStorage:', this.selectedBranch);
      }
      const savedShipping = localStorage.getItem('shipping');

      if (savedShipping) {
        this.shippingInfo = JSON.parse(savedShipping);

        this.shippingFee = this.shippingInfo?.fee ?? 0;

        // Nếu muốn hiển thị
        console.log('🚚 Shipping loaded:', this.shippingInfo);
      }
    });
  
    // Cập nhật thông tin đơn hàng từ thông tin người dùng
    this.orderInfo = {
      name: this.userInfo.full_name || '',
      email: this.userInfo.email || '',
      phone: String(this.userInfo.phone_number || ''),
      address: this.selectedAddress,  // Địa chỉ mặc định hoặc đầu tiên
      note: '',
      payment: this.userInfo.payment || '',
      storeBranch: this.selectedBranch || null
    };
  
    // Lấy giỏ hàng từ localStorage và tính toán tổng tiền
    const savedCart = localStorage.getItem('cart');
    this.selectedBooks = savedCart ? JSON.parse(savedCart) : [];
  
    // Tính tổng số tiền
    this.subtotalAmount = this.selectedBooks.reduce((sum, item) => {
      const price = item.flashsale_price || item.price;
      const qty = item.quantity || 1;
      return sum + price * qty;
    }, 0);

    // discount đã lấy từ localStorage
    this.finalAmount = Math.max(
      this.subtotalAmount - this.totalDiscount,
      0
    );
    this.totalDiscount = JSON.parse(
      localStorage.getItem('totalDiscount') || '0'
    );

     // ✅ Lấy các mã đã applied từ localStorage
    const savedCoupons = localStorage.getItem('appliedCoupons');
    this.appliedCoupons = savedCoupons ? JSON.parse(savedCoupons) : [];    
    this.http.get<City[]>('/assets/json/vietnamAddress.json').subscribe((data) => {
      this.vietnamAddresses = data;
      this.cities = data; // Lấy danh sách tỉnh/thành phố
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
    if (this.orderInfo.payment === 'payos' && this.payosValue) {
      this.generatePayOSQR();
    }
  }, 0);
  }

  generatePayOSQR() {
    try {
      const canvas = this.qrPayosCanvas?.nativeElement;

      if (!canvas) {
        console.error("QR Canvas not ready!"); 
        return;
      }

      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);

      if (!this.payosValue) {
        console.error("PayOS QR value is empty");
        return;
      }

      QRCode.toCanvas(canvas, this.payosValue, {
        errorCorrectionLevel: 'H',
        scale: 6,
      }, err => {
        if (err) console.error("QR error:", err);
        else console.log("PayOS QR generated!");
      });

    } catch (err) {
      console.error("generatePayOSQR Exception:", err);
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

  get finalPayAmount(): number {
    return Math.max(
      this.subtotalAmount - this.totalDiscount + this.shippingFee,
      0
    );
  }

  removeCoupon(coupon: Coupon) {
    this.appliedCoupons = this.appliedCoupons.filter(c => c.code !== coupon.code);
    localStorage.setItem('appliedCoupons', JSON.stringify(this.appliedCoupons));
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
    
    console.log(
      '🛒 selectedBooks raw:',
      this.selectedBooks
    );

    console.log(
      '🧪 book ids:',
      this.selectedBooks.map(b => b._id)
    );

    const orderData = {
      userId: this.userInfo._id,
      storeBranchId: this.orderInfo.storeBranch?._id || null,
      products: this.selectedBooks.map(item => ({
        book: item.productId,
        quantity: item.quantity,
        title: item.title,
        price: item.price,
        flashsale_price: item.flashsale_price,
        coverImage: item.coverImage,
        storeBranchId: this.orderInfo.storeBranch?._id || null
      })),
      name: this.orderInfo.name,
      email: this.orderInfo.email,
      phone: this.orderInfo.phone,
      address: this.orderInfo.address,
      total: this.finalPayAmount,
      discount: this.totalDiscount,
      coupons: this.appliedCoupons.map(c => ({
        code: c.code,
        type: c.type,
        value: c.value
      })),
      orderDate: new Date(),
      paymentMethod: this.orderInfo.payment,
      note: this.orderInfo.note,
      shipping: this.shippingInfo ? {
        fee: this.shippingInfo.fee,
        region: this.shippingInfo.region,
        deliveryTime: this.shippingInfo.deliveryTime
      } : null,
    };

    console.log("🧾 Sending orderData:", orderData);

    this.orderService.createOrder(orderData).subscribe({
      next: () => {

        // Nếu chọn PayOS
        if (this.orderInfo.payment === 'payos') {
          this.isProcessingPayOS = true; 
          this.payWithPayOS();
          return;
        }

        // Nếu thanh toán COD
        alert("Đặt hàng thành công!");
        this.afterOrderSuccess();
      },

      error: (err) => {
        console.error("❌ Lỗi tạo đơn hàng:", err);
        alert("Tạo đơn hàng thất bại, vui lòng thử lại!");
      }
    });
  }

  isHCMInnerCity(address: string): boolean {
    const lower = address.toLowerCase();

    const innerDistricts = [
      'quận 1', 'quận 2', 'quận 3', 'quận 4', 'quận 5',
      'quận 6', 'quận 7', 'quận 8', 'quận 9', 'quận 10',
      'quận 11', 'quận 12',
      'bình thạnh', 'phú nhuận',
      'tân bình', 'tân phú', 'gò vấp',
      'thủ đức'
    ];

    return (
      lower.includes('hồ chí minh') ||
      lower.includes('tp.hcm') ||
      lower.includes('sài gòn')
    ) && innerDistricts.some(d => lower.includes(d));
  }

  detectRegion(address: string): 'Miền Bắc' | 'Miền Trung' | 'Miền Nam' {
    const lower = address.toLowerCase();

    // === MIỀN NAM ===
    const southKeywords = [
      'hồ chí minh', 'tp.hcm', 'sài gòn',
      'cần thơ', 'đồng nai', 'bình dương',
      'vũng tàu', 'long an', 'tiền giang'
    ];

    // === MIỀN BẮC ===
    const northKeywords = [
      'hà nội', 'hải phòng', 'quảng ninh',
      'bắc ninh', 'bắc giang', 'nam định',
      'thái bình', 'hải dương', 'hà giang'
    ];

    // === MIỀN TRUNG & TÂY NGUYÊN ===
    const centralKeywords = [
      'đà nẵng', 'huế', 'quảng nam', 'quảng ngãi',
      'bình định', 'phú yên',
      'nha trang', 'khánh hòa',
      'gia lai', 'đắk lắk', 'đắk nông',
      'kon tum', 'lâm đồng'
    ];

    if (southKeywords.some(k => lower.includes(k))) return 'Miền Nam';
    if (northKeywords.some(k => lower.includes(k))) return 'Miền Bắc';
    if (centralKeywords.some(k => lower.includes(k))) return 'Miền Trung';

    // Mặc định an toàn
    return 'Miền Trung';
  }

  updateShippingInfo(address: string) {
    const region = this.detectRegion(address);

    let fee = 0;

    if (this.isHCMInnerCity(address)) {
      fee = 0;
    } else if (region === 'Miền Nam') {
      fee = 10000;
    } else if (region === 'Miền Trung') {
      fee = 20000;
    } else {
      fee = 30000;
    }

    this.shippingFee = fee;

    const deliveryDaysMap = {
      'Miền Nam': 1,
      'Miền Trung': 2,
      'Miền Bắc': 3
    };

    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + deliveryDaysMap[region]);

    const dateStr = deliveryDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });

    const deliveryTime = `Giao từ 18h - 20h, ngày ${dateStr}`;

    this.deliveryTime = deliveryTime;

    // ✅🔥 FIX QUAN TRỌNG
    this.shippingInfo = {
      fee,
      address,
      region,
      deliveryTime
    };

    // (optional) debug
    console.log('🚚 shippingInfo set:', this.shippingInfo);
  }

  payWithPayOS() {
    const payableAmount =
      Math.max(this.subtotalAmount - this.totalDiscount, 0)
      + this.shippingFee;
    this.isProcessingPayOS = true;

    this.payosService.createPayment({
      amount: payableAmount,
      description: "Thanh toan don hang",
      orderId: Date.now().toString(),
      items: this.selectedBooks.map(p => ({
        name: p.title,
        quantity: p.quantity ?? 1,
        price: p.flashsale_price || p.price
      }))
    }).subscribe({
      next: (res) => {
        console.log("PayOS response:", res);

        this.isProcessingPayOS = false;

        if (!res.data) {
          alert("Thanh toán PayOS thất bại: " + (res.desc ?? res.code));
          return;
        }

        this.lastPayosOrderCode = res.data.orderCode;
        this.payosCheckoutUrl = res.data.checkoutUrl;

        window.location.href = this.payosCheckoutUrl;
      },

      error: () => {
        this.isProcessingPayOS = false;
        alert("Không kết nối được PayOS!");
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
    const selected = this.userInfo.address.find(
      (a: any) => a.value === selectedValue
    );

    if (selected) {
      this.orderInfo.name = selected.fullName ?? '';
      this.orderInfo.phone = String(selected.phoneNumber);

      // Chỉ dùng cho HIỂN THỊ
      const addressPart = selected.value.split(',')[0].trim();
      this.orderInfo.address = addressPart;

      const parts = selected.value.split(',').map(p => p.trim());

      const cityName = parts.find(p => p.toLowerCase().includes('thành phố') || p.toLowerCase().includes('tp')) || '';
      const districtName = parts.find(p => p.toLowerCase().includes('quận') || p.toLowerCase().includes('huyện')) || '';
      const wardName = parts.find(p => p.toLowerCase().includes('phường') || p.toLowerCase().includes('xã')) || '';

      this.selectedCity = this.cities.find(
        c => cityName && c.Name.toLowerCase() === cityName.toLowerCase()
      );
      this.onCityChange();

      this.selectedDistrict = this.districts.find(
        d => districtName && d.Name.toLowerCase() === districtName.toLowerCase()
      );
      this.onDistrictChange();

      this.selectedWard = this.wards.find(
        w => wardName && w.Name.toLowerCase() === wardName.toLowerCase()
      );

      // 🔥 FIX QUAN TRỌNG
      this.updateShippingInfo(selected.value);
    }

    else if (selectedValue === 'other') {
      this.orderInfo.name = this.userInfo.full_name || '';
      this.orderInfo.phone = String(this.userInfo.phone_number || '');
      this.orderInfo.address = '';

      this.selectedCity = undefined;
      this.selectedDistrict = undefined;
      this.selectedWard = undefined;

      this.districts = [];
      this.wards = [];

      this.shippingFee = 0;
      this.shippingInfo = null;
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
    if (this.orderInfo.payment === 'payos') {
      // logic mở dialog MoMo
      alert('Thanh toán bằng PayOS - hiển thị QR');
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
