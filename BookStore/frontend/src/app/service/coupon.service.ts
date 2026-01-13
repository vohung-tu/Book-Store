import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Coupon } from '../model/coupon.model';

@Injectable({ providedIn: 'root' })
export class CouponsService {
  private apiUrl = 'https://book-store-3-svnz.onrender.com/coupons';

  constructor(private http: HttpClient) {}

  getCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.apiUrl);
  }

  getValidCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(`${this.apiUrl}/valid`);
  }

  createCoupon(coupon: Coupon): Observable<Coupon> {
    return this.http.post<Coupon>(this.apiUrl, coupon);
  }

  updateCoupon(id: string, coupon: Partial<Coupon>): Observable<Coupon> {
    return this.http.put<Coupon>(`${this.apiUrl}/${id}`, coupon);
  }

  deleteCoupon(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCouponByCode(code: string): Observable<{ valid: boolean; coupon?: Coupon; message?: string }> {
    return this.http.get<{ valid: boolean; coupon?: Coupon; message?: string }>(
        `${this.apiUrl}/validate/${code}`
    );
  }
}
