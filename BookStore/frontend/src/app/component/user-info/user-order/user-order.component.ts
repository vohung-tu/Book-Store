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
      });
    } else {
      console.error('Không tìm thấy thông tin user');
    }
  }
  getOrderCountByStatus(status: number): number {
    if (status === 0) {
      return this.orders.length; // Tất cả
    }

    const statusMap: { [key: number]: string } = {
      1: 'pending',
      2: 'processing',
      3: 'shipping',
      4: 'completed',
      5: 'cancelled',
      6: 'returned'
    };

    return this.orders.filter(order => order.status === statusMap[status]).length;
  }
}
