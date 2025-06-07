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
  ],
  templateUrl: './user-order.component.html',
  styleUrls: ['./user-order.component.scss'],
  providers: [MessageService]
})
export class UserOrderComponent implements OnInit, OnDestroy {
  product$: Observable<Product[]>;
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedTab: string = ''; 
  isOrdersLoaded = false; // Kiểm soát việc gọi API nhiều lần

  tabs = [
    { value: '', title: 'Tất cả', content: 'Tất cả đơn hàng' },
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
    private cartService: CartService,
    private messageService: MessageService,
    private router: Router,
    private bookService: BooksService
  ) {
    // Sản phẩm của đơn hàng nếu cần sử dụng riêng
    this.product$ = this.orderService.getOrders().pipe(
      map(orders => orders.flatMap(order => order.products))
    );
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.selectedTab = ''; // reset về tab mặc định
        this.filterOrdersByTab(); // lọc lại nếu cần
      }
    });
  }

  ngOnInit(): void {
    this.selectedTab = '';
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.storageEventListener);
    }
    // Chỉ gọi API 1 lần
    this.loadUserOrders();
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageEventListener);
    }
  }

  // Hàm reload (có thể được gọi qua sự kiện storage) sẽ bỏ qua kiểm tra isOrdersLoaded
  reloadOrders() {
    console.log('Reloading user orders...');
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      const currentUserId = currentUser._id;
      this.orderService.getOrders().subscribe((orders) => {
        console.log('Orders fetched (reload):', orders.length);
        this.orders = orders.filter(order => order.userId === currentUserId);
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
        this.orders = orders.filter(order => order.userId === currentUserId);
        this.isOrdersLoaded = true;
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
  selectTab(tabValue: string): void {
    this.selectedTab = tabValue.toLowerCase();
    console.log('Selected Tab:', this.selectedTab);
    this.filterOrdersByTab();
  }

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
    if (!status) return this.orders;
    return this.orders.filter(order => order.status?.toLowerCase() === status.toLowerCase());
  }

  // Lọc đơn hàng theo selectedTab
  filterOrdersByTab(): void {
    this.filteredOrders = this.getOrdersByStatus(this.selectedTab);
  }

  // Tính số đơn theo trạng thái (sử dụng lowercase để so sánh)
  getOrderCountByStatus(status: string): number {
    return status 
      ? this.orders.filter(order => order.status.toLowerCase() === status.toLowerCase()).length 
      : this.orders.length;
  }

  cancelOrder(orderId: string, reason: string) {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      this.orderService.cancelOrder(orderId, reason).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Đã hủy đơn hàng.' });
          this.filterOrdersByTab(); // refresh lại đơn hàng
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể hủy đơn hàng.' });
        }
      });
    }
  }

  confirmCancelOrder() {
    this.orderService.cancelOrder(this.selectedOrderIdToCancel, this.selectedCancelReason).subscribe({
      next: () => {
        this.confirmCancelDialogVisible = false; 
        this.cancelDialogVisible = false;
        this.selectedCancelReason = '';
        this.loadUserOrders();
        this.messageService.add({severity:'success', summary:'Thành công', detail:'Đơn hàng đã được hủy.'});
      },
      error: err => {
        this.confirmCancelDialogVisible = false;
        this.messageService.add({severity:'error', summary:'Lỗi', detail:'Hủy đơn thất bại.'});
        console.error('Hủy đơn thất bại:', err);
      }
    });
  }

  rebuyOrder(products: any[]): void {
    const fetches = products.map(product =>
      this.bookService.getBookById(product.productId || product._id).pipe(
        tap(book => {
          const bookWithQuantity = { ...book, quantity: product.quantity || 1 };
          this.cartService.addToCart(bookWithQuantity);
        }),
        catchError(err => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: `Không thể lấy thông tin sản phẩm ${product.title}`,
          });
          return of(null);
        })
      )
    );

    forkJoin(fetches).subscribe(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Đã thêm vào giỏ hàng',
        detail: 'Bạn có thể kiểm tra lại trước khi thanh toán.',
      });
      this.router.navigate(['/cart']);
    });
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
}
