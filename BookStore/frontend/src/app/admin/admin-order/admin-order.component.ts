import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { CommonModule } from '@angular/common';
import { Order } from '../../model/order.model';
import { OrderService } from '../../service/order.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-order',
  standalone: true,
  imports: [
    TableModule,
    CommonModule,
    ButtonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    DropdownModule
  ],
  providers: [MessageService], 
  templateUrl: './admin-order.component.html',
  styleUrls: ['./admin-order.component.scss'],
  
})
export class AdminOrderComponent implements OnInit {
  orders: Order[] = [];
  searchText: string = '';
  filteredOrders: Order[] = [];

  // statusOptions = ['pending', 'processing', 'shipping', 'completed', 'cancelled', 'returned'];
  // statusOptionItems = this.statusOptions.map(s => ({ label: s, value: s }));
  statusOptions = [
    { label: 'Chờ xử lý', value: 'pending' },
    { label: 'Đang xử lý', value: 'processing' },
    { label: 'Đang giao hàng', value: 'shipping' },
    { label: 'Hoàn thành', value: 'completed' },
    { label: 'Đã hủy', value: 'cancelled' },
    { label: 'Đã trả hàng', value: 'returned' }
  ];

  statusOptionItems = this.statusOptions;

  constructor(
    private orderService: OrderService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // this.statusOptionItems = this.statusOptions.map(s => ({ label: s, value: s }));
    this.statusOptionItems = this.statusOptions;
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getOrders().subscribe({
      next: (res) => {
        this.orders = res;
        this.filteredOrders = [...res];
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không tải được đơn hàng' });
      }
    });
  }

  filterOrders() {
    const query = this.searchText.toLowerCase().trim();

    if (!query) {
      this.filteredOrders = [...this.orders];
      return;
    }

    this.filteredOrders = this.orders.filter(order =>
      order._id.toLowerCase().includes(query) ||
      (order.name && order.name.toLowerCase().includes(query))
    );
  }

  onStatusChange(order: Order, newStatus: string) {
    const oldStatus = order.status;
    order.status = newStatus;

    this.orderService.updateOrderStatus(order._id, newStatus).subscribe({
      next: (updatedOrder) => {
        this.messageService.add({severity:'success', summary:'Thành công', detail:'Cập nhật trạng thái thành công'});

        // Gửi event thông báo đơn hàng đã cập nhật
        localStorage.setItem('orderUpdated', JSON.stringify({
          orderId: updatedOrder._id,
          status: updatedOrder.status,
          timestamp: new Date().getTime()
        }));
      },
      error: (err) => {
        order.status = oldStatus;  // rollback
        this.messageService.add({severity:'error', summary:'Lỗi', detail:'Cập nhật trạng thái thất bại'});
      }
    });
  }
}
