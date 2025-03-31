import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:3000/orders'; // Thay bằng API thực tế

  constructor(private http: HttpClient
  ) {}

  createOrder(order: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, order);
  }
}
