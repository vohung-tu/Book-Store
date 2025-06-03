import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { Order, Product } from '../../../model/order.model';
import { OrderService } from '../../../service/order.service';
import { TableModule } from 'primeng/table';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../../service/auth.service';
import { DotSeparatorPipe } from '../../../pipes/dot-separator.pipe';

@Component({
  selector: 'app-user-order',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    DotSeparatorPipe,
    TableModule
  ],
  templateUrl: './user-order.component.html',
  styleUrls: ['./user-order.component.scss']
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
    private authService: AuthService
  ) {
    // Sản phẩm của đơn hàng nếu cần sử dụng riêng
    this.product$ = this.orderService.getOrders().pipe(
      map(orders => orders.flatMap(order => order.products))
    );
  }

  ngOnInit(): void {
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

  // Lọc đơn hàng theo selectedTab
  filterOrdersByTab(): void {
    console.log('Filtering orders...');
    // Nếu SelectedTab rỗng thì hiển thị tất cả
    this.filteredOrders = !this.selectedTab 
      ? [...this.orders] 
      : this.orders.filter(order => order.status.toLowerCase() === this.selectedTab);
    
    console.log('Filtered Orders count:', this.filteredOrders.length);
  }

  // Tính số đơn theo trạng thái (sử dụng lowercase để so sánh)
  getOrderCountByStatus(status: string): number {
    return status 
      ? this.orders.filter(order => order.status.toLowerCase() === status.toLowerCase()).length 
      : this.orders.length;
  }
}
