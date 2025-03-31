import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookDetails } from '../../model/books-details.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../service/order.service';
import { AuthService } from '../../service/auth.service';
import { User } from '../../model/users-details.model';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    PaginatorModule,
    FormsModule

  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit{
  selectedBooks: BookDetails[] = [];
  totalAmount: number = 0;
  user: User | null = null;

  orderInfo = {
    name: '',
    email: '',
    address: '',
    phone: ''
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    console.log('🛒 Sản phẩm trong giỏ:', this.selectedBooks.length);
    const savedCart = localStorage.getItem('cart');
    const savedTotal = localStorage.getItem('totalAmount');

    this.selectedBooks = savedCart ? JSON.parse(savedCart) : [];
    this.totalAmount = this.selectedBooks.reduce((sum, item) => sum + (item.flashsale_price || item.price) * (item.quantity || 1), 0);;

    // lấy giỏ hàng từ Navigation state
    this.authService.getUserInfo().subscribe(user => {
      if (user) {
        this.user = user;
        this.orderInfo = {
          name: user.full_name,
          email: user.email,
          address: user.address,
          phone: user.phone_number.toString()
        };
      }
    });
  }

  submitOrder() {
    console.log('🛒 Sản phẩm trong giỏ:', this.selectedBooks);
    if (!this.orderInfo.name || !this.orderInfo.email || !this.orderInfo.address || !this.orderInfo.phone) {
      alert('Vui lòng nhập đủ thông tin!');
      return;
    }

    const orderData = {
      userId: this.user?.id,
      ...this.orderInfo,
      items: this.selectedBooks,
      total: this.totalAmount,
      orderDate: new Date()
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        alert('Đơn hàng đã được đặt thành công!');
        this.router.navigate(['/']); // Quay về trang chủ sau khi đặt hàng
      },
      error: (err) => {
        console.error('Lỗi khi đặt hàng:', err);
        alert('Đặt hàng thất bại, vui lòng thử lại!');
      }
    });
  }
}
