import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { Order, Product } from '../../../model/order.model';
import { OrderService } from '../../../service/order.service';
import { TableModule } from 'primeng/table';
import { catchError, forkJoin, map, Observable, of, tap } from 'rxjs';
import { AuthService } from '../../../service/auth.service';
import { DotSeparatorPipe } from '../../../pipes/dot-separator.pipe';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CartService } from '../../../service/cart.service';
import { NavigationEnd, Router } from '@angular/router';
import { BookDetails } from '../../../model/books-details.model';
import { BooksService } from '../../../service/books.service';
import { DialogModule } from 'primeng/dialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
@Component({
  selector: 'app-user-order',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    DotSeparatorPipe,
    TableModule,
    ButtonModule,
    ToastModule,
    DialogModule,
    RadioButtonModule,
    FormsModule,
    ConfirmDialogModule
  ],
  templateUrl: './user-order.component.html',
  styleUrls: ['./user-order.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class UserOrderComponent implements OnInit, OnDestroy {
  product$: Observable<Product[]>;
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedTab: string = 'all'; 
  isOrdersLoaded = false; // Kiểm soát việc gọi API nhiều lần
  discountedAmount: number = 0;
  selectedBooks: BookDetails[] = [];
  totalAmount: number = 0;

  tabs = [
    { value: 'all', title: 'Tất cả', content: 'Tất cả đơn hàng' },
    { value: 'pending', title: 'Chờ thanh toán', content: 'Đơn hàng chờ thanh toán' },
    { value: 'processing', title: 'Đang xử lý', content: 'Đơn hàng đang xử lý' },
    { value: 'shipping', title: 'Đang giao', content: 'Đơn hàng đang được vận chuyển' },
    { value: 'completed', title: 'Hoàn tất', content: 'Đơn hàng đã hoàn tất' },
    { value: 'cancelled', title: 'Bị hủy', content: 'Đơn hàng bị hủy' },
    { value: 'returned', title: 'Đổi trả', content: 'Đơn hàng đổi trả' }
  ];
  cancelReasons: string[] = [
    'Không còn nhu cầu mua hàng',
    'Đặt nhầm/trùng',
    'Thêm/bớt sản phẩm',
    'Quên nhập mã giảm giá',
    'Không áp dụng được mã giảm giá',
    'Đơn hàng bị tách ra quá nhiều lần giao',
    'Thời gian giao hàng quá chậm',
    'Thay đổi địa chỉ nhận hàng',
    'Khác'
  ];
  // Biến lưu trạng thái mở/đóng dialog
  cancelDialogVisible: boolean = false;

  // Biến lưu lý do hủy đã chọn
  selectedCancelReason: string = '';

  // Biến lưu ID đơn hàng đang được yêu cầu hủy
  selectedOrderIdToCancel: string = '';
  confirmCancelDialogVisible = false;


  // Sử dụng trackBy cho tabs
  trackByValue(index: number, item: any): any {
    return item.value;
  }

  // Lắng nghe sự kiện storage (nếu có cập nhật từ nơi khác)
  private storageEventListener = (event: StorageEvent) => {
    if (event.key === 'orderUpdated') {
      console.log('Phát hiện đơn hàng được cập nhật, tải lại đơn hàng...');
      this.reloadOrders();
    }
  };

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
  ) {
    // Sản phẩm của đơn hàng nếu cần sử dụng riêng
    this.product$ = this.orderService.getOrders().pipe(
      map(orders => orders.flatMap(order => order.products))
    );
  }

  ngOnInit(): void {
    this.selectedTab = this.tabs[0].value; // 'all' ✅
    this.filterOrdersByTab();

    this.loadUserOrders();
  }

  ngOnDestroy(): void {

    
    this.totalAmount = this.selectedBooks.reduce(
      (sum, item) => sum + (item.flashsale_price || item.price) * (item.quantity || 1),
      0
    );
  }

  // Hàm reload (có thể được gọi qua sự kiện storage) sẽ bỏ qua kiểm tra isOrdersLoaded
  reloadOrders() {
    console.log('Reloading user orders...');
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      const currentUserId = currentUser._id;
      this.orderService.getOrders().subscribe((orders) => {
        console.log('Orders fetched (reload):', orders.length);
        const userOrders = orders.filter(o => o.userId === currentUserId);
        this.orders = this.prepareOrders(userOrders);
        this.filterOrdersByTab();
      });
    }
  }

  loadUserOrders() {
    if (this.isOrdersLoaded) {
      console.log('Orders already loaded, skipping duplicate fetch.');
      return;
    }

    console.log('Loading user orders...');
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      const currentUserId = currentUser._id;
      this.orderService.getOrders().subscribe((orders) => {
        console.log('Orders fetched:', orders.length);
        
        this.isOrdersLoaded = true;
        const userOrders = orders.filter(o => o.userId === currentUserId);
        this.orders = this.prepareOrders(userOrders);
        this.filterOrdersByTab();
      });
    } else {
      console.error('Không tìm thấy thông tin user');
    }
  }

  // trackBy function cho order trong ngFor
  trackByOrder(index: number, order: Order): string {
    return order._id;
  }

  // Khi chọn tab, cập nhật selectedTab (sử dụng lowercase để so sánh)
  // selectTab(tabValue: string): void {
  //   this.selectedTab = tabValue.toLowerCase();
  //   console.log('Selected Tab:', this.selectedTab);
  //   this.filterOrdersByTab();
  // }

  openCancelDialog(orderId: string) {
    this.selectedOrderIdToCancel = orderId;
    this.cancelDialogVisible = true;
  }

  openConfirmCancelDialog() {
    if (!this.selectedCancelReason) {
      this.messageService.add({severity:'warn', summary:'Cảnh báo', detail:'Vui lòng chọn lý do hủy đơn!'});
      return;
    }
    this.confirmCancelDialogVisible = true;
  }

  getOrdersByStatus(status: string): Order[] {
    if (!status || status === 'all') {
      return this.orders;
    }
    return this.orders.filter(
      order => order.status?.toLowerCase() === status.toLowerCase()
    );
  }

  // Lọc đơn hàng theo selectedTab
  filterOrdersByTab(): void {
    if (this.selectedTab === 'all') {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(
        o => o.status?.toLowerCase() === this.selectedTab
      );
    }
  }

  private prepareOrders(rawOrders: any[]): Order[] {
    return rawOrders.map(order => ({
      ...order,

      // 🎯 DỮ LIỆU GỐC TỪ CHECKOUT
      _shippingFee: order.shipping?.fee ?? 0,

      _finalTotal: order.total ?? 0,
      _discount: order.discount ?? 0,
    }));
  }

    
  // Tính số đơn theo trạng thái (sử dụng lowercase để so sánh)
  getOrderCountByStatus(status: string): number {
    if (!status || status === 'all') {
      return this.orders.length;
    }

    return this.orders.filter(
      order => order.status?.toLowerCase() === status.toLowerCase()
    ).length;
  }

  confirmCancelOrder() {
    this.orderService.cancelOrder(this.selectedOrderIdToCancel, this.selectedCancelReason).subscribe({
      next: () => {
        this.confirmCancelDialogVisible = false; 
        this.cancelDialogVisible = false;
        this.selectedCancelReason = '';

        this.orders = this.orders.map(o =>
          o._id === this.selectedOrderIdToCancel
            ? {
                ...o,
                status: 'cancelled',
                _statusLabel: this.getStatusLabel('cancelled')
              }
            : o
        );

        // 🔥 Lọc lại theo tab hiện tại
        this.filterOrdersByTab();

        this.messageService.add({
          severity:'success',
          summary:'Thành công',
          detail:'Đơn hàng đã được hủy.'
        });
      },
      error: err => {
        this.confirmCancelDialogVisible = false;
        this.messageService.add({severity:'error', summary:'Lỗi', detail:'Hủy đơn thất bại.'});
        console.error('Hủy đơn thất bại:', err);
      }
    });
  }


  rebuyOrder(products: any[]): void {
    const cartItems = products.map(p => ({
      _id: p.book || p.productId || p._id,
      productId: p.book || p.productId || p._id,
      title: p.title,
      price: p.price,
      flashsale_price: p.flashsale_price || 0,
      coverImage: p.coverImage,
      quantity: p.quantity || 1,
    }));

    localStorage.setItem('cart', JSON.stringify(cartItems));
    localStorage.removeItem('totalDiscount');
    localStorage.removeItem('appliedCoupons');

    this.messageService.add({
      severity: 'success',
      summary: 'Sẵn sàng thanh toán',
      detail: 'Đang chuyển hướng tới trang thanh toán...',
    });

    this.router.navigate(['/checkout']);
  }

  
  getStatusLabel(status: string): string {
    switch (status) {
      case 'processing': return 'Đang xử lý';
      case 'confirmed': return 'Đã xác nhận';
      case 'shipping': return 'Đang giao hàng';
      case 'completed': return 'Đã giao';
      case 'cancelled': return 'Đã hủy';
      default: return 'Chờ thanh toán';
    }
  }

  getRegionFromAddress(address: string): string {
    if (!address) return '';

    const lower = address.toLowerCase();

    if (lower.includes('hồ chí minh') || lower.includes('miền nam')) return 'Miền Nam';
    if (lower.includes('hà nội') || lower.includes('miền bắc')) return 'Miền Bắc';
    if (lower.includes('đà nẵng') || lower.includes('miền trung')) return 'Miền Trung';

    return '';
  }

}
