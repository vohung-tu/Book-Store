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
    code: string;                  // ví dụ: "00", "201" 
    desc?: string;                 // <- thêm dòng này, PayOS trả khi lỗi
    success?: boolean;
    data: PayOSCreatePaymentRes | null;
  }

  @Injectable({ providedIn: 'root' })
  export class PayOSPaymentService {
    private base = 'https://book-store-3-svnz.onrender.com';

    constructor(private http: HttpClient) {}

    createPayment(payload: {
      amount: number;
      orderId: string; 
      description: string;
      items: { name: string; quantity: number; price: number }[];
    }): Observable<PayOSCreatePaymentApiResponse> {
      return this.http.post<PayOSCreatePaymentApiResponse>(
        `${this.base}/payos/create-payment`,
        payload
      );
    }
  }
