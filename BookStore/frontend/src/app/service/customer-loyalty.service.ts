import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomerLoyaltyService {
  private baseUrl = 'http://localhost:3000/admin/loyalty';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl, { headers: this.getAuthHeaders() });
  }

  updateCustomerLevel(id: string, level: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}`, { level }, { headers: this.getAuthHeaders() });
  }
}
