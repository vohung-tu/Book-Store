import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface PayOSCreatePaymentRes {
  orderCode: string;
  checkoutUrl: string;
  paymentLinkId: string;
  qrCode: string;
}

export interface PayOSCreatePaymentApiResponse {
  success: boolean;
  data: PayOSCreatePaymentRes;
}

@Injectable({ providedIn: 'root' })
export class PayOSPaymentService {
  private base = 'https://book-store-3-svnz.onrender.com';

  constructor(private http: HttpClient) {}

  createPayment(payload: {
    amount: number;
    items: { name: string; quantity: number; price: number }[];
  }): Observable<PayOSCreatePaymentApiResponse> {
    return this.http.post<PayOSCreatePaymentApiResponse>(
      `${this.base}/payos/create-payment`,
      payload
    );
  }
}
