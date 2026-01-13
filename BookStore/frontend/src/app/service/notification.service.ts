import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly baseUrl = `http://localhost:3000/notifications`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  getMyNotifications(limit: number = 20): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}?limit=${limit}`, this.getAuthHeaders());
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/unread-count`, this.getAuthHeaders());
  }

  markAsRead(id: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/read`, {}, this.getAuthHeaders());
  }

  markAllAsRead(): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(
      `${this.baseUrl}/mark-all-read`,
      {},
      this.getAuthHeaders(),
    );
  }
}
