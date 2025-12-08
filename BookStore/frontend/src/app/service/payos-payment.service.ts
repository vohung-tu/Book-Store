import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PayOSCreatePaymentRes {
  orderCode: string;
  checkoutUrl: string;
  paymentLinkId: string;
}

@Injectable({ providedIn: 'root' })
export class PayOSPaymentService {
  private base = 'https://book-store-3-svnz.onrender.com';

  constructor(private http: HttpClient) {}

  createPayment(payload: {
    amount: number;
    items: { name: string; quantity: number; price: number }[];
  }): Observable<PayOSCreatePaymentRes> {
    return this.http.post<PayOSCreatePaymentRes>(`${this.base}/payos/create-payment`, payload);
  }
}
