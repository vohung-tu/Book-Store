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
import { BooksService } from '../../service/books.service';

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
  totalRecords = 0;
  loading = false;
  statusOptions = [
    { label: 'Chờ xử lý', value: 'pending_payment' },
    { label: 'Đang xử lý', value: 'processing' },
    { label: 'Đang giao hàng', value: 'shipping' },
    { label: 'Hoàn thành', value: 'completed' },
    { label: 'Đã hủy', value: 'cancelled' },
    { label: 'Đã trả hàng', value: 'returned' }
  ];

  statusOptionItems = this.statusOptions;

  constructor(
    private orderService: OrderService,
    private messageService: MessageService,
    private bookService: BooksService
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

  loadOrdersLazy(event: any) {
    this.loading = true;

    const page = event.first / event.rows + 1; 
    const limit = event.rows;

    this.orderService.getOrdersLazy({
      page,
      limit,
      search: this.searchText
    }).subscribe({
      next: (res) => {
        this.orders = res.data;
        this.totalRecords = res.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không tải được đơn hàng'
        });
      }
    });
  }

  onSearch() {
    this.loadOrdersLazy({
      first: 0,
      rows: 10
    });
  }

  onStatusChange(order: Order, newStatus: string) {
    const oldStatus = order.status;
    order.status = newStatus;

    this.orderService.updateOrderStatus(order._id, newStatus).subscribe({
      next: (updatedOrder) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Cập nhật trạng thái thành công'
        });

        // Phát tín hiệu cho các màn khác cập nhật tồn kho
        const payload = {
          orderId: updatedOrder._id,
          status: updatedOrder.status,
          timestamp: Date.now()
        };

        // 1) Cross-tab (khác tab / cửa sổ)
        localStorage.setItem('orderUpdated', JSON.stringify(payload));

        // 2) Same-tab (cùng SPA / cùng document)
        window.dispatchEvent(new CustomEvent('order-updated', { detail: payload }));
      },
      error: () => {
        order.status = oldStatus; // rollback
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Cập nhật trạng thái thất bại'
        });
      }
    });
  }
}
