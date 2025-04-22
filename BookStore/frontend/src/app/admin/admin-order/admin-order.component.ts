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
  templateUrl: './admin-order.component.html',
  styleUrl: './admin-order.component.scss'
})
export class AdminOrderComponent implements OnInit{
  orders: Order[] = [];
  searchText: string = '';
  filteredOrders: any[] = [];
  
  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.orderService.getOrders().subscribe((res) => {
      this.orders = res;
      this.filteredOrders = res;
    });
  }
  filterOrders() {
    const query = this.searchText.toLowerCase().trim();
  
    if (!query) {
      this.filteredOrders = this.orders;
      return;
    }
  
    this.filteredOrders = this.orders.filter(order =>
      order._id.toLowerCase().includes(query) ||
      (order.name && order.name.toLowerCase().includes(query))
    );
  }
}
