import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
export class UserOrderComponent implements OnInit{
  product$: Observable<Product[]>
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedTab = 0;
  tabs = [
    { value: 0, title: 'Tất cả', content: 'Danh sách tất cả đơn hàng' },
    { value: 1, title: 'Chờ thanh toán', content: 'Danh sách đơn hàng chờ thanh toán' },
    { value: 2, title: 'Đang xử lý', content: 'Danh sách đơn hàng đang xử lý' },
    { value: 3, title: 'Đang giao', content: 'Danh sách đơn hàng đang được vận chuyển' },
    { value: 4, title: 'Hoàn tất', content: 'Danh sách đơn hàng đã hoàn tất' },
    { value: 5, title: 'Bị hủy', content: 'Danh sách đơn hàng bị hủy' },
    { value: 6, title: 'Đổi trả', content: 'Danh sách đơn hàng đổi trả' }
  ];
  constructor(
    private orderService: OrderService,
    private authService: AuthService
  ) {
    this.product$ = this.orderService.getOrders().pipe(
      map(orders => orders.flatMap(order => order.products))
    );

  }
  
  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      const currentUserId = currentUser._id;
      this.orderService.getOrders().subscribe((orders) => {
        this.orders = orders.filter(order => order.userId === currentUserId);
        this.filterOrdersByTab(); // Lọc dữ liệu ngay khi load
      });
    } else {
      console.error('Không tìm thấy thông tin user');
    }
  }
  filterOrdersByTab(): void {
    console.log("Tab hiện tại:", this.selectedTab); // Kiểm tra giá trị tab
  console.log("Danh sách đơn hàng trước khi lọc:", this.orders);
    if (this.selectedTab === 0) {
      this.filteredOrders = this.orders; // Hiển thị tất cả đơn hàng
    } else {
      const statusMap: { [key: number]: string } = {
        1: 'Chờ thanh toán',
        2: 'Đang xử lý',
        3: 'Đang giao',
        4: 'Hoàn tất',
        5: 'Bị hủy',
        6: 'Đổi trả'
      };

      const selectedStatus = statusMap[this.selectedTab];
      this.filteredOrders = this.orders.filter(order => order.status === selectedStatus);
    }
  }
  
  getOrderCountByStatus(status: number): number {
    if (status === 0) {
      return this.orders.length; // Tất cả
    }

    const statusMap: { [key: number]: string } = {
      1: 'Chờ thanh toán',
      2: 'Đang xử lý',
      3: 'Đang giao',
      4: 'Hoàn tất',
      5: 'Bị hủy',
      6: 'Đổi trả'
    };

    return this.orders.filter(order => order.status === statusMap[status]).length;
  }
}
