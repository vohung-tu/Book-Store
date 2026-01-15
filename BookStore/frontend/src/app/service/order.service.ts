import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../model/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'https://book-store-3-svnz.onrender.com/orders'; // Thay bằng API thực tế

  constructor(private http: HttpClient
  ) {}

  createOrder(order: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, order);
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  getOrderByCode(orderCode: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/by-code/${orderCode}`);
  }

  getOrdersLazy(params: {
    page: number;
    limit: number;
    search?: string;
  }) {
    return this.http.get<any>(`${this.apiUrl}/admin/lazy`, {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search || ''
      },
    });
  }

  confirmPayment(orderId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${orderId}/confirm-payment`, {});
  }

  updateOrderStatus(orderId: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${orderId}/status`, { status });
  }

  cancelOrder(orderId: string, reason: string): Observable<any> {
    const token = localStorage.getItem('token');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    // Gửi PATCH hoặc PUT request để cập nhật trạng thái đơn hàng
    return this.http.patch(`${this.apiUrl}/${orderId}/cancel`, { reason }, {
      headers
    });
  }
}
